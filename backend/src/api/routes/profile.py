from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ...database import get_db
from .auth import get_current_user_dep
from ...models.user import User
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["Profile"])

class ProfileUpdate(BaseModel):
    full_name: str
    phone: str
    bio: str = ""
    location: str = ""

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.put("/profile")
async def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Mettre à jour le profil utilisateur"""
    setattr(current_user, 'full_name', data.full_name)
    setattr(current_user, 'phone', data.phone)
    # Ajouter les champs bio et location si vous les avez ajoutés au modèle
    # current_user.bio = data.bio
    # current_user.location = data.location
    
    db.commit()
    db.refresh(current_user)
    return {"message": "Profil mis à jour avec succès"}

@router.post("/change-password")
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Changer le mot de passe"""
    if not pwd_context.verify(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Le mot de passe doit faire au moins 6 caractères")
    
    current_user.password_hash = pwd_context.hash(data.new_password)
    db.commit()
    return {"message": "Mot de passe changé avec succès"}