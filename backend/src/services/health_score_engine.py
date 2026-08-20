"""
Crop Health Score Engine — AquaCycle
Calculates a 0-100 health score per farm/plot by aggregating:
  - Estimated NDVI (from weather + growth stage)
  - Weather conditions (temperature, humidity, precipitation)
  - Water stress index (from RF water predictor)
  - Disease detections (from CNN/YOLO history)
  - Soil quality factor
  - Growth stage progression
All data comes from real AquaCycle services — no mock data.
"""

import logging
import math
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


# ── NDVI estimation from growth stage + weather ─────────────────────
GROWTH_STAGE_NDVI = {
    "germination": 0.15, "seedling": 0.25, "semis": 0.25,
    "végétatif": 0.55, "vegetative": 0.55, "croissance": 0.55,
    "floraison": 0.75, "flowering": 0.75,
    "fructification": 0.70, "fruiting": 0.70,
    "maturation": 0.60, "maturation": 0.60,
    "récolte": 0.40, "harvest": 0.40,
}


class HealthScoreEngine:
    """
    Computes a Crop Health Score (0-100) from multiple real data sources.
    """

    def compute_farm_health(
        self,
        *,
        crops: List[Dict],
        weather: Optional[Dict] = None,
        water_predictions: Optional[List[Dict]] = None,
        water_records: Optional[List[Dict]] = None,
        disease_detections: Optional[List[Dict]] = None,
        farm: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Returns an overall farm health score and per-crop breakdown.
        """
        if not crops:
            return {
                "overall_score": 0,
                "grade": "N/A",
                "color": "#9E9E9E",
                "message": "Aucune culture enregistrée",
                "factors": {},
                "crop_scores": [],
                "computed_at": datetime.now().isoformat(),
            }

        crop_scores = []
        for crop in crops:
            score_detail = self._compute_crop_score(
                crop=crop,
                weather=weather,
                water_predictions=water_predictions,
                water_records=water_records,
                disease_detections=disease_detections,
                farm=farm,
            )
            crop_scores.append(score_detail)

        # Weighted average by area
        total_area = sum(c.get("area_weight", 1) for c in crop_scores)
        overall = sum(
            c["score"] * c.get("area_weight", 1) for c in crop_scores
        ) / max(total_area, 1)
        overall = round(overall, 1)

        grade, color = self._score_to_grade(overall)

        # Aggregate factor breakdown
        factor_keys = ["ndvi", "weather", "water_stress", "disease", "soil", "growth"]
        agg_factors = {}
        for key in factor_keys:
            values = [c["factors"].get(key, {}).get("score", 0) for c in crop_scores]
            agg_factors[key] = {
                "score": round(sum(values) / max(len(values), 1), 1),
                "weight": crop_scores[0]["factors"].get(key, {}).get("weight", 0) if crop_scores else 0,
                "label": crop_scores[0]["factors"].get(key, {}).get("label", key) if crop_scores else key,
            }

        return {
            "overall_score": overall,
            "grade": grade,
            "color": color,
            "message": self._score_message(overall),
            "factors": agg_factors,
            "crop_scores": crop_scores,
            "computed_at": datetime.now().isoformat(),
        }

    def _compute_crop_score(
        self, *, crop, weather, water_predictions, water_records,
        disease_detections, farm
    ) -> Dict[str, Any]:
        factors = {}

        # ── 1. NDVI estimate (25%) ──────────────────────────────────
        stage = (crop.get("growth_stage") or crop.get("growthStage") or "végétatif").lower()
        base_ndvi = GROWTH_STAGE_NDVI.get(stage, 0.5)

        # Adjust NDVI by weather: good rain + moderate temp boost it
        if weather:
            temp = weather.get("temperature", 22)
            precip = weather.get("precipitation", 0)
            humidity = weather.get("humidity", 60)
            # Optimal temp range 18-30°C
            temp_factor = 1.0 - max(0, abs(temp - 24) - 6) * 0.03
            # Light rain is good
            rain_factor = min(1.0 + precip * 0.02, 1.15) if precip < 20 else 0.9
            humidity_factor = 1.0 if 40 <= humidity <= 80 else 0.9
            base_ndvi = min(1.0, base_ndvi * temp_factor * rain_factor * humidity_factor)

        ndvi_score = round(base_ndvi * 100, 1)
        factors["ndvi"] = {
            "score": ndvi_score,
            "weight": 25,
            "label": "NDVI estimé",
            "detail": f"Stade: {stage}, NDVI: {base_ndvi:.2f}",
        }

        # ── 2. Weather conditions (20%) ─────────────────────────────
        weather_score = 75.0  # default decent
        if weather:
            temp = weather.get("temperature", 22)
            humidity = weather.get("humidity", 60)
            wind = weather.get("wind_speed", 10)

            # Score based on optimal ranges
            temp_ok = max(0, 100 - abs(temp - 24) * 4)
            humidity_ok = max(0, 100 - abs(humidity - 60) * 1.5)
            wind_ok = max(0, 100 - max(0, wind - 15) * 3)
            weather_score = round((temp_ok * 0.4 + humidity_ok * 0.35 + wind_ok * 0.25), 1)

        factors["weather"] = {
            "score": weather_score,
            "weight": 20,
            "label": "Conditions météo",
            "detail": f"Temp: {weather.get('temperature', '--')}°C" if weather else "Données non disponibles",
        }

        # ── 3. Water stress (15%) ───────────────────────────────────
        water_score = 80.0  # default ok
        if water_predictions and water_records:
            predicted_daily = sum(
                p.get("predicted_m3", 0) for p in water_predictions
            ) / max(len(water_predictions), 1)
            actual_avg = sum(
                w.get("volume", 0) for w in water_records
            ) / max(len(water_records), 1)

            if actual_avg > 0:
                ratio = predicted_daily / actual_avg
                # ratio near 1.0 = good, >1.3 or <0.7 = stress
                if 0.8 <= ratio <= 1.2:
                    water_score = 90
                elif ratio > 1.5:
                    water_score = 40  # severe deficit
                elif ratio > 1.3:
                    water_score = 60
                elif ratio < 0.5:
                    water_score = 55  # over-irrigation
                else:
                    water_score = 75

        factors["water_stress"] = {
            "score": water_score,
            "weight": 15,
            "label": "Stress hydrique",
            "detail": f"Score: {water_score}/100",
        }

        # ── 4. Disease history (20%) ────────────────────────────────
        disease_score = 100.0  # healthy default
        if disease_detections:
            crop_name = crop.get("name", "").lower()
            crop_type = (crop.get("type") or "").lower()
            # Find disease detections potentially related to this crop
            relevant = [
                d for d in disease_detections
                if (d.get("plant_type", "").lower() in (crop_name, crop_type)
                    or not d.get("plant_type"))
                and d.get("disease_name", "").lower() != "healthy"
                and d.get("confidence", 0) > 50
            ]
            if relevant:
                max_conf = max(d.get("confidence", 0) for d in relevant)
                disease_score = max(20, 100 - max_conf * 0.8 - len(relevant) * 5)

        factors["disease"] = {
            "score": round(disease_score, 1),
            "weight": 20,
            "label": "Maladies détectées",
            "detail": f"{'Aucune maladie' if disease_score > 90 else 'Signes détectés'}",
        }

        # ── 5. Soil quality (5%) ────────────────────────────────────
        soil_score = 70.0
        if farm:
            soil = (farm.get("soil_type") or "").lower()
            soil_scores = {
                "loam": 90, "loameux": 90, "limoneux": 85,
                "argile": 75, "clay": 75, "argileux": 75,
                "sable": 55, "sand": 55, "sableux": 55,
                "calcaire": 65, "limestone": 65,
            }
            soil_score = soil_scores.get(soil, 70)

        factors["soil"] = {
            "score": soil_score,
            "weight": 5,
            "label": "Qualité du sol",
            "detail": f"Type: {farm.get('soil_type', 'inconnu')}" if farm else "Données non disponibles",
        }

        # ── 6. Growth stage progression (15%) ───────────────────────
        growth_stages_order = [
            "germination", "semis", "seedling",
            "végétatif", "vegetative", "croissance",
            "floraison", "flowering",
            "fructification", "fruiting",
            "maturation",
            "récolte", "harvest",
        ]
        stage_idx = next(
            (i for i, s in enumerate(growth_stages_order) if s == stage),
            3
        )
        # Active growing stages score higher
        if stage_idx <= 7:  # Before or at flowering
            growth_score = 60 + stage_idx * 5
        else:
            growth_score = 85 - (stage_idx - 7) * 5

        factors["growth"] = {
            "score": round(growth_score, 1),
            "weight": 15,
            "label": "Stade de croissance",
            "detail": f"Stade: {stage}",
        }

        # ── Weighted total ──────────────────────────────────────────
        total = sum(
            f["score"] * f["weight"] / 100
            for f in factors.values()
        )
        total = round(min(100, max(0, total)), 1)

        return {
            "crop_id": crop.get("id", ""),
            "crop_name": crop.get("name", "Culture"),
            "score": total,
            "grade": self._score_to_grade(total)[0],
            "color": self._score_to_grade(total)[1],
            "factors": factors,
            "area_weight": crop.get("area", 1) or 1,
        }

    @staticmethod
    def _score_to_grade(score: float) -> tuple:
        if score >= 80:
            return ("Excellent", "#2E7D32")
        elif score >= 60:
            return ("Attention requise", "#ED6C02")
        elif score >= 40:
            return ("Intervention nécessaire", "#E65100")
        else:
            return ("Critique", "#D32F2F")

    @staticmethod
    def _score_message(score: float) -> str:
        if score >= 85:
            return "Vos cultures sont en excellent état. Continuez ainsi !"
        elif score >= 70:
            return "État général bon. Quelques points d'attention identifiés."
        elif score >= 55:
            return "Attention requise sur certaines parcelles. Consultez les recommandations."
        elif score >= 40:
            return "Intervention nécessaire. Plusieurs facteurs nécessitent votre attention."
        else:
            return "Situation critique. Action immédiate recommandée sur vos parcelles."


# Singleton
health_score_engine = HealthScoreEngine()
