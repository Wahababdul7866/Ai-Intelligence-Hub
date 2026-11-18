import React, { useEffect, useState } from 'react';
import { Layers, Database, Cpu, Trophy, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export const ModelRegistryPage: React.FC = () => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExps = async () => {
    setLoading(true);
    try {
      const data = await api.getExperiments();
      setExperiments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExps();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              MLOps Experiment Tracker & Model Registry
            </h3>
            <p className="text-xs text-slate-400">
              Integrated local MLflow tracking: logs runs, hyperparameters, metrics, and serialized artifacts.
            </p>
          </div>
        </div>
        <button
          onClick={loadExps}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Logged Experiments ({experiments.length})
        </h4>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading experiments...</div>
        ) : experiments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No experiments logged yet. Run AutoML on a dataset to record runs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                  <th className="py-2.5 px-3">Experiment Name</th>
                  <th className="py-2.5 px-3">Task Type</th>
                  <th className="py-2.5 px-3">Target Feature</th>
                  <th className="py-2.5 px-3">Algorithms Evaluated</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {experiments.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{exp.name}</span>
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-400">{exp.problem_type}</td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {exp.target_column || 'Unsupervised'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-blue-600 dark:text-blue-400">
                      {exp.models_evaluated_count} Models
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(exp.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
