from sqlalchemy import Column, String, Float
from .base import BaseModel


class CollectionOrder(BaseModel):
    __tablename__ = "collection_orders"

    offer_id = Column(String(36), nullable=False)
    waste_id = Column(String(36), nullable=False)
    company_id = Column(String(36), nullable=False)
    storage_facility_id = Column(String(36), nullable=True)	

    quantity = Column(Float, nullable=False)

    pickup_location = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)

    status = Column(String(30), default="scheduled")

    estimated_distance_km = Column(Float, nullable=True)
    transport_cost = Column(Float, nullable=True)