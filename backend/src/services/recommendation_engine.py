"""
Recommendation Engine — AquaCycle
Moteur de recommandations IA intégré.
Agrège les données météo, eau, cultures, maladies et déchets
pour produire des recommandations actionnables :
  Prédiction → Recommandation → Action
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Generates actionable AI recommendations by cross-referencing
    real data from all AquaCycle modules.
    """

    def generate_recommendations(
        self,
        *,
        weather: Optional[Dict[str, Any]] = None,
        water_predictions: Optional[List[Dict]] = None,
        crops: Optional[List[Dict]] = None,
        water_records: Optional[List[Dict]] = None,
        disease_history: Optional[List[Dict]] = None,
        waste_available: Optional[List[Dict]] = None,
        farm: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Produce a ranked list of actionable recommendations.
        Every recommendation includes:
          - category, priority, title, description
          - action (concrete step the farmer should take)
          - impact_estimate, confidence, module_sources
        """
        recs: List[Dict[str, Any]] = []

        # ── 1. Water-based recommendations ───────────────────────────
        if water_predictions and len(water_predictions) > 0:
            recs.extend(self._water_recommendations(
                water_predictions, weather, crops, water_records, farm
            ))

        # ── 2. Weather-based recommendations ─────────────────────────
        if weather:
            recs.extend(self._weather_recommendations(weather, crops))

        # ── 3. Crop growth stage recommendations ─────────────────────
        if crops:
            recs.extend(self._crop_recommendations(crops, weather))

        # ── 4. Disease / health recommendations ──────────────────────
        if disease_history:
            recs.extend(self._disease_recommendations(disease_history, crops))

        # ── 5. Waste valorisation recommendations ────────────────────
        if waste_available:
            recs.extend(self._waste_recommendations(waste_available, farm))

        # ── 6. Cross-module recommendations ──────────────────────────
        recs.extend(self._cross_module_recommendations(
            weather, water_predictions, crops, waste_available
        ))

        # Sort by priority weight
        priority_weight = {"critique": 0, "haute": 1, "moyenne": 2, "basse": 3}
        recs.sort(key=lambda r: priority_weight.get(r.get("priority", "basse"), 4))

        return recs

    # ─────────────────────────────────────────────────────────────────
    def _water_recommendations(
        self, predictions, weather, crops, water_records, farm
    ) -> List[Dict]:
        recs = []
        total_predicted = sum(p.get("predicted_m3", 0) for p in predictions)
        avg_daily = total_predicted / max(len(predictions), 1)

        # Compare with historical average if available
        historical_avg = 0.0
        if water_records and len(water_records) > 0:
            historical_avg = sum(
                w.get("volume", 0) for w in water_records
            ) / max(len(water_records), 1)

        if historical_avg > 0:
            change_pct = ((avg_daily - historical_avg) / historical_avg) * 100
            if abs(change_pct) > 10:
                direction = "augmente" if change_pct > 0 else "diminue"
                # Build concrete irrigation action
                crop_name = "vos parcelles"
                irrigation_minutes = round(avg_daily * 60 / max(1, len(crops or [{}])), 0)
                optimal_time = "tôt le matin (6h-8h)" if weather and weather.get("temperature", 20) > 28 else "le matin (7h-9h)"

                recs.append({
                    "id": f"reco_water_trend_{datetime.now().strftime('%H%M')}",
                    "category": "eau",
                    "priority": "haute" if abs(change_pct) > 20 else "moyenne",
                    "title": f"💧 Consommation prévue {direction} de {abs(change_pct):.0f}%",
                    "description": (
                        f"La consommation prédite ({avg_daily:.1f} m³/jour) "
                        f"est {'supérieure' if change_pct > 0 else 'inférieure'} "
                        f"à la moyenne historique ({historical_avg:.1f} m³/jour)."
                    ),
                    "action": (
                        f"Irriguer {crop_name} {optimal_time} pendant environ "
                        f"{irrigation_minutes:.0f} minutes par parcelle."
                    ),
                    "impact_estimate": f"Économie potentielle de {abs(change_pct * 0.3):.0f}% d'eau",
                    "confidence": 85,
                    "module_sources": ["rf_water_predictor", "water_records"],
                    "icon": "💧",
                })

        # Peak consumption alert
        if predictions:
            peak_day = max(predictions, key=lambda p: p.get("predicted_m3", 0))
            if peak_day.get("predicted_m3", 0) > avg_daily * 1.3:
                peak_date = peak_day.get("date", "prochainement")
                recs.append({
                    "id": f"reco_water_peak_{datetime.now().strftime('%H%M')}",
                    "category": "eau",
                    "priority": "haute",
                    "title": f"📈 Pic de consommation prévu le {peak_date}",
                    "description": (
                        f"La consommation prévue atteint {peak_day['predicted_m3']:.1f} m³, "
                        f"soit {((peak_day['predicted_m3'] / avg_daily - 1) * 100):.0f}% au-dessus de la moyenne."
                    ),
                    "action": (
                        f"Préparer les réserves d'eau pour le {peak_date}. "
                        f"Vérifier le système d'irrigation et programmer l'arrosage automatique."
                    ),
                    "impact_estimate": "Prévention de stress hydrique",
                    "confidence": 80,
                    "module_sources": ["rf_water_predictor", "atmospheric_service"],
                    "icon": "📈",
                })

        return recs

    # ─────────────────────────────────────────────────────────────────
    def _weather_recommendations(self, weather, crops) -> List[Dict]:
        recs = []
        temp = weather.get("temperature", 22)
        humidity = weather.get("humidity", 60)
        wind = weather.get("wind_speed", 10)
        precip = weather.get("precipitation", 0)

        if temp > 35:
            recs.append({
                "id": f"reco_heat_{datetime.now().strftime('%H%M')}",
                "category": "météo",
                "priority": "critique",
                "title": f"🌡️ Vague de chaleur — {temp}°C",
                "description": (
                    f"Température actuelle de {temp}°C avec humidité à {humidity}%. "
                    f"Risque élevé de stress thermique pour les cultures."
                ),
                "action": (
                    "Irriguer exclusivement entre 5h et 7h du matin ou après 20h. "
                    "Installer des filets d'ombrage si possible. "
                    "Augmenter la fréquence d'irrigation de 20%."
                ),
                "impact_estimate": "Réduction du stress thermique de 40%",
                "confidence": 92,
                "module_sources": ["atmospheric_service"],
                "icon": "🌡️",
            })

        if precip > 5:
            saved_water = precip * 0.8  # 80% effective
            recs.append({
                "id": f"reco_rain_{datetime.now().strftime('%H%M')}",
                "category": "météo",
                "priority": "haute",
                "title": f"🌧️ Pluie prévue — {precip} mm",
                "description": (
                    f"Précipitations de {precip} mm prévues. "
                    f"Cela équivaut à environ {saved_water:.1f} m³/ha d'eau effective."
                ),
                "action": (
                    f"Suspendre l'irrigation aujourd'hui. "
                    f"Économie estimée : {saved_water:.1f} m³/ha. "
                    f"Reprendre l'irrigation après 24h sans pluie."
                ),
                "impact_estimate": f"Économie de {saved_water:.1f} m³/ha d'eau",
                "confidence": 88,
                "module_sources": ["atmospheric_service"],
                "icon": "🌧️",
            })

        if wind > 25:
            recs.append({
                "id": f"reco_wind_{datetime.now().strftime('%H%M')}",
                "category": "météo",
                "priority": "haute",
                "title": f"💨 Vent fort — {wind} km/h",
                "description": f"Vitesse du vent à {wind} km/h. Risque pour les cultures hautes et l'irrigation par aspersion.",
                "action": (
                    "Passer en irrigation goutte-à-goutte si possible. "
                    "Protéger les serres et tuteurs des cultures hautes."
                ),
                "impact_estimate": "Prévention de pertes mécaniques",
                "confidence": 90,
                "module_sources": ["atmospheric_service"],
                "icon": "💨",
            })

        if humidity < 30:
            recs.append({
                "id": f"reco_dry_{datetime.now().strftime('%H%M')}",
                "category": "météo",
                "priority": "moyenne",
                "title": f"🏜️ Air très sec — Humidité {humidity}%",
                "description": f"Humidité relative à {humidity}%. Évapotranspiration accrue.",
                "action": (
                    "Augmenter la fréquence d'irrigation de 15%. "
                    "Appliquer un paillage (mulch) pour retenir l'humidité du sol."
                ),
                "impact_estimate": "Réduction de l'évaporation de 25%",
                "confidence": 82,
                "module_sources": ["atmospheric_service"],
                "icon": "🏜️",
            })

        return recs

    # ─────────────────────────────────────────────────────────────────
    def _crop_recommendations(self, crops, weather) -> List[Dict]:
        recs = []
        for crop in crops:
            stage = (crop.get("growth_stage") or crop.get("growthStage") or "").lower()
            name = crop.get("name", "Culture")
            area = crop.get("area", 0)

            if stage in ("floraison", "flowering"):
                recs.append({
                    "id": f"reco_crop_bloom_{crop.get('id', '')}",
                    "category": "culture",
                    "priority": "haute",
                    "title": f"🌺 {name} en floraison — Irrigation critique",
                    "description": (
                        f"{name} ({area} ha) est en phase de floraison. "
                        f"Le besoin en eau est maximal durant cette période."
                    ),
                    "action": (
                        f"Maintenir une irrigation régulière de {name}. "
                        f"Ne pas réduire l'arrosage pendant la floraison pour assurer la fructification. "
                        f"Durée recommandée : 45-60 min/jour en goutte-à-goutte."
                    ),
                    "impact_estimate": "Rendement +15-25%",
                    "confidence": 90,
                    "module_sources": ["crops_data"],
                    "icon": "🌺",
                })

            if stage in ("maturation", "harvest", "récolte"):
                recs.append({
                    "id": f"reco_crop_harvest_{crop.get('id', '')}",
                    "category": "culture",
                    "priority": "moyenne",
                    "title": f"🌾 {name} — Préparer la récolte",
                    "description": (
                        f"{name} approche de la maturité. "
                        f"Planifier la récolte et la gestion des résidus."
                    ),
                    "action": (
                        f"Réduire progressivement l'irrigation de {name}. "
                        f"Prévoir la déclaration des résidus de culture sur le marketplace AquaCycle."
                    ),
                    "impact_estimate": "Valorisation des résidus possible",
                    "confidence": 85,
                    "module_sources": ["crops_data", "waste_service"],
                    "icon": "🌾",
                })

        return recs

    # ─────────────────────────────────────────────────────────────────
    def _disease_recommendations(self, disease_history, crops) -> List[Dict]:
        recs = []
        for entry in disease_history:
            disease = entry.get("disease_name", "")
            confidence = entry.get("confidence", 0)
            subject = entry.get("plant_type") or entry.get("animal_type") or "sujet"

            if disease and disease.lower() != "healthy" and confidence > 50:
                recs.append({
                    "id": f"reco_disease_{entry.get('id', '')}",
                    "category": "santé",
                    "priority": "critique" if confidence > 75 else "haute",
                    "title": f"⚠️ Signes visuels détectés sur {subject}",
                    "description": (
                        f"L'analyse par vision par ordinateur a détecté des signes visuels "
                        f"potentiellement associés à : {disease} (confiance : {confidence}%). "
                        f"Cette analyse est indicative et ne constitue pas un diagnostic."
                    ),
                    "action": (
                        f"Inspecter visuellement {subject} pour confirmer les signes observés. "
                        f"Consulter un agronome ou vétérinaire pour un diagnostic professionnel. "
                        f"{entry.get('treatment', '')}"
                    ),
                    "impact_estimate": "Prévention de propagation",
                    "confidence": confidence,
                    "module_sources": ["cnn_disease_detector", "yolo_disease_detector"],
                    "icon": "⚠️",
                })

        return recs

    # ─────────────────────────────────────────────────────────────────
    def _waste_recommendations(self, waste_available, farm) -> List[Dict]:
        recs = []
        if waste_available and len(waste_available) > 0:
            organic_waste = [
                w for w in waste_available
                if w.get("waste_type", "") in (
                    "fumier", "compost", "résidus_végétaux", "organic",
                    "manure", "crop_residues"
                )
            ]
            if organic_waste:
                total_qty = sum(w.get("quantity", 0) for w in organic_waste)
                recs.append({
                    "id": f"reco_waste_organic_{datetime.now().strftime('%H%M')}",
                    "category": "déchets",
                    "priority": "moyenne",
                    "title": f"♻️ {len(organic_waste)} déchet(s) organique(s) disponible(s) — {total_qty:.0f} kg",
                    "description": (
                        f"{len(organic_waste)} offre(s) de déchets organiques "
                        f"disponible(s) sur le marketplace pour un total de {total_qty:.0f} kg."
                    ),
                    "action": (
                        "Consulter le marketplace AquaCycle pour valoriser ces déchets "
                        "en compost ou amendement organique pour vos parcelles."
                    ),
                    "impact_estimate": f"Valorisation de {total_qty:.0f} kg de matière organique",
                    "confidence": 95,
                    "module_sources": ["waste_service", "marketplace"],
                    "icon": "♻️",
                })

        return recs

    # ─────────────────────────────────────────────────────────────────
    def _cross_module_recommendations(
        self, weather, water_predictions, crops, waste_available
    ) -> List[Dict]:
        """
        Cross-module intelligence: combine data from multiple modules
        to generate insights no single module could produce alone.
        """
        recs = []

        # Weather + Harvest timing
        if weather and crops:
            temp = weather.get("temperature", 22)
            precip = weather.get("precipitation", 0)
            for crop in crops:
                stage = (crop.get("growth_stage") or crop.get("growthStage") or "").lower()
                name = crop.get("name", "Culture")
                if stage in ("maturation", "harvest", "récolte") and precip > 10:
                    recs.append({
                        "id": f"reco_cross_harvest_rain_{crop.get('id', '')}",
                        "category": "cross-module",
                        "priority": "critique",
                        "title": f"🚨 {name} : Avancer la récolte — Pluie prévue",
                        "description": (
                            f"{name} est en phase de récolte et des précipitations de {precip} mm "
                            f"sont prévues. Risque de dégradation de la qualité."
                        ),
                        "action": (
                            f"Avancer la récolte de {name} de 1-2 jours si possible. "
                            f"Préparer le séchage et le stockage à couvert."
                        ),
                        "impact_estimate": "Prévention de pertes post-récolte",
                        "confidence": 87,
                        "module_sources": ["atmospheric_service", "crops_data"],
                        "icon": "🚨",
                    })

        # Water stress + waste valorisation
        if water_predictions and waste_available:
            total_water = sum(p.get("predicted_m3", 0) for p in water_predictions)
            if total_water > 50:  # High consumption
                organic = [w for w in waste_available if w.get("waste_type") in (
                    "fumier", "compost", "organic", "manure"
                )]
                if organic:
                    recs.append({
                        "id": f"reco_cross_mulch_{datetime.now().strftime('%H%M')}",
                        "category": "cross-module",
                        "priority": "moyenne",
                        "title": "🔄 Économiser l'eau avec du compost disponible",
                        "description": (
                            f"Consommation d'eau prévue élevée ({total_water:.0f} m³ sur 7 jours). "
                            f"Du compost est disponible sur le marketplace."
                        ),
                        "action": (
                            "Utiliser le compost comme paillage (mulch) pour réduire l'évaporation "
                            "de 20-30%. Commander via le marketplace AquaCycle."
                        ),
                        "impact_estimate": "Économie de 20-30% d'eau d'irrigation",
                        "confidence": 80,
                        "module_sources": ["rf_water_predictor", "waste_service"],
                        "icon": "🔄",
                    })

        return recs


# Singleton
recommendation_engine = RecommendationEngine()
