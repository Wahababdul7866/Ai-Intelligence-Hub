import React, { useEffect, useState } from 'react';
import {
  FileText,
  UploadCloud,
  Search,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Trash2,
  Bot,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { DocumentItem, RAGResponse } from '../types';
import { api } from '../services/api';

export const DocumentIntelligencePage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [ragResult, setRagResult] = useState<RAGResponse | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await api.uploadDocument(file);
      await fetchDocs();
    } catch (e) {
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSample = async () => {
    setUploading(true);
    try {
      await api.loadSampleDocument();
      await fetchDocs();
    } catch (e) {
      alert('Failed to load sample document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.deleteDocument(id);
      setDocuments(documents.filter((d) => d.id !== id));
      if (ragResult) setRagResult(null);
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await api.queryRAG({ query });
      setRagResult(res);
    } catch (e) {
      alert('RAG Query failed');
    } finally {
      setIsSearching(false);
    }
  };

  const quickPrompts = [
    'What is the RAG methodology and embedding architecture?',
    'What were the key conclusions and findings?',
    'How is data sovereignty and privacy protected?',
    'What features are used for the AutoML system?'
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Ingestion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Box */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Document Knowledge Base
                </h3>
                <p className="text-xs text-slate-400">
                  Ingest PDFs, markdown, or research papers into local FAISS vector storage.
                </p>
              </div>
            </div>

            <button
              onClick={handleLoadSample}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold hover:bg-purple-100 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Sample Guide
            </button>
          </div>

          <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-purple-500 rounded-xl p-6 text-center cursor-pointer group transition-colors">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-8 h-8 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              {uploading ? 'Extracting, Chunking & Vectorizing...' : 'Upload PDF or TXT Document'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              PyMuPDF extraction • all-MiniLM-L6-v2 384d dense embeddings • FAISS index
            </p>
          </div>
        </div>

        {/* Ingested Documents List */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Indexed Documents ({documents.length})
            </h4>
            {documents.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {doc.num_chunks} Chunks • {Math.round(doc.file_size_bytes / 1024)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Semantic Question Bar */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask any question about your uploaded documents..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim() || documents.length === 0}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            <span>{isSearching ? 'Retrieving...' : 'Ask RAG Assistant'}</span>
          </button>
        </form>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold text-slate-400">Try asking:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(p)}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>

      {/* Answer & Citations Display */}
      {ragResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Answer Card */}
          <div className="lg:col-span-2 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Grounded Response
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Engine: {ragResult.model_used} • {ragResult.inference_time_sec}s
              </span>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {ragResult.answer}
            </div>
          </div>

          {/* Sources & Citations Panel */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verified Document Excerpts ({ragResult.sources.length})
              </h4>
            </div>

            {ragResult.sources.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {ragResult.sources.map((src, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {src.document_title}
                      </span>
                      <span className="font-mono text-slate-400">
                        Page {src.page_number} • Similarity {Math.round(src.score * 100)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 italic">
                      "{src.text_content}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No matching chunks found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
