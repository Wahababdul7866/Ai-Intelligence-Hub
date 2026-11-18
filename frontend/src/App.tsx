import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Navbar } from './components/Layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { DatasetAnalysisPage } from './pages/DatasetAnalysisPage';
import { AutoMLPage } from './pages/AutoMLPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { DocumentIntelligencePage } from './pages/DocumentIntelligencePage';
import { AIDataAnalystPage } from './pages/AIDataAnalystPage';
import { ComputerVisionPage } from './pages/ComputerVisionPage';
import { ModelRegistryPage } from './pages/ModelRegistryPage';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardStats, DatasetProfile, DatasetItem, OllamaStatus } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currentProfile, setCurrentProfile] = useState<DatasetProfile | null>(null);
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const loadData = async () => {
    try {
      const [dash, dsList, ollama] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getDatasets().catch(() => []),
        api.getOllamaStatus().catch(() => null),
      ]);
      if (dash) setStats(dash);
      if (dsList) setDatasets(dsList);
      if (ollama) setOllamaStatus(ollama);

      // If datasets exist and no current profile, load the first one
      if (dsList.length > 0 && !currentProfile) {
        api.getDatasetProfile(dsList[0].id).then(setCurrentProfile).catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickLoadDemo = async () => {
    try {
      const profile = await api.loadSampleDataset('churn');
      setCurrentProfile(profile);
      await loadData();
      setActiveTab('datasets');
    } catch (e) {
      console.error('Failed to load demo dataset', e);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          ollamaStatus={ollamaStatus}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          activeTab={activeTab}
          onQuickLoadDemo={handleQuickLoadDemo}
        />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              onNavigate={setActiveTab}
              onQuickLoadDemo={handleQuickLoadDemo}
            />
          )}

          {activeTab === 'datasets' && (
            <DatasetAnalysisPage
              currentProfile={currentProfile}
              setCurrentProfile={setCurrentProfile}
              datasets={datasets}
              refreshDatasets={loadData}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'automl' && (
            <AutoMLPage
              currentProfile={currentProfile}
              onNavigate={setActiveTab}
              onSelectModelForPrediction={setSelectedModelId}
              onSelectModelForExplanation={setSelectedModelId}
            />
          )}

          {activeTab === 'comparison' && (
            <ModelComparisonPage
              onNavigate={setActiveTab}
              onSelectModelForPrediction={setSelectedModelId}
              onSelectModelForExplanation={setSelectedModelId}
            />
          )}

          {activeTab === 'predictions' && (
            <PredictionsPage
              selectedModelId={selectedModelId}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'explainability' && (
            <ExplainabilityPage
              selectedModelId={selectedModelId}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentIntelligencePage />
          )}

          {activeTab === 'analyst' && (
            <AIDataAnalystPage
              currentProfile={currentProfile}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'vision' && (
            <ComputerVisionPage />
          )}

          {activeTab === 'registry' && (
            <ModelRegistryPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              ollamaStatus={ollamaStatus}
              refreshOllama={loadData}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
