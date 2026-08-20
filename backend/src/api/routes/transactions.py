from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from ...database import get_db
from .auth import get_current_user_dep
from ...models.user import User
from ...models.farm import Farm
from ...models.finance import FinanceTransaction, TransactionType, TransactionCategory
from pydantic import BaseModel, Field

router = APIRouter(prefix="/transactions", tags=["Transactions"])

class TransactionCreate(BaseModel):
    type: str = Field(..., description="revenu, depense, investissement")
    categorie: str = Field(..., description="vente, achat_intrant, main_doeuvre, equipement, veterinaire, transport, energie, autre")
    montant: float = Field(..., description="Montant en TND")
    date: str = Field(..., description="Date au format YYYY-MM-DD")
    description: str = ""

class TransactionResponse(BaseModel):
    id: str
    type: str
    categorie: str
    montant: float
    date: str
    description: str

@router.get("", response_model=List[TransactionResponse])
async def get_transactions(
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Récupérer toutes les transactions de l'utilisateur"""
    farms = db.query(Farm).filter(Farm.owner_id == current_user.id).all()
    farm_ids = [farm.id for farm in farms]
    
    transactions = db.query(FinanceTransaction).filter(
        FinanceTransaction.farm_id.in_(farm_ids)
    ).all()
    
    result = []
    for t in transactions:
        result.append({
            "id": t.id,
            "type": t.type.value,
            "categorie": t.categorie.value,
            "montant": t.montant,
            "date": t.date.isoformat(),
            "description": t.description
        })
    return result

@router.post("", response_model=TransactionResponse)
async def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle transaction"""
    farm = db.query(Farm).filter(Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Aucune ferme trouvée. Veuillez créer une ferme d'abord.")
    
    try:
        transaction = FinanceTransaction(
            farm_id=farm.id,
            type=TransactionType(data.type),
            categorie=TransactionCategory(data.categorie),
            montant=data.montant,
            date=date.fromisoformat(data.date),
            description=data.description
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        return {
            "id": transaction.id,
            "type": transaction.type.value,
            "categorie": transaction.categorie.value,
            "montant": transaction.montant,
            "date": transaction.date.isoformat(),
            "description": transaction.description
        }
    except Exception as e:
        db.rollback()
        print(f"Erreur création transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))