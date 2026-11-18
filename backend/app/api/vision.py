import os
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.core.config import settings
from app.schemas.schemas import VisionAnalysisResponse
from app.services.vision_service import VisionService

router = APIRouter(prefix="/vision", tags=["Computer Vision"])

@router.post("/analyze", response_model=VisionAnalysisResponse)
async def analyze_image_endpoint(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
        raise HTTPException(status_code=400, detail="Only image formats (.jpg, .jpeg, .png, .webp, .bmp) are supported.")

    file_id = str(uuid.uuid4())
    save_path = settings.UPLOAD_DIR / f"{file_id}_{file.filename}"

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        res = VisionService.analyze_image(save_path)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")
