from sqlalchemy import Column, String, Float, ForeignKey, Date, JSON, Integer
from sqlalchemy.orm import relationship
from .base import BaseModel

class WaterBudget(BaseModel):
    __tablename__ = "water_budgets"
    
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False)
    total_available = Column(Float, nullable=False)  # m³
    total_used = Column(Float, default=0.0)
    total_allocated = Column(Float, default=0.0)
    month = Column(Date, nullable=False)
    weather_data = Column(JSON)
    status = Column(String(50), default="balanced")
    
    # Relations
    farm = relationship("Farm", back_populates="water_budget")

class WaterRecommendation(BaseModel):
    __tablename__ = "water_recommendations"
    
    plot_id = Column(String(36), ForeignKey("plots.id"), nullable=False)
    date = Column(Date, nullable=False)
    recommended_volume = Column(Float, nullable=False)  # m³
    actual_volume = Column(Float)
    evapotranspiration = Column(Float)  # ETo
    crop_water_need = Column(Float)  # ETc
    priority = Column(Integer, default=1)  # 1: haute, 3: basse
    status = Column(String(50), default="pending")
    notes = Column(String(500))
    
    # Relations
    plot = relationship("Plot", back_populates="water_recommendations")