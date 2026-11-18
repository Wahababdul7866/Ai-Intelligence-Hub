import React, { useState } from 'react';
import { Settings, Bot, ShieldCheck, Download, RefreshCw, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { OllamaStatus } from '../types';
import { api } from '../services/api';

interface SettingsProps {
  ollamaStatus: OllamaStatus | null;
  refreshOllama: () => void;
}

export const SettingsPage: React.FC<SettingsProps> = ({ ollamaStatus, refreshOllama }) => {
  const [modelToPull, setModelToPull] = useState('');
  const [pulling, setPulling] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelToPull.trim()) return;

    setPulling(true);
    setStatusMsg(null);
    try {
      const res = await api.pullOllamaModel(modelToPull.trim());
      setStatusMsg(res.message);
      refreshOllama();
    } catch (e: any) {
      setStatusMsg('Failed to trigger model pull. Ensure Ollama is running.');
    } finally {
      setPulling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Local Engine & Privacy Settings
            </h3>
            <p className="text-xs text-slate-400">
              Manage local Ollama models, storage endpoints, and offline security policies.
            </p>
          </div>
        </div>

        <button
          onClick={refreshOllama}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ollama Local LLM Config */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Ollama Local Model Manager
            </h4>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Service Status:</span>
              <span
                className={`font-semibold flex items-center gap-1.5 ${
                  ollamaStatus?.available ? 'text-emerald-600' : 'text-amber-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    ollamaStatus?.available ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {ollamaStatus?.available ? 'Online & Ready' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Base URL:</span>
              <span className="font-mono">{ollamaStatus?.base_url || 'http://localhost:11434'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Installed Models:</span>
              <span className="font-semibold">
                {ollamaStatus?.models?.length ? ollamaStatus.models.join(', ') : 'None Detected'}
              </span>
            </div>
          </div>

          {/* Instructions Box if offline */}
          {!ollamaStatus?.available && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                How to enable local LLM inference:
              </div>
              <p className="text-[11px] leading-relaxed">
                1. Download Ollama from <a href="https://ollama.com" target="_blank" rel="noreferrer" className="underline font-bold">ollama.com</a>.
                <br />
                2. Run in terminal: <code className="px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900 font-mono">ollama run llama3.2</code>
                <br />
                3. The platform will automatically connect with zero API keys required.
              </p>
            </div>
          )}

          {/* Pull Model Form */}
          <form onSubmit={handlePull} className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Pull / Download New Open-Source Model:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={modelToPull}
                onChange={(e) => setModelToPull(e.target.value)}
                placeholder="e.g. llama3.2, mistral, phi3, gemma"
                className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
              <button
                type="submit"
                disabled={pulling || !modelToPull.trim()}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {pulling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Pull</span>
              </button>
            </div>
            {statusMsg && <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{statusMsg}</p>}
          </form>
        </div>

        {/* Offline Privacy Guarantee */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Zero Paid APIs & Local Privacy Architecture
            </h4>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                ✓ 100% Free & Open-Source Guarantee
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                This installation requires zero OpenAI keys, zero Gemini/Anthropic credits, and zero cloud accounts. 
                All computation executes locally on your CPU/GPU.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Vector Embeddings:</span>
                <span className="font-semibold">Sentence-Transformers (Local all-MiniLM-L6-v2)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Vector Storage:</span>
                <span className="font-semibold">Local FAISS Index</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">ML Engine:</span>
                <span className="font-semibold">Scikit-learn, XGBoost, SHAP</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Computer Vision:</span>
                <span className="font-semibold">Torchvision Pretrained Models & EasyOCR</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Document Parsing:</span>
                <span className="font-semibold">Local PyMuPDF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
