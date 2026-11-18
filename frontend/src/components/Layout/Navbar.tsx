import React from 'react';
import { Sparkles, Moon, Sun, Terminal } from 'lucide-react';
import { OllamaStatus } from '../../types';

interface NavbarProps {
  ollamaStatus: OllamaStatus | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeTab: string;
  onQuickLoadDemo: () => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Real-time overview of local AI/ML pipelines and metrics' },
  datasets: { title: 'Dataset Analysis', subtitle: 'Automated statistical profiling, outliers, and distribution checks' },
  automl: { title: 'AutoML Training', subtitle: 'Zero-code machine learning pipeline and model training' },
  comparison: { title: 'Model Comparison', subtitle: 'Evaluate candidate algorithms on balanced metrics' },
  predictions: { title: 'Live Predictions', subtitle: 'Run interactive real-time inferences on trained models' },
  explainability: { title: 'Explainable AI (SHAP)', subtitle: 'Decompose decisions with mathematical feature attribution' },
  documents: { title: 'Document Intelligence & RAG', subtitle: 'Local semantic vector search and grounded Q&A' },
  analyst: { title: 'AI Data Analyst', subtitle: 'Conversational natural language to safe Pandas execution' },
  vision: { title: 'Computer Vision', subtitle: 'Local image classification, object detection, and OCR' },
  registry: { title: 'Model Registry', subtitle: 'Track experiment versions, parameters, and model artifacts' },
  settings: { title: 'Local Engine Settings', subtitle: 'Ollama local LLM configuration and compute status' },
};

export const Navbar: React.FC<NavbarProps> = ({
  ollamaStatus,
  darkMode,
  setDarkMode,
  activeTab,
  onQuickLoadDemo,
}) => {
  const currentInfo = TAB_TITLES[activeTab] || { title: 'AI Hub', subtitle: 'Free Local AI Platform' };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
          {currentInfo.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {currentInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Ollama Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            ollamaStatus?.available
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
          }`}
          title={
            ollamaStatus?.available
              ? `Ollama Active. Models: ${ollamaStatus.models.join(', ') || 'None'}`
              : 'Ollama offline. Run `ollama run llama3.2` to enable local LLM'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              ollamaStatus?.available ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>
            {ollamaStatus?.available ? `Ollama: ${ollamaStatus.models[0] || 'Connected'}` : 'Ollama: Offline (Rule Mode)'}
          </span>
        </div>

        {/* Quick Demo Button */}
        <button
          onClick={onQuickLoadDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60 dark:hover:bg-blue-900/50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Demo Dataset</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark / Light mode"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
