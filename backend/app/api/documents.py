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
from app.models.models import Document, DocumentChunk
from app.schemas.schemas import DocumentOut, RAGQueryRequest, RAGQueryResponse
from app.services.rag_service import RAGService

router = APIRouter(prefix="/documents", tags=["Documents & RAG"])

@router.get("", response_model=List[DocumentOut])
async def list_documents(db: AsyncSession = Depends(get_db)):
    query = select(Document).order_by(desc(Document.created_at))
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".txt", ".md"]:
        raise HTTPException(status_code=400, detail="Only PDF (.pdf) and text (.txt, .md) documents are supported.")

    doc_id = str(uuid.uuid4())
    save_path = settings.UPLOAD_DIR / f"{doc_id}_{file.filename}"

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc_title = title or Path(file.filename).stem.replace("_", " ").title()
    file_size = os.path.getsize(save_path)

    # Ingest, chunk, and index
    try:
        num_chunks = RAGService.index_document(doc_id, doc_title, save_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Document indexing failed: {str(e)}")

    doc = Document(
        id=doc_id,
        title=doc_title,
        filename=file.filename,
        file_path=str(save_path),
        file_size_bytes=file_size,
        num_pages=max(1, num_chunks // 4),
        num_chunks=num_chunks
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return doc

@router.post("/load-sample", response_model=DocumentOut)
async def load_sample_document(db: AsyncSession = Depends(get_db)):
    source_path = settings.SAMPLES_DIR / "ai_architecture_guide.txt"
    if not source_path.exists():
        raise HTTPException(status_code=404, detail="Sample guide not found on disk.")

    doc_id = str(uuid.uuid4())
    dest_path = settings.UPLOAD_DIR / f"{doc_id}_ai_architecture_guide.txt"
    shutil.copyfile(source_path, dest_path)

    doc_title = "Deep Learning & RAG Architecture Report"
    num_chunks = RAGService.index_document(doc_id, doc_title, dest_path)

    doc = Document(
        id=doc_id,
        title=doc_title,
        filename="ai_architecture_guide.txt",
        file_path=str(dest_path),
        file_size_bytes=os.path.getsize(dest_path),
        num_pages=5,
        num_chunks=num_chunks
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return doc

@router.post("/query", response_model=RAGQueryResponse)
async def query_documents(req: RAGQueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        response = await RAGService.answer_rag_query(
            query=req.query,
            top_k=req.top_k or 4,
            target_doc_id=req.document_id,
            model=req.ollama_model
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query error: {str(e)}")

@router.delete("/{doc_id}")
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Document).where(Document.id == doc_id)
    res = await db.execute(query)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    # Clear from RAG in-memory index
    if doc_id in RAGService._vector_indices:
        del RAGService._vector_indices[doc_id]
    if doc_id in RAGService._chunk_metadata:
        del RAGService._chunk_metadata[doc_id]

    await db.delete(doc)
    await db.commit()
    return {"message": "Document removed successfully", "id": doc_id}
