from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.config import settings
from app.core.database import get_db
from app.models.models import Dataset, MLModel, Experiment
from app.schemas.schemas import AutoMLTrainRequest, AutoMLTrainResponse, ModelComparisonItem
from app.services.dataset_service import DatasetService
from app.services.automl_service import AutoMLService
from app.services.mlflow_service import MLflowService

router = APIRouter(prefix="/automl", tags=["AutoML"])

@router.post("/train", response_model=AutoMLTrainResponse)
async def train_automl_pipeline(
    req: AutoMLTrainRequest,
    db: AsyncSession = Depends(get_db)
):
    query = select(Dataset).where(Dataset.id == req.dataset_id)
    res = await db.execute(query)
    dataset = res.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = DatasetService.load_dataframe(dataset.file_path)

    try:
        train_result = AutoMLService.train_automl(
            df=df,
            target_col=req.target_column,
            problem_type=req.problem_type,
            test_size=req.test_size or 0.2
        )
        train_result.dataset_id = dataset.id
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"AutoML training failed: {str(e)}")

    # Create Experiment record in DB
    experiment = Experiment(
        id=train_result.experiment_id,
        name=f"AutoML on {dataset.name}",
        dataset_id=dataset.id,
        problem_type=train_result.detected_problem_type,
        target_column=train_result.target_column,
        best_model_id=train_result.best_model.model_id if train_result.best_model else None,
        models_evaluated_count=len(train_result.models_evaluated),
        config_json=req.model_dump()
    )
    db.add(experiment)

    # Save models in DB
    for m in train_result.models_evaluated:
        db_model = MLModel(
            id=m.model_id,
            name=m.name,
            dataset_id=dataset.id,
            experiment_id=experiment.id,
            problem_type=m.problem_type,
            algorithm_name=m.algorithm_name,
            target_column=train_result.target_column,
            features_list_json=train_result.features_used,
            metrics_json=m.metrics,
            is_best=m.is_best,
            artifact_path=str(settings.MODEL_DIR / f"{m.model_id}.joblib"),
            training_duration_sec=m.training_duration_sec
        )
        db.add(db_model)

        # Log to MLflow
        MLflowService.log_experiment_run(
            experiment_name=f"AutoML_{dataset.name.replace(' ', '_')}",
            run_name=m.name,
            params={"algorithm": m.algorithm_name, "problem_type": m.problem_type, "target": str(train_result.target_column)},
            metrics=m.metrics
        )

    await db.commit()
    return train_result

@router.get("/experiments", response_model=List[dict])
async def list_experiments(db: AsyncSession = Depends(get_db)):
    query = select(Experiment).order_by(desc(Experiment.created_at))
    res = await db.execute(query)
    exps = res.scalars().all()
    out = []
    for exp in exps:
        out.append({
            "id": exp.id,
            "name": exp.name,
            "dataset_id": exp.dataset_id,
            "problem_type": exp.problem_type,
            "target_column": exp.target_column,
            "models_evaluated_count": exp.models_evaluated_count,
            "best_model_id": exp.best_model_id,
            "created_at": exp.created_at
        })
    return out
