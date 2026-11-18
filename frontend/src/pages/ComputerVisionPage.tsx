import React, { useState } from 'react';
import { Eye, UploadCloud, Copy, Check, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { VisionResponse } from '../types';
import { api } from '../services/api';

export const ComputerVisionPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisionResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setErrorMsg(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.analyzeVision(selectedFile);
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Vision analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!result?.extracted_text) return;
    navigator.clipboard.writeText(result.extracted_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Computer Vision & OCR Studio
            </h3>
            <p className="text-xs text-slate-400">
              Free and local object detection, ImageNet classification, and OCR text extraction.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload & Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload and Image Preview Canvas */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Image Canvas
          </h4>

          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center max-h-[360px]">
                <img
                  src={previewUrl}
                  alt="Uploaded target"
                  className="max-h-[360px] w-auto object-contain"
                />

                {/* Simulated Bounding Box Overlay if available */}
                {result?.detected_objects?.map((obj, i) => {
                  if (!obj.box) return null;
                  const [ymin, xmin, ymax, xmax] = obj.box;
                  return (
                    <div
                      key={i}
                      className="absolute border-2 border-cyan-400 bg-cyan-400/10 pointer-events-none rounded"
                      style={{
                        top: `${ymin * 100}%`,
                        left: `${xmin * 100}%`,
                        width: `${(xmax - xmin) * 100}%`,
                        height: `${(ymax - ymin) * 100}%`,
                      }}
                    >
                      <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 text-[10px] font-bold">
                        {obj.label} ({Math.round(obj.confidence * 100)}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                <label className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  <span>{loading ? 'Analyzing...' : 'Run Vision Inference'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-cyan-500 rounded-xl p-12 text-center group cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <ImageIcon className="w-10 h-10 text-cyan-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                Upload Target Image
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports PNG, JPG, JPEG, WEBP • Zero cloud dependencies
              </p>
            </div>
          )}
        </div>

        {/* Right: Results View (Classification + OCR) */}
        <div className="space-y-6">
          {/* Metadata & Classification */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Deep Learning Classification
            </h4>

            {result?.classification_labels && result.classification_labels.length > 0 ? (
              <div className="space-y-2.5">
                {result.classification_labels.map((c, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {c.category.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-slate-400">
                        {(c.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${c.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Upload an image and run inference to see Top-5 classification labels.
              </div>
            )}
          </div>

          {/* OCR Extracted Text Panel */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Optical Character Recognition (OCR)
              </h4>
              {result?.extracted_text && (
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-xs text-slate-700 dark:text-slate-300 min-h-[100px] max-h-[160px] overflow-y-auto whitespace-pre-wrap">
              {result ? result.extracted_text : 'Extracted optical text will appear here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
