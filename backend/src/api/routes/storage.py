from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ...database import get_db
from ...models.storage_facility import StorageFacility
from ...services.storage_service import StorageFacilityService


router = APIRouter(
    prefix="/storage",
    tags=["Supply Chain - Storage"]
)


from pydantic import BaseModel

class StorageFacilityCreate(BaseModel):
    name: str
    location: str
    latitude: float
    longitude: float
    total_capacity: float
    available_capacity: float
    accepted_waste_types: str
    storage_cost_per_unit: float = 0.0
    description: str = ""


@router.post("/facilities")
async def create_storage_facility(
    facility_data: StorageFacilityCreate,
    db: Session = Depends(get_db)
):

    if facility_data.available_capacity > facility_data.total_capacity:
        raise HTTPException(
            status_code=400,
            detail="Available capacity cannot exceed total capacity"
        )

    facility = StorageFacility(
        name=facility_data.name,
        location=facility_data.location,
        latitude=facility_data.latitude,
        longitude=facility_data.longitude,
        total_capacity=facility_data.total_capacity,
        available_capacity=facility_data.available_capacity,
        accepted_waste_types=facility_data.accepted_waste_types,
        storage_cost_per_unit=facility_data.storage_cost_per_unit,
        description=facility_data.description,
        is_active=True
    )

    db.add(facility)
    db.commit()
    db.refresh(facility)

    return {
        "message": "Storage facility created successfully",
        "facility_id": facility.id,
        "name": facility.name
    }


@router.get("/facilities")
async def get_storage_facilities(
    db: Session = Depends(get_db)
):
    facilities = db.query(StorageFacility).filter(
        StorageFacility.is_active == True
    ).all()

    if not facilities:
        seed_facilities = [
            StorageFacility(
                name="Hub Régional Sfax Nord - Silos Biomasse",
                location="Sfax, Tunisie",
                latitude=34.7406,
                longitude=10.7603,
                total_capacity=1200.0,
                available_capacity=850.0,
                accepted_waste_types="olive_pomace,olive_pits,crop_residues",
                storage_cost_per_unit=12.5,
                description="Installation moderne équipée de silos ventilés pour grignons et résidus oléicoles.",
                is_active=True
            ),
            StorageFacility(
                name="Centre Logistique Béja & Nord-Ouest",
                location="Béja, Tunisie",
                latitude=36.7256,
                longitude=9.1817,
                total_capacity=800.0,
                available_capacity=620.0,
                accepted_waste_types="crop_residues,pruning_residues,olive_pomace",
                storage_cost_per_unit=10.0,
                description="Entrepôt couvert et plateforme de compactage pour résidus de grandes cultures.",
                is_active=True
            ),
            StorageFacility(
                name="Hub Zaghouan & Cap-Bon ValoBio",
                location="Zaghouan, Tunisie",
                latitude=36.4028,
                longitude=10.1428,
                total_capacity=1500.0,
                available_capacity=1100.0,
                accepted_waste_types="vine_residues,olive_pomace,olive_pits,pruning_residues",
                storage_cost_per_unit=15.0,
                description="Centre multimodal avec accès direct autoroute et pont-bascule certifié.",
                is_active=True
            ),
        ]
        for sf in seed_facilities:
            db.add(sf)
        db.commit()
        facilities = db.query(StorageFacility).filter(StorageFacility.is_active == True).all()

    return [
        {
            "id": facility.id,
            "name": facility.name,
            "location": facility.location,
            "latitude": facility.latitude,
            "longitude": facility.longitude,
            "total_capacity": facility.total_capacity,
            "available_capacity": facility.available_capacity,
            "accepted_waste_types": facility.accepted_waste_types,
            "storage_cost_per_unit": facility.storage_cost_per_unit,
            "description": facility.description
        }
        for facility in facilities
    ]


@router.get("/facilities/recommend")
async def recommend_storage_facilities(
    latitude: float,
    longitude: float,
    waste_type: str,
    quantity: float,
    max_distance: float = 100,
    db: Session = Depends(get_db)
):

    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero"
        )

    matches = StorageFacilityService.find_suitable_facilities(
        db=db,
        latitude=latitude,
        longitude=longitude,
        waste_type=waste_type,
        quantity=quantity,
        max_distance=max_distance
    )

    return {
        "waste_type": waste_type,
        "quantity": quantity,
        "matches": matches,
        "total_matches": len(matches)
    }


@router.delete("/facilities/{facility_id}")
async def delete_storage_facility(
    facility_id: str,
    db: Session = Depends(get_db)
):
    facility = db.query(StorageFacility).filter(StorageFacility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Storage facility not found")

    facility.is_active = False
    db.commit()

    return {"message": "Storage facility deactivated successfully", "facility_id": facility_id}