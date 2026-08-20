"""
AI Models Router — AquaCycle
Exposes CNN, YOLO, Random Forest, and NVIDIA Earth-2 endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import io
from PIL import Image

from .auth import get_current_user_dep
from ...models.user import User
from ...services.cnn_disease_detector import cnn_detector
from ...services.yolo_disease_detector import yolo_detector
from ...services.rf_water_predictor import rf_water_predictor
from ...services.atmospheric_service import atmospheric_service

router = APIRouter(prefix="/ai/models", tags=["AI Models"])


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class WaterPredictionRequest(BaseModel):
    temperature: float = Field(25.0, description="Temperature en °C")
    humidity: float = Field(60.0, description="Humidité relative en %")
    wind_speed: float = Field(10.0, description="Vitesse du vent en km/h")
    precipitation: float = Field(0.0, description="Précipitations en mm")
    area_ha: float = Field(1.0, description="Superficie en hectares")
    crop_type: str = Field("vegetables", description="Type de culture")
    soil_type: str = Field("loam", description="Type de sol")
    irrigation_system: str = Field("drip", description="Système d'irrigation")
    growth_stage: str = Field("vegetative", description="Stade de croissance")
    forecast_days: int = Field(7, ge=1, le=30, description="Nombre de jours à prédire")


class TrainRFRequest(BaseModel):
    records: List[Dict[str, Any]] = Field(
        ..., description="Données historiques pour entraînement"
    )


class ForecastRequest(BaseModel):
    latitude: float = Field(..., description="Latitude")
    longitude: float = Field(..., description="Longitude")
    days: int = Field(7, ge=1, le=16, description="Nombre de jours")


class AtmosphereMapRequest(BaseModel):
    latitude: float
    longitude: float
    radius_deg: float = Field(2.0, ge=0.1, le=10.0)
    grid_points: int = Field(5, ge=3, le=10)


# ─────────────────────────────────────────────────────────────────────────────
# CNN Disease Detection
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/cnn/detect-disease")
async def cnn_detect_disease(
    image: UploadFile = File(..., description="Image de la plante ou animal"),
    analysis_type: str = Form("plant", description="'plant' ou 'animal'"),
    current_user: User = Depends(get_current_user_dep),
):
    """
    ## Détection de maladies par CNN (ResNet-50)
    
    Analyse une image de plante ou animal via un réseau de neurones convolutif.
    Retourne le type de maladie, la sévérité et les recommandations de traitement.
    
    - **Modèle**: ResNet-50 (ImageNet pre-trained)
    - **Classes**: 38 maladies des plantes (PlantVillage dataset)
    - **Fallback**: Heuristique couleur si PyTorch non disponible
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image (JPEG, PNG, etc.)")

    try:
        contents = await image.read()
        result = await cnn_detector.analyze(contents, analysis_type)
        return {
            **result,
            "endpoint": "CNN ResNet-50",
            "analyzed_at": datetime.now().isoformat(),
            "filename": image.filename,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur CNN: {str(exc)}")


@router.get("/cnn/status")
async def cnn_status(current_user: User = Depends(get_current_user_dep)):
    """État du modèle CNN."""
    return {
        "model": "CNN ResNet-50",
        "torch_available": cnn_detector._torch_available,
        "model_loaded": cnn_detector._model is not None,
        "num_classes": len(cnn_detector.__class__.__dict__),
        "status": "ready" if cnn_detector._torch_available else "heuristic_mode",
    }


# ─────────────────────────────────────────────────────────────────────────────
# YOLO Disease Detection
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/yolo/detect-disease")
async def yolo_detect_disease(
    image: UploadFile = File(..., description="Image de la plante ou animal"),
    analysis_type: str = Form("plant", description="'plant' ou 'animal'"),
    current_user: User = Depends(get_current_user_dep),
):
    """
    ## Détection de maladies par YOLO (YOLOv8)
    
    Détecte et localise les zones malades dans une image avec des boîtes englobantes.
    Retourne les coordonnées des zones affectées pour visualisation sur l'image.
    
    - **Modèle**: YOLOv8n (Ultralytics)
    - **Output**: Bounding boxes + classes + confidences
    - **Fallback**: Simulation si ultralytics non installé
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")

    try:
        contents = await image.read()
        result = await yolo_detector.detect(contents, analysis_type)
        return {
            **result,
            "endpoint": "YOLOv8",
            "analyzed_at": datetime.now().isoformat(),
            "filename": image.filename,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur YOLO: {str(exc)}")


@router.post("/yolo+cnn/combined-analysis")
async def combined_yolo_cnn_analysis(
    image: UploadFile = File(...),
    analysis_type: str = Form("plant"),
    current_user: User = Depends(get_current_user_dep),
):
    """
    ## Analyse combinée CNN + YOLO
    
    Lance simultanément l'analyse CNN (classification) et YOLO (localisation).
    Combine les résultats pour une analyse complète: type de maladie + zones affectées.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")

    try:
        contents = await image.read()

        import asyncio
        cnn_task = cnn_detector.analyze(contents, analysis_type)
        yolo_task = yolo_detector.detect(contents, analysis_type)
        cnn_result, yolo_result = await asyncio.gather(cnn_task, yolo_task)

        # Merge confidence scores
        cnn_conf = cnn_result.get("confidence", 0)
        yolo_conf = yolo_result.get("overall_confidence", 0)
        merged_conf = round((cnn_conf + yolo_conf) / 2, 1) if (cnn_conf and yolo_conf) else max(cnn_conf, yolo_conf)

        # Determine consensus health status
        cnn_health = cnn_result.get("health_status", "inconnu")
        yolo_health = yolo_result.get("health_status", "inconnu")
        consensus_health = (
            "malade" if "malade" in [cnn_health, yolo_health] else
            "legerement_malade" if "legerement" in [cnn_health, yolo_health] else
            "sain"
        )

        return {
            "endpoint": "CNN + YOLO Combined",
            "analyzed_at": datetime.now().isoformat(),
            "filename": image.filename,
            "consensus": {
                "health_status": consensus_health,
                "merged_confidence": merged_conf,
                "disease_name": cnn_result.get("disease_name", "Indéterminé"),
                "severity": cnn_result.get("severity", "unknown"),
                "treatment": cnn_result.get("treatment", ""),
                "detection_count": yolo_result.get("detection_count", 0),
            },
            "cnn": cnn_result,
            "yolo": yolo_result,
            "status": "success"
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur analyse combinée: {str(exc)}")


@router.get("/yolo/status")
async def yolo_status(current_user: User = Depends(get_current_user_dep)):
    """État du modèle YOLO."""
    return {
        "model": "YOLOv8",
        "ultralytics_available": yolo_detector._available,
        "model_loaded": yolo_detector._model is not None,
        "status": "ready" if yolo_detector._available else "simulation_mode",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Random Forest Water Consumption
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/rf/predict-water")
async def rf_predict_water(
    data: WaterPredictionRequest,
    current_user: User = Depends(get_current_user_dep),
):
    """
    ## Prédiction de consommation d'eau par Random Forest
    
    Prédit la consommation d'eau quotidienne sur N jours en utilisant un modèle
    Random Forest entraîné sur des données agronomiques.
    
    - **Modèle**: RandomForestRegressor (scikit-learn, 150 arbres)
    - **Features**: température, humidité, vent, précipitations, surface, type de sol, culture, irrigation
    - **Output**: Prédictions quotidiennes avec intervalles de confiance à 95%
    """
    try:
        result = rf_water_predictor.predict(
            temperature=data.temperature,
            humidity=data.humidity,
            wind_speed=data.wind_speed,
            precipitation=data.precipitation,
            area_ha=data.area_ha,
            crop_type=data.crop_type,
            soil_type=data.soil_type,
            irrigation_system=data.irrigation_system,
            growth_stage=data.growth_stage,
            forecast_days=data.forecast_days,
        )
        return {**result, "requested_at": datetime.now().isoformat()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur Random Forest: {str(exc)}")


@router.post("/rf/train")
async def rf_train_model(
    data: TrainRFRequest,
    current_user: User = Depends(get_current_user_dep),
):
    """
    ## Ré-entraîner le modèle Random Forest
    
    Entraîne le modèle sur vos données historiques de consommation d'eau.
    Chaque enregistrement doit contenir les features et 'actual_consumption'.
    """
    if len(data.records) < 20:
        raise HTTPException(
            status_code=400,
            detail="Minimum 20 enregistrements requis pour l'entraînement."
        )
    try:
        result = rf_water_predictor.train_on_data(data.records)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur entraînement: {str(exc)}")


@router.get("/rf/feature-importance")
async def rf_feature_importance(current_user: User = Depends(get_current_user_dep)):
    """Importance des features du modèle Random Forest."""
    return {
        "feature_importance": rf_water_predictor.get_feature_importance(),
        "model": "RandomForestRegressor (sklearn)",
        "status": "success"
    }


@router.get("/rf/status")
async def rf_status(current_user: User = Depends(get_current_user_dep)):
    """État du modèle Random Forest."""
    return {
        "model": "Random Forest",
        "sklearn_available": rf_water_predictor._sklearn_available,
        "trained": rf_water_predictor._trained,
        "status": "ready" if rf_water_predictor._trained else "rule_based_mode",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Atmospheric / NVIDIA Earth-2
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/atmosphere/forecast")
async def get_atmospheric_forecast(
    data: ForecastRequest,
    current_user: User = Depends(get_current_user_dep),
):
    """
    ## Prévisions atmosphériques multi-sources
    
    Récupère les prévisions météo depuis les sources disponibles dans l'ordre:
    1. **NVIDIA Earth-2** (FourCastNet AI model) si NVIDIA_API_KEY configurée
    2. **Open-Meteo** (gratuit, sans clé API, jusqu'à 16 jours)
    3. **OpenWeatherMap** (gratuit tier, 5 jours)
    4. **NASA POWER** (gratuit, données solaires + ET)
    5. **Simulation** (fallback déterministe)
    """
    try:
        result = await atmospheric_service.get_forecast(
            lat=data.latitude,
            lon=data.longitude,
            days=data.days
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur atmosphérique: {str(exc)}")


@router.post("/atmosphere/map-grid")
async def get_atmosphere_map_grid(
    data: AtmosphereMapRequest,
    current_user: User = Depends(get_current_user_dep),
):
    """
    ## Grille atmosphérique pour carte
    
    Génère une grille NxN de prédictions atmosphériques autour d'un point central.
    Utilisé pour afficher des overlays météo sur la carte de la ferme.
    """
    try:
        result = await atmospheric_service.get_atmosphere_map_grid(
            lat=data.latitude,
            lon=data.longitude,
            radius_deg=data.radius_deg,
            grid_points=data.grid_points,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur grille atmosphérique: {str(exc)}")


@router.post("/atmosphere/current")
async def get_current_atmosphere(
    data: ForecastRequest,
    current_user: User = Depends(get_current_user_dep),
):
    """Conditions atmosphériques actuelles en temps réel."""
    try:
        result = await atmospheric_service.get_current_conditions(
            lat=data.latitude,
            lon=data.longitude
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur conditions actuelles: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
# Models Status Overview
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/status")
async def all_models_status(current_user: User = Depends(get_current_user_dep)):
    """
    ## État de tous les modèles IA
    
    Retourne l'état de chaque modèle: CNN, YOLO, Random Forest, et sources atmosphériques.
    """
    return {
        "models": {
            "cnn": {
                "name": "CNN ResNet-50",
                "purpose": "Classification de maladies des plantes",
                "torch_available": cnn_detector._torch_available,
                "model_loaded": cnn_detector._model is not None,
                "mode": "deep_learning" if cnn_detector._torch_available else "heuristic",
                "endpoint": "/ai/models/cnn/detect-disease",
            },
            "yolo": {
                "name": "YOLOv8",
                "purpose": "Détection et localisation de maladies (bounding boxes)",
                "ultralytics_available": yolo_detector._available,
                "model_loaded": yolo_detector._model is not None,
                "mode": "deep_learning" if yolo_detector._available else "simulation",
                "endpoint": "/ai/models/yolo/detect-disease",
            },
            "random_forest": {
                "name": "Random Forest (scikit-learn)",
                "purpose": "Prédiction de consommation d'eau",
                "sklearn_available": rf_water_predictor._sklearn_available,
                "trained": rf_water_predictor._trained,
                "mode": "ml" if rf_water_predictor._sklearn_available else "rule_based",
                "endpoint": "/ai/models/rf/predict-water",
            },
            "atmospheric": {
                "name": "Atmospheric Prediction Service",
                "purpose": "Prévisions météo et carte atmosphérique",
                "nvidia_e2_configured": bool(atmospheric_service._nv_key),
                "openweather_configured": bool(atmospheric_service._ow_key) and atmospheric_service._ow_key not in ("votre_api_key_meteo", ""),
                "open_meteo": "always_available",
                "nasa_power": "always_available",
                "endpoint": "/ai/models/atmosphere/forecast",
            }
        },
        "gemini": {
            "name": "Google Gemini 2.0 Flash",
            "purpose": "Analyse visuelle généraliste + chat agricole",
            "endpoint": "/ai/gemini",
        },
        "timestamp": datetime.now().isoformat(),
        "status": "operational"
    }
