from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...database import get_db
from ...models.collection import CollectionOrder
from ...models.offer import WasteOffer
from ...models.storage_facility import StorageFacility


router = APIRouter(
    prefix="/collection",
    tags=["Supply Chain - Collection"]
)


class CollectionCreate(BaseModel):
    offer_id: str
    pickup_location: str
    destination: str
    storage_facility_id: str | None = None
    estimated_distance_km: float = 0
    transport_cost: float = 0


@router.post("/")
async def create_collection(
    data: CollectionCreate,
    db: Session = Depends(get_db)
):

    offer = db.query(WasteOffer).filter(
        WasteOffer.id == data.offer_id
    ).first()

    if not offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found"
        )

    if offer.status != "accepted":
        raise HTTPException(
            status_code=400,
            detail="Only accepted offers can be scheduled for collection"
        )

    collection = CollectionOrder(
        offer_id=offer.id,
        waste_id=offer.waste_id,
        company_id=offer.company_id,
        storage_facility_id=data.storage_facility_id,
        quantity=offer.quantity,
        pickup_location=data.pickup_location,
        destination=data.destination,
        status="scheduled",
        estimated_distance_km=data.estimated_distance_km,
        transport_cost=data.transport_cost
    )

    db.add(collection)
    db.commit()
    db.refresh(collection)

    return {
        "message": "Collection scheduled successfully",
        "collection_id": collection.id,
        "offer_id": offer.id,
        "quantity": collection.quantity,
        "status": collection.status,
        "pickup_location": collection.pickup_location,
        "destination": collection.destination,
        "storage_facility_id": collection.storage_facility_id
    }


@router.get("/")
async def get_collections(
    db: Session = Depends(get_db)
):

    collections = db.query(CollectionOrder).all()

    return [
        {
            "id": collection.id,
            "offer_id": collection.offer_id,
            "waste_id": collection.waste_id,
            "company_id": collection.company_id,
            "storage_facility_id": collection.storage_facility_id,
            "quantity": collection.quantity,
            "pickup_location": collection.pickup_location,
            "destination": collection.destination,
            "status": collection.status,
            "estimated_distance_km": collection.estimated_distance_km,
            "transport_cost": collection.transport_cost
        }
        for collection in collections
    ]


@router.put("/{collection_id}/status")
async def update_collection_status(
    collection_id: str,
    status: str,
    db: Session = Depends(get_db)
):

    collection = db.query(CollectionOrder).filter(
        CollectionOrder.id == collection_id
    ).first()

    if not collection:
        raise HTTPException(
            status_code=404,
            detail="Collection order not found"
        )

    allowed_statuses = [
        "scheduled",
        "picked_up",
        "in_transit",
        "delivered",
        "stored",
        "cancelled"
    ]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Use one of: {allowed_statuses}"
        )

    if status == "stored":

        if not collection.storage_facility_id:
            raise HTTPException(
                status_code=400,
                detail="No storage facility assigned to this collection"
            )

        facility = db.query(StorageFacility).filter(
            StorageFacility.id == collection.storage_facility_id
        ).first()

        if not facility:
            raise HTTPException(
                status_code=404,
                detail="Storage facility not found"
            )

        if facility.available_capacity < collection.quantity:
            raise HTTPException(
                status_code=400,
                detail="Storage facility does not have enough available capacity"
            )

        if collection.status != "stored":
            facility.available_capacity -= collection.quantity

    collection.status = status

    db.commit()
    db.refresh(collection)

    return {
        "message": "Collection status updated successfully",
        "collection_id": collection.id,
        "status": collection.status,
        "storage_facility_id": collection.storage_facility_id
    }