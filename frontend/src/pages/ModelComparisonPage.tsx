import React, { useEffect, useState } from 'react';
import { Trophy, Activity, HelpCircle, Trash2, Cpu, RefreshCw, Eye } from 'lucide-react';
import { ModelComparisonItem } from '../types';
import { api } from '../services/api';

interface ModelComparisonProps {
  onNavigate: (tab: string) => void;
  onSelectModelForPrediction: (modelId: string) => void;
  onSelectModelForExplanation: (modelId: string) => void;
}

export const ModelComparisonPage: React.FC<ModelComparisonProps> = ({
  onNavigate,
  onSelectModelForPrediction,
  onSelectModelForExplanation,
}) => {
  const [models, setModels] = useState<ModelComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await api.getModels();
      setModels(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;
    try {
      await api.deleteModel(id);
      setModels(models.filter((m) => m.model_id !== id));
      if (selectedDetail?.id === id) setSelectedDetail(null);
    } catch (e) {
      alert('Failed to delete model');
    }
  };

  const handleInspect = async (id: string) => {
    try {
      const detail = await api.getModelDetail(id);
      setSelectedDetail(detail);
    } catch (e) {
      alert('Failed to load model details');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Model Registry & Comparison
          </h3>
          <p className="text-xs text-slate-400">
            Compare model metrics across cross-validation runs and select models for deployment.
          </p>
        </div>
        <button
          onClick={loadModels}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading models...</div>
      ) : models.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Cpu className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Models Trained Yet</h4>
          <p className="text-xs text-slate-400 mt-1">
            Navigate to AutoML Engine to train candidate algorithms on your datasets.
          </p>
        </div>
      ) : (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Task</th>
                <th className="py-2.5 px-3">Primary Metric</th>
                <th className="py-2.5 px-3">Training Time</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {models.map((m) => {
                const metricKey = m.problem_type === 'classification' ? 'f1_score' : m.problem_type === 'regression' ? 'r2' : 'silhouette_score';
                const metricVal = m.metrics[metricKey];
                return (
                  <tr key={m.model_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {m.is_best && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                      <span>{m.name}</span>
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-400">{m.problem_type}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {metricKey.toUpperCase()}: {metricVal !== undefined ? (typeof metricVal === 'number' && metricVal <= 1 ? (metricVal * 100).toFixed(1) + '%' : metricVal) : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{m.training_duration_sec}s</td>
                    <td className="py-3 px-3 text-slate-400">{new Date(m.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleInspect(m.model_id)}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 transition-colors"
                        title="Inspect Architecture"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => {
                          onSelectModelForPrediction(m.model_id);
                          onNavigate('predictions');
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        title="Predict with this model"
                      >
                        Predict
                      </button>
                      <button
                        onClick={() => {
                          onSelectModelForExplanation(m.model_id);
                          onNavigate('explainability');
                        }}
                        className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                        title="Explain feature attribution"
                      >
                        SHAP
                      </button>
                      <button
                        onClick={() => handleDelete(m.model_id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Model"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Model Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedDetail.name}
                </h3>
                <p className="text-xs text-slate-400">ID: {selectedDetail.id}</p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono">
                <span className="text-slate-400 block mb-1">Metrics:</span>
                <pre className="text-[11px] text-blue-600 dark:text-blue-400 overflow-x-auto">
                  {JSON.stringify(selectedDetail.metrics, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Features Used ({selectedDetail.features.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedDetail.features.map((f: string) => (
                    <span
                      key={f}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Saved Joblib Artifact:
                </span>
                <span className="font-mono text-[11px] text-slate-500 break-all">
                  {selectedDetail.artifact_path}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
