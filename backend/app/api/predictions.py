from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import MLModel, PredictionRecord
from app.schemas.schemas import PredictionRequest, PredictionResponse, BatchPredictionRequest
from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/models", tags=["Predictions"])

@router.post("/{model_id}/predict", response_model=PredictionResponse)
async def make_prediction(
    model_id: str,
    req: PredictionRequest,
    db: AsyncSession = Depends(get_db)
):
    query = select(MLModel).where(MLModel.id == model_id)
    res = await db.execute(query)
    model = res.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    try:
        pred_res = PredictionService.predict_single(model_id, req.inputs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

    # Store record
    record = PredictionRecord(
        model_id=model_id,
        input_data_json=req.inputs,
        prediction_result_json={
            "prediction": pred_res.prediction,
            "label": pred_res.prediction_label,
            "probability": pred_res.probability,
            "class_probabilities": pred_res.class_probabilities
        },
        confidence_score=pred_res.probability,
        explanation_json={"text": pred_res.explanation}
    )
    db.add(record)
    await db.commit()

    return pred_res

@router.post("/{model_id}/predict-batch")
async def make_batch_predictions(
    model_id: str,
    req: BatchPredictionRequest,
    db: AsyncSession = Depends(get_db)
):
    query = select(MLModel).where(MLModel.id == model_id)
    res = await db.execute(query)
    model = res.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    try:
        results = PredictionService.predict_batch(model_id, req.data)
        return {"model_id": model_id, "total_records": len(req.data), "predictions": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Batch prediction error: {str(e)}")
