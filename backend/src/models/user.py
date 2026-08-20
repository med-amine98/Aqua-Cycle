from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class UserRole(enum.Enum):
    FARMER = "farmer"
    COMPANY = "company"
    ADMIN = "admin"

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    
    # Relations
    farm = relationship("Farm", back_populates="owner", uselist=False)
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False)
    waste_declarations = relationship("WasteDeclaration", back_populates="farmer")
    transactions = relationship("Transaction", back_populates="user")