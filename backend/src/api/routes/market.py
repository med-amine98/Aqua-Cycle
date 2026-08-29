from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from ...database import get_db
from ...models.market import CompanyProfile
from ...models.user import User
from .auth import get_current_user_dep

router = APIRouter(
    prefix="/market",
    tags=["Supply Chain - Marketplace"]
)


class CompanyCreate(BaseModel):
    company_name: str
    waste_interests: List[str]
    min_quantity: float = 0
    max_distance: float = 100


@router.post("/companies")
async def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db)
):
    # Try to find a user or assign default
    user = db.query(User).first()
    user_id = user.id if user else "system_buyer"

    company = CompanyProfile(
        user_id=user_id,
        company_name=company_data.company_name,
        waste_interests=",".join(company_data.waste_interests) if isinstance(company_data.waste_interests, list) else str(company_data.waste_interests),
        min_quantity=company_data.min_quantity,
        max_distance=company_data.max_distance,
        is_active=True
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    return {
        "message": "Company created successfully",
        "company_id": company.id,
        "company_name": company.company_name
    }


@router.get("/companies")
async def get_companies(
    db: Session = Depends(get_db)
):
    companies = db.query(CompanyProfile).filter(
        CompanyProfile.is_active == True
    ).all()

    # If no companies in database, auto-seed default buyer enterprises
    if not companies:
        default_user = db.query(User).first()
        uid = default_user.id if default_user else "system_buyer"
        seed_companies = [
            CompanyProfile(
                user_id=uid,
                company_name="BioEnergy Solutions Tunisie",
                sector="Énergie & Biomasse",
                waste_interests="olive_pomace,olive_pits,pruning_residues",
                min_quantity=10,
                max_distance=150,
                is_active=True
            ),
            CompanyProfile(
                user_id=uid,
                company_name="EcoCompost & Fertilisants Verts",
                sector="Compostage & Fertilisants Organiques",
                waste_interests="crop_residues,olive_pomace,vine_residues",
                min_quantity=5,
                max_distance=100,
                is_active=True
            ),
            CompanyProfile(
                user_id=uid,
                company_name="AgriPellets International",
                sector="Granulés & Combustibles Verts",
                waste_interests="olive_pits,pruning_residues,date_residues",
                min_quantity=15,
                max_distance=200,
                is_active=True
            ),
            CompanyProfile(
                user_id=uid,
                company_name="NutriAlim Agro-Industrie",
                sector="Alimentation Animale & Extraction",
                waste_interests="olive_pomace,crop_residues,date_residues",
                min_quantity=8,
                max_distance=80,
                is_active=True
            ),
        ]
        for sc in seed_companies:
            db.add(sc)
        db.commit()
        companies = db.query(CompanyProfile).filter(CompanyProfile.is_active == True).all()

    return [
        {
            "id": company.id,
            "company_name": company.company_name,
            "waste_interests": company.waste_interests,
            "min_quantity": company.min_quantity,
            "max_distance": company.max_distance
        }
        for company in companies
    ]

@router.delete("/companies/{company_id}")
async def delete_company(
    company_id: str,
    db: Session = Depends(get_db)
):
    company = db.query(CompanyProfile).filter(
        CompanyProfile.id == company_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    company.is_active = False
    db.commit()

    return {
        "message": "Company deactivated successfully",
        "company_id": company_id
    }