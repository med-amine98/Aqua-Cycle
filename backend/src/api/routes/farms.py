from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from ...models import Farm, Plot, WaterBudget, User
from ...database import get_db
from .auth import get_current_user_dep
from pydantic import BaseModel
from ...models.farm import SoilType, IrrigationSystem
from ...models.plot import CropType, CropGrowthStage

router = APIRouter(prefix="/farms", tags=["Farms"])

# --- Modèles de données ---
class FarmCreate(BaseModel):
    name: str
    location: str
    latitude: float
    longitude: float
    total_area: float
    soil_type: str
    irrigation_system: str
    water_availability: float

class FarmResponse(BaseModel):
    id: str
    name: str
    location: str
    latitude: float
    longitude: float
    total_area: float
    soil_type: str
    irrigation_system: str
    water_availability: float
    owner_id: str
    created_at: datetime

class CropCreate(BaseModel):
    name: str
    variety: str
    type: str
    growth_stage: str
    planting_date: str
    area: float
    expected_yield: float = 0
    irrigation_type: str = ""
    notes: str = ""

class WaterDataCreate(BaseModel):
    date: str
    source: str
    volume: float
    used_for: str
    status: str = "planned"
    notes: str = ""

# --- Routes Farms ---
@router.get("")
async def get_farms(
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Récupérer toutes les fermes de l'utilisateur"""
    try:
        farms = db.query(Farm).filter(Farm.owner_id == current_user.id).all()
        return farms
    except Exception as e:
        print(f"Erreur get_farms: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@router.post("")
async def create_farm(
    data: FarmCreate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle ferme"""
    try:
        soil_type_map = {
            "argileux": SoilType.CLAY,
            "sableux": SoilType.SANDY,
            "limoneux": SoilType.SILTY,
            "loameux": SoilType.LOAMY,
            "calcaire": SoilType.CHALKY,
            "tourbeux": SoilType.PEATY,
        }
        
        irrigation_map = {
            "goutte-à-goutte": IrrigationSystem.DRIP,
            "aspersion": IrrigationSystem.SPRINKLER,
            "gravitaire": IrrigationSystem.SURFACE,
            "subsurface": IrrigationSystem.SUBSURFACE,
            "manuel": IrrigationSystem.MANUAL,
        }
        
        farm = Farm(
            owner_id=current_user.id,
            name=data.name,
            location=data.location,
            latitude=data.latitude,
            longitude=data.longitude,
            total_area=data.total_area,
            soil_type=soil_type_map.get(data.soil_type.lower(), SoilType.LOAMY),
            irrigation_system=irrigation_map.get(data.irrigation_system.lower(), IrrigationSystem.DRIP),
            water_availability=data.water_availability,
            crop_details={},
            is_verified=True
        )
        
        db.add(farm)
        db.commit()
        db.refresh(farm)
        return farm
    except Exception as e:
        db.rollback()
        print(f"Erreur create_farm: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@router.get("/{farm_id}")
async def get_farm(
    farm_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Récupérer une ferme spécifique"""
    try:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
        if not farm:
            raise HTTPException(status_code=404, detail="Ferme non trouvée")
        return farm
    except Exception as e:
        print(f"Erreur get_farm: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@router.put("/{farm_id}")
async def update_farm(
    farm_id: str,
    data: FarmCreate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Mettre à jour une ferme"""
    try:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
        if not farm:
            raise HTTPException(status_code=404, detail="Ferme non trouvée")
        
        # Mapping des types de sol
        soil_type_map = {
            "argileux": SoilType.CLAY,
            "sableux": SoilType.SANDY,
            "limoneux": SoilType.SILTY,
            "loameux": SoilType.LOAMY,
            "calcaire": SoilType.CHALKY,
            "tourbeux": SoilType.PEATY,
            "clay": SoilType.CLAY,
            "sandy": SoilType.SANDY,
            "silty": SoilType.SILTY,
            "loamy": SoilType.LOAMY,
            "chalcy": SoilType.CHALKY,
            "peaty": SoilType.PEATY,
        }
        
        irrigation_map = {
            "goutte-à-goutte": IrrigationSystem.DRIP,
            "aspersion": IrrigationSystem.SPRINKLER,
            "gravitaire": IrrigationSystem.SURFACE,
            "subsurface": IrrigationSystem.SUBSURFACE,
            "manuel": IrrigationSystem.MANUAL,
            "drip": IrrigationSystem.DRIP,
            "sprinkler": IrrigationSystem.SPRINKLER,
            "surface": IrrigationSystem.SURFACE,
            "subsurface": IrrigationSystem.SUBSURFACE,
            "manual": IrrigationSystem.MANUAL,
        }
        
        # Mettre à jour les champs
        farm.name = data.name
        farm.location = data.location
        farm.latitude = data.latitude
        farm.longitude = data.longitude
        farm.total_area = data.total_area
        farm.water_availability = data.water_availability
        
        # Gérer le type de sol (convertir en minuscules pour la correspondance)
        soil_key = data.soil_type.lower()
        farm.soil_type = soil_type_map.get(soil_key, SoilType.LOAMY)
        
        # Gérer le système d'irrigation
        irrigation_key = data.irrigation_system.lower()
        farm.irrigation_system = irrigation_map.get(irrigation_key, IrrigationSystem.DRIP)
        
        db.commit()
        db.refresh(farm)
        return farm
    except Exception as e:
        db.rollback()
        print(f"Erreur update_farm: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@router.delete("/{farm_id}")
async def delete_farm(
    farm_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Supprimer une ferme"""
    try:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
        if not farm:
            raise HTTPException(status_code=404, detail="Ferme non trouvée")
        
        db.delete(farm)
        db.commit()
        return {"message": "Ferme supprimée avec succès"}
    except Exception as e:
        db.rollback()
        print(f"Erreur delete_farm: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

# --- Routes Crops ---
@router.post("/{farm_id}/crops")
async def add_crop(
    farm_id: str,
    data: CropCreate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Ajouter une culture à une ferme"""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")
    
    crop_type_map = {
        "Céréales": CropType.CEREALS,
        "Légumes": CropType.VEGETABLES,
        "Fruits": CropType.FRUITS,
        "Oliviers": CropType.OLIVES,
        "Vignes": CropType.VINES,
        "Dattes": CropType.DATES,
        "Légumineuses": CropType.LEGUMES,
        "Autre": CropType.OTHER,  # ← Ajouter ce mapping
    }
    
    growth_stage_map = {
        "Semis": CropGrowthStage.SEEDLING,
        "Végétatif": CropGrowthStage.VEGETATIVE,
        "Floraison": CropGrowthStage.FLOWERING,
        "Fructification": CropGrowthStage.FRUITING,
        "Maturation": CropGrowthStage.MATURATION,
        "Récolte": CropGrowthStage.HARVEST,
    }
    
    try:
        # Utiliser get avec une valeur par défaut
        crop_type = crop_type_map.get(data.type, CropType.OTHER)
        growth_stage = growth_stage_map.get(data.growth_stage, CropGrowthStage.VEGETATIVE)
        
        plot = Plot(
            farm_id=farm_id,
            name=data.name,
            area=data.area,
            crop_type=crop_type,
            crop_variety=data.variety,
            growth_stage=growth_stage,
            planting_date=datetime.strptime(data.planting_date, "%Y-%m-%d").date(),
            expected_harvest_date=datetime.strptime(data.planting_date, "%Y-%m-%d").date() + timedelta(days=90),
            crop_coefficient=0.8,
            irrigation_efficiency=0.7
        )
        
        db.add(plot)
        db.commit()
        db.refresh(plot)
        
        return {
            "id": plot.id,
            "name": plot.name,
            "variety": plot.crop_variety,
            "type": plot.crop_type.value if hasattr(plot.crop_type, 'value') else str(plot.crop_type),
            "growth_stage": plot.growth_stage.value if hasattr(plot.growth_stage, 'value') else str(plot.growth_stage),
            "planting_date": plot.planting_date.isoformat(),
            "area": plot.area,
            "expected_yield": data.expected_yield,
            "irrigation_type": data.irrigation_type,
            "notes": data.notes,
            "farm_id": plot.farm_id,
            "created_at": plot.created_at
        }
    except Exception as e:
        db.rollback()
        print(f"Erreur add_crop: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


@router.get("/{farm_id}/crops")
async def get_crops(
    farm_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Récupérer toutes les cultures d'une ferme"""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")
    
    plots = db.query(Plot).filter(Plot.farm_id == farm_id).all()
    
    result = []
    for plot in plots:
        result.append({
            "id": plot.id,
            "name": plot.name,
            "variety": plot.crop_variety,
            "type": plot.crop_type.value if hasattr(plot.crop_type, 'value') else str(plot.crop_type),
            "growth_stage": plot.growth_stage.value if hasattr(plot.growth_stage, 'value') else str(plot.growth_stage),
            "planting_date": plot.planting_date.isoformat(),
            "area": plot.area,
            "expected_yield": 0,
            "irrigation_type": "",
            "notes": "",
            "farm_id": plot.farm_id,
            "created_at": plot.created_at
        })
    
    return result

@router.put("/{farm_id}/crops/{crop_id}")
async def update_crop(
    farm_id: str,
    crop_id: str,
    data: CropCreate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Mettre à jour une culture"""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")
    
    plot = db.query(Plot).filter(Plot.id == crop_id, Plot.farm_id == farm_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Culture non trouvée")
    
    crop_type_map = {
        "Céréales": CropType.CEREALS,
        "Légumes": CropType.VEGETABLES,
        "Fruits": CropType.FRUITS,
        "Oliviers": CropType.OLIVES,
        "Vignes": CropType.VINES,
        "Dattes": CropType.DATES,
        "Légumineuses": CropType.LEGUMES,
        "Autre": CropType.OTHER,
    }
    
    growth_stage_map = {
        "Semis": CropGrowthStage.SEEDLING,
        "Végétatif": CropGrowthStage.VEGETATIVE,
        "Floraison": CropGrowthStage.FLOWERING,
        "Fructification": CropGrowthStage.FRUITING,
        "Maturation": CropGrowthStage.MATURATION,
        "Récolte": CropGrowthStage.HARVEST,
    }
    
    try:
        plot.name = data.name
        plot.crop_variety = data.variety
        plot.area = data.area
        plot.crop_type = crop_type_map.get(data.type, CropType.OTHER)
        plot.growth_stage = growth_stage_map.get(data.growth_stage, CropGrowthStage.VEGETATIVE)
        
        if data.planting_date:
            plot.planting_date = datetime.strptime(data.planting_date, "%Y-%m-%d").date()
        
        db.commit()
        db.refresh(plot)
        
        return {
            "id": plot.id,
            "name": plot.name,
            "variety": plot.crop_variety,
            "type": plot.crop_type.value if hasattr(plot.crop_type, 'value') else str(plot.crop_type),
            "growth_stage": plot.growth_stage.value if hasattr(plot.growth_stage, 'value') else str(plot.growth_stage),
            "planting_date": plot.planting_date.isoformat(),
            "area": plot.area,
            "expected_yield": data.expected_yield,
            "irrigation_type": data.irrigation_type,
            "notes": data.notes,
            "farm_id": plot.farm_id,
            "created_at": plot.created_at
        }
    except Exception as e:
        db.rollback()
        print(f"Erreur update_crop: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@router.delete("/{farm_id}/crops/{crop_id}")
async def delete_crop(
    farm_id: str,
    crop_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Supprimer une culture"""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")
    
    plot = db.query(Plot).filter(Plot.id == crop_id, Plot.farm_id == farm_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Culture non trouvée")
    
    try:
        db.delete(plot)
        db.commit()
        return {"message": "Culture supprimée avec succès"}
    except Exception as e:
        db.rollback()
        print(f"Erreur delete_crop: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

# --- Routes Water Data ---
@router.post("/{farm_id}/water")
async def add_water_data(
    farm_id: str,
    data: WaterDataCreate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Ajouter des données d'eau"""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")
    
    try:
        water_budget = WaterBudget(
            farm_id=farm_id,
            total_available=farm.water_availability,
            total_used=data.volume,
            total_allocated=data.volume,
            month=datetime.strptime(data.date, "%Y-%m-%d").date(),
            status=data.status
        )
        
        db.add(water_budget)
        db.commit()
        db.refresh(water_budget)
        return water_budget
    except Exception as e:
        db.rollback()
        print(f"Erreur add_water_data: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@router.get("/{farm_id}/water")
async def get_water_data(
    farm_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Récupérer les données d'eau"""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")
    
    budgets = db.query(WaterBudget).filter(WaterBudget.farm_id == farm_id).all()
    return budgets

# --- Route Recommendations ---
@router.post("/{farm_id}/recommendations")
async def get_recommendations(
    farm_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Obtenir des recommandations IA pour une ferme"""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")
    
    plots = db.query(Plot).filter(Plot.farm_id == farm_id).all()
    
    recommendations = []
    for plot in plots:
        water_need = plot.area * 10
        
        recommendations.append({
            "id": f"rec_{plot.id}",
            "title": f"Recommandation pour {plot.name}",
            "description": f"Irrigation recommandée: {water_need:.1f} m³ pour {plot.name}",
            "volume": water_need,
            "priority": "medium",
            "date": datetime.now().isoformat(),
            "status": "pending"
        })
    
    return recommendations