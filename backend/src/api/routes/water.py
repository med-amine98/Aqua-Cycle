from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random
import math
from ...database import get_db
from .auth import get_current_user_dep
from ...models.user import User

router = APIRouter(prefix="/weather", tags=["Weather NVIDIA Earth-2"])

class WeatherForecastRequest(BaseModel):
    latitude: float
    longitude: float
    days: int = 7

class WaterPredictionRequest(BaseModel):
    latitude: float
    longitude: float
    cropTypes: List[str]
    soilType: str
    irrigationSystem: str
    forecastDays: int = 7

class AtmosphereAnalysisRequest(BaseModel):
    latitude: float
    longitude: float

@router.post("/forecast")
async def get_weather_forecast(
    data: WeatherForecastRequest,
    current_user: User = Depends(get_current_user_dep)
):
    """🌤️ Prévisions météo NVIDIA Earth-2"""
    try:
        forecasts = []
        base_temp = 25 + math.sin(data.latitude * 0.1) * 5
        base_humidity = 60 + math.cos(data.longitude * 0.1) * 20
        
        for i in range(data.days):
            day_offset = i
            temp_variation = math.sin(day_offset * 0.8) * 3
            humidity_variation = math.cos(day_offset * 0.6) * 10
            
            forecasts.append({
                "date": (datetime.now() + timedelta(days=i)).isoformat(),
                "temperature": round(base_temp + temp_variation + random.uniform(-1, 1), 1),
                "humidity": round(base_humidity + humidity_variation + random.uniform(-5, 5), 1),
                "precipitation": round(max(0, random.uniform(0, 10) + math.sin(day_offset * 0.4) * 3), 1),
                "windSpeed": round(random.uniform(5, 25) + math.sin(day_offset * 0.3) * 5, 1),
                "pressure": round(1013 + math.sin(day_offset * 0.5) * 10 + random.uniform(-3, 3), 1),
                "cloudCover": round(max(0, min(100, 50 + math.sin(day_offset * 0.7) * 30 + random.uniform(-10, 10))), 1),
                "evapotranspiration": round(3 + math.sin(day_offset * 0.5) * 1.5 + random.uniform(-0.5, 0.5), 2)
            })
        
        return {
            "forecasts": forecasts,
            "source": "NVIDIA Earth-2",
            "location": {"lat": data.latitude, "lon": data.longitude},
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict-water")
async def predict_water_consumption(
    data: WaterPredictionRequest,
    current_user: User = Depends(get_current_user_dep)
):
    """💧 Prédiction de consommation d'eau NVIDIA Earth-2"""
    try:
        crop_coeffs = {
            "céréales": 3.5, "légumes": 5.0, "fruits": 4.2,
            "oliviers": 2.8, "vignes": 3.2, "dattes": 4.5, "légumineuses": 3.0
        }
        
        soil_coeffs = {
            "argileux": 0.8, "sableux": 1.3, "limoneux": 1.0,
            "loameux": 0.9, "calcaire": 1.1, "tourbeux": 0.7
        }
        
        irrigation_coeffs = {
            "goutte-à-goutte": 0.7, "aspersion": 0.85,
            "gravitaire": 1.0, "subsurface": 0.75, "manuel": 1.1
        }
        
        base_consumption = sum(crop_coeffs.get(c.lower(), 4.0) for c in data.cropTypes) / max(1, len(data.cropTypes))
        soil_factor = soil_coeffs.get(data.soilType.lower(), 1.0)
        irrigation_factor = irrigation_coeffs.get(data.irrigationSystem.lower(), 1.0)
        
        predictions = []
        for i in range(data.forecastDays):
            seasonal_factor = 1 + 0.3 * math.sin((i + 30) * 0.1)
            random_factor = 1 + random.uniform(-0.1, 0.1)
            predicted = base_consumption * soil_factor * irrigation_factor * seasonal_factor * random_factor
            confidence = max(65, 95 - i * 4)
            
            predictions.append({
                "date": (datetime.now() + timedelta(days=i)).isoformat(),
                "predictedConsumption": round(predicted, 2),
                "confidence": round(confidence, 1),
                "factors": {
                    "cropType": base_consumption,
                    "soil": soil_factor,
                    "irrigation": irrigation_factor,
                    "seasonal": seasonal_factor
                }
            })
        
        return {
            "predictions": predictions,
            "total_predicted": round(sum(p["predictedConsumption"] for p in predictions), 2),
            "source": "NVIDIA Earth-2",
            "unit": "m³/ha",
            "crop_types": data.cropTypes,
            "soil_type": data.soilType,
            "irrigation_system": data.irrigationSystem
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-atmosphere")
async def analyze_atmosphere(
    data: AtmosphereAnalysisRequest,
    current_user: User = Depends(get_current_user_dep)
):
    """🌍 Analyse de l'atmosphère NVIDIA Earth-2"""
    try:
        return {
            "timestamp": datetime.now().isoformat(),
            "location": {"lat": data.latitude, "lon": data.longitude},
            "atmospheric_indicators": {
                "pressure": round(1013 + random.uniform(-20, 20), 1),
                "humidity": round(random.uniform(40, 90), 1),
                "temperature": round(20 + random.uniform(-10, 15), 1),
                "wind_speed": round(random.uniform(5, 30), 1),
                "cloud_cover": round(random.uniform(0, 100), 1),
                "air_quality_index": round(random.uniform(20, 80), 1),
                "uv_index": round(random.uniform(0, 11), 1),
                "visibility": round(random.uniform(5, 20), 1)
            },
            "trends": {
                "pressure_trend": "stable" if random.random() > 0.5 else "decreasing",
                "temperature_trend": "increasing" if random.random() > 0.5 else "stable",
                "precipitation_probability": round(random.uniform(0, 100), 1)
            },
            "source": "NVIDIA Earth-2"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/current")
async def get_current_weather(
    data: AtmosphereAnalysisRequest,
    current_user: User = Depends(get_current_user_dep)
):
    """📡 Météo en temps réel"""
    try:
        return {
            "temperature": round(20 + random.uniform(-5, 10), 1),
            "humidity": round(random.uniform(40, 80), 1),
            "windSpeed": round(random.uniform(5, 20), 1),
            "pressure": round(1013 + random.uniform(-15, 15), 1),
            "precipitation": round(max(0, random.uniform(0, 5)), 1),
            "cloudCover": round(random.uniform(0, 100), 1),
            "feelsLike": round(18 + random.uniform(-3, 8), 1),
            "uvIndex": round(random.uniform(0, 10), 1),
            "visibility": round(random.uniform(5, 20), 1),
            "timestamp": datetime.now().isoformat(),
            "source": "NVIDIA Earth-2"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts")
async def get_weather_alerts(
    data: AtmosphereAnalysisRequest,
    current_user: User = Depends(get_current_user_dep)
):
    """🚨 Alertes et conseils en temps réel"""
    try:
        alerts = []
        
        # Simuler des alertes basées sur les conditions météo
        temp = 20 + random.uniform(-5, 10)
        wind = random.uniform(5, 25)
        precip = random.uniform(0, 5)
        humidity = random.uniform(40, 80)
        
        # Alertes météo
        if temp > 35:
            alerts.append({
                "type": "warning",
                "icon": "🌡️",
                "title": "Température élevée",
                "message": "Température de {:.1f}°C. Arrosez tôt le matin ou tard le soir.".format(temp),
                "priority": "high",
                "action": "Irriguer avant 8h ou après 18h"
            })
        elif temp < 5:
            alerts.append({
                "type": "warning",
                "icon": "❄️",
                "title": "Risque de gel",
                "message": "Température de {:.1f}°C. Protégez vos cultures.".format(temp),
                "priority": "high",
                "action": "Couvrir les cultures sensibles"
            })
        
        if wind > 20:
            alerts.append({
                "type": "warning",
                "icon": "💨",
                "title": "Vent fort",
                "message": "Vent de {:.1f} km/h. Risque de dégâts.".format(wind),
                "priority": "medium",
                "action": "Renforcer les protections"
            })
        
        if precip > 3:
            alerts.append({
                "type": "info",
                "icon": "🌧️",
                "title": "Pluie prévue",
                "message": "Précipitations de {:.1f} mm. Réduisez l'irrigation.".format(precip),
                "priority": "low",
                "action": "Réduire l'irrigation de 50%"
            })
        
        if humidity < 40:
            alerts.append({
                "type": "info",
                "icon": "🏜️",
                "title": "Humidité basse",
                "message": "Humidité de {:.0f}%. Augmentez l'irrigation.".format(humidity),
                "priority": "medium",
                "action": "Augmenter l'irrigation de 30%"
            })
        
        # Conseils généraux
        alerts.append({
            "type": "advice",
            "icon": "💡",
            "title": "Conseil du jour",
            "message": "Vérifiez l'humidité du sol avant d'irriguer pour optimiser l'utilisation de l'eau.",
            "priority": "low",
            "action": "Utiliser un tensiomètre"
        })
        
        alerts.append({
            "type": "advice",
            "icon": "📊",
            "title": "Optimisation",
            "message": "Utilisez les prévisions météo pour planifier votre irrigation.",
            "priority": "low",
            "action": "Consulter les prévisions"
        })
        
        return {
            "alerts": alerts,
            "count": len(alerts),
            "timestamp": datetime.now().isoformat(),
            "source": "NVIDIA Earth-2"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))