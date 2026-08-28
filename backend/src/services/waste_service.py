from typing import List, Dict, Tuple
import numpy as np
from datetime import datetime, timedelta
from geopy.distance import geodesic
from ..models.waste import WasteDeclaration, WasteType, WasteStatus
from ..models.market import CompanyProfile, WasteMatch
from ..models.user import User

class WasteManagementService:
    """Service de gestion des déchets et mise en relation"""
    
    # Valeurs économiques indicatives par type de déchet (TND/tonne)
    WASTE_VALUES = {
        WasteType.OLIVE_POMACE: {
            "min": 50, "max": 120,
            "uses": ["biomasse", "compost", "alimentation animale"],
            "processors": ["usines de biogaz", "compostage", "alimentaire"]
        },
        WasteType.OLIVE_PITS: {
            "min": 30, "max": 80,
            "uses": ["combustible", "biochar", "abrasif"],
            "processors": ["centrales biomasse", "fabricants de charbon", "cosmétique"]
        },
        WasteType.PRUNING_RESIDUES: {
            "min": 20, "max": 60,
            "uses": ["paillage", "biomasse", "compost"],
            "processors": ["compostage", "biomasse", "jardinerie"]
        },
        WasteType.CROP_RESIDUES: {
            "min": 15, "max": 50,
            "uses": ["fourrage", "biomasse", "compost"],
            "processors": ["alimentation animale", "biomasse", "compostage"]
        },
        WasteType.DATE_RESIDUES: {
            "min": 40, "max": 100,
            "uses": ["alimentation animale", "biomasse", "cosmétique"],
            "processors": ["alimentaire", "biomasse", "cosmétique"]
        }
    }
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calcule la distance entre deux points géographiques en km"""
        return geodesic((lat1, lon1), (lat2, lon2)).kilometers
    
    def match_waste_with_companies(self,waste: WasteDeclaration,
                                   companies: List[CompanyProfile]
)       -> List[Dict]:
        """Find companies that match the waste."""

        matches = []

        for company in companies:

            # 1. Check waste type
            accepted_types = [
                item.strip().lower()
                for item in company.waste_interests.split(",")
            ]

            if waste.waste_type.value.lower() not in accepted_types:
                continue

            # 2. Check minimum quantity
            if waste.quantity < company.min_quantity:
                continue

            # 3. Get company location
            company_lat = getattr(company.user, "location_lat", None)
            company_lon = getattr(company.user, "location_lon", None)

            # If company location is unavailable, don't reject the match
            if company_lat is not None and company_lon is not None:
                distance = self.calculate_distance(
                    waste.latitude,
                    waste.longitude,
                    company_lat,
                    company_lon
                )

                if distance > company.max_distance:
                    continue
            else:
                distance = 0

            # 4. Calculate score
            score = 30  # waste type

            # Quantity
            if waste.quantity >= company.min_quantity:
                score += 20

            # Distance
            if distance < 20:
                score += 25
            elif distance < 50:
                score += 15
            elif distance < 100:
                score += 5

            # Quality
            if waste.quality_grade == "high":
                score += 15
            elif waste.quality_grade == "medium":
                score += 10

            # Economic value
            waste_value = self.WASTE_VALUES.get(
                waste.waste_type,
                {}
            ).get("max", 50)

            if waste.price_per_unit and waste.price_per_unit <= waste_value:
                score += 10

            matches.append({
                "company_id": company.id,
                "company_name": company.company_name,
                "match_score": score,
                "distance": round(distance, 1),
                "estimated_value": round(
                    waste.quantity * (waste.price_per_unit or 50),
                    2
                )
            })

        matches.sort(
            key=lambda x: x["match_score"],
            reverse=True
        )

        return matches
    
    def aggregate_waste(self, waste_declarations: List[WasteDeclaration]) -> Dict:
        """Agrège les petites quantités de déchets de plusieurs agriculteurs"""
        if len(waste_declarations) < 2:
            return {"status": "insufficient", "message": "Besoin d'au moins 2 déclarations"}
        
        # Regrouper par type de déchet
        groups = {}
        for waste in waste_declarations:
            key = waste.waste_type.value
            if key not in groups:
                groups[key] = []
            groups[key].append(waste)
        
        aggregated = []
        for waste_type, wastes in groups.items():
            total_quantity = sum(w.quantity for w in wastes)
            
            # Calculer le centroid géographique
            avg_lat = np.mean([w.latitude for w in wastes])
            avg_lon = np.mean([w.longitude for w in wastes])
            
            aggregated.append({
                "waste_type": waste_type,
                "total_quantity": total_quantity,
                "number_of_farmers": len(wastes),
                "average_quality": np.mean([1 if w.quality_grade == "high" else 0.6 for w in wastes]),
                "location": {"lat": avg_lat, "lon": avg_lon},
                "farmer_ids": [w.farmer_id for w in wastes],
                "waste_ids": [w.id for w in wastes],
                "potential_value": self._calculate_aggregated_value(wastes)
            })
        
        return {
            "status": "success",
            "aggregated_groups": aggregated,
            "total_farmers_involved": len(set(w.farmer_id for w in waste_declarations))
        }
    
    def _calculate_aggregated_value(self, wastes: List[WasteDeclaration]) -> Dict:
        """Calcule la valeur potentielle des déchets agrégés"""
        total_quantity = sum(w.quantity for w in wastes)
        avg_price = np.mean([w.price_per_unit for w in wastes if w.price_per_unit])
        
        # Rabais pour volume (économie d'échelle)
        if total_quantity > 100:
            discount = 0.8
        elif total_quantity > 50:
            discount = 0.85
        elif total_quantity > 20:
            discount = 0.9
        else:
            discount = 0.95
        
        estimated_value = total_quantity * avg_price * discount
        
        return {
            "total_quantity": total_quantity,
            "avg_price": avg_price,
            "discount": discount,
            "estimated_value": estimated_value
        }
    
    def generate_match_description(self, match: Dict) -> str:
        """Génère une description textuelle du match"""
        return f"""
        🎯 Match trouvé pour {match.get('waste_type', 'déchet')}
        
        📍 Distance: {match.get('distance', 'N/A')} km
        🏢 Entreprise: {match.get('company_name', 'N/A')}
        ⭐ Score de compatibilité: {match.get('match_score', 0)}%
        
        💰 Valeur estimée: {match.get('estimated_value', 0)} TND
        📦 Quantité: {match.get('quantity', 0)} tonnes
        
        📋 Recommandation: {self._get_recommendation(match.get('match_score', 0))}
        """
    
    def _get_recommendation(self, score: float) -> str:
        if score >= 80:
            return "Excellent match - Contactez l'entreprise immédiatement"
        elif score >= 60:
            return "Bon match - Proposez vos déchets avec une offre compétitive"
        elif score >= 40:
            return "Match moyen - Négociez les conditions de vente"
        else:
            return "Match faible - Envisagez d'autres opportunités ou une agrégation"