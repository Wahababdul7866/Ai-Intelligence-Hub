import React, { useEffect, useState } from 'react';
import { HelpCircle, BarChart3, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ModelComparisonItem, SHAPExplanation } from '../types';
import { api } from '../services/api';

interface ExplainabilityProps {
  selectedModelId: string | null;
  onNavigate: (tab: string) => void;
}

export const ExplainabilityPage: React.FC<ExplainabilityProps> = ({ selectedModelId, onNavigate }) => {
  const [models, setModels] = useState<ModelComparisonItem[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>(selectedModelId || '');
  const [explanation, setExplanation] = useState<SHAPExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
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
    load();
  }, []);

  useEffect(() => {
    if (selectedModelId) {
      setActiveModelId(selectedModelId);
    }
  }, [selectedModelId]);

  useEffect(() => {
    if (!activeModelId) return;
    const fetchExplanation = async () => {
      setLoading(true);
      try {
        // Pass sample inputs if available
        const res = await api.explainModel(activeModelId, {
          monthly_charges: 95.0,
          tenure_months: 4,
          contract: 'Month-to-month',
          square_feet: 2200,
          location_tier: 'Downtown'
        });
        setExplanation(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchExplanation();
  }, [activeModelId]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Explainable AI & Feature Attribution (SHAP)
            </h3>
            <p className="text-xs text-slate-400">
              Unpack black-box decision logic with global feature importance and sample attribution waterfalls.
            </p>
          </div>
        </div>

        {models.length > 0 && (
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
        )}
      </div>

      {/* Scientific Disclaimer Guardrail */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div>
          <span className="font-bold block mb-0.5">Statistical Guardrail Disclaimer:</span>
          {explanation?.disclaimer ||
            'SHAP explanations describe internal model behavior and mathematical feature attribution. They do not imply direct real-world causal mechanisms.'}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Computing Shapley feature values...</span>
        </div>
      ) : explanation ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Global Feature Importance */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Global Feature Importance (%)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Relative influence of each feature across all trained dataset records.
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={explanation.global_feature_importance.slice(0, 8)}
                  margin={{ top: 10, right: 30, left: 50, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Importance']}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  />
                  <Bar dataKey="importance_percent" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold block mb-1 text-slate-900 dark:text-white">Summary Rationale:</span>
              {explanation.summary_text}
            </div>
          </div>

          {/* Individual Sample Waterfall */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                Individual Prediction Attribution
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Features pushing the prediction higher (positive) vs. lower (negative).
              </p>
            </div>

            {explanation.sample_prediction_waterfall ? (
              <div className="space-y-3">
                {explanation.sample_prediction_waterfall.map((item, idx) => {
                  const isPos = item.direction === 'positive';
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-md ${
                            isPos
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPos ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.feature}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Input Value: {item.base_value !== null ? String(item.base_value) : 'Default'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isPos
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPos ? '+' : ''}{item.impact_score}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {isPos ? 'Increases Score' : 'Decreases Score'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Run an interactive prediction first to view individual sample waterfall values.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Models Available</h4>
          <p className="text-xs text-slate-400 mt-1">
            Train a model in the AutoML tab to inspect mathematical SHAP attributions.
          </p>
        </div>
      )}
    </div>
  );
};
