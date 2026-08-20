from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from ...services.waste_service import WasteManagementService
from ...models.waste import WasteDeclaration, WasteType, WasteStatus
from ...models.market import CompanyProfile, WasteMatch, Transaction, TransactionStatus
from ...models.user import User, UserRole
from ...database import get_db
from .auth import get_current_user_dep  # ← Importer la bonne dépendance
from pydantic import BaseModel

router = APIRouter(prefix="/waste", tags=["Waste Management"])
waste_service = WasteManagementService()

class WasteDeclarationCreate(BaseModel):
    waste_type: str
    quantity: float
    availability_date: date
    expiry_date: Optional[date] = None
    location: str
    latitude: float
    longitude: float
    quality_grade: Optional[str] = None
    description: Optional[str] = None
    price_per_unit: Optional[float] = None

@router.post("/declare")
async def declare_waste(
    waste_data: WasteDeclarationCreate,
    current_user: User = Depends(get_current_user_dep),  # ← Utiliser get_current_user_dep
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.FARMER:
        raise HTTPException(status_code=403, detail="Seuls les agriculteurs peuvent déclarer des déchets")
    
    try:
        waste_type_enum = WasteType(waste_data.waste_type)
        
        new_waste = WasteDeclaration(
            farmer_id=current_user.id,
            waste_type=waste_type_enum,
            quantity=waste_data.quantity,
            availability_date=waste_data.availability_date,
            expiry_date=waste_data.expiry_date,
            location=waste_data.location,
            latitude=waste_data.latitude,
            longitude=waste_data.longitude,
            quality_grade=waste_data.quality_grade,
            description=waste_data.description,
            price_per_unit=waste_data.price_per_unit,
            status=WasteStatus.AVAILABLE
        )
        
        db.add(new_waste)
        db.commit()
        db.refresh(new_waste)
        
        return {
            "message": "Déchet déclaré avec succès",
            "waste_id": new_waste.id,
            "status": new_waste.status.value
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Type de déchet invalide: {str(e)}")
    except Exception as e:
        db.rollback()
        print(f"Erreur declare_waste: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@router.get("/available")
async def get_available_waste(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    waste_type: Optional[str] = None,
    min_quantity: Optional[float] = None,
    current_user: User = Depends(get_current_user_dep),  # ← Utiliser get_current_user_dep
    db: Session = Depends(get_db)
):
    query = db.query(WasteDeclaration).filter(
        WasteDeclaration.status == WasteStatus.AVAILABLE
    )
    
    if waste_type:
        try:
            waste_type_enum = WasteType(waste_type)
            query = query.filter(WasteDeclaration.waste_type == waste_type_enum)
        except ValueError:
            pass
    
    if min_quantity:
        query = query.filter(WasteDeclaration.quantity >= min_quantity)
    
    wastes = query.all()
    
    result = []
    for waste in wastes:
        waste_data = {
            "id": waste.id,
            "waste_type": waste.waste_type.value,
            "quantity": waste.quantity,
            "unit": waste.unit,
            "availability_date": waste.availability_date.isoformat() if waste.availability_date else None,
            "location": waste.location,
            "latitude": waste.latitude,
            "longitude": waste.longitude,
            "quality_grade": waste.quality_grade,
            "description": waste.description,
            "price_per_unit": waste.price_per_unit,
            "farmer_name": waste.farmer.full_name if waste.farmer else "Inconnu"
        }
        
        if lat and lon and waste.latitude and waste.longitude:
            distance = waste_service.calculate_distance(
                lat, lon,
                waste.latitude, waste.longitude
            )
            waste_data["distance"] = round(distance, 1)
        
        result.append(waste_data)
    
    return result

@router.get("/matches/{waste_id}")
async def find_matches(
    waste_id: str,
    current_user: User = Depends(get_current_user_dep),  # ← Utiliser get_current_user_dep
    db: Session = Depends(get_db)
):
    waste = db.query(WasteDeclaration).filter(WasteDeclaration.id == waste_id).first()
    if not waste:
        raise HTTPException(status_code=404, detail="Déchet non trouvé")
    
    companies = db.query(CompanyProfile).filter(
        CompanyProfile.is_active == True
    ).all()
    
    matches = waste_service.match_waste_with_companies(waste, companies)
    
    return {
        "waste_id": waste_id,
        "matches": matches[:10],
        "total_matches": len(matches)
    }

@router.post("/aggregate")
async def aggregate_waste(
    waste_ids: List[str],
    current_user: User = Depends(get_current_user_dep),  # ← Utiliser get_current_user_dep
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.FARMER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    wastes = db.query(WasteDeclaration).filter(
        WasteDeclaration.id.in_(waste_ids),
        WasteDeclaration.status == WasteStatus.AVAILABLE
    ).all()
    
    if len(wastes) < 2:
        raise HTTPException(status_code=400, detail="Besoin d'au moins 2 déchets disponibles pour l'agrégation")
    
    result = waste_service.aggregate_waste(wastes)
    
    for waste in wastes:
        waste.is_aggregated = True
        waste.aggregation_group_id = str(date.today().timestamp())
    
    db.commit()
    
    return result

@router.post("/transaction/initiate")
async def initiate_transaction(
    waste_id: str,
    company_id: str,
    amount: float,
    current_user: User = Depends(get_current_user_dep),  # ← Utiliser get_current_user_dep
    db: Session = Depends(get_db)
):
    waste = db.query(WasteDeclaration).filter(WasteDeclaration.id == waste_id).first()
    if not waste:
        raise HTTPException(status_code=404, detail="Déchet non trouvé")
    
    if waste.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas le propriétaire de ce déchet")
    
    commission = amount * 0.05
    
    transaction = Transaction(
        user_id=current_user.id,
        waste_id=waste_id,
        company_id=company_id,
        amount=amount,
        commission=commission,
        status=TransactionStatus.PENDING,
        transaction_date=date.today()
    )
    
    waste.status = WasteStatus.RESERVED
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return {
        "transaction_id": transaction.id,
        "amount": amount,
        "commission": commission,
        "net_amount": amount - commission,
        "status": transaction.status.value
    }