from sqlalchemy import Column, String, Float, Boolean, Text
from .base import BaseModel


class StorageFacility(BaseModel):
    __tablename__ = "storage_facilities"

    name = Column(String(255), nullable=False)

    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    total_capacity = Column(Float, nullable=False)
    available_capacity = Column(Float, nullable=False)

    accepted_waste_types = Column(Text, nullable=False)

    storage_cost_per_unit = Column(Float, default=0.0)

    is_active = Column(Boolean, default=True)

    description = Column(Text, nullable=True)