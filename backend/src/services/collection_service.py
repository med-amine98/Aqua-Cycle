from typing import List, Dict
from geopy.distance import geodesic


class CollectionService:

    @staticmethod
    def calculate_distance(
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        return geodesic(
            (lat1, lon1),
            (lat2, lon2)
        ).kilometers

    @staticmethod
    def create_collection_plan(
        wastes: List[Dict],
        storage: Dict
    ) -> Dict:

        if not wastes:
            return {
                "status": "error",
                "message": "No waste declarations provided"
            }

        total_quantity = sum(
            waste["quantity"] for waste in wastes
        )

        stops = []

        for waste in wastes:
            distance = CollectionService.calculate_distance(
                waste["latitude"],
                waste["longitude"],
                storage["latitude"],
                storage["longitude"]
            )

            stops.append({
                "waste_id": waste["id"],
                "farmer_id": waste["farmer_id"],
                "location": waste["location"],
                "quantity": waste["quantity"],
                "distance_to_storage_km": round(distance, 2)
            })

        # Nearest farms first
        stops.sort(
            key=lambda x: x["distance_to_storage_km"]
        )

        total_distance = sum(
            stop["distance_to_storage_km"]
            for stop in stops
        )

        return {
            "status": "success",
            "storage_facility": {
                "id": storage["id"],
                "name": storage["name"],
                "location": storage["location"]
            },
            "total_quantity": total_quantity,
            "number_of_farms": len(stops),
            "collection_stops": stops,
            "estimated_total_distance_km": round(
                total_distance, 2
            ),
            "recommendation":
                "Collect from the nearest farms first to reduce transport distance."
        }