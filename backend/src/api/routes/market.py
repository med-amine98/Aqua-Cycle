from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

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
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    company = CompanyProfile(
        user_id=current_user.id,
        company_name=company_data.company_name,
        waste_interests=",".join(company_data.waste_interests),
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