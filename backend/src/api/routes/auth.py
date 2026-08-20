from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import sha256_crypt
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from ...models.user import User, UserRole
from ...config import settings
from ...database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Configurer bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b",
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# --- Schémas Pydantic ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str
    is_premium: bool

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = ""
    role: str = "farmer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- Fonctions utilitaires ---
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie le mot de passe avec bcrypt ou SHA256"""
    if not plain_password or not hashed_password:
        return False
    
    password = plain_password[:72] if len(plain_password) > 72 else plain_password
    
    try:
        if pwd_context.verify(password, hashed_password):
            return True
    except Exception:
        pass
    
    try:
        if sha256_crypt.verify(password, hashed_password):
            return True
    except Exception:
        pass
    
    return False

def hash_password(password: str) -> str:
    password = password[:72] if len(password) > 72 else password
    return pwd_context.hash(password)

# --- Routes ---

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Inscription avec bcrypt"""
    print(f"📝 Tentative d'inscription: {user_data.email}")
    
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        print(f"❌ Email déjà utilisé: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )
    
    try:
        role_enum = UserRole(user_data.role)
    except ValueError:
        print(f"❌ Rôle invalide: {user_data.role}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rôle invalide. Choisir: farmer, company, admin"
        )
    
    try:
        hashed_password = hash_password(user_data.password)
        print(f"✅ Mot de passe hashé avec succès")
        
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            full_name=user_data.full_name,
            phone=user_data.phone or "",
            role=role_enum,
            is_premium=False,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"✅ Utilisateur créé: {new_user.id} - {new_user.email}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur base de données: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de l'utilisateur: {str(e)}"
        )
    
    token_data = {"sub": new_user.email, "user_id": new_user.id}
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "role": new_user.role.value,
        "is_premium": new_user.is_premium
    }

@router.post("/register-simple")
async def register_simple(user_data: UserCreate, db: Session = Depends(get_db)):
    """Inscription avec SHA256"""
    print(f"📝 Inscription simple: {user_data.email}")
    
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )
    
    try:
        role_enum = UserRole(user_data.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rôle invalide"
        )
    
    try:
        hashed = sha256_crypt.hash(user_data.password[:72])
        
        new_user = User(
            email=user_data.email,
            password_hash=hashed,
            full_name=user_data.full_name,
            phone=user_data.phone or "",
            role=role_enum,
            is_premium=False,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "message": "Utilisateur créé avec succès",
            "user_id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.value
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Connexion OAuth2"""
    print(f"📝 Tentative de connexion: {form_data.username}")
    
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        print(f"❌ Utilisateur non trouvé: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    is_valid = verify_password(form_data.password, user.password_hash)
    
    if not is_valid:
        print(f"❌ Mot de passe incorrect pour: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ Connexion réussie: {user.email}")
    
    token_data = {"sub": user.email, "user_id": user.id}
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role.value,
        "is_premium": user.is_premium
    }

@router.post("/login-json")
async def login_json(login_data: UserLogin, db: Session = Depends(get_db)):
    """Connexion avec JSON"""
    print(f"📝 Connexion JSON: {login_data.email}")
    
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    is_valid = verify_password(login_data.password, user.password_hash)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    token_data = {"sub": user.email, "user_id": user.id}
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role.value,
        "is_premium": user.is_premium
    }

@router.post("/login-test")
async def login_test(login_data: UserLogin, db: Session = Depends(get_db)):
    """Route de test pour diagnostiquer les problèmes de connexion"""
    print(f"📝 Test de connexion: {login_data.email}")
    
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        return {
            "status": "error",
            "message": "Utilisateur non trouvé",
            "email": login_data.email
        }
    
    is_valid_bcrypt = False
    is_valid_sha256 = False
    hash_type = "inconnu"
    
    try:
        is_valid_bcrypt = pwd_context.verify(login_data.password[:72], user.password_hash)
        if is_valid_bcrypt:
            hash_type = "bcrypt"
    except Exception:
        pass
    
    if not is_valid_bcrypt:
        try:
            is_valid_sha256 = sha256_crypt.verify(login_data.password[:72], user.password_hash)
            if is_valid_sha256:
                hash_type = "sha256"
        except Exception:
            pass
    
    return {
        "status": "success",
        "email": user.email,
        "full_name": user.full_name,
        "password_valid": is_valid_bcrypt or is_valid_sha256,
        "hash_type": hash_type,
        "hash_preview": user.password_hash[:40] + "...",
        "is_active": user.is_active,
        "role": user.role.value
    }
async def get_current_user_dep(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Dépendance pour obtenir l'utilisateur actuel (retourne un objet User)"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    return user
@router.get("/me")
async def get_current_user(current_user: User = Depends(get_current_user_dep)):
    """Récupérer le profil de l'utilisateur connecté"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "is_premium": current_user.is_premium,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }

@router.get("/check")
async def check_db(db: Session = Depends(get_db)):
    """Route de diagnostic pour vérifier la base de données"""
    try:
        count = db.query(User).count()
        users = db.query(User).all()
        return {
            "status": "ok",
            "user_count": count,
            "users": [
                {
                    "email": u.email,
                    "full_name": u.full_name,
                    "role": u.role.value,
                    "is_active": u.is_active,
                    "hash_preview": u.password_hash[:30] + "..."
                }
                for u in users[:10]
            ]
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }