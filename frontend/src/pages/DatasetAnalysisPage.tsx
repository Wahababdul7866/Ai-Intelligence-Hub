import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Search,
  BarChart2,
  Table as TableIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { DatasetProfile, DatasetItem } from '../types';
import { api } from '../services/api';

interface DatasetAnalysisProps {
  currentProfile: DatasetProfile | null;
  setCurrentProfile: (p: DatasetProfile | null) => void;
  datasets: DatasetItem[];
  refreshDatasets: () => void;
  onNavigate: (tab: string) => void;
}

export const DatasetAnalysisPage: React.FC<DatasetAnalysisProps> = ({
  currentProfile,
  setCurrentProfile,
  datasets,
  refreshDatasets,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'preview' | 'correlation' | 'distributions'>('stats');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const profile = await api.uploadDataset(file);
      setCurrentProfile(profile);
      refreshDatasets();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectDataset = async (id: string) => {
    try {
      const profile = await api.getDatasetProfile(id);
      setCurrentProfile(profile);
    } catch (err: any) {
      setErrorMsg('Failed to load dataset details');
    }
  };

  const handleLoadSample = async (key: string) => {
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const profile = await api.loadSampleDataset(key);
      setCurrentProfile(profile);
      refreshDatasets();
    } catch (err: any) {
      setErrorMsg('Failed to load sample dataset');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredColumns = currentProfile?.columns.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action & Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Dropzone */}
        <div className="lg:col-span-2 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 bg-white dark:bg-slate-900 transition-all flex flex-col items-center justify-center text-center relative group">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            {isUploading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">
            {isUploading ? 'Analyzing Dataset...' : 'Drop your CSV or Excel dataset here'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports .csv, .xlsx, .xls • Automated profiling, outliers, and data-types
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Instant Benchmark Datasets
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              No dataset on hand? Load ready-to-use benchmark datasets:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLoadSample('churn')}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                📊 Customer Churn
              </button>
              <button
                onClick={() => handleLoadSample('housing')}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                🏠 Housing Prices
              </button>
              <button
                onClick={() => handleLoadSample('clustering')}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                👥 Segmentation
              </button>
              <button
                onClick={() => handleLoadSample('fraud')}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                🚨 Transaction Fraud
              </button>
            </div>
          </div>

          {datasets.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Switch Analyzed Dataset:
              </label>
              <select
                value={currentProfile?.dataset_id || ''}
                onChange={(e) => handleSelectDataset(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.row_count.toLocaleString()} rows)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dataset Profile Dashboard */}
      {currentProfile ? (
        <div className="space-y-6">
          {/* Header Summary Cards */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentProfile.name}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dataset ID: <span className="font-mono">{currentProfile.dataset_id}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Rows</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentProfile.row_count.toLocaleString()}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Columns</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentProfile.column_count}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Duplicates</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentProfile.duplicate_rows}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Missing Values</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentProfile.total_missing_values}
                </span>
              </div>

              <button
                onClick={() => onNavigate('automl')}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-2 transition-colors ml-auto"
              >
                <Cpu className="w-4 h-4" />
                Train AutoML on Dataset
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              Column Statistics & Profiling
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Raw Data Preview (Top 10)
            </button>
            <button
              onClick={() => setActiveTab('correlation')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'correlation'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Correlation Matrix
            </button>
            <button
              onClick={() => setActiveTab('distributions')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'distributions'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Categorical Distributions
            </button>
          </div>

          {/* TAB 1: Column Statistics */}
          {activeTab === 'stats' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search column..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <span className="text-xs text-slate-400">
                  Showing {filteredColumns?.length} of {currentProfile.columns.length} columns
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Column Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Missing</th>
                      <th className="py-2.5 px-3">Unique</th>
                      <th className="py-2.5 px-3">Min / Max</th>
                      <th className="py-2.5 px-3">Mean ± Std</th>
                      <th className="py-2.5 px-3">Median</th>
                      <th className="py-2.5 px-3">Outliers (IQR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredColumns?.map((col) => (
                      <tr key={col.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {col.name}
                          {currentProfile.suggested_target_columns.includes(col.name) && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                              Target
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{col.dtype}</td>
                        <td className="py-2.5 px-3">
                          {col.null_count > 0 ? (
                            <span className="text-amber-600 font-semibold">{col.null_count} ({col.null_percentage}%)</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">{col.unique_count}</td>
                        <td className="py-2.5 px-3">
                          {col.is_numeric ? `${col.min?.toLocaleString()} / ${col.max?.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          {col.is_numeric ? `${col.mean?.toLocaleString()} ± ${col.std?.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-2.5 px-3">{col.is_numeric ? col.median?.toLocaleString() : '—'}</td>
                        <td className="py-2.5 px-3">
                          {col.outliers_count && col.outliers_count > 0 ? (
                            <span className="text-rose-500 font-bold">{col.outliers_count}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Raw Data Preview */}
          {activeTab === 'preview' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    {currentProfile.columns.map((col) => (
                      <th key={col.name} className="py-2.5 px-3 whitespace-nowrap">{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  {currentProfile.preview_data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {currentProfile.columns.map((col) => (
                        <td key={col.name} className="py-2 px-3 whitespace-nowrap">
                          {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Correlation Matrix */}
          {activeTab === 'correlation' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                Pearson Correlation Coefficients
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Identifies linear relationships between continuous numeric parameters (-1.0 to +1.0).
              </p>
              {currentProfile.correlation_matrix ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2 px-3 text-left font-sans text-slate-400">Feature</th>
                        {Object.keys(currentProfile.correlation_matrix).map((k) => (
                          <th key={k} className="py-2 px-3 text-slate-700 dark:text-slate-300 font-semibold">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(currentProfile.correlation_matrix).map(([rowKey, rowVal]) => (
                        <tr key={rowKey} className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="py-2 px-3 text-left font-sans font-semibold text-slate-800 dark:text-slate-200">{rowKey}</td>
                          {Object.entries(rowVal).map(([colKey, val]) => {
                            const absVal = Math.abs(val);
                            const bgStyle =
                              val > 0.6
                                ? 'bg-blue-500/30 text-blue-600 dark:text-blue-300 font-bold'
                                : val < -0.4
                                ? 'bg-rose-500/30 text-rose-600 dark:text-rose-300 font-bold'
                                : 'text-slate-500';
                            return (
                              <td key={colKey} className={`py-2 px-3 ${bgStyle}`}>
                                {val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Not enough numeric features in this dataset to generate correlation coefficients.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Categorical Distributions */}
          {activeTab === 'distributions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentProfile.columns
                .filter((c) => c.is_categorical && c.top_categories && Object.keys(c.top_categories).length > 0)
                .slice(0, 4)
                .map((col) => {
                  const chartData = Object.entries(col.top_categories || {}).map(([cat, count]) => ({
                    category: cat,
                    count: count,
                  }));
                  return (
                    <div key={col.name} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
                        Distribution: {col.name}
                      </h4>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Dataset Selected</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload a CSV/Excel file or click "Load Demo Dataset" above to explore instant machine learning profiling.
          </p>
        </div>
      )}
    </div>
  );
};
