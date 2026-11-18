import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  BarChart2,
  Table as TableIcon,
  RefreshCw,
  Code2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DatasetProfile, AnalystResponse } from '../types';
import { api } from '../services/api';

interface AnalystProps {
  currentProfile: DatasetProfile | null;
  onNavigate: (tab: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const AIDataAnalystPage: React.FC<AnalystProps> = ({ currentProfile, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analystResponse, setAnalystResponse] = useState<AnalystResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleQuestions = [
    'What is the average monthly charges by contract?',
    'What is the average price by location tier?',
    'Which category has the highest spending score?',
    'Show distribution of payment methods',
    'What is the total sum of charges?'
  ];

  const handleAsk = async (questionToAsk?: string) => {
    const q = questionToAsk || query;
    if (!q.trim()) return;

    if (!currentProfile) {
      setErrorMsg('Please select or upload a dataset first.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.queryAnalyst({
        dataset_id: currentProfile.dataset_id,
        query: q,
      });
      setAnalystResponse(res);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Query analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Dataset State */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              AI Data Analyst (Safe Pandas Execution)
            </h3>
            <p className="text-xs text-slate-400">
              Ask natural language questions. The engine executes restricted AST Pandas operations with zero hallucinations.
            </p>
          </div>
        </div>

        {currentProfile ? (
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Analyzing Dataset:</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {currentProfile.name} ({currentProfile.row_count.toLocaleString()} rows)
            </span>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('datasets')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
          >
            Select Dataset
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Query Bar */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about this dataset (e.g., 'What is the average monthly charges?')..."
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim() || !currentProfile}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{loading ? 'Computing...' : 'Analyze'}</span>
          </button>
        </form>

        {/* Example Questions */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold text-slate-400">Suggested queries:</span>
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(q);
                handleAsk(q);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {analystResponse && (
        <div className="space-y-6 animate-fadeIn">
          {/* Operation & Computed Result Pill */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Interpreted Intent
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {analystResponse.interpreted_intent}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1 font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-blue-500" />
                Verified Pandas AST Call
              </span>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">
                {analystResponse.executed_operation}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Exact Computed Result
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {typeof analystResponse.computed_result === 'number'
                  ? analystResponse.computed_result.toLocaleString()
                  : typeof analystResponse.computed_result === 'object'
                  ? 'Tabular Summary Output'
                  : String(analystResponse.computed_result)}
              </p>
            </div>
          </div>

          {/* Explanation Narrative */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Executive Analytical Summary
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              {analystResponse.explanation}
            </p>
          </div>

          {/* Visual Chart if available */}
          {analystResponse.chart_config && analystResponse.chart_data && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-500" />
                {analystResponse.chart_config.title}
              </h4>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {analystResponse.chart_config.chart_type === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={analystResponse.chart_data}
                        dataKey={analystResponse.chart_config.y_keys[0]}
                        nameKey={analystResponse.chart_config.x_key}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {analystResponse.chart_data.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    </PieChart>
                  ) : (
                    <BarChart
                      data={analystResponse.chart_data}
                      margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                    >
                      <XAxis dataKey={analystResponse.chart_config.x_key} tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Bar
                        dataKey={analystResponse.chart_config.y_keys[0]}
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
