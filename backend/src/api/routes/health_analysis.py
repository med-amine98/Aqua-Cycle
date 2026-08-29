from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import io
from PIL import Image
from ...database import get_db
from .auth import get_current_user_dep
from ...models.user import User
from ...models.animal import Animal
from ...models.plot import Plot
from ...models.health_analysis import HealthAnalysis  # ← Importer HealthAnalysis depuis le bon module
from ...services.image_analysis import ImageAnalysisService
from pydantic import BaseModel

router = APIRouter(prefix="/health", tags=["Health Analysis"])
analysis_service = ImageAnalysisService()

class HealthAnalysisCreate(BaseModel):
    type: str  # 'animal' ou 'plant'
    animal_id: Optional[str] = None
    plant_id: Optional[str] = None
    notes: Optional[str] = None

@router.post("/analyze/plant")
async def analyze_plant_health(
    image: UploadFile = File(...),
    plant_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Analyser la santé d'une plante via une image"""
    if not (image.content_type and image.content_type.startswith('image/')):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    try:
        contents = await image.read()
        result = await analysis_service.analyze_plant_health(contents)
        
        # Sauvegarder l'analyse en base de données
        analysis = HealthAnalysis(
            plant_id=plant_id,
            type="plant",
            result=result,
            confidence=result.get('confidence', 0),
            status="analyzed",
            notes="Analyse IA - Santé des plantes"
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        return {
            "analysis_id": analysis.id,
            "result": result,
            "confidence": result.get('confidence', 0),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/animal")
async def analyze_animal_health(
    image: UploadFile = File(...),
    animal_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Analyser la santé d'un animal via une image"""
    if not (image.content_type and image.content_type.startswith('image/')):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    try:
        contents = await image.read()
        result = await analysis_service.analyze_animal_health(contents)
        
        # Sauvegarder l'analyse en base de données
        analysis = HealthAnalysis(
            animal_id=animal_id,
            type="animal",
            result=result,
            confidence=result.get('confidence', 0),
            status="analyzed",
            notes="Analyse IA - Santé animale"
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        return {
            "analysis_id": analysis.id,
            "result": result,
            "confidence": result.get('confidence', 0),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analyses")
async def get_health_analyses(
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Récupérer toutes les analyses de santé"""
    analyses = db.query(HealthAnalysis).all()
    return analyses

@router.get("/analyses/{analysis_id}")
async def get_health_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Récupérer une analyse spécifique"""
    analysis = db.query(HealthAnalysis).filter(
        HealthAnalysis.id == analysis_id
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analyse non trouvée")
    return analysis

@router.delete("/analyses/{analysis_id}")
async def delete_health_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Supprimer une analyse"""
    analysis = db.query(HealthAnalysis).filter(
        HealthAnalysis.id == analysis_id
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analyse non trouvée")
    
    db.delete(analysis)
    db.commit()
    return {"message": "Analyse supprimée avec succès"}


@router.post("/analyze/combined")
async def analyze_combined(
    image: UploadFile = File(...),
    analysis_type: str = Form("plant", description="'plant' ou 'animal'"),
    entity_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """
    ## Analyse combinée CNN + YOLO + Gemini
    
    Lance les 3 modèles en parallèle:
    - **Gemini**: Description détaillée + traitement recommandé
    - **CNN ResNet-50**: Classification de la maladie
    - **YOLOv8**: Localisation (bounding boxes) des zones affectées
    
    Retourne un résultat consensuel fusionné.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")

    try:
        contents = await image.read()
        result = await analysis_service.combined_analysis(contents, analysis_type)

        # Save to DB
        consensus = result.get("consensus", {})
        analysis = HealthAnalysis(
            plant_id=entity_id if analysis_type == "plant" else None,
            animal_id=entity_id if analysis_type == "animal" else None,
            type=analysis_type,
            result=result,
            confidence=consensus.get("merged_confidence", 0),
            status="analyzed",
            notes=f"Analyse combinée CNN+YOLO+Gemini — {consensus.get('disease_name', '')}"
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        return {
            "analysis_id": analysis.id,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))