from typing import List, Dict
from geopy.distance import geodesic
from sqlalchemy.orm import Session

from ..models.storage_facility import StorageFacility


class StorageFacilityService:

    @staticmethod
    def calculate_distance(
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """Calculate distance between two locations in kilometres."""
        return geodesic(
            (lat1, lon1),
            (lat2, lon2)
        ).kilometers

    @staticmethod
    def find_suitable_facilities(
        db: Session,
        latitude: float,
        longitude: float,
        waste_type: str,
        quantity: float,
        max_distance: float = 100
    ) -> List[Dict]:

        facilities = db.query(StorageFacility).filter(
            StorageFacility.is_active == True
        ).all()

        matches = []

        for facility in facilities:

            # Check storage capacity
            if facility.available_capacity < quantity:
                continue

            # Check whether facility accepts this waste type
            accepted_types = [
                item.strip().lower()
                for item in facility.accepted_waste_types.split(",")
            ]

            if waste_type.lower() not in accepted_types:
                continue

            # Calculate distance
            distance = StorageFacilityService.calculate_distance(
                latitude,
                longitude,
                facility.latitude,
                facility.longitude
            )

            if distance > max_distance:
                continue

            # Calculate recommendation score
            score = 0

            # Distance
            if distance <= 20:
                score += 40
            elif distance <= 50:
                score += 25
            else:
                score += 10

            # Capacity
            capacity_ratio = facility.available_capacity / quantity

            if capacity_ratio >= 3:
                score += 30
            elif capacity_ratio >= 2:
                score += 20
            else:
                score += 10

            # Cost
            if facility.storage_cost_per_unit <= 50:
                score += 20
            elif facility.storage_cost_per_unit <= 100:
                score += 10

            matches.append({
                "facility_id": facility.id,
                "facility_name": facility.name,
                "location": facility.location,
                "distance_km": round(distance, 2),
                "available_capacity": facility.available_capacity,
                "storage_cost_per_unit": facility.storage_cost_per_unit,
                "match_score": score
            })

        matches.sort(
            key=lambda x: x["match_score"],
            reverse=True
        )

        return matches