from sqlalchemy import Column, String, Float, JSON, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class SoilType(enum.Enum):
    CLAY = "argileux"
    SANDY = "sableux"
    SILTY = "limoneux"
    LOAMY = "loameux"
    CHALKY = "calcaire"
    PEATY = "tourbeux"

class IrrigationSystem(enum.Enum):
    DRIP = "goutte-à-goutte"
    SPRINKLER = "aspersion"
    SURFACE = "gravitaire"
    SUBSURFACE = "subsurface"
    MANUAL = "manuel"

class Farm(BaseModel):
    __tablename__ = "farms"
    
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_area = Column(Float, nullable=False)
    soil_type = Column(Enum(SoilType), nullable=False)
    irrigation_system = Column(Enum(IrrigationSystem), nullable=False)
    water_availability = Column(Float, nullable=False)
    crop_details = Column(JSON, nullable=False)
    has_drip_irrigation = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Relations
    owner = relationship("User", back_populates="farm")
    water_budget = relationship("WaterBudget", back_populates="farm", uselist=False)
    plots = relationship("Plot", back_populates="farm")
    animals = relationship("Animal", back_populates="farm")