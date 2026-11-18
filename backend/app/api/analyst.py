from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Dataset
from app.schemas.schemas import AnalystQueryRequest, AnalystQueryResponse
from app.services.analyst_service import AnalystService

router = APIRouter(prefix="/analyst", tags=["AI Data Analyst"])

@router.post("/query", response_model=AnalystQueryResponse)
async def analyze_dataset_query(
    req: AnalystQueryRequest,
    db: AsyncSession = Depends(get_db)
):
    query = select(Dataset).where(Dataset.id == req.dataset_id)
    res = await db.execute(query)
    dataset = res.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        response = await AnalystService.analyze_query(
            dataset_id=dataset.id,
            file_path=dataset.file_path,
            query=req.query,
            model=req.ollama_model
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
