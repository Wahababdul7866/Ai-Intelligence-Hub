from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import MLModel
from app.schemas.schemas import SHAPExplanationOut
from app.services.explainability_service import ExplainabilityService

router = APIRouter(prefix="/models", tags=["Explainability"])

@router.post("/{model_id}/explain", response_model=SHAPExplanationOut)
async def explain_model(
    model_id: str,
    sample_inputs: Optional[Dict[str, Any]] = Body(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(MLModel).where(MLModel.id == model_id)
    res = await db.execute(query)
    model = res.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    try:
        explanation = ExplainabilityService.explain_model(model_id, sample_inputs)
        return explanation
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate explanation: {str(e)}")
