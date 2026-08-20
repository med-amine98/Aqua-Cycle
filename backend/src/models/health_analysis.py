from sqlalchemy import Column, String, Float, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import BaseModel
from datetime import datetime

class HealthAnalysis(BaseModel):
    __tablename__ = "health_analyses"
    
    animal_id = Column(String(36), ForeignKey("animals.id"), nullable=True)
    plant_id = Column(String(36), ForeignKey("plots.id"), nullable=True)
    type = Column(String(50), nullable=False)  # 'animal' ou 'plant'
    image_url = Column(String(500), nullable=True)
    result = Column(JSON, nullable=False)
    confidence = Column(Float, default=0)
    status = Column(String(50), default="analyzed")
    notes = Column(String(500))
    analyzed_at = Column(DateTime, default=datetime.now)
    
    animal = relationship("Animal", back_populates="health_analyses")
    plant = relationship("Plot", back_populates="health_analyses")