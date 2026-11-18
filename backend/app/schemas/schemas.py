from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel as PydanticBaseModel, Field, ConfigDict

class BaseModel(PydanticBaseModel):
    model_config = {"protected_namespaces": ()}

# Auth Schemas
class UserCreate(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Dataset Schemas
class ColumnSummary(BaseModel):
    name: str
    dtype: str
    null_count: int
    null_percentage: float
    unique_count: int
    is_numeric: bool
    is_categorical: bool
    is_datetime: bool
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    std: Optional[float] = None
    median: Optional[float] = None
    sample_values: List[Any] = []
    top_categories: Optional[Dict[str, int]] = None
    outliers_count: Optional[int] = None

class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    original_filename: str
    file_type: str
    file_size_bytes: int
    row_count: int
    column_count: int
    created_at: datetime

class DatasetProfileResponse(BaseModel):
    dataset_id: str
    name: str
    row_count: int
    column_count: int
    duplicate_rows: int
    total_missing_values: int
    columns: List[ColumnSummary]
    correlation_matrix: Optional[Dict[str, Dict[str, float]]] = None
    suggested_target_columns: List[str] = []
    preview_data: List[Dict[str, Any]] = []

# AutoML Schemas
class AutoMLTrainRequest(BaseModel):
    dataset_id: str
    target_column: Optional[str] = None
    problem_type: Optional[str] = None  # auto, classification, regression, clustering, anomaly
    time_budget_sec: Optional[int] = 120
    test_size: Optional[float] = 0.2
    selected_algorithms: Optional[List[str]] = None

class ModelComparisonItem(BaseModel):
    model_id: str
    name: str
    algorithm_name: str
    problem_type: str
    training_duration_sec: float
    metrics: Dict[str, Any]
    is_best: bool
    created_at: datetime

class AutoMLTrainResponse(BaseModel):
    experiment_id: str
    dataset_id: str
    detected_problem_type: str
    target_column: Optional[str]
    features_used: List[str]
    models_evaluated: List[ModelComparisonItem]
    best_model: ModelComparisonItem

# Prediction Schemas
class PredictionRequest(BaseModel):
    inputs: Dict[str, Any]

class PredictionResponse(BaseModel):
    model_id: str
    algorithm_name: str
    prediction: Any
    prediction_label: Optional[str] = None
    probability: Optional[float] = None
    class_probabilities: Optional[Dict[str, float]] = None
    explanation: Optional[str] = None
    feature_contributions: Optional[List[Dict[str, Any]]] = None

class BatchPredictionRequest(BaseModel):
    data: List[Dict[str, Any]]

# Explainability Schemas
class SHAPFeatureImpact(BaseModel):
    feature: str
    impact_score: float
    direction: str  # positive, negative, neutral
    base_value: Any

class SHAPExplanationOut(BaseModel):
    model_id: str
    global_feature_importance: List[Dict[str, Any]]
    sample_prediction_waterfall: Optional[List[SHAPFeatureImpact]] = None
    summary_text: str
    disclaimer: str = (
        "Notice: SHAP explanations describe internal model behavior and mathematical feature attribution. "
        "They do not imply direct real-world causal mechanisms."
    )

# Document & RAG Schemas
class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    filename: str
    file_size_bytes: int
    num_pages: int
    num_chunks: int
    created_at: datetime

class SourceChunkOut(BaseModel):
    document_id: str
    document_title: str
    page_number: int
    chunk_index: int
    score: float
    text_content: str

class RAGQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 4
    document_id: Optional[str] = None
    ollama_model: Optional[str] = None

class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[SourceChunkOut]
    model_used: str
    inference_time_sec: float

# AI Data Analyst Schemas
class AnalystQueryRequest(BaseModel):
    dataset_id: str
    query: str
    ollama_model: Optional[str] = None

class AnalystChartConfig(BaseModel):
    chart_type: str  # bar, line, scatter, pie, table
    x_key: str
    y_keys: List[str]
    title: str

class AnalystQueryResponse(BaseModel):
    query: str
    interpreted_intent: str
    executed_operation: str
    computed_result: Any
    is_numerical: bool
    explanation: str
    chart_config: Optional[AnalystChartConfig] = None
    chart_data: Optional[List[Dict[str, Any]]] = None

# Computer Vision Schemas
class DetectedObjectOut(BaseModel):
    label: str
    confidence: float
    box: Optional[List[float]] = None  # [ymin, xmin, ymax, xmax] or [x, y, w, h] normalized

class VisionAnalysisResponse(BaseModel):
    filename: str
    image_width: int
    image_height: int
    format: str
    classification_labels: List[Dict[str, Any]]
    detected_objects: List[DetectedObjectOut]
    extracted_text: str
    ocr_confidence: Optional[float] = None
    analysis_time_sec: float

# Ollama & System Schemas
class OllamaStatusResponse(BaseModel):
    available: bool
    base_url: str
    models: List[str]
    active_model: Optional[str] = None
    version: Optional[str] = None
    instructions: Optional[str] = None

class DashboardStatsOut(BaseModel):
    datasets_count: int
    models_trained_count: int
    predictions_made_count: int
    documents_uploaded_count: int
    recent_datasets: List[DatasetOut]
    recent_models: List[ModelComparisonItem]
    recent_activity: List[Dict[str, Any]]
    system_status: Dict[str, Any]
