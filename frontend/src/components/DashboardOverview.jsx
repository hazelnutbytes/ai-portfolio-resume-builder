import React from 'react';
import {
  Code,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Award,
  Sparkles,
  Sheet,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PlusCircle,
} from 'lucide-react';

export default function DashboardOverview({
  stats,
  integrations,
  onNavigate,
  onOpenAIAssistant,
  onNewJob,
}) {
  const statCards = [
    {
      label: 'Projects',
      count: stats?.total_projects || 0,
      icon: FolderGit2,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => onNavigate('portfolio', 'projects'),
    },
    {
      label: 'Technical Skills',
      count: stats?.total_technical_skills || 0,
      icon: Code,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      action: () => onNavigate('portfolio', 'technical_skills'),
    },
    {
      label: 'Experience & Internships',
      count: stats?.total_experience || 0,
      icon: Briefcase,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => onNavigate('portfolio', 'experience'),
    },
    {
      label: 'Certifications',
      count: stats?.total_certifications || 0,
      icon: Award,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      action: () => onNavigate('portfolio', 'certifications'),
    },
    {
      label: 'Education',
      count: stats?.total_education || 0,
      icon: GraduationCap,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      action: () => onNavigate('portfolio', 'education'),
    },
    {
      label: 'Achievements',
      count: stats?.total_achievements || 0,
      icon: Award,
      color: 'bg-rose-500',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      action: () => onNavigate('portfolio', 'achievements'),
    },
  ];

  const geminiActive = integrations?.gemini?.configured;
  const sheetsActive = integrations?.google_sheets?.configured;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome & Profile Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-400/30">
                Fictional Demonstration Portfolio
              </span>
              <span className="text-slate-400 text-xs">College Evaluation Edition</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {stats?.candidate_name || 'Student Candidate'}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-light">
              {stats?.headline || 'B.Tech Computer Science Senior | Aspiring AI & Full-Stack Engineer'}
            </p>
            {stats?.active_summary && (
              <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 italic pt-1 border-t border-slate-700/60 mt-2">
                "{stats.active_summary}"
              </p>
            )}
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('jobs')}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-lg shadow-blue-600/30"
            >
              <Briefcase className="w-4 h-4" />
              <span>Analyze Job Description</span>
            </button>
            <button
              onClick={() => onNavigate('resume-builder')}
              className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm border border-slate-700 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Resume Builder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Portfolio Summary Statistics</h2>
          <button
            onClick={() => onNavigate('portfolio')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                onClick={card.action}
                className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg ${card.bgColor} ${card.textColor} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold text-slate-800 group-hover:text-brand-600 transition">
                    {card.count}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500">{card.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Feature Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Workflow Guide */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <span>Resume Tailoring Workflow</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">How it works</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">1</div>
              <h4 className="font-semibold text-slate-900 text-sm">Paste Job Description</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gemini AI or the rule-based analyzer extracts skills, qualifications, and responsibilities.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">2</div>
              <h4 className="font-semibold text-slate-900 text-sm">Audit & Match Evidence</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Matches requirements directly to verified SQLite records. Never fabricates missing skills.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">3</div>
              <h4 className="font-semibold text-slate-900 text-sm">Select & Download PDF</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Customize section order, choose an ATS template, preview live, and export ATS-friendly PDF.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-2 rounded-lg transition flex items-center space-x-1"
            >
              <span>Try Pre-loaded Junior AI/ML Engineer Job</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('resume-builder')}
              className="text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg transition flex items-center space-x-1"
            >
              <span>View Saved Tailored Resumes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Integration Status Panel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Integration Status</h3>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Settings
            </button>
          </div>

          {/* Gemini AI Status */}
          <div className="p-3.5 rounded-xl border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-800">Google Gemini API</span>
              </div>
              {geminiActive ? (
                <span className="flex items-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                </span>
              ) : (
                <span className="flex items-center text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Rule-based Mode
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              {geminiActive
                ? `Connected (${integrations?.gemini?.model}). Live parsing & matching enabled.`
                : 'GEMINI_API_KEY not configured. Deterministic keyword matching & ATS parser are active.'}
            </p>
          </div>

          {/* Google Sheets Status */}
          <div className="p-3.5 rounded-xl border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sheet className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Google Sheets Sync</span>
              </div>
              {sheetsActive ? (
                <span className="flex items-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                </span>
              ) : (
                <span className="flex items-center text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Unconfigured
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              {sheetsActive
                ? 'Ready for manual sync across category tabs.'
                : 'Configure Service Account credentials and Spreadsheet ID in .env to sync.'}
            </p>
          </div>

          {/* Quick AI Parse CTA */}
          <div className="pt-2">
            <button
              onClick={onOpenAIAssistant}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 transition flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Paste Unstructured Notes to Auto-Extract</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
