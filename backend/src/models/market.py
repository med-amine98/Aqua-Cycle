from sqlalchemy import Column, String, Float, Enum, ForeignKey, Date, JSON, Integer, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class TransactionStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CompanyProfile(BaseModel):
    __tablename__ = "company_profiles"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    company_name = Column(String(255), nullable=False)
    registration_number = Column(String(100))
    sector = Column(String(255))
    waste_interests = Column(JSON)  # Liste des types de déchets recherchés
    min_quantity = Column(Float, default=0.0)
    max_distance = Column(Float, default=100)  # km
    is_active = Column(Boolean, default=True)
    
    # Relations
    user = relationship("User", back_populates="company_profile")
    matches = relationship("WasteMatch", foreign_keys="WasteMatch.company_id")

class WasteMatch(BaseModel):
    __tablename__ = "waste_matches"
    
    waste_id = Column(String(36), ForeignKey("waste_declarations.id"), nullable=False)
    company_id = Column(String(36), ForeignKey("company_profiles.id"), nullable=False)
    match_score = Column(Float, default=0.0)
    status = Column(String(50), default="pending")
    
    # Relations
    waste = relationship("WasteDeclaration", foreign_keys=[waste_id])
    company = relationship("CompanyProfile", foreign_keys=[company_id])

class Transaction(BaseModel):
    __tablename__ = "transactions"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    waste_id = Column(String(36), ForeignKey("waste_declarations.id"))
    company_id = Column(String(36), ForeignKey("company_profiles.id"))
    amount = Column(Float, nullable=False)
    commission = Column(Float, default=0.0)
    status = Column(Enum(TransactionStatus), default="pending")
    transaction_date = Column(Date, nullable=False)
    payment_method = Column(String(50))
    reference = Column(String(100))
    details = Column(JSON)
    
    # Relations
    user = relationship("User", back_populates="transactions")