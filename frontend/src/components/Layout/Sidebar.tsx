import React from 'react';
import {
  LayoutDashboard,
  Database,
  Cpu,
  Trophy,
  Activity,
  HelpCircle,
  FileText,
  MessageSquare,
  Eye,
  Layers,
  Settings,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'datasets', label: 'Dataset Analysis', icon: Database },
    { id: 'automl', label: 'AutoML Engine', icon: Cpu },
    { id: 'comparison', label: 'Model Comparison', icon: Trophy },
    { id: 'predictions', label: 'Predictions', icon: Activity },
    { id: 'explainability', label: 'Explainable AI', icon: HelpCircle },
    { id: 'documents', label: 'Document RAG', icon: FileText },
    { id: 'analyst', label: 'AI Data Analyst', icon: MessageSquare },
    { id: 'vision', label: 'Computer Vision', icon: Eye },
    { id: 'registry', label: 'Model Registry', icon: Layers },
    { id: 'settings', label: 'Local Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 text-slate-300 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              AI Hub
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Local
              </span>
            </h1>
            <p className="text-xs text-slate-400">100% Free & Offline</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-190px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Security Badge */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Zero Paid APIs • Local Compute</span>
        </div>
      </div>
    </aside>
  );
};
