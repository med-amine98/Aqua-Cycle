from sqlalchemy import Column, String, Float, Enum, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class WasteType(enum.Enum):
    OLIVE_POMACE = "olive_pomace"
    OLIVE_PITS = "olive_pits"
    PRUNING_RESIDUES = "pruning_residues"
    CROP_RESIDUES = "crop_residues"
    DATE_RESIDUES = "date_residues"
    VINE_RESIDUES = "vine_residues"
    OTHER = "other"

class WasteStatus(enum.Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    COLLECTED = "collected"
    SOLD = "sold"

class WasteDeclaration(BaseModel):
    __tablename__ = "waste_declarations"
    
    farmer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    waste_type = Column(Enum(WasteType), nullable=False)
    quantity = Column(Float, nullable=False)  # en tonnes
    unit = Column(String(50), default="tonnes")
    availability_date = Column(Date, nullable=False)
    expiry_date = Column(Date)
    location = Column(String(255), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    quality_grade = Column(String(50))
    description = Column(String(500))
    status = Column(Enum(WasteStatus), default="available")
    is_aggregated = Column(Boolean, default=False)
    aggregation_group_id = Column(String(36))
    price_per_unit = Column(Float)
    
    # Relations
    farmer = relationship("User", back_populates="waste_declarations")
    matches = relationship("WasteMatch", foreign_keys="WasteMatch.waste_id")