import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_type = Column(String(50), nullable=False)  # csv, xlsx, etc.
    file_size_bytes = Column(Integer, nullable=False)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    summary_json = Column(JSON, nullable=True)
    columns_meta_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    models = relationship("MLModel", back_populates="dataset", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="dataset", cascade="all, delete-orphan")

class MLModel(Base):
    __tablename__ = "ml_models"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=True)
    experiment_id = Column(String(36), ForeignKey("experiments.id"), nullable=True)
    problem_type = Column(String(50), nullable=False)  # classification, regression, clustering, anomaly
    algorithm_name = Column(String(100), nullable=False)
    target_column = Column(String(100), nullable=True)
    features_list_json = Column(JSON, nullable=False)
    hyperparameters_json = Column(JSON, nullable=True)
    metrics_json = Column(JSON, nullable=False)
    is_best = Column(Boolean, default=False)
    artifact_path = Column(Text, nullable=False)
    preprocessor_path = Column(Text, nullable=True)
    training_duration_sec = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    dataset = relationship("Dataset", back_populates="models")
    experiment = relationship("Experiment", back_populates="models")
    predictions = relationship("PredictionRecord", back_populates="model", cascade="all, delete-orphan")

class Experiment(Base):
    __tablename__ = "experiments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    problem_type = Column(String(50), nullable=False)
    target_column = Column(String(100), nullable=True)
    status = Column(String(50), default="COMPLETED")  # PENDING, RUNNING, COMPLETED, FAILED
    best_model_id = Column(String(36), nullable=True)
    models_evaluated_count = Column(Integer, default=0)
    config_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    dataset = relationship("Dataset", back_populates="experiments")
    models = relationship("MLModel", back_populates="experiment", cascade="all, delete-orphan")

class PredictionRecord(Base):
    __tablename__ = "predictions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("ml_models.id"), nullable=False)
    input_data_json = Column(JSON, nullable=False)
    prediction_result_json = Column(JSON, nullable=False)
    confidence_score = Column(Float, nullable=True)
    explanation_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    model = relationship("MLModel", back_populates="predictions")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    num_pages = Column(Integer, default=1)
    num_chunks = Column(Integer, default=0)
    vector_index_name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, default=1)
    text_content = Column(Text, nullable=False)
    embedding_vector_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    document = relationship("Document", back_populates="chunks")

class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_type = Column(String(100), nullable=False)  # automl, profiling, rag_index, ocr, vision
    status = Column(String(50), default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED
    progress_percent = Column(Float, default=0.0)
    message = Column(Text, nullable=True)
    result_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)
