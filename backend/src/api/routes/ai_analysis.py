from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from ...services.image_analysis import ImageAnalysisService
from ...database import get_db
from .auth import get_current_user_dep
from ...models.user import User

router = APIRouter(prefix="/ai/analysis", tags=["AI Analysis"])
analysis_service = ImageAnalysisService()

@router.post("/plant")
async def analyze_plant(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Analyse la santé d'une plante via une image"""
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    try:
        contents = await image.read()
        result = await analysis_service.analyze_plant_health(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/animal")
async def analyze_animal(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Analyse la santé d'un animal via une image"""
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    try:
        contents = await image.read()
        result = await analysis_service.analyze_animal_health(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))