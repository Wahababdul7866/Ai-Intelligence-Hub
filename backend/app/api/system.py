from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.config import settings
from app.core.database import get_db
from app.models.models import Dataset, MLModel, PredictionRecord, Document, Experiment
from app.schemas.schemas import DashboardStatsOut, DatasetOut, ModelComparisonItem, OllamaStatusResponse
from app.services.ollama_service import OllamaService

router = APIRouter(prefix="/system", tags=["System & Dashboard"])

@router.get("/dashboard", response_model=DashboardStatsOut)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    # Counts
    d_count = await db.scalar(select(func.count(Dataset.id))) or 0
    m_count = await db.scalar(select(func.count(MLModel.id))) or 0
    p_count = await db.scalar(select(func.count(PredictionRecord.id))) or 0
    doc_count = await db.scalar(select(func.count(Document.id))) or 0

    # Recent datasets
    d_res = await db.execute(select(Dataset).order_by(desc(Dataset.created_at)).limit(5))
    recent_d = [DatasetOut.model_validate(d) for d in d_res.scalars().all()]

    # Recent models
    m_res = await db.execute(select(MLModel).order_by(desc(MLModel.created_at)).limit(5))
    recent_m = [
        ModelComparisonItem(
            model_id=m.id,
            name=m.name,
            algorithm_name=m.algorithm_name,
            problem_type=m.problem_type,
            training_duration_sec=m.training_duration_sec,
            metrics=m.metrics_json,
            is_best=m.is_best,
            created_at=m.created_at
        ) for m in m_res.scalars().all()
    ]

    # Recent Activity items
    recent_activity = []
    for d in recent_d[:3]:
        recent_activity.append({
            "type": "dataset",
            "title": f"Uploaded dataset: {d.name}",
            "timestamp": d.created_at,
            "details": f"{d.row_count:,} rows, {d.column_count} columns"
        })
    for m in recent_m[:3]:
        recent_activity.append({
            "type": "model",
            "title": f"Trained model: {m.name}",
            "timestamp": m.created_at,
            "details": f"Algorithm: {m.algorithm_name}"
        })

    # Ollama status
    ollama_status = await OllamaService.check_health()

    system_status = {
        "engine": "AI Intelligence Hub Local Core",
        "database": "Operational (Local Engine)",
        "vector_store": "FAISS IndexFlat",
        "ollama_available": ollama_status.available,
        "ollama_models": ollama_status.models,
        "offline_ready": True
    }

    return DashboardStatsOut(
        datasets_count=d_count,
        models_trained_count=m_count,
        predictions_made_count=p_count,
        documents_uploaded_count=doc_count,
        recent_datasets=recent_d,
        recent_models=recent_m,
        recent_activity=recent_activity,
        system_status=system_status
    )

@router.get("/ollama", response_model=OllamaStatusResponse)
async def get_ollama_status():
    return await OllamaService.check_health()

@router.post("/ollama/pull")
async def pull_ollama_model(model_name: str = Query(..., description="e.g. llama3.2, mistral, phi3")):
    return await OllamaService.pull_model(model_name)

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "offline_first": True
    }
