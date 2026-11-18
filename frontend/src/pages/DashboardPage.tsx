import React from 'react';
import {
  Database,
  Cpu,
  Activity,
  FileText,
  ArrowRight,
  ShieldAlert,
  Server,
  Sparkles,
  Layers,
  BarChart3,
  Bot
} from 'lucide-react';
import { DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats | null;
  onNavigate: (tab: string) => void;
  onQuickLoadDemo: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ stats, onNavigate, onQuickLoadDemo }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-800/40 p-8 text-white shadow-xl shadow-blue-950/30">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            100% Free & Open-Source AI/ML Suite
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            AI Intelligence Hub
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Run automated machine learning, statistical dataset profiling, SHAP explainability, 
            local document RAG, computer vision, and AI data analytics directly on your workstation. 
            Zero paid subscriptions, zero API tokens, 100% offline data privacy.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('datasets')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Analyze a Dataset
            </button>
            <button
              onClick={() => onNavigate('automl')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              Start AutoML
            </button>
            <button
              onClick={onQuickLoadDemo}
              className="px-4 py-2 rounded-lg bg-emerald-700/60 hover:bg-emerald-600 text-white text-xs font-semibold border border-emerald-500/40 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Load Demo Benchmark Data
            </button>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.datasets_count ?? 0}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Datasets Ingested
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.models_trained_count ?? 0}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              ML Models Trained
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.predictions_made_count ?? 0}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Inferences Executed
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.documents_uploaded_count ?? 0}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Documents Vectorized
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Explore Core AI Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => onNavigate('analyst')}
            className="group cursor-pointer p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-sm transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              AI Data Analyst
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Ask natural language questions like "What is the average price?" and get verified mathematical results via safe Pandas execution.
            </p>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              Ask Dataset Questions <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div
            onClick={() => onNavigate('explainability')}
            className="group cursor-pointer p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-sm transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Explainable AI (SHAP)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Inspect global feature importance rankings and single-prediction waterfalls to understand why models make specific decisions.
            </p>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              Inspect Model Attribution <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div
            onClick={() => onNavigate('documents')}
            className="group cursor-pointer p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/50 dark:hover:border-purple-500/50 shadow-sm transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Document Intelligence & RAG
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Ingest PDF and TXT research documents into FAISS vector storage and query them locally with strict citations and zero hallucination.
            </p>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              Open Document Search <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* System Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-500" />
            Local Infrastructure Status
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">FastAPI Gateway</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active (Port 8000)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Database Engine</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Operational</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Vector Storage</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">FAISS Dense L2</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Ollama Local LLM</span>
              <span className={`font-semibold ${stats?.system_status?.ollama_available ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                {stats?.system_status?.ollama_available ? 'Connected' : 'Offline (Rule Mode)'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Offline Isolation</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">100% Offline Ready</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            Recent Activity Log
          </h3>
          {stats?.recent_activity && stats.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_activity.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    {act.type === 'dataset' ? <Database className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{act.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{act.details}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No recent activity yet. Load a demo dataset or upload your own files to begin!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
