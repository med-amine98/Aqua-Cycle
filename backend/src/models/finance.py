from sqlalchemy import Column, String, Float, Enum, ForeignKey, Date
from .base import BaseModel
import enum

class TransactionType(enum.Enum):
    REVENU = "revenu"
    DEPENSE = "depense"
    INVESTISSEMENT = "investissement"

class TransactionCategory(enum.Enum):
    VENTE = "vente"
    ACHAT_INTRANT = "achat_intrant"
    MAIN_DOEUVRE = "main_doeuvre"
    EQUIPEMENT = "equipement"
    VETERINAIRE = "veterinaire"
    TRANSPORT = "transport"
    ENERGIE = "energie"
    AUTRE = "autre"

class FinanceTransaction(BaseModel):
    __tablename__ = "finance_transactions"
    
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    categorie = Column(Enum(TransactionCategory), nullable=False)
    montant = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String(500))
    culture_id = Column(String(36), ForeignKey("plots.id"), nullable=True)
    animal_id = Column(String(36), ForeignKey("animals.id"), nullable=True)