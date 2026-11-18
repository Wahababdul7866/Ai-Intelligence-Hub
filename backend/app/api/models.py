import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.models import MLModel
from app.schemas.schemas import ModelComparisonItem

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("", response_model=List[ModelComparisonItem])
async def list_models(db: AsyncSession = Depends(get_db)):
    query = select(MLModel).order_by(desc(MLModel.created_at))
    res = await db.execute(query)
    models = res.scalars().all()
    
    out = []
    for m in models:
        out.append(ModelComparisonItem(
            model_id=m.id,
            name=m.name,
            algorithm_name=m.algorithm_name,
            problem_type=m.problem_type,
            training_duration_sec=m.training_duration_sec,
            metrics=m.metrics_json,
            is_best=m.is_best,
            created_at=m.created_at
        ))
    return out

@router.get("/{model_id}")
async def get_model_detail(model_id: str, db: AsyncSession = Depends(get_db)):
    query = select(MLModel).where(MLModel.id == model_id)
    res = await db.execute(query)
    m = res.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")

    return {
        "id": m.id,
        "name": m.name,
        "dataset_id": m.dataset_id,
        "experiment_id": m.experiment_id,
        "problem_type": m.problem_type,
        "algorithm_name": m.algorithm_name,
        "target_column": m.target_column,
        "features": m.features_list_json,
        "metrics": m.metrics_json,
        "is_best": m.is_best,
        "training_duration_sec": m.training_duration_sec,
        "artifact_path": m.artifact_path,
        "created_at": m.created_at
    }

@router.delete("/{model_id}")
async def delete_model(model_id: str, db: AsyncSession = Depends(get_db)):
    query = select(MLModel).where(MLModel.id == model_id)
    res = await db.execute(query)
    m = res.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")

    if m.artifact_path and os.path.exists(m.artifact_path):
        try:
            os.remove(m.artifact_path)
        except Exception:
            pass

    await db.delete(m)
    await db.commit()
    return {"message": "Model deleted successfully", "id": model_id}
