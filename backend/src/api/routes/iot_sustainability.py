"""
IoT Telemetry & Sustainability Carbon Credits API — AquaCycle
Provides IoT sensor telemetry, remote valve actuation, and water/carbon credit monetization metrics.
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import math

from .auth import get_current_user_dep
from ...models.user import User

router = APIRouter(prefix="/iot-sustainability", tags=["IoT & Sustainability"])

# ── In-Memory Telemetry State (Simulated Hardware Bus) ────────────────────────
_IOT_STATE = {
    "device_id": "AQ-IOT-VALVE-01",
    "soil_moisture_percent": 45.2,
    "ambient_temperature_c": 27.4,
    "flow_rate_lpm": 14.8,
    "valve_open": True,
    "solar_battery_percent": 94,
    "signal_rssi_dbm": -68,
    "auto_pilot_enabled": True,
    "last_telemetry_at": datetime.now().isoformat(),
}


class ValveControlRequest(BaseModel):
    open_valve: bool = Field(..., description="Ouvrir ou fermer la vanne solenoid")
    auto_pilot: Optional[bool] = Field(None, description="Activer le pilotage IA automatique")


class CarbonCreditsQuery(BaseModel):
    water_saved_m3: float = Field(..., ge=0, description="Volume d'eau économisé en m³")
    waste_repurposed_tons: float = Field(0.0, ge=0, description="Déchets valorisés en Tonnes")


@router.get("/telemetry/live")
async def get_live_telemetry(current_user: User = Depends(get_current_user_dep)):
    """
    ## Télémétrie IoT en Direct
    Retourne l'état en temps réel des capteurs IoT de la ferme (humidité sol, débit, vanne, batterie solaire).
    """
    # Slight dynamic jitter to emulate live hardware stream
    import random
    _IOT_STATE["soil_moisture_percent"] = round(min(80, max(20, _IOT_STATE["soil_moisture_percent"] + random.uniform(-0.5, 0.5))), 1)
    _IOT_STATE["flow_rate_lpm"] = round(14.8 + random.uniform(-0.4, 0.4), 1) if _IOT_STATE["valve_open"] else 0.0
    _IOT_STATE["last_telemetry_at"] = datetime.now().isoformat()

    return {
        "telemetry": _IOT_STATE,
        "status": "online",
        "protocol": "MQTT / LoRaWAN",
        "firmware": "v2.1.0-AquaCycle-IoT",
    }


@router.post("/valve/control")
async def control_solenoid_valve(
    data: ValveControlRequest,
    current_user: User = Depends(get_current_user_dep),
):
    """
    ## Contrôle à Distance de l'Électro-Vanne d'Irrigation
    Permet d'ouvrir/fermer la vanne ou d'activer le pilotage automatique par IA.
    """
    _IOT_STATE["valve_open"] = data.open_valve
    if data.auto_pilot is not None:
        _IOT_STATE["auto_pilot_enabled"] = data.auto_pilot
    _IOT_STATE["flow_rate_lpm"] = 14.8 if data.open_valve else 0.0
    _IOT_STATE["last_telemetry_at"] = datetime.now().isoformat()

    return {
        "message": f"Vanne {'ouverte' if data.open_valve else 'fermée'} avec succès.",
        "valve_open": _IOT_STATE["valve_open"],
        "auto_pilot": _IOT_STATE["auto_pilot_enabled"],
        "flow_rate_lpm": _IOT_STATE["flow_rate_lpm"],
        "timestamp": datetime.now().isoformat(),
    }


@router.post("/sustainability/carbon-credits")
async def calculate_carbon_credits(
    query: CarbonCreditsQuery,
    current_user: User = Depends(get_current_user_dep),
):
    """
    ## Moteur de Monétisation des Crédits Carbone & Eau
    Calcule la valeur financière ($TND) et l'impact carbone ($tCO_2e$) économisé grâce à l'agriculture circulaire.
    
    - **Eau**: 1 m³ économisé = 0.32 TND de crédits eau & 0.45 kg CO₂e évité
    - **Déchets**: 1 tonne de déchet composté/recyclé = 45 TND de valeur & 120 kg CO₂e évité
    """
    water_value_tnd = query.water_saved_m3 * 0.32
    waste_value_tnd = query.waste_repurposed_tons * 45.0
    total_value_tnd = round(water_value_tnd + waste_value_tnd, 2)

    co2_saved_from_water = (query.water_saved_m3 * 0.45) / 1000.0  # tons CO2
    co2_saved_from_waste = (query.waste_repurposed_tons * 120.0) / 1000.0  # tons CO2
    total_co2_reduced_tons = round(co2_saved_from_water + co2_saved_from_waste, 3)

    return {
        "water_saved_m3": query.water_saved_m3,
        "waste_repurposed_tons": query.waste_repurposed_tons,
        "monetization": {
            "water_credits_tnd": round(water_value_tnd, 2),
            "waste_value_tnd": round(waste_value_tnd, 2),
            "total_credits_earned_tnd": total_value_tnd,
        },
        "environmental_impact": {
            "co2_reduced_from_water_tons": round(co2_saved_from_water, 3),
            "co2_reduced_from_waste_tons": round(co2_saved_from_waste, 3),
            "total_co2_reduced_tons": total_co2_reduced_tons,
            "equivalent_trees_planted": int(total_co2_reduced_tons * 45),
        },
        "certified_by": "AquaCycle Circular Standard v2.0",
        "generated_at": datetime.now().isoformat(),
    }


@router.get("/sustainability/esg-report")
async def get_esg_impact_summary(current_user: User = Depends(get_current_user_dep)):
    """
    ## Rapport d'Impact ESG Startup (Exportable)
    Retourne la synthèse globale d'impact environnemental, social et de gouvernance d'AquaCycle.
    """
    return {
        "organization": "AquaCycle Circular Farming Startup",
        "period": "Année en cours",
        "metrics": {
            "water_efficiency_gain_percent": 34.5,
            "total_water_saved_m3": 1420.0,
            "total_waste_repurposed_tons": 8.5,
            "total_co2_reduced_tons": 3.82,
            "circular_transactions_completed": 42,
            "esg_score": 92.4,
        },
        "esg_pillars": {
            "environmental": "Réduction de l'épuisement des nappes phréatiques & valorisation des biodéchets",
            "social": "Autonomisation des agriculteurs locaux & amélioration des rendements",
            "governance": "Traçabilité Blockchain / DB transparente des flux de matières réutilisées",
        },
        "generated_at": datetime.now().isoformat(),
        "status": "certified"
    }
