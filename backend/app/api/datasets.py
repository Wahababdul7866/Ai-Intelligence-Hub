import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.config import settings
from app.core.database import get_db
from app.models.models import Dataset
from app.schemas.schemas import DatasetOut, DatasetProfileResponse
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetOut])
async def list_datasets(db: AsyncSession = Depends(get_db)):
    query = select(Dataset).order_by(desc(Dataset.created_at))
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/upload", response_model=DatasetProfileResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    ext = Path(file.filename).suffix.lower()
    if ext not in [".csv", ".xlsx", ".xls", ".txt"]:
        raise HTTPException(status_code=400, detail="Only CSV and Excel (.xlsx, .xls) files are supported.")

    dataset_id = str(uuid.uuid4())
    save_name = f"{dataset_id}_{file.filename}"
    save_path = settings.UPLOAD_DIR / save_name

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)
    display_name = name or Path(file.filename).stem.replace("_", " ").title()

    try:
        df = DatasetService.load_dataframe(save_path)
        profile = DatasetService.profile_dataset(df, dataset_id=dataset_id, name=display_name)
    except Exception as e:
        if save_path.exists():
            os.remove(save_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")

    dataset = Dataset(
        id=dataset_id,
        name=display_name,
        original_filename=file.filename,
        file_path=str(save_path),
        file_type=ext.replace(".", ""),
        file_size_bytes=file_size,
        row_count=profile.row_count,
        column_count=profile.column_count,
        summary_json=profile.model_dump()
    )
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)

    return profile

@router.post("/load-sample", response_model=DatasetProfileResponse)
async def load_sample_dataset(
    sample_key: str = Form(..., description="churn, housing, clustering, fraud"),
    db: AsyncSession = Depends(get_db)
):
    sample_files = {
        "churn": ("customer_churn.csv", "Customer Churn Analysis"),
        "housing": ("housing_prices.csv", "Real Estate Housing Prices"),
        "clustering": ("customer_segmentation.csv", "Customer Segmentation"),
        "fraud": ("transaction_fraud.csv", "Financial Transaction Fraud")
    }

    if sample_key not in sample_files:
        raise HTTPException(status_code=400, detail=f"Invalid sample key. Available: {list(sample_files.keys())}")

    filename, title = sample_files[sample_key]
    source_path = settings.SAMPLES_DIR / filename
    if not source_path.exists():
        raise HTTPException(status_code=404, detail="Sample dataset file not found on disk.")

    dataset_id = str(uuid.uuid4())
    dest_path = settings.UPLOAD_DIR / f"{dataset_id}_{filename}"
    shutil.copyfile(source_path, dest_path)

    df = DatasetService.load_dataframe(dest_path)
    profile = DatasetService.profile_dataset(df, dataset_id=dataset_id, name=title)

    dataset = Dataset(
        id=dataset_id,
        name=title,
        original_filename=filename,
        file_path=str(dest_path),
        file_type="csv",
        file_size_bytes=os.path.getsize(dest_path),
        row_count=profile.row_count,
        column_count=profile.column_count,
        summary_json=profile.model_dump()
    )
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)

    return profile

@router.get("/{dataset_id}", response_model=DatasetProfileResponse)
async def get_dataset_profile(dataset_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Dataset).where(Dataset.id == dataset_id)
    res = await db.execute(query)
    dataset = res.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if dataset.summary_json:
        return DatasetProfileResponse(**dataset.summary_json)

    df = DatasetService.load_dataframe(dataset.file_path)
    profile = DatasetService.profile_dataset(df, dataset_id=dataset.id, name=dataset.name)
    dataset.summary_json = profile.model_dump()
    await db.commit()
    return profile

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Dataset).where(Dataset.id == dataset_id)
    res = await db.execute(query)
    dataset = res.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if os.path.exists(dataset.file_path):
        try:
            os.remove(dataset.file_path)
        except Exception:
            pass

    await db.delete(dataset)
    await db.commit()
    return {"message": "Dataset deleted successfully", "id": dataset_id}
