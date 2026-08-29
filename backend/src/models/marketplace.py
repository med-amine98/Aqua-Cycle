from sqlalchemy import Column, String, Float, Enum, ForeignKey, Date, JSON, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class ProductType(enum.Enum):
    FRUITS_LEGUMES = "fruits_legumes"
    CEREALES = "cereales"
    PRODUITS_ANIMAUX = "produits_animaux"
    PRODUITS_TRANSFORMES = "produits_transformes"
    MATERIEL = "materiel"
    INTRANTS = "intrants"
    AUTRE = "autre"

class ProductCondition(enum.Enum):
    NEUF = "neuf"
    TRES_BON = "tres_bon"
    BON = "bon"
    MOYEN = "moyen"

class MarketplaceProduct(BaseModel):
    __tablename__ = "marketplace_products"
    
    seller_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    farm_id = Column(String(36), ForeignKey("farms.id"))
    name = Column(String(200), nullable=False)
    type = Column(Enum(ProductType), nullable=False)
    description = Column(String(1000))
    quantity = Column(Float)
    unit = Column(String(20))
    price = Column(Float, nullable=False)
    condition = Column(Enum(ProductCondition))
    images = Column(JSON)
    available = Column(Boolean, default=True)
    expiration_date = Column(Date)
    location = Column(String(200))
    
    seller = relationship("User", back_populates="marketplace_products")
    farm = relationship("Farm")