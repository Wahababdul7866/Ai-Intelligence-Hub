export interface ColumnSummary {
  name: string;
  dtype: string;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  is_numeric: boolean;
  is_categorical: boolean;
  is_datetime: boolean;
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  median?: number;
  sample_values: any[];
  top_categories?: Record<string, number>;
  outliers_count?: number;
}

export interface DatasetProfile {
  dataset_id: string;
  name: string;
  row_count: number;
  column_count: number;
  duplicate_rows: number;
  total_missing_values: number;
  columns: ColumnSummary[];
  correlation_matrix?: Record<string, Record<string, number>>;
  suggested_target_columns: string[];
  preview_data: Record<string, any>[];
}

export interface DatasetItem {
  id: string;
  name: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  created_at: string;
}

export interface ModelComparisonItem {
  model_id: string;
  name: string;
  algorithm_name: string;
  problem_type: string;
  training_duration_sec: number;
  metrics: Record<string, any>;
  is_best: boolean;
  created_at: string;
}

export interface AutoMLResponse {
  experiment_id: string;
  dataset_id: string;
  detected_problem_type: string;
  target_column?: string;
  features_used: string[];
  models_evaluated: ModelComparisonItem[];
  best_model: ModelComparisonItem;
}

export interface PredictionResponse {
  model_id: string;
  algorithm_name: string;
  prediction: any;
  prediction_label?: string;
  probability?: number;
  class_probabilities?: Record<string, number>;
  explanation?: string;
}

export interface SHAPFeatureImpact {
  feature: string;
  impact_score: number;
  direction: 'positive' | 'negative' | 'neutral';
  base_value: any;
}

export interface SHAPExplanation {
  model_id: string;
  global_feature_importance: Array<{
    feature: string;
    importance: number;
    importance_percent: number;
  }>;
  sample_prediction_waterfall?: SHAPFeatureImpact[];
  summary_text: string;
  disclaimer: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  file_size_bytes: number;
  num_pages: number;
  num_chunks: number;
  created_at: string;
}

export interface SourceChunk {
  document_id: string;
  document_title: string;
  page_number: number;
  chunk_index: number;
  score: number;
  text_content: string;
}

export interface RAGResponse {
  query: string;
  answer: string;
  sources: SourceChunk[];
  model_used: string;
  inference_time_sec: number;
}

export interface AnalystResponse {
  query: string;
  interpreted_intent: string;
  executed_operation: string;
  computed_result: any;
  is_numerical: boolean;
  explanation: string;
  chart_config?: {
    chart_type: 'bar' | 'line' | 'scatter' | 'pie' | 'table';
    x_key: string;
    y_keys: string[];
    title: string;
  };
  chart_data?: Record<string, any>[];
}

export interface VisionResponse {
  filename: string;
  image_width: number;
  image_height: number;
  format: string;
  classification_labels: Array<{ category: string; confidence: number }>;
  detected_objects: Array<{ label: string; confidence: number; box?: number[] }>;
  extracted_text: string;
  ocr_confidence?: number;
  analysis_time_sec: number;
}

export interface DashboardStats {
  datasets_count: number;
  models_trained_count: number;
  predictions_made_count: number;
  documents_uploaded_count: number;
  recent_datasets: DatasetItem[];
  recent_models: ModelComparisonItem[];
  recent_activity: Array<{
    type: string;
    title: string;
    timestamp: string;
    details: string;
  }>;
  system_status: {
    engine: string;
    database: string;
    vector_store: string;
    ollama_available: boolean;
    ollama_models: string[];
    offline_ready: boolean;
  };
}

export interface OllamaStatus {
  available: boolean;
  base_url: string;
  models: string[];
  active_model?: string;
  version?: string;
  instructions?: string;
}
