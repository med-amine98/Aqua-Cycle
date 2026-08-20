import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import aiohttp
import asyncio
from ..models.plot import Plot, CropType, CropGrowthStage
from ..models.farm import Farm, SoilType
from ..models.water import WaterBudget, WaterRecommendation
from ..config import settings

class WaterManagementService:
    """Service de gestion de l'eau avec calculs agronomiques"""
    
    # Coefficients de culture (Kc) par type et stade
    CROP_COEFFICIENTS = {
        "cereals": {
            "seedling": 0.3, "vegetative": 0.7, "flowering": 1.0,
            "fruiting": 1.1, "maturation": 0.6, "harvest": 0.4
        },
        "vegetables": {
            "seedling": 0.4, "vegetative": 0.8, "flowering": 1.0,
            "fruiting": 1.2, "maturation": 0.7, "harvest": 0.5
        },
        "fruits": {
            "seedling": 0.5, "vegetative": 0.7, "flowering": 0.9,
            "fruiting": 1.1, "maturation": 0.7, "harvest": 0.5
        },
        "olives": {
            "seedling": 0.4, "vegetative": 0.6, "flowering": 0.7,
            "fruiting": 0.9, "maturation": 0.6, "harvest": 0.4
        },
        "dates": {
            "seedling": 0.5, "vegetative": 0.7, "flowering": 0.8,
            "fruiting": 1.0, "maturation": 0.7, "harvest": 0.5
        }
    }
    
    def __init__(self):
        self.weather_api_key = getattr(settings, 'OPENWEATHER_API_KEY', '')
    
    async def get_weather_data(self, latitude: float, longitude: float) -> Dict:
        """Récupère les données météo actuelles et prévisionnelles"""
        if not self.weather_api_key or self.weather_api_key == 'votre_api_key_meteo':
            # Données simulées si pas de clé API
            return {
                "temperature": 25.0,
                "humidity": 60,
                "wind_speed": 10,
                "precipitation": 0,
                "forecast": [
                    {"date": datetime.now().isoformat(), "temp": 25, "precip": 0, "humidity": 60}
                ]
            }
        
        try:
            async with aiohttp.ClientSession() as session:
                current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={self.weather_api_key}&units=metric"
                forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={latitude}&lon={longitude}&appid={self.weather_api_key}&units=metric"
                
                current_task = session.get(current_url)
                forecast_task = session.get(forecast_url)
                
                current_resp, forecast_resp = await asyncio.gather(current_task, forecast_task)
                
                current_data = await current_resp.json()
                forecast_data = await forecast_resp.json()
                
                return {
                    "temperature": current_data["main"]["temp"],
                    "humidity": current_data["main"]["humidity"],
                    "wind_speed": current_data["wind"]["speed"],
                    "precipitation": forecast_data.get("rain", {}).get("3h", 0),
                    "forecast": [
                        {
                            "date": item["dt_txt"],
                            "temp": item["main"]["temp"],
                            "precip": item.get("rain", {}).get("3h", 0),
                            "humidity": item["main"]["humidity"]
                        }
                        for item in forecast_data["list"][:8]
                    ]
                }
        except Exception as e:
            print(f"Erreur météo: {e}")
            # Retourner des données simulées
            return {
                "temperature": 25.0,
                "humidity": 60,
                "wind_speed": 10,
                "precipitation": 0,
                "forecast": []
            }
    
    def calculate_evapotranspiration(self, temperature: float, humidity: float, 
                                     wind_speed: float, solar_radiation: float = 15) -> float:
        """Calcule l'évapotranspiration de référence (ETo) simplifiée"""
        # Version simplifiée
        if temperature <= 0:
            return 0
        
        # Calcul approximatif
        eto = 0.0023 * (temperature + 17.8) * (temperature - 0) ** 0.5 * (0.5 + 0.01 * wind_speed)
        return max(eto, 0)
    
    def calculate_crop_water_need(self, plot: Plot, eto: float) -> float:
        """Calcule les besoins en eau de la culture (ETc)"""
        # Récupérer le coefficient de culture en fonction du type et du stade
        crop_type = plot.crop_type.value if hasattr(plot.crop_type, 'value') else str(plot.crop_type)
        growth_stage = plot.growth_stage.value if hasattr(plot.growth_stage, 'value') else str(plot.growth_stage)
        
        crop_coeffs = self.CROP_COEFFICIENTS.get(crop_type, {})
        kc = crop_coeffs.get(growth_stage, 0.7)
        
        # Ajustement pour l'efficacité de l'irrigation
        irrigation_efficiency = plot.irrigation_efficiency or 0.7
        
        # ETc = ETo * Kc
        etc = eto * kc
        
        # Besoin total en eau (mm) = ETc / efficacité
        water_need_mm = etc / irrigation_efficiency
        
        # Conversion en m³/ha
        water_need_m3_per_ha = water_need_mm * 10
        
        return water_need_m3_per_ha * plot.area
    
    async def calculate_water_recommendations(self, farm: Farm) -> List[Dict]:
        """Calcule les recommandations d'irrigation pour toutes les parcelles de la ferme"""
        weather_data = await self.get_weather_data(farm.latitude, farm.longitude)
        eto = self.calculate_evapotranspiration(
            weather_data["temperature"],
            weather_data["humidity"],
            weather_data["wind_speed"]
        )
        
        recommendations = []
        total_water_needed = 0
        
        # Récupérer les parcelles
        plots = getattr(farm, 'plots', [])
        if not plots:
            # Données simulées si pas de parcelles
            plots = [
                self._create_sample_plot(farm)
            ]
        
        for plot in plots:
            water_need = self.calculate_crop_water_need(plot, eto)
            total_water_needed += water_need
            
            # Calcul du score de priorité basé sur le stade de croissance
            growth_stage = plot.growth_stage.value if hasattr(plot.growth_stage, 'value') else str(plot.growth_stage)
            priority_score = {
                "flowering": 1,
                "fruiting": 1,
                "vegetative": 2,
                "maturation": 3,
                "seedling": 3,
                "harvest": 4
            }.get(growth_stage, 2)
            
            recommendations.append({
                "plot_id": plot.id,
                "plot_name": plot.name,
                "crop_type": plot.crop_type.value if hasattr(plot.crop_type, 'value') else str(plot.crop_type),
                "growth_stage": growth_stage,
                "water_need_m3": round(water_need, 2),
                "eto": round(eto, 2),
                "priority": priority_score,
                "recommendation": self._generate_recommendation(water_need, plot, weather_data)
            })
        
        # Allocation de l'eau disponible
        available_water = farm.water_availability
        if total_water_needed > available_water:
            recommendations = self._allocate_water(recommendations, available_water)
        else:
            for rec in recommendations:
                rec["allocated"] = rec["water_need_m3"]
                rec["status"] = "full"
        
        return recommendations
    
    def _allocate_water(self, recommendations: List[Dict], available_water: float) -> List[Dict]:
        """Alloue l'eau disponible entre les parcelles selon les priorités"""
        # Trier par priorité
        sorted_recs = sorted(recommendations, key=lambda x: x["priority"])
        
        total_allocated = 0
        for rec in sorted_recs:
            if total_allocated + rec["water_need_m3"] <= available_water:
                rec["allocated"] = rec["water_need_m3"]
                rec["status"] = "full"
            else:
                remaining = available_water - total_allocated
                rec["allocated"] = remaining
                rec["status"] = "partial"
                rec["shortage"] = rec["water_need_m3"] - remaining
                total_allocated = available_water
                break
            total_allocated += rec["water_need_m3"]
        
        return sorted_recs
    
    def _generate_recommendation(self, water_need: float, plot: Plot, weather: Dict) -> str:
        """Génère une recommandation textuelle personnalisée"""
        recommendations = []
        
        # Recommandation basée sur les besoins
        if water_need > 10:
            recommendations.append(f"Besoin élevé en eau ({water_need:.1f} m³)")
        
        # Recommandation basée sur la météo
        if weather.get("precipitation", 0) > 5:
            recommendations.append("Précipitations prévues - réduire l'irrigation")
        
        if weather.get("temperature", 0) > 35:
            recommendations.append("Température élevée - irriguer tôt le matin")
        
        # Recommandation basée sur le stade de croissance
        growth_stage = plot.growth_stage.value if hasattr(plot.growth_stage, 'value') else str(plot.growth_stage)
        stage_recommendations = {
            "flowering": "Période critique - maintenir une humidité constante",
            "fruiting": "Assurer un apport suffisant pour le développement",
            "vegetative": "Maintenir une croissance régulière",
            "maturation": "Réduire progressivement l'irrigation",
            "seedling": "Irrigation légère et fréquente",
            "harvest": "Arrêter l'irrigation avant la récolte"
        }
        
        if growth_stage in stage_recommendations:
            recommendations.append(stage_recommendations[growth_stage])
        
        return ". ".join(recommendations) if recommendations else "Irrigation normale recommandée"
    
    def _create_sample_plot(self, farm: Farm) -> Plot:
        """Crée une parcelle simulée pour les tests"""
        from ..models.plot import Plot, CropType, CropGrowthStage
        from datetime import date
        
        plot = Plot()
        plot.id = "plot-sample-1"
        plot.name = "Parcelle principale"
        plot.area = 5.0
        plot.crop_type = CropType.VEGETABLES
        plot.crop_variety = "Tomate"
        plot.growth_stage = CropGrowthStage.FLOWERING
        plot.planting_date = date.today() - timedelta(days=30)
        plot.irrigation_efficiency = 0.7
        return plot
    
    def detect_anomalies(self, plot: Plot, actual_water: float, recommended_water: float) -> Dict:
        """Détecte les consommations anormales d'eau"""
        ratio = actual_water / recommended_water if recommended_water > 0 else 0
        
        if ratio > 1.5:
            return {
                "anomaly": True,
                "type": "overconsumption",
                "message": f"Consommation excessive : {ratio:.1f}x la recommandation",
                "severity": "high"
            }
        elif ratio < 0.5:
            return {
                "anomaly": True,
                "type": "underconsumption",
                "message": f"Consommation insuffisante : {ratio:.1f}x la recommandation",
                "severity": "medium"
            }
        else:
            return {
                "anomaly": False,
                "message": "Consommation normale",
                "severity": "low"
            }