import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Sparkles, AlertTriangle, CheckCircle2, Play, Upload } from 'lucide-react';
import { ModelComparisonItem, PredictionResponse } from '../types';
import { api } from '../services/api';

interface PredictionsProps {
  selectedModelId: string | null;
  onNavigate: (tab: string) => void;
}

export const PredictionsPage: React.FC<PredictionsProps> = ({ selectedModelId, onNavigate }) => {
  const [models, setModels] = useState<ModelComparisonItem[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>(selectedModelId || '');
  const [modelDetail, setModelDetail] = useState<any | null>(null);
  const [formInputs, setFormInputs] = useState<Record<string, any>>({});
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const list = await api.getModels();
        setModels(list);
        if (!activeModelId && list.length > 0) {
          setActiveModelId(list[0].model_id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (selectedModelId) {
      setActiveModelId(selectedModelId);
    }
  }, [selectedModelId]);

  useEffect(() => {
    if (!activeModelId) return;
    const fetchDetail = async () => {
      try {
        const detail = await api.getModelDetail(activeModelId);
        setModelDetail(detail);
        // Initialize form inputs with sensible defaults
        const initial: Record<string, any> = {};
        for (const f of detail.features || []) {
          initial[f] = '';
        }
        setFormInputs(initial);
        setPredictionResult(null);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDetail();
  }, [activeModelId]);

  const handleInputChange = (feature: string, val: any) => {
    setFormInputs((prev) => ({ ...prev, [feature]: val }));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModelId) return;

    setIsPredicting(true);
    setErrorMsg(null);
    try {
      const res = await api.predictSingle(activeModelId, formInputs);
      setPredictionResult(res);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleFillSampleValues = () => {
    if (!modelDetail) return;
    const sample: Record<string, any> = {};
    for (const f of modelDetail.features || []) {
      const fLower = f.toLowerCase();
      if (fLower.includes('month') || fLower.includes('tenure') || fLower.includes('age') || fLower.includes('feet') || fLower.includes('sqft')) {
        sample[f] = 24;
      } else if (fLower.includes('charge') || fLower.includes('price') || fLower.includes('income') || fLower.includes('amount')) {
        sample[f] = 85.5;
      } else if (fLower.includes('contract')) {
        sample[f] = 'Month-to-month';
      } else if (fLower.includes('support') || fLower.includes('garage') || fLower.includes('paperless')) {
        sample[f] = 'Yes';
      } else if (fLower.includes('internet')) {
        sample[f] = 'Fiber optic';
      } else {
        sample[f] = 1;
      }
    }
    setFormInputs(sample);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Model Selection Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Interactive Model Inference
          </h3>
          <p className="text-xs text-slate-400">
            Supply attributes to run real-time predictions directly on the trained serialized model.
          </p>
        </div>

        {models.length > 0 ? (
          <div className="flex items-center gap-3">
            <select
              value={activeModelId}
              onChange={(e) => setActiveModelId(e.target.value)}
              className="text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
            >
              {models.map((m) => (
                <option key={m.model_id} value={m.model_id}>
                  {m.name} ({m.algorithm_name})
                </option>
              ))}
            </select>
            <button
              onClick={handleFillSampleValues}
              className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Fill Sample Data
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('automl')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
          >
            Train a Model First
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {modelDetail ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              Input Feature Attributes ({modelDetail.features?.length || 0})
            </h4>

            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-2">
                {modelDetail.features?.map((feat: string) => (
                  <div key={feat}>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {feat}
                    </label>
                    <input
                      type="text"
                      value={formInputs[feat] !== undefined ? formInputs[feat] : ''}
                      onChange={(e) => handleInputChange(feat, e.target.value)}
                      placeholder={`Enter ${feat}`}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPredicting}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>{isPredicting ? 'Inferring...' : 'Execute Model Prediction'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Outcome Result Card */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Inference Outcome
              </h4>

              {predictionResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                      Predicted Output
                    </span>
                    <div className="text-2xl font-black">{predictionResult.prediction_label}</div>
                    {predictionResult.probability !== undefined && (
                      <div className="text-xs text-blue-100">
                        Model Confidence: {(predictionResult.probability * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>

                  {predictionResult.explanation && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold block mb-1 text-slate-900 dark:text-white">Explanation:</span>
                      {predictionResult.explanation}
                    </div>
                  )}

                  {predictionResult.class_probabilities && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Class Probabilities:
                      </span>
                      {Object.entries(predictionResult.class_probabilities).map(([label, prob]) => (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">{label}</span>
                            <span className="font-mono font-semibold">{(prob * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Fill in the input features on the left and click "Execute Model Prediction" to see actual model output.
                </div>
              )}
            </div>

            {predictionResult && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  onClick={() => onNavigate('explainability')}
                  className="w-full py-2 text-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  View Full SHAP Breakdown →
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Model Selected</h4>
          <p className="text-xs text-slate-400 mt-1">
            Train a model in the AutoML tab or select an existing model from the Model Registry.
          </p>
        </div>
      )}
    </div>
  );
};
