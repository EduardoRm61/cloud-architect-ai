from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
import asyncio
from database import get_db
import models, schemas
from services.gemini import GeminiService

router = APIRouter(prefix="/generations", tags=["generations"])
generate_router = APIRouter(tags=["generations"])

@generate_router.post("/generate", response_model=schemas.GenerationResponse, status_code=201)
async def create_generation(request: schemas.GenerationRequest, db: AsyncSession = Depends(get_db)):
    project = await db.get(models.Project, request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        parsed_result = await GeminiService.generate_architecture(
            description=request.description, 
            provider=request.provider, 
            filters=request.filters
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    db_generation = models.Generation(
        project_id=request.project_id,
        description=request.description,
        provider=request.provider,
        architecture=parsed_result["architecture"],
        mermaid_code=parsed_result["mermaid_code"],
        cost_estimate={"items": parsed_result["cost_estimate"]},
        total_monthly_cost=str(parsed_result["total_monthly_cost_usd"]),
        alternatives={"items": parsed_result["alternatives"]}
    )
    db.add(db_generation)
    await db.commit()
    await db.refresh(db_generation)
    return db_generation

@generate_router.post("/generate/compare", status_code=200)
async def generate_compare(request: schemas.CompareRequest):
    providers = ["AWS", "GCP", "Azure"]
    
    async def fetch_for_provider(provider: str):
        try:
            result = await GeminiService.generate_architecture(
                description=request.description,
                provider=provider,
                filters=request.filters
            )
            result["provider"] = provider
            return result
        except Exception as e:
            return {"provider": provider, "error": str(e)}

    results = []
    for i, p in enumerate(providers):
        if i > 0:
            # Atraso intencional para não estourar a cota gratuita do Gemini (5 req/min)
            await asyncio.sleep(4)
        res = await fetch_for_provider(p)
        results.append(res)
        
    return results

@router.get("/", response_model=List[schemas.GenerationResponse])
async def list_generations(project_id: Optional[UUID] = None, db: AsyncSession = Depends(get_db)):
    query = select(models.Generation)
    if project_id:
        query = query.where(models.Generation.project_id == project_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{id}", response_model=schemas.GenerationResponse)
async def get_generation(id: UUID, db: AsyncSession = Depends(get_db)):
    generation = await db.get(models.Generation, id)
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")
    return generation
