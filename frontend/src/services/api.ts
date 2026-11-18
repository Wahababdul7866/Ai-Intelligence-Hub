import axios from 'axios';
import {
  DashboardStats,
  DatasetItem,
  DatasetProfile,
  AutoMLResponse,
  ModelComparisonItem,
  PredictionResponse,
  SHAPExplanation,
  DocumentItem,
  RAGResponse,
  AnalystResponse,
  VisionResponse,
  OllamaStatus
} from '../types';

const API_BASE = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes for ML training / image processing
});

export const api = {
  // System & Dashboard
  getDashboard: async (): Promise<DashboardStats> => {
    const res = await client.get('/system/dashboard');
    return res.data;
  },
  getOllamaStatus: async (): Promise<OllamaStatus> => {
    const res = await client.get('/system/ollama');
    return res.data;
  },
  pullOllamaModel: async (modelName: string) => {
    const res = await client.post(`/system/ollama/pull?model_name=${encodeURIComponent(modelName)}`);
    return res.data;
  },

  // Datasets
  getDatasets: async (): Promise<DatasetItem[]> => {
    const res = await client.get('/datasets');
    return res.data;
  },
  uploadDataset: async (file: File, name?: string): Promise<DatasetProfile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    const res = await client.post('/datasets/upload', formData);
    return res.data;
  },
  loadSampleDataset: async (sampleKey: string): Promise<DatasetProfile> => {
    const formData = new FormData();
    formData.append('sample_key', sampleKey);
    const res = await client.post('/datasets/load-sample', formData);
    return res.data;
  },
  getDatasetProfile: async (id: string): Promise<DatasetProfile> => {
    const res = await client.get(`/datasets/${id}`);
    return res.data;
  },
  deleteDataset: async (id: string) => {
    const res = await client.delete(`/datasets/${id}`);
    return res.data;
  },

  // AutoML
  trainAutoML: async (req: {
    dataset_id: string;
    target_column?: string;
    problem_type?: string;
    test_size?: number;
  }): Promise<AutoMLResponse> => {
    const res = await client.post('/automl/train', req);
    return res.data;
  },
  getExperiments: async () => {
    const res = await client.get('/automl/experiments');
    return res.data;
  },

  // Models
  getModels: async (): Promise<ModelComparisonItem[]> => {
    const res = await client.get('/models');
    return res.data;
  },
  getModelDetail: async (id: string) => {
    const res = await client.get(`/models/${id}`);
    return res.data;
  },
  deleteModel: async (id: string) => {
    const res = await client.delete(`/models/${id}`);
    return res.data;
  },

  // Predictions
  predictSingle: async (modelId: string, inputs: Record<string, any>): Promise<PredictionResponse> => {
    const res = await client.post(`/models/${modelId}/predict`, { inputs });
    return res.data;
  },
  predictBatch: async (modelId: string, data: Record<string, any>[]) => {
    const res = await client.post(`/models/${modelId}/predict-batch`, { data });
    return res.data;
  },

  // Explainability
  explainModel: async (modelId: string, sampleInputs?: Record<string, any>): Promise<SHAPExplanation> => {
    const res = await client.post(`/models/${modelId}/explain`, sampleInputs || {});
    return res.data;
  },

  // Documents & RAG
  getDocuments: async (): Promise<DocumentItem[]> => {
    const res = await client.get('/documents');
    return res.data;
  },
  uploadDocument: async (file: File, title?: string): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    const res = await client.post('/documents/upload', formData);
    return res.data;
  },
  loadSampleDocument: async (): Promise<DocumentItem> => {
    const res = await client.post('/documents/load-sample');
    return res.data;
  },
  queryRAG: async (req: {
    query: string;
    top_k?: number;
    document_id?: string;
    ollama_model?: string;
  }): Promise<RAGResponse> => {
    const res = await client.post('/documents/query', req);
    return res.data;
  },
  deleteDocument: async (id: string) => {
    const res = await client.delete(`/documents/${id}`);
    return res.data;
  },

  // AI Data Analyst
  queryAnalyst: async (req: {
    dataset_id: string;
    query: string;
    ollama_model?: string;
  }): Promise<AnalystResponse> => {
    const res = await client.post('/analyst/query', req);
    return res.data;
  },

  // Vision
  analyzeVision: async (file: File): Promise<VisionResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/vision/analyze', formData);
    return res.data;
  }
};
