from sqlalchemy import Column, String, Boolean, JSON, ForeignKey
from .base import BaseModel

class Notification(BaseModel):
    __tablename__ = "notifications"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)  # info, success, warning, error
    title = Column(String(200), nullable=False)
    message = Column(String(500), nullable=False)
    read = Column(Boolean, default=False)
    action = Column(JSON, nullable=True)