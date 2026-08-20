from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from ...database import get_db
from .auth import get_current_user_dep
from ...models.user import User
from ...models.animal import Animal, AnimalType, AnimalSex, HealthStatus
from ...models.farm import Farm
from pydantic import BaseModel, Field

router = APIRouter(prefix="/animals", tags=["Animals"])

class AnimalCreate(BaseModel):
    type: str = Field(..., description="Type d'animal: bovin, ovin, caprin, volaille, equide, autre")
    race: str = ""
    nom: str = ""
    identification: str = Field(..., description="Identifiant unique de l'animal")
    date_naissance: str = Field(..., description="Date au format YYYY-MM-DD")
    sexe: str = Field(..., description="mâle ou femelle")
    poids: float = 0
    notes: str = ""

class AnimalResponse(BaseModel):
    id: str
    type: str
    race: str
    nom: str
    identification: str
    date_naissance: str
    sexe: str
    poids: float
    sante: str
    notes: str

@router.get("", response_model=List[AnimalResponse])
async def get_animals(
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Récupérer tous les animaux de l'utilisateur"""
    farms = db.query(Farm).filter(Farm.owner_id == current_user.id).all()
    farm_ids = [farm.id for farm in farms]
    
    animals = db.query(Animal).filter(Animal.farm_id.in_(farm_ids)).all()
    
    result = []
    for animal in animals:
        result.append({
            "id": animal.id,
            "type": animal.type.value,
            "race": animal.race,
            "nom": animal.nom,
            "identification": animal.identification,
            "date_naissance": animal.date_naissance.isoformat(),
            "sexe": animal.sexe.value,
            "poids": animal.poids,
            "sante": animal.sante.value,
            "notes": animal.notes
        })
    return result

@router.post("", response_model=AnimalResponse)
async def create_animal(
    data: AnimalCreate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Créer un nouvel animal"""
    farm = db.query(Farm).filter(Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Aucune ferme trouvée. Veuillez créer une ferme d'abord.")
    
    # Vérifier si l'identification existe déjà
    existing = db.query(Animal).filter(Animal.identification == data.identification).first()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"L'identification '{data.identification}' existe déjà pour un autre animal."
        )
    
    try:
        animal = Animal(
            farm_id=farm.id,
            type=AnimalType(data.type),
            race=data.race,
            nom=data.nom,
            identification=data.identification,
            date_naissance=date.fromisoformat(data.date_naissance),
            sexe=AnimalSex(data.sexe),
            poids=data.poids,
            sante=HealthStatus.BON,
            notes=data.notes
        )
        db.add(animal)
        db.commit()
        db.refresh(animal)
        
        return {
            "id": animal.id,
            "type": animal.type.value,
            "race": animal.race,
            "nom": animal.nom,
            "identification": animal.identification,
            "date_naissance": animal.date_naissance.isoformat(),
            "sexe": animal.sexe.value,
            "poids": animal.poids,
            "sante": animal.sante.value,
            "notes": animal.notes
        }
    except Exception as e:
        db.rollback()
        print(f"Erreur création animal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{animal_id}")
async def delete_animal(
    animal_id: str,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Supprimer un animal"""
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal non trouvé")
    
    farm = db.query(Farm).filter(Farm.id == animal.farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    db.delete(animal)
    db.commit()
    return {"message": "Animal supprimé avec succès"}

@router.put("/{animal_id}")
async def update_animal(
    animal_id: str,
    data: AnimalCreate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Mettre à jour un animal"""
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal non trouvé")
    
    farm = db.query(Farm).filter(Farm.id == animal.farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    animal.type = AnimalType(data.type)
    animal.race = data.race
    animal.nom = data.nom
    animal.identification = data.identification
    animal.date_naissance = date.fromisoformat(data.date_naissance)
    animal.sexe = AnimalSex(data.sexe)
    animal.poids = data.poids
    animal.notes = data.notes
    
    db.commit()
    db.refresh(animal)
    return animal