from sqlalchemy import Column, String, Float, Text
from .base import BaseModel


class WasteOffer(BaseModel):
    __tablename__ = "waste_offers"

    waste_id = Column(String(36), nullable=False)
    company_id = Column(String(36), nullable=False)

    quantity = Column(Float, nullable=False)
    price_per_unit = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    status = Column(String(30), default="pending")
    message = Column(Text, nullable=True)