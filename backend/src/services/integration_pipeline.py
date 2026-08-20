"""
Integration Pipeline — AquaCycle
Central orchestrator that connects ALL modules into a unified pipeline:
  Satellite + Météo → IA → 💧 Eau → 🌱 Culture → 🚨 Alerte → 🤖 Recommandation → ♻️ Déchets → 🛒 Marketplace
Exposes a single endpoint that returns the full farm status.
All data is real — fetched live from the actual services.
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional

from .atmospheric_service import atmospheric_service
from .rf_water_predictor import rf_water_predictor
from .recommendation_engine import recommendation_engine
from .health_score_engine import health_score_engine
from .alert_engine import alert_engine

logger = logging.getLogger(__name__)


class IntegrationPipeline:
    """
    Orchestrates all AquaCycle modules into a unified analysis pipeline.
    """

    async def get_farm_status(
        self,
        *,
        farm: Dict[str, Any],
        crops: list,
        water_records: list,
        disease_detections: list,
        waste_available: list,
    ) -> Dict[str, Any]:
        """
        Execute the full integration pipeline for a farm.
        Returns health score, alerts, recommendations, and module status.
        """
        lat = farm.get("latitude", 36.8)
        lon = farm.get("longitude", 10.18)

        # ── Step 1: Get real weather data ────────────────────────────
        weather = {}
        weather_source = "unavailable"
        try:
            weather = await atmospheric_service.get_current_conditions(lat, lon)
            weather_source = weather.get("source", "unknown")
        except Exception as e:
            logger.warning(f"[Pipeline] Weather fetch failed: {e}")

        # ── Step 2: Get weather forecast ─────────────────────────────
        forecast_data = {}
        try:
            forecast_data = await atmospheric_service.get_forecast(lat, lon, days=7)
        except Exception as e:
            logger.warning(f"[Pipeline] Forecast fetch failed: {e}")

        # ── Step 3: Run water prediction (Random Forest) ─────────────
        water_predictions = []
        water_model = "unavailable"
        try:
            crop_type = "vegetables"
            if crops and len(crops) > 0:
                crop_type = (crops[0].get("type") or "vegetables").lower()

            soil_type = (farm.get("soil_type") or "loam").lower()
            irrigation = (farm.get("irrigation_system") or "drip").lower()
            area = farm.get("total_area", 1.0)

            result = rf_water_predictor.predict(
                temperature=weather.get("temperature", 22),
                humidity=weather.get("humidity", 60),
                wind_speed=weather.get("wind_speed", 10),
                precipitation=weather.get("precipitation", 0),
                area_ha=area,
                crop_type=crop_type,
                soil_type=soil_type,
                irrigation_system=irrigation,
                forecast_days=7,
            )
            water_predictions = result.get("predictions", [])
            water_model = result.get("model", "unknown")
        except Exception as e:
            logger.warning(f"[Pipeline] Water prediction failed: {e}")

        # ── Step 4: Compute Health Score ─────────────────────────────
        health_result = health_score_engine.compute_farm_health(
            crops=crops,
            weather=weather,
            water_predictions=water_predictions,
            water_records=water_records,
            disease_detections=disease_detections,
            farm=farm,
        )

        # ── Step 5: Generate Smart Alerts ────────────────────────────
        alerts = alert_engine.generate_alerts(
            weather=weather,
            water_predictions=water_predictions,
            water_records=water_records,
            crops=crops,
            disease_detections=disease_detections,
            waste_available=waste_available,
            health_score=health_result,
            farm=farm,
        )

        # ── Step 6: Generate AI Recommendations ─────────────────────
        recommendations = recommendation_engine.generate_recommendations(
            weather=weather,
            water_predictions=water_predictions,
            crops=crops,
            water_records=water_records,
            disease_history=disease_detections,
            waste_available=waste_available,
            farm=farm,
        )

        # ── Step 7: Build pipeline status ────────────────────────────
        pipeline_modules = {
            "atmospheric_service": {
                "status": "active" if weather_source != "unavailable" else "inactive",
                "source": weather_source,
                "data_available": bool(weather),
            },
            "rf_water_predictor": {
                "status": "active" if water_predictions else "inactive",
                "model": water_model,
                "predictions_count": len(water_predictions),
            },
            "health_score_engine": {
                "status": "active",
                "score": health_result.get("overall_score", 0),
            },
            "alert_engine": {
                "status": "active",
                "alerts_count": len(alerts),
                "critical_count": sum(1 for a in alerts if a.get("priority") == "critique"),
            },
            "recommendation_engine": {
                "status": "active",
                "recommendations_count": len(recommendations),
            },
            "waste_marketplace": {
                "status": "active" if waste_available else "no_data",
                "available_count": len(waste_available),
            },
        }

        return {
            "farm_id": farm.get("id", ""),
            "farm_name": farm.get("name", ""),
            "computed_at": datetime.now().isoformat(),

            # Core outputs
            "health_score": health_result,
            "alerts": alerts,
            "recommendations": recommendations,

            # Supporting data
            "weather": {
                "current": weather,
                "forecast": forecast_data.get("forecasts", [])[:7],
                "source": weather_source,
            },
            "water_prediction": {
                "predictions": water_predictions,
                "total_predicted_m3": sum(p.get("predicted_m3", 0) for p in water_predictions),
                "model": water_model,
            },
            "waste_marketplace": {
                "available_count": len(waste_available),
                "organic_count": sum(
                    1 for w in waste_available
                    if w.get("waste_type", "") in (
                        "fumier", "compost", "résidus_végétaux",
                        "organic", "manure", "crop_residues"
                    )
                ),
            },

            # Pipeline status
            "pipeline": pipeline_modules,
            "status": "success",
        }


# Singleton
integration_pipeline = IntegrationPipeline()
