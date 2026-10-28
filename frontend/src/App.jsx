import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardOverview from './components/DashboardOverview';
import PortfolioManager from './components/PortfolioManager';
import JobAnalyzer from './components/JobAnalyzer';
import ResumeBuilder from './components/ResumeBuilder';
import IntegrationSettings from './components/IntegrationSettings';
import AIAssistantModal from './components/AIAssistantModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [portfolio, setPortfolio] = useState(null);
  const [stats, setStats] = useState(null);
  const [integrations, setIntegrations] = useState(null);
  const [savedSessions, setSavedSessions] = useState([]);
  const [activeResumeSession, setActiveResumeSession] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [backendError, setBackendError] = useState(null);

  // AI Assistant modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalTab, setAiModalTab] = useState('organize');
  const [aiRoleHint, setAiRoleHint] = useState('');

  // Initial data loading
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      setBackendError(null);

      const [portfolioRes, statsRes, intRes, sessionsRes] = await Promise.all([
        api.getPortfolio(),
        api.getStats(),
        api.getIntegrationsStatus(),
        api.listResumes(),
      ]);

      setPortfolio(portfolioRes);
      setStats(statsRes);
      setIntegrations(intRes);
      setSavedSessions(sessionsRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setBackendError(err.message || 'Unable to connect to backend server on port 5001.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPortfolio = async () => {
    try {
      const [p, s, r] = await Promise.all([
        api.getPortfolio(),
        api.getStats(),
        api.listResumes(),
      ]);
      setPortfolio(p);
      setStats(s);
      setSavedSessions(r);
    } catch (err) {
      console.error('Failed to refresh portfolio', err);
    }
  };

  const handleRefreshIntegrations = async () => {
    try {
      const res = await api.getIntegrationsStatus();
      setIntegrations(res);
    } catch (err) {
      console.error('Failed to refresh integrations', err);
    }
  };

  const handleResetSample = async () => {
    if (!window.confirm('Reset SQLite database to the default fictional sample demonstration data? Any custom items will be restored to default demo records.')) {
      return;
    }
    try {
      setIsResetting(true);
      await api.resetSamplePortfolio();
      await loadAllData();
      alert('Portfolio successfully re-seeded with fictional college demonstration records.');
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Navigating to Resume Builder from Job Analyzer with recommended pre-selections
  const handleNavigateToResumeBuilderWithJob = ({ jobId, targetRole, targetCompany, matchResults }) => {
    const recommendedSummary = matchResults?.recommended_summary_text || '';
    const recommendedSelections = matchResults?.recommended_selections || {};

    const newSession = {
      session_name: `Tailored: ${targetRole}${targetCompany ? ` (${targetCompany})` : ''}`,
      target_role: targetRole,
      target_company: targetCompany,
      template_name: targetRole.toLowerCase().includes('ai') ? 'classic_ats' : 'modern_minimal',
      custom_summary: recommendedSummary,
      selected_records: recommendedSelections,
      job_description_id: jobId,
    };

    setActiveResumeSession(newSession);
    setActiveTab('resume-builder');
  };

  // Opening AI modal
  const handleOpenAIAssistant = (tab = 'organize', roleHint = '') => {
    setAiModalTab(tab);
    setAiRoleHint(roleHint);
    setIsAiModalOpen(true);
  };

  // Applying AI suggested summary to active resume
  const handleApplySummarySuggestion = (suggestedText) => {
    setActiveResumeSession((prev) => ({
      ...(prev || {}),
      custom_summary: suggestedText,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAIAssistant={() => handleOpenAIAssistant('organize')}
        onResetSample={handleResetSample}
        isResetting={isResetting}
        integrations={integrations}
      />

      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Connecting to Python Flask & SQLite Database...</p>
          </div>
        ) : backendError ? (
          <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-red-200 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-900">Backend Connection Error</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{backendError}</p>
            <div className="p-3 bg-slate-100 rounded-xl text-left text-xs font-mono text-slate-700">
              Run backend: <strong>python backend/app.py</strong>
            </div>
            <button
              onClick={loadAllData}
              className="px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardOverview
                stats={stats}
                integrations={integrations}
                onNavigate={(tab, category) => setActiveTab(tab)}
                onOpenAIAssistant={() => handleOpenAIAssistant('organize')}
                onNewJob={() => setActiveTab('jobs')}
              />
            )}

            {activeTab === 'portfolio' && (
              <PortfolioManager
                portfolio={portfolio}
                onRefresh={handleRefreshPortfolio}
                onCreateItem={api.createCategoryItem}
                onUpdateItem={api.updateCategoryItem}
                onDeleteItem={api.deleteCategoryItem}
              />
            )}

            {activeTab === 'jobs' && (
              <JobAnalyzer
                onAnalyzeJob={api.analyzeJob}
                onNavigateToResumeBuilder={handleNavigateToResumeBuilderWithJob}
                integrations={integrations}
              />
            )}

            {activeTab === 'resume-builder' && (
              <ResumeBuilder
                portfolio={portfolio}
                savedSessions={savedSessions}
                activeSessionInitial={activeResumeSession}
                onSaveSession={async (sessionData) => {
                  const saved = await api.saveResume(sessionData);
                  await handleRefreshPortfolio();
                  return saved;
                }}
                onGeneratePdf={api.generatePdf}
                onOpenAISuggestions={(role) => handleOpenAIAssistant('suggestions', role)}
              />
            )}

            {activeTab === 'settings' && (
              <IntegrationSettings
                integrations={integrations}
                onRefreshIntegrations={handleRefreshIntegrations}
              />
            )}
          </>
        )}
      </main>

      {/* AI Assistant Modal (Feature 3A & 3D) */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialTab={aiModalTab}
        targetRoleHint={aiRoleHint}
        onOrganizeText={api.organizeUnstructured}
        onCommitApproved={async (items) => {
          const res = await api.commitApprovedItems(items);
          await handleRefreshPortfolio();
          return res;
        }}
        onGetSuggestions={api.getAISuggestions}
        onApplySummarySuggestion={handleApplySummarySuggestion}
        integrations={integrations}
      />

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">PortfolioForge</span>
            <span>•</span>
            <span>AI-Powered Portfolio Manager & Dynamic Resume Builder</span>
          </div>
          <div className="text-[11px] text-slate-400">
            College Project Demonstration • Local SQLite & Flask Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
