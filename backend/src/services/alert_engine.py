"""
Smart Alert Engine — AquaCycle
Generates proactive alerts by analyzing real data from all modules.
Alerts are categorised by type, priority, and include actionable guidance.
No mock data — all analysis is based on actual service outputs.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class AlertEngine:
    """
    Proactive alert generator that analyzes cross-module data
    to produce alerts the farmer needs to see.
    """

    def generate_alerts(
        self,
        *,
        weather: Optional[Dict[str, Any]] = None,
        water_predictions: Optional[List[Dict]] = None,
        water_records: Optional[List[Dict]] = None,
        crops: Optional[List[Dict]] = None,
        disease_detections: Optional[List[Dict]] = None,
        waste_available: Optional[List[Dict]] = None,
        health_score: Optional[Dict[str, Any]] = None,
        farm: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Generate smart alerts from real data across all modules.
        """
        alerts: List[Dict[str, Any]] = []

        # ── Water stress alerts ──────────────────────────────────────
        if water_predictions:
            alerts.extend(self._water_alerts(water_predictions, water_records))

        # ── Weather extreme alerts ───────────────────────────────────
        if weather:
            alerts.extend(self._weather_alerts(weather))

        # ── Disease detection alerts ─────────────────────────────────
        if disease_detections:
            alerts.extend(self._disease_alerts(disease_detections))

        # ── Abnormal consumption alerts ──────────────────────────────
        if water_records and len(water_records) >= 2:
            alerts.extend(self._consumption_anomaly_alerts(water_records))

        # ── Waste valorisation alerts ────────────────────────────────
        if waste_available:
            alerts.extend(self._waste_alerts(waste_available))

        # ── Health score drop alerts ─────────────────────────────────
        if health_score:
            alerts.extend(self._health_score_alerts(health_score))

        # ── Crop stage alerts ────────────────────────────────────────
        if crops:
            alerts.extend(self._crop_stage_alerts(crops, weather))

        # Sort by priority
        priority_order = {"critique": 0, "haute": 1, "moyenne": 2, "basse": 3}
        alerts.sort(key=lambda a: priority_order.get(a.get("priority", "basse"), 4))

        return alerts

    # ─────────────────────────────────────────────────────────────────
    def _water_alerts(self, predictions, records) -> List[Dict]:
        alerts = []
        if not predictions:
            return alerts

        avg_predicted = sum(p.get("predicted_m3", 0) for p in predictions) / max(len(predictions), 1)

        # Check for water stress risk
        high_consumption_days = [
            p for p in predictions
            if p.get("predicted_m3", 0) > avg_predicted * 1.4
        ]
        if high_consumption_days:
            dates = ", ".join(p.get("date", "?")[-5:] for p in high_consumption_days[:3])
            alerts.append({
                "id": f"alert_water_stress_{datetime.now().strftime('%Y%m%d%H%M')}",
                "type": "water_stress",
                "priority": "critique",
                "icon": "🚨",
                "title": "Risque de stress hydrique élevé",
                "message": (
                    f"La consommation d'eau prévue dépasse de 40% la moyenne sur les jours : {dates}. "
                    f"Pic prévu : {max(p.get('predicted_m3', 0) for p in high_consumption_days):.1f} m³."
                ),
                "action": "Vérifier les réserves d'eau et programmer l'irrigation en conséquence.",
                "module_source": "rf_water_predictor",
                "timestamp": datetime.now().isoformat(),
            })

        # Low confidence predictions warning
        low_conf = [p for p in predictions if p.get("confidence", 100) < 60]
        if len(low_conf) > len(predictions) * 0.5:
            alerts.append({
                "id": f"alert_water_conf_{datetime.now().strftime('%Y%m%d%H%M')}",
                "type": "info",
                "priority": "basse",
                "icon": "ℹ️",
                "title": "Prédictions d'eau à faible confiance",
                "message": (
                    f"{len(low_conf)}/{len(predictions)} prédictions ont une confiance < 60%. "
                    f"Les estimations au-delà de 5 jours sont moins fiables."
                ),
                "action": "Considérer les prédictions à long terme comme indicatives.",
                "module_source": "rf_water_predictor",
                "timestamp": datetime.now().isoformat(),
            })

        return alerts

    # ─────────────────────────────────────────────────────────────────
    def _weather_alerts(self, weather) -> List[Dict]:
        alerts = []
        temp = weather.get("temperature", 22)
        humidity = weather.get("humidity", 60)
        wind = weather.get("wind_speed", 10)
        precip = weather.get("precipitation", 0)

        if temp > 38:
            alerts.append({
                "id": f"alert_heat_{datetime.now().strftime('%Y%m%d%H%M')}",
                "type": "weather_extreme",
                "priority": "critique",
                "icon": "🔥",
                "title": f"Canicule — {temp}°C",
                "message": (
                    f"Température extrême de {temp}°C détectée. "
                    f"Risque critique de stress thermique pour les cultures et les animaux."
                ),
                "action": "Irriguer immédiatement. Protéger les animaux de l'exposition directe. Installer des filets d'ombrage.",
                "module_source": "atmospheric_service",
                "timestamp": datetime.now().isoformat(),
            })
        elif temp > 35:
            alerts.append({
                "id": f"alert_heat_warn_{datetime.now().strftime('%Y%m%d%H%M')}",
                "type": "weather_warning",
                "priority": "haute",
                "icon": "🌡️",
                "title": f"Chaleur élevée — {temp}°C",
                "message": f"Température de {temp}°C avec humidité à {humidity}%.",
                "action": "Arroser tôt le matin (avant 7h) ou tard le soir (après 20h) pour minimiser l'évaporation.",
                "module_source": "atmospheric_service",
                "timestamp": datetime.now().isoformat(),
            })

        if temp < 5:
            alerts.append({
                "id": f"alert_frost_{datetime.now().strftime('%Y%m%d%H%M')}",
                "type": "weather_extreme",
                "priority": "critique",
                "icon": "❄️",
                "title": f"Risque de gel — {temp}°C",
                "message": f"Température de {temp}°C. Risque de gel pour les cultures sensibles.",
                "action": "Protéger les cultures avec des voiles d'hivernage. Reporter l'irrigation.",
                "module_source": "atmospheric_service",
                "timestamp": datetime.now().isoformat(),
            })

        if wind > 30:
            alerts.append({
                "id": f"alert_wind_{datetime.now().strftime('%Y%m%d%H%M')}",
                "type": "weather_warning",
                "priority": "haute",
                "icon": "🌪️",
                "title": f"Tempête de vent — {wind} km/h",
                "message": f"Vents violents de {wind} km/h. Risque de dégâts mécaniques.",
                "action": "Sécuriser les serres et tunnels. Renforcer les tuteurs. Suspendre l'irrigation par aspersion.",
                "module_source": "atmospheric_service",
                "timestamp": datetime.now().isoformat(),
            })

        if precip > 30:
            alerts.append({
                "id": f"alert_flood_{datetime.now().strftime('%Y%m%d%H%M')}",
                "type": "weather_extreme",
                "priority": "critique",
                "icon": "🌊",
                "title": f"Fortes précipitations — {precip} mm",
                "message": f"Précipitations de {precip} mm prévues. Risque d'inondation.",
                "action": "Vérifier le drainage des parcelles. Suspendre toute irrigation. Protéger les récoltes stockées.",
                "module_source": "atmospheric_service",
                "timestamp": datetime.now().isoformat(),
            })

        return alerts

    # ─────────────────────────────────────────────────────────────────
    def _disease_alerts(self, detections) -> List[Dict]:
        alerts = []
        for det in detections:
            disease = det.get("disease_name", "")
            confidence = det.get("confidence", 0)
            subject = det.get("plant_type") or det.get("animal_type") or "sujet"

            if disease and disease.lower() != "healthy" and confidence > 50:
                subject_type = "plante" if det.get("plant_type") else "animal"
                alerts.append({
                    "id": f"alert_disease_{det.get('id', datetime.now().strftime('%Y%m%d%H%M'))}",
                    "type": "disease_detection",
                    "priority": "critique" if confidence > 80 else "haute",
                    "icon": "⚠️",
                    "title": f"Signes visuels détectés sur {subject}",
                    "message": (
                        f"L'analyse par vision par ordinateur a détecté des signes visuels "
                        f"potentiellement associés à : {disease} (confiance : {confidence}%). "
                        f"Cette analyse IA est indicative et ne constitue pas un diagnostic médical."
                    ),
                    "action": (
                        f"Inspecter visuellement {subject}. "
                        f"Consulter un {'vétérinaire' if subject_type == 'animal' else 'agronome'} "
                        f"pour confirmation du diagnostic."
                    ),
                    "module_source": "cnn_disease_detector",
                    "timestamp": datetime.now().isoformat(),
                })

        return alerts

    # ─────────────────────────────────────────────────────────────────
    def _consumption_anomaly_alerts(self, records) -> List[Dict]:
        alerts = []
        if len(records) < 2:
            return alerts

        volumes = [r.get("volume", 0) for r in records if r.get("volume", 0) > 0]
        if len(volumes) < 2:
            return alerts

        avg = sum(volumes) / len(volumes)
        latest = volumes[-1] if volumes else 0

        if avg > 0 and latest > avg * 1.5:
            pct = ((latest - avg) / avg) * 100
            alerts.append({
                "id": f"alert_consumption_{datetime.now().strftime('%Y%m%d%H%M')}",
                "type": "consumption_anomaly",
                "priority": "haute",
                "icon": "⚠️",
                "title": f"Consommation d'eau anormalement élevée (+{pct:.0f}%)",
                "message": (
                    f"Le dernier relevé ({latest:.1f} m³) est {pct:.0f}% supérieur "
                    f"à la moyenne ({avg:.1f} m³). Possible fuite ou erreur de relevé."
                ),
                "action": "Vérifier le système d'irrigation pour détecter une éventuelle fuite. Contrôler les compteurs.",
                "module_source": "water_records",
                "timestamp": datetime.now().isoformat(),
            })

        return alerts

    # ─────────────────────────────────────────────────────────────────
    def _waste_alerts(self, waste_available) -> List[Dict]:
        alerts = []
        if waste_available and len(waste_available) > 0:
            organic = [
                w for w in waste_available
                if w.get("waste_type", "") in (
                    "fumier", "compost", "résidus_végétaux",
                    "organic", "manure", "crop_residues"
                )
            ]
            if organic:
                alerts.append({
                    "id": f"alert_waste_{datetime.now().strftime('%Y%m%d%H%M')}",
                    "type": "waste_valorisation",
                    "priority": "moyenne",
                    "icon": "♻️",
                    "title": f"{len(organic)} déchet(s) organique(s) disponible(s) pour valorisation",
                    "message": (
                        f"{len(organic)} offre(s) de déchets organiques disponibles "
                        f"sur le marketplace AquaCycle. "
                        f"Total : {sum(w.get('quantity', 0) for w in organic):.0f} kg."
                    ),
                    "action": "Consulter le marketplace pour acquérir du compost ou fumier pour vos parcelles.",
                    "module_source": "waste_service",
                    "timestamp": datetime.now().isoformat(),
                })

        return alerts

    # ─────────────────────────────────────────────────────────────────
    def _health_score_alerts(self, health_score) -> List[Dict]:
        alerts = []
        score = health_score.get("overall_score", 100)

        if score < 40:
            alerts.append({
                "id": f"alert_health_critical_{datetime.now().strftime('%Y%m%d%H%M')}",
                "type": "health_score",
                "priority": "critique",
                "icon": "🚨",
                "title": f"Score de santé critique : {score}/100",
                "message": (
                    f"Le score de santé global de vos parcelles est à {score}/100. "
                    f"Action immédiate nécessaire."
                ),
                "action": "Consulter les recommandations détaillées et prioriser les interventions sur les parcelles les plus touchées.",
                "module_source": "health_score_engine",
                "timestamp": datetime.now().isoformat(),
            })
        elif score < 60:
            alerts.append({
                "id": f"alert_health_warn_{datetime.now().strftime('%Y%m%d%H%M')}",
                "type": "health_score",
                "priority": "haute",
                "icon": "📉",
                "title": f"Score de santé en baisse : {score}/100",
                "message": (
                    f"Le score de santé de vos parcelles est à {score}/100. "
                    f"Plusieurs facteurs nécessitent votre attention."
                ),
                "action": "Vérifier les facteurs contributifs dans le détail du score de santé.",
                "module_source": "health_score_engine",
                "timestamp": datetime.now().isoformat(),
            })

        return alerts

    # ─────────────────────────────────────────────────────────────────
    def _crop_stage_alerts(self, crops, weather) -> List[Dict]:
        alerts = []
        for crop in crops:
            stage = (crop.get("growth_stage") or crop.get("growthStage") or "").lower()
            name = crop.get("name", "Culture")

            if stage in ("floraison", "flowering") and weather:
                temp = weather.get("temperature", 22)
                if temp > 35:
                    alerts.append({
                        "id": f"alert_bloom_heat_{crop.get('id', '')}",
                        "type": "crop_critical",
                        "priority": "critique",
                        "icon": "🌺",
                        "title": f"{name} en floraison sous chaleur extrême",
                        "message": (
                            f"{name} est en floraison alors que la température atteint {temp}°C. "
                            f"Risque d'avortement floral et de perte de rendement."
                        ),
                        "action": f"Irriguer {name} immédiatement. Installer un ombrage temporaire si possible.",
                        "module_source": "crops_data + atmospheric_service",
                        "timestamp": datetime.now().isoformat(),
                    })

        return alerts


# Singleton
alert_engine = AlertEngine()
