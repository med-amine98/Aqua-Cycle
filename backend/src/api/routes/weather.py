from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from ...database import get_db
from .auth import get_current_user_dep
from ...models.user import User
from ...services.atmospheric_service import atmospheric_service

router = APIRouter(prefix="/weather", tags=["Weather"])

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
    historicalData: Optional[List[dict]] = None
    forecastDays: int = 7

class AtmosphereAnalysisRequest(BaseModel):
    latitude: float
    longitude: float


@router.post("/forecast")
async def get_weather_forecast(
    data: WeatherForecastRequest,
    current_user: User = Depends(get_current_user_dep)
):
    """
    Prévisions météo via Open-Meteo (gratuit) / NVIDIA Earth-2 (si clé configurée).
    Fallback déterministe si toutes les APIs échouent.
    """
    try:
        result = await atmospheric_service.get_forecast(
            lat=data.latitude,
            lon=data.longitude,
            days=data.days
        )
        # Normalize field names for frontend compatibility
        normalized = []
        for f in result.get("forecasts", []):
            normalized.append({
                "date": f.get("date"),
                "temperature": f.get("temperature", 22),
                "humidity": f.get("humidity", 60),
                "precipitation": f.get("precipitation", 0),
                "windSpeed": f.get("wind_speed", 10),
                "pressure": f.get("pressure", 1013),
                "cloudCover": f.get("cloud_cover", 50),
                "evapotranspiration": f.get("evapotranspiration", 3.5),
            })
        return {
            "forecasts": normalized,
            "source": result.get("source", "Open-Meteo"),
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
    """
    Prédiction de consommation d'eau via Random Forest (scikit-learn).
    Utilise les données météo réelles de Open-Meteo.
    """
    from ...services.rf_water_predictor import rf_water_predictor

    try:
        # Get real weather for the location
        weather = await atmospheric_service.get_current_conditions(
            lat=data.latitude,
            lon=data.longitude
        )

        primary_crop = data.cropTypes[0] if data.cropTypes else "vegetables"
        result = rf_water_predictor.predict(
            temperature=weather.get("temperature", 22),
            humidity=weather.get("humidity", 60),
            wind_speed=weather.get("wind_speed", 10),
            precipitation=weather.get("precipitation", 0),
            area_ha=1.0,
            crop_type=primary_crop,
            soil_type=data.soilType,
            irrigation_system=data.irrigationSystem,
            forecast_days=data.forecastDays,
        )

        # Format for frontend
        predictions = []
        for p in result.get("predictions", []):
            predictions.append({
                "date": p["date"],
                "predictedConsumption": p["predicted_m3"],
                "confidence": p["confidence"],
                "factors": {
                    "cropType": primary_crop,
                    "soil": data.soilType,
                    "irrigation": data.irrigationSystem,
                }
            })

        return {
            "predictions": predictions,
            "total_predicted": result.get("total_predicted_m3", 0),
            "source": result.get("model", "Random Forest"),
            "unit": "m³/ha",
            "crop_types": data.cropTypes,
            "soil_type": data.soilType,
            "irrigation_system": data.irrigationSystem,
            "weather_source": weather.get("source", "unknown"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-atmosphere")
async def analyze_atmosphere(
    data: AtmosphereAnalysisRequest,
    current_user: User = Depends(get_current_user_dep)
):
    """Analyse atmosphérique en temps réel via Open-Meteo / NVIDIA Earth-2."""
    try:
        conditions = await atmospheric_service.get_current_conditions(
            lat=data.latitude,
            lon=data.longitude
        )

        temp = conditions.get("temperature", 22)
        humidity = conditions.get("humidity", 60)
        wind = conditions.get("wind_speed", 10)
        precip = conditions.get("precipitation", 0)

        recommendations = []
        if precip > 5:
            recommendations.append("🌧️ Pluie prévue — Réduire l'irrigation aujourd'hui")
        if temp > 35:
            recommendations.append("🌡️ Température élevée — Arroser tôt le matin ou le soir")
        if wind > 20:
            recommendations.append("💨 Vent fort — Protéger les cultures fragiles")
        if humidity < 30:
            recommendations.append("🏜️ Humidité faible — Augmenter la fréquence d'irrigation")
        if not recommendations:
            recommendations.append("✅ Conditions favorables pour l'irrigation")
            recommendations.append("💧 Maintenir le calendrier d'arrosage habituel")

        return {
            "timestamp": datetime.now().isoformat(),
            "location": {"lat": data.latitude, "lon": data.longitude},
            "atmospheric_indicators": {
                "pressure": conditions.get("pressure", 1013),
                "humidity": humidity,
                "temperature": temp,
                "wind_speed": wind,
                "cloud_cover": conditions.get("cloud_cover", 50),
                "air_quality_index": 45,
                "uv_index": round(max(0, 8 * (1 - conditions.get("cloud_cover", 50) / 100)), 1),
                "visibility": 15.0,
            },
            "trends": {
                "pressure_trend": "stable",
                "temperature_trend": "increasing" if temp > 28 else "stable",
                "precipitation_probability": min(100, precip * 20),
            },
            "recommendations": recommendations,
            "source": conditions.get("source", "Open-Meteo"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/current")
async def get_current_weather(
    data: AtmosphereAnalysisRequest,
    current_user: User = Depends(get_current_user_dep)
):
    """Données météo en temps réel via Open-Meteo."""
    try:
        conditions = await atmospheric_service.get_current_conditions(
            lat=data.latitude,
            lon=data.longitude
        )
        return {
            "temperature": conditions.get("temperature", 20),
            "humidity": conditions.get("humidity", 60),
            "windSpeed": conditions.get("wind_speed", 10),
            "pressure": conditions.get("pressure", 1013),
            "precipitation": conditions.get("precipitation", 0),
            "cloudCover": conditions.get("cloud_cover", 50),
            "feelsLike": round(conditions.get("temperature", 20) - 2, 1),
            "uvIndex": round(max(0, 8 * (1 - conditions.get("cloud_cover", 50) / 100)), 1),
            "visibility": 15.0,
            "timestamp": datetime.now().isoformat(),
            "source": conditions.get("source", "Open-Meteo"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))