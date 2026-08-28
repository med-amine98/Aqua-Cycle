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


@router.post("/facilities")
async def create_storage_facility(
    name: str,
    location: str,
    latitude: float,
    longitude: float,
    total_capacity: float,
    available_capacity: float,
    accepted_waste_types: str,
    storage_cost_per_unit: float = 0.0,
    description: str = "",
    db: Session = Depends(get_db)
):

    if available_capacity > total_capacity:
        raise HTTPException(
            status_code=400,
            detail="Available capacity cannot exceed total capacity"
        )

    facility = StorageFacility(
        name=name,
        location=location,
        latitude=latitude,
        longitude=longitude,
        total_capacity=total_capacity,
        available_capacity=available_capacity,
        accepted_waste_types=accepted_waste_types,
        storage_cost_per_unit=storage_cost_per_unit,
        description=description,
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