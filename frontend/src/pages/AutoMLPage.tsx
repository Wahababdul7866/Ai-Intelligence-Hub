import React, { useState } from 'react';
import {
  Cpu,
  Trophy,
  Activity,
  HelpCircle,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { DatasetProfile, AutoMLResponse, ModelComparisonItem } from '../types';
import { api } from '../services/api';

interface AutoMLProps {
  currentProfile: DatasetProfile | null;
  onNavigate: (tab: string) => void;
  onSelectModelForPrediction: (modelId: string) => void;
  onSelectModelForExplanation: (modelId: string) => void;
}

export const AutoMLPage: React.FC<AutoMLProps> = ({
  currentProfile,
  onNavigate,
  onSelectModelForPrediction,
  onSelectModelForExplanation,
}) => {
  const [targetCol, setTargetCol] = useState<string>(
    currentProfile?.suggested_target_columns?.[0] || ''
  );
  const [problemType, setProblemType] = useState<string>('auto');
  const [testSize, setTestSize] = useState<number>(0.2);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainResult, setTrainResult] = useState<AutoMLResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync target col if profile changes
  React.useEffect(() => {
    if (currentProfile?.suggested_target_columns?.length) {
      setTargetCol(currentProfile.suggested_target_columns[0]);
    } else if (currentProfile?.columns?.length) {
      setTargetCol(currentProfile.columns[currentProfile.columns.length - 1].name);
    }
  }, [currentProfile]);

  const handleStartAutoML = async () => {
    if (!currentProfile) {
      setErrorMsg('Please select or upload a dataset first in Dataset Analysis tab.');
      return;
    }

    setIsTraining(true);
    setErrorMsg(null);

    try {
      const res = await api.trainAutoML({
        dataset_id: currentProfile.dataset_id,
        target_column: problemType !== 'clustering' && problemType !== 'anomaly' ? targetCol : undefined,
        problem_type: problemType,
        test_size: testSize,
      });
      setTrainResult(res);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'AutoML training failed');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Config Card */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AutoML Pipeline Configuration
              </h3>
              <p className="text-xs text-slate-400">
                Active Dataset: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentProfile?.name || 'None Selected'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleStartAutoML}
            disabled={isTraining || !currentProfile}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isTraining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isTraining ? 'Training Models...' : 'Train AutoML Pipeline'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Target Column */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Target Column (Predictor)
            </label>
            <select
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              disabled={problemType === 'clustering' || problemType === 'anomaly' || !currentProfile}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50"
            >
              {currentProfile?.columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.dtype})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Auto-selected based on dataset schema heuristics
            </span>
          </div>

          {/* Problem Type Override */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Learning Task Type
            </label>
            <select
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="auto">Auto-Detect (Recommended)</option>
              <option value="classification">Classification (Binary / Multi-class)</option>
              <option value="regression">Regression (Continuous Numerical)</option>
              <option value="clustering">Clustering (Unsupervised K-Means)</option>
              <option value="anomaly">Anomaly Detection (Isolation Forest)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Routes to optimized algorithmic suites
            </span>
          </div>

          {/* Train/Test Split */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Evaluation Test Split
              </label>
              <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                {Math.round(testSize * 100)}% Test / {Math.round((1 - testSize) * 100)}% Train
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={testSize}
              onChange={(e) => setTestSize(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Uses stratified k-fold cross validation for robust metric estimation
            </span>
          </div>
        </div>
      </div>

      {/* Training In-Progress Banner */}
      {isTraining && (
        <div className="p-8 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            AutoML Engine Running Locally...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Standardizing numerical distributions, one-hot encoding categorical variables, 
            training Random Forest, Gradient Boosting, XGBoost, and executing cross-validation.
          </p>
        </div>
      )}

      {/* Results Section */}
      {trainResult && (
        <div className="space-y-6">
          {/* Best Model Trophy Banner */}
          <div className="p-6 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-900/10 dark:bg-emerald-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                    Best Model Champion
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {trainResult.detected_problem_type.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {trainResult.best_model.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target: <span className="font-semibold">{trainResult.target_column || 'Unsupervised'}</span> • 
                  Features Evaluated: {trainResult.features_used.length} • 
                  Training Time: {trainResult.best_model.training_duration_sec}s
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onSelectModelForPrediction(trainResult.best_model.model_id);
                  onNavigate('predictions');
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-colors"
              >
                <Activity className="w-4 h-4" />
                Make Predictions
              </button>
              <button
                onClick={() => {
                  onSelectModelForExplanation(trainResult.best_model.model_id);
                  onNavigate('explainability');
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Explain with SHAP
              </button>
            </div>
          </div>

          {/* Model Comparison Leaderboard */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Candidate Model Leaderboard
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3">Problem Type</th>
                    <th className="py-2.5 px-3">Training Time</th>
                    {trainResult.detected_problem_type === 'classification' && (
                      <>
                        <th className="py-2.5 px-3">Accuracy</th>
                        <th className="py-2.5 px-3">Precision</th>
                        <th className="py-2.5 px-3">Recall</th>
                        <th className="py-2.5 px-3">F1 Score</th>
                        <th className="py-2.5 px-3">ROC-AUC</th>
                        <th className="py-2.5 px-3">CV Score</th>
                      </>
                    )}
                    {trainResult.detected_problem_type === 'regression' && (
                      <>
                        <th className="py-2.5 px-3">MAE</th>
                        <th className="py-2.5 px-3">RMSE</th>
                        <th className="py-2.5 px-3">R² Score</th>
                        <th className="py-2.5 px-3">CV Score</th>
                      </>
                    )}
                    {trainResult.detected_problem_type === 'clustering' && (
                      <>
                        <th className="py-2.5 px-3">Clusters</th>
                        <th className="py-2.5 px-3">Silhouette Score</th>
                        <th className="py-2.5 px-3">Inertia</th>
                      </>
                    )}
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {trainResult.models_evaluated.map((m) => (
                    <tr key={m.model_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {m.is_best && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        {m.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 capitalize font-sans">{m.problem_type}</td>
                      <td className="py-2.5 px-3 text-slate-400">{m.training_duration_sec}s</td>
                      
                      {trainResult.detected_problem_type === 'classification' && (
                        <>
                          <td className="py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400">
                            {((m.metrics.accuracy || 0) * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3">{((m.metrics.precision || 0) * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-3">{((m.metrics.recall || 0) * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {((m.metrics.f1_score || 0) * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3">
                            {m.metrics.roc_auc ? `${((m.metrics.roc_auc || 0) * 100).toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-2.5 px-3">{((m.metrics.cv_score || 0) * 100).toFixed(1)}%</td>
                        </>
                      )}

                      {trainResult.detected_problem_type === 'regression' && (
                        <>
                          <td className="py-2.5 px-3">{m.metrics.mae?.toLocaleString()}</td>
                          <td className="py-2.5 px-3">{m.metrics.rmse?.toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {m.metrics.r2}
                          </td>
                          <td className="py-2.5 px-3">{m.metrics.cv_score}</td>
                        </>
                      )}

                      {trainResult.detected_problem_type === 'clustering' && (
                        <>
                          <td className="py-2.5 px-3">{m.metrics.clusters}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {m.metrics.silhouette_score}
                          </td>
                          <td className="py-2.5 px-3">{m.metrics.inertia}</td>
                        </>
                      )}

                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={() => {
                            onSelectModelForPrediction(m.model_id);
                            onNavigate('predictions');
                          }}
                          className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[11px] hover:bg-blue-100 transition-colors"
                        >
                          Predict
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
