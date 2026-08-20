from sqlalchemy import Column, String, Float, Enum, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class AnimalType(enum.Enum):
    BOVIN = "bovin"
    OVIN = "ovin"
    CAPRIN = "caprin"
    VOLAILLE = "volaille"
    EQUIDE = "equide"
    AUTRE = "autre"

class AnimalSex(enum.Enum):
    MALE = "mâle"
    FEMELLE = "femelle"

class HealthStatus(enum.Enum):
    EXCELLENT = "excellent"
    BON = "bon"
    MOYEN = "moyen"
    CRITIQUE = "critique"

class Animal(BaseModel):
    __tablename__ = "animals"
    
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False)
    type = Column(Enum(AnimalType), nullable=False)
    race = Column(String(100))
    nom = Column(String(100))
    identification = Column(String(50), unique=True)
    date_naissance = Column(Date)
    sexe = Column(Enum(AnimalSex))
    poids = Column(Float)
    statut = Column(String(50), default="actif")
    sante = Column(Enum(HealthStatus), default=HealthStatus.BON)
    image_url = Column(String(500))
    notes = Column(String(500))
    
    farm = relationship("Farm", back_populates="animals")
    health_analyses = relationship("HealthAnalysis", back_populates="animal", cascade="all, delete-orphan")