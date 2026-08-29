"""
Integration API Routes — AquaCycle
Unified endpoint that orchestrates all modules via the integration pipeline.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from ...database import get_db
from .auth import get_current_user_dep
from ...models.user import User
from ...models.farm import Farm
from ...models.plot import Plot
from ...models.water import WaterBudget
from ...models.waste import WasteDeclaration, WasteStatus
from ...models.health_analysis import HealthAnalysis
from ...services.integration_pipeline import integration_pipeline

router = APIRouter(prefix="/integration", tags=["Integration Pipeline"])


@router.get("/farm-status/{farm_id}")
async def get_farm_status(
    farm_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """
    Unified farm status endpoint — executes the full integration pipeline:
    Météo → IA → Eau → Culture → Santé → Alertes → Recommandations → Déchets
    Returns health score, smart alerts, actionable recommendations, and module status.
    """
    # Fetch farm
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.owner_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")

    farm_dict = {
        "id": farm.id,
        "name": farm.name,
        "latitude": farm.latitude,
        "longitude": farm.longitude,
        "total_area": farm.total_area,
        "soil_type": farm.soil_type.value if hasattr(farm.soil_type, 'value') else str(farm.soil_type or "loam"),
        "irrigation_system": farm.irrigation_system.value if hasattr(farm.irrigation_system, 'value') else str(farm.irrigation_system or "drip"),
    }

    # Fetch crops
    plots = db.query(Plot).filter(Plot.farm_id == farm_id).all()
    crops = []
    for p in plots:
        crops.append({
            "id": p.id,
            "name": p.name,
            "type": p.crop_type.value if hasattr(p.crop_type, 'value') else str(p.crop_type or "vegetables"),
            "growth_stage": p.growth_stage.value if hasattr(p.growth_stage, 'value') else str(p.growth_stage or "végétatif"),
            "area": p.area,
            "planting_date": str(p.planting_date) if p.planting_date else None,
        })

    # Fetch water records
    water_budgets = db.query(WaterBudget).filter(
        WaterBudget.farm_id == farm_id
    ).order_by(WaterBudget.created_at.desc()).limit(30).all()
    water_records = []
    for w in water_budgets:
        water_records.append({
            "id": w.id,
            "volume": w.volume if hasattr(w, 'volume') else (w.total_used if hasattr(w, 'total_used') else 0),
            "date": str(w.created_at) if w.created_at else None,
        })

    # Fetch disease detections
    health_analyses = db.query(HealthAnalysis).order_by(HealthAnalysis.created_at.desc()).limit(20).all()
    disease_detections = []
    for h in health_analyses:
        disease_detections.append({
            "id": h.id,
            "disease_name": h.disease_name if hasattr(h, 'disease_name') else "",
            "confidence": h.confidence if hasattr(h, 'confidence') else 0,
            "plant_type": h.plant_type if hasattr(h, 'plant_type') else "",
            "animal_type": h.animal_type if hasattr(h, 'animal_type') else "",
            "treatment": h.treatment if hasattr(h, 'treatment') else "",
        })

    # Fetch available waste
    available_waste = db.query(WasteDeclaration).filter(
        WasteDeclaration.status == WasteStatus.AVAILABLE
    ).limit(50).all()
    waste_available = []
    for w in available_waste:
        waste_available.append({
            "id": w.id,
            "waste_type": w.waste_type.value if hasattr(w.waste_type, 'value') else str(w.waste_type),
            "quantity": w.quantity,
            "location": w.location if hasattr(w, 'location') else "",
        })

    try:
        result = await integration_pipeline.get_farm_status(
            farm=farm_dict,
            crops=crops,
            water_records=water_records,
            disease_detections=disease_detections,
            waste_available=waste_available,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur pipeline: {str(e)}")


@router.get("/health-score/{farm_id}")
async def get_health_score(
    farm_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Compute the crop health score for a specific farm."""
    from ...services.health_score_engine import health_score_engine
    from ...services.atmospheric_service import atmospheric_service

    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")

    plots = db.query(Plot).filter(Plot.farm_id == farm_id).all()
    crops = [{
        "id": p.id, "name": p.name,
        "type": p.crop_type.value if hasattr(p.crop_type, 'value') else str(p.crop_type or ""),
        "growth_stage": p.growth_stage.value if hasattr(p.growth_stage, 'value') else str(p.growth_stage or ""),
        "area": p.area,
    } for p in plots]

    weather = {}
    try:
        weather = await atmospheric_service.get_current_conditions(farm.latitude, farm.longitude)
    except Exception:
        pass

    farm_dict = {
        "soil_type": farm.soil_type.value if hasattr(farm.soil_type, 'value') else str(farm.soil_type or "loam"),
    }

    result = health_score_engine.compute_farm_health(
        crops=crops, weather=weather, farm=farm_dict,
    )
    return result


@router.get("/smart-alerts/{farm_id}")
async def get_smart_alerts(
    farm_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Generate smart alerts for a farm by analyzing all module data."""
    # Reuse the full pipeline for consistency
    farm_status = await get_farm_status(farm_id, current_user, db)
    return {
        "alerts": farm_status.get("alerts", []),
        "count": len(farm_status.get("alerts", [])),
        "critical": sum(1 for a in farm_status.get("alerts", []) if a.get("priority") == "critique"),
    }
