from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...database import get_db
from ...models.offer import WasteOffer

router = APIRouter(
    prefix="/offers",
    tags=["Supply Chain - Offers"]
)


class OfferCreate(BaseModel):
    waste_id: str
    company_id: str
    quantity: float
    price_per_unit: float
    message: str = ""


@router.post("/")
async def create_offer(
    offer_data: OfferCreate,
    db: Session = Depends(get_db)
):

    if offer_data.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero"
        )

    if offer_data.price_per_unit < 0:
        raise HTTPException(
            status_code=400,
            detail="Price cannot be negative"
        )

    offer = WasteOffer(
        waste_id=offer_data.waste_id,
        company_id=offer_data.company_id,
        quantity=offer_data.quantity,
        price_per_unit=offer_data.price_per_unit,
        total_price=(
            offer_data.quantity *
            offer_data.price_per_unit
        ),
        status="pending",
        message=offer_data.message
    )

    db.add(offer)
    db.commit()
    db.refresh(offer)

    return {
        "message": "Offer created successfully",
        "offer_id": offer.id,
        "status": offer.status,
        "total_price": offer.total_price
    }


@router.get("/")
async def get_offers(
    db: Session = Depends(get_db)
):

    offers = db.query(WasteOffer).all()

    return [
        {
            "id": offer.id,
            "waste_id": offer.waste_id,
            "company_id": offer.company_id,
            "quantity": offer.quantity,
            "price_per_unit": offer.price_per_unit,
            "total_price": offer.total_price,
            "status": offer.status,
            "message": offer.message
        }
        for offer in offers
    ]