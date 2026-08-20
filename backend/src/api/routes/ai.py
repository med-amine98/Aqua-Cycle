from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from pydantic import BaseModel
from typing import Optional, List
import json
from datetime import datetime
from ...services.gemini_service import gemini_service
from ...config import settings
import io
from PIL import Image

router = APIRouter(prefix="/ai/gemini", tags=["AI Gemini"])

class IrrigationRequest(BaseModel):
    cropType: str
    growthStage: str
    soilType: str
    temperature: float
    humidity: float
    rainfall: float
    area: float
    plantHealth: Optional[str] = "good"

class SoilAnalysisRequest(BaseModel):
    ph: float
    nitrogen: float
    phosphorus: float
    potassium: float
    organicMatter: float
    soilType: str
    cropType: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = "agriculture"

@router.post("/irrigation")
async def get_irrigation_recommendations(data: IrrigationRequest):
    """Recommandations d'irrigation avec le nouveau SDK"""
    if not gemini_service:
        raise HTTPException(status_code=503, detail="Service Gemini non disponible")
    
    prompt = f"""
    En tant qu'expert agricole, analysez ces données et fournissez des recommandations d'irrigation précises:
    
    Culture: {data.cropType}
    Stade: {data.growthStage}
    Type de sol: {data.soilType}
    Température: {data.temperature}°C
    Humidité: {data.humidity}%
    Précipitations: {data.rainfall}mm
    Superficie: {data.area}ha
    Santé des plantes: {data.plantHealth}
    
    Fournissez une réponse JSON avec:
    - recommended_water_amount: nombre
    - irrigation_schedule: chaîne
    - urgency_level: "low"|"medium"|"high"
    - tips: liste de conseils
    - risks: liste de risques
    - soil_moisture_target: nombre
    """
    
    try:
        result = gemini_service.generate_json_response(prompt)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Gemini: {str(e)}")

@router.post("/soil-analysis")
async def analyze_soil(data: SoilAnalysisRequest):
    """Analyse de sol avec le nouveau SDK"""
    if not gemini_service:
        raise HTTPException(status_code=503, detail="Service Gemini non disponible")
    
    prompt = f"""
    Analysez ces données de sol et fournissez des recommandations en JSON:
    
    pH: {data.ph}
    Azote (N): {data.nitrogen}%
    Phosphore (P): {data.phosphorus}%
    Potassium (K): {data.potassium}%
    Matière organique: {data.organicMatter}%
    Type de sol: {data.soilType}
    Culture prévue: {data.cropType}
    
    Répondez en JSON avec:
    - soil_health_score: nombre (0-100)
    - deficiencies: liste de carences
    - recommendations: liste de recommandations
    - fertilizer_needed: chaîne
    - ph_adjustment: chaîne
    - organic_matter_improvement: chaîne
    """
    
    try:
        result = gemini_service.generate_json_response(prompt)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Gemini: {str(e)}")

@router.post("/chat")
async def chat_with_gemini(data: ChatRequest):
    """Chatbot agricole avec le nouveau SDK"""
    if not gemini_service:
        raise HTTPException(status_code=503, detail="Service Gemini non disponible")
    
    try:
        response = gemini_service.chat(data.message, data.context)
        return {
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Gemini: {str(e)}")

@router.post("/detect-disease")
async def detect_disease(image: UploadFile = File(...)):
    """Détection de maladies avec Gemini Vision"""
    if not gemini_service:
        raise HTTPException(status_code=503, detail="Service Gemini non disponible")
    
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))
        
        prompt = """
        Analysez cette image de plante agricole et répondez en JSON:
        - disease_name: nom de la maladie
        - confidence: niveau de confiance (0-100)
        - symptoms: symptômes observés
        - severity: "low"|"medium"|"high"
        - treatment: traitement recommandé
        - prevention: mesures préventives
        - urgency: "low"|"medium"|"high"
        """
        
        response = gemini_service.analyze_image(img, prompt)
        return {"result": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Gemini Vision: {str(e)}")