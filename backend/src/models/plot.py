from sqlalchemy import Column, String, Float, Enum, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class CropType(enum.Enum):
    CEREALS = "cereals"
    VEGETABLES = "vegetables"
    FRUITS = "fruits"
    OLIVES = "olives"
    DATES = "dates"
    VINES = "vines"
    LEGUMES = "legumes"
    OTHER = "other"

class CropGrowthStage(enum.Enum):
    SEEDLING = "seedling"
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    FRUITING = "fruiting"
    MATURATION = "maturation"
    HARVEST = "harvest"

class Plot(BaseModel):
    __tablename__ = "plots"
    
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False)
    name = Column(String(255), nullable=False)
    area = Column(Float, nullable=False)
    crop_type = Column(Enum(CropType), nullable=False)
    crop_variety = Column(String(255))
    growth_stage = Column(Enum(CropGrowthStage), nullable=False)
    planting_date = Column(Date, nullable=False)
    expected_harvest_date = Column(Date)
    crop_coefficient = Column(Float, default=0.8)
    soil_moisture = Column(Float, default=0.0)
    irrigation_efficiency = Column(Float, default=0.7)
    
    farm = relationship("Farm", back_populates="plots")
    water_recommendations = relationship("WaterRecommendation", back_populates="plot")
    health_analyses = relationship("HealthAnalysis", back_populates="plant", cascade="all, delete-orphan")