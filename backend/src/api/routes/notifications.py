from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
from jose import jwt, JWTError
from ...database import get_db
from .auth import get_current_user_dep
from ...models.user import User
from ...models.notification import Notification
from ...config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationCreate(BaseModel):
    type: str
    title: str
    message: str
    action: Optional[dict] = None

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    timestamp: str
    read: bool
    action: Optional[dict]

# WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ WebSocket connecté pour l'utilisateur {user_id}")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"🔌 WebSocket déconnecté pour l'utilisateur {user_id}")

    async def send_notification(self, user_id: str, notification: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(notification))
                print(f"📨 Notification envoyée à l'utilisateur {user_id}")
            except Exception as e:
                print(f"❌ Erreur envoi notification: {e}")
                self.disconnect(user_id)

manager = ConnectionManager()

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Récupérer toutes les notifications de l'utilisateur"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()
    return notifications

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Marquer une notification comme lue"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    
    notification.read = True
    db.commit()
    return {"message": "Notification marquée comme lue"}

@router.put("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Marquer toutes les notifications comme lues"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"message": "Toutes les notifications marquées comme lues"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Supprimer une notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    
    db.delete(notification)
    db.commit()
    return {"message": "Notification supprimée"}

@router.post("/send")
async def send_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Envoyer une notification à l'utilisateur courant"""
    notification = Notification(
        user_id=current_user.id,
        type=notification_data.type,
        title=notification_data.title,
        message=notification_data.message,
        read=False,
        action=notification_data.action
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    await manager.send_notification(
        str(current_user.id),
        {
            "id": notification.id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "timestamp": notification.created_at.isoformat(),
            "read": notification.read,
            "action": notification.action
        }
    )
    
    return notification

@router.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket pour les notifications en temps réel"""
    print(f"🔌 Tentative de connexion WebSocket...")
    print(f"📝 Token reçu: {token[:50]}...")
    
    try:
        # Vérifier le token
        try:
            print(f"🔑 Décodage du token...")
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("user_id")
            email = payload.get("sub")
            print(f"👤 Utilisateur: {email} (ID: {user_id})")
            
            if not user_id:
                print("❌ Pas d'user_id dans le token")
                await websocket.close(code=1008, reason="Invalid token: no user_id")
                return
                
        except jwt.ExpiredSignatureError:
            print("❌ Token expiré")
            await websocket.close(code=1008, reason="Token expired")
            return
        except JWTError as e:
            print(f"❌ Erreur JWT: {e}")
            await websocket.close(code=1008, reason=f"Invalid token: {str(e)}")
            return
        
        # Vérifier que l'utilisateur existe
        from ...database import get_db
        db = next(get_db())
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"❌ Utilisateur {user_id} non trouvé dans la base")
            await websocket.close(code=1008, reason="User not found")
            return
        print(f"✅ Utilisateur trouvé: {user.email}")
        
        # Accepter la connexion
        await manager.connect(websocket, user_id)
        
        # Envoyer un message de confirmation
        await websocket.send_text(json.dumps({
            "type": "connection",
            "message": "Connecté aux notifications",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }))
        print(f"✅ Message de confirmation envoyé")
        
        try:
            while True:
                # Garder la connexion ouverte
                data = await websocket.receive_text()
                # Répondre pour maintenir la connexion
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }))
        except WebSocketDisconnect:
            print(f"🔌 WebSocket déconnecté pour l'utilisateur {user_id}")
            manager.disconnect(user_id)
            
    except Exception as e:
        print(f"❌ Erreur WebSocket: {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.close(code=1011, reason=str(e))
        except:
            pass