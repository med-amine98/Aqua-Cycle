from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from ...database import get_db
from ...models.offer import WasteOffer
from ...models.waste import WasteDeclaration
from ...models.market import CompanyProfile

router = APIRouter(
    prefix="/offers",
    tags=["Supply Chain - Offers"]
)


class OfferCreate(BaseModel):
    waste_id: str
    company_id: str
    quantity: float
    price_per_unit: float
    message: str = ""


class OfferStatusUpdate(BaseModel):
    status: str  # pending, accepted, rejected, cancelled


@router.post("/")
async def create_offer(
    offer_data: OfferCreate,
    db: Session = Depends(get_db)
):

    if offer_data.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero"
        )

    if offer_data.price_per_unit < 0:
        raise HTTPException(
            status_code=400,
            detail="Price cannot be negative"
        )

    offer = WasteOffer(
        waste_id=offer_data.waste_id,
        company_id=offer_data.company_id,
        quantity=offer_data.quantity,
        price_per_unit=offer_data.price_per_unit,
        total_price=(
            offer_data.quantity *
            offer_data.price_per_unit
        ),
        status="pending",
        message=offer_data.message
    )

    db.add(offer)
    db.commit()
    db.refresh(offer)

    return {
        "message": "Offer created successfully",
        "offer_id": offer.id,
        "status": offer.status,
        "total_price": offer.total_price
    }


@router.get("/")
async def get_offers(
    waste_id: Optional[str] = None,
    company_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WasteOffer)
    
    if waste_id:
        query = query.filter(WasteOffer.waste_id == waste_id)
    if company_id:
        query = query.filter(WasteOffer.company_id == company_id)
    if status:
        query = query.filter(WasteOffer.status == status)

    offers = query.order_by(WasteOffer.created_at.desc()).all()

    result = []
    for offer in offers:
        waste = db.query(WasteDeclaration).filter(WasteDeclaration.id == offer.waste_id).first()
        company = db.query(CompanyProfile).filter(CompanyProfile.id == offer.company_id).first()
        
        result.append({
            "id": offer.id,
            "waste_id": offer.waste_id,
            "waste_type": waste.waste_type.value if waste else "Inconnu",
            "waste_location": waste.location if waste else "",
            "waste_latitude": waste.latitude if waste else None,
            "waste_longitude": waste.longitude if waste else None,
            "farmer_name": waste.farmer.full_name if (waste and waste.farmer) else "Agriculteur",
            "company_id": offer.company_id,
            "company_name": company.company_name if company else "Entreprise Partenaire",
            "quantity": offer.quantity,
            "price_per_unit": offer.price_per_unit,
            "total_price": offer.total_price,
            "status": offer.status,
            "message": offer.message,
            "created_at": offer.created_at.isoformat() if hasattr(offer, 'created_at') and offer.created_at else None
        })

    return result


@router.get("/{offer_id}")
async def get_offer(
    offer_id: str,
    db: Session = Depends(get_db)
):
    offer = db.query(WasteOffer).filter(WasteOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    waste = db.query(WasteDeclaration).filter(WasteDeclaration.id == offer.waste_id).first()
    company = db.query(CompanyProfile).filter(CompanyProfile.id == offer.company_id).first()

    return {
        "id": offer.id,
        "waste_id": offer.waste_id,
        "waste_type": waste.waste_type.value if waste else "Inconnu",
        "waste_location": waste.location if waste else "",
        "company_id": offer.company_id,
        "company_name": company.company_name if company else "Entreprise Partenaire",
        "quantity": offer.quantity,
        "price_per_unit": offer.price_per_unit,
        "total_price": offer.total_price,
        "status": offer.status,
        "message": offer.message
    }


@router.put("/{offer_id}/status")
async def update_offer_status(
    offer_id: str,
    status_data: OfferStatusUpdate,
    db: Session = Depends(get_db)
):
    offer = db.query(WasteOffer).filter(WasteOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    allowed_statuses = ["pending", "accepted", "rejected", "cancelled"]
    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed values are: {allowed_statuses}"
        )

    offer.status = status_data.status
    db.commit()
    db.refresh(offer)

    return {
        "message": "Offer status updated successfully",
        "offer_id": offer.id,
        "status": offer.status
    }


@router.delete("/{offer_id}")
async def delete_offer(
    offer_id: str,
    db: Session = Depends(get_db)
):
    offer = db.query(WasteOffer).filter(WasteOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    db.delete(offer)
    db.commit()

    return {"message": "Offer deleted successfully", "offer_id": offer_id}