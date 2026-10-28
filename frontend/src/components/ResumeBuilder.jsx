import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Settings,
  Eye,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderGit2,
  Code,
  Briefcase,
  GraduationCap,
  Award,
} from 'lucide-react';

const SECTION_LABELS = {
  summary: 'Professional Summary',
  education: 'Education',
  technical_skills: 'Technical Skills',
  experience: 'Experience & Internships',
  projects: 'Projects',
  certifications: 'Certifications & Courses',
  achievements: 'Honors & Achievements',
  publications: 'Publications',
  languages: 'Languages',
  soft_skills: 'Professional Competencies',
  extracurricular: 'Leadership & Extracurricular',
};

const DEFAULT_ORDER = [
  'summary',
  'education',
  'technical_skills',
  'experience',
  'projects',
  'certifications',
  'achievements',
  'publications',
  'extracurricular',
  'languages',
  'soft_skills',
];

export default function ResumeBuilder({
  portfolio,
  savedSessions,
  activeSessionInitial,
  onSaveSession,
  onGeneratePdf,
  onOpenAISuggestions,
}) {
  const [sessionName, setSessionName] = useState('');
  const [targetRole, setTargetRole] = useState('Junior AI/ML Engineer');
  const [targetCompany, setTargetCompany] = useState('');
  const [templateName, setTemplateName] = useState('classic_ats');
  const [customSummary, setCustomSummary] = useState('');
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_ORDER);
  const [optionalSections, setOptionalSections] = useState({
    summary: true,
    education: true,
    technical_skills: true,
    experience: true,
    projects: true,
    certifications: true,
    achievements: true,
    publications: true,
    languages: true,
    soft_skills: false,
    extracurricular: false,
  });
  const [selectedRecords, setSelectedRecords] = useState({});
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [lastPdfUrl, setLastPdfUrl] = useState(null);

  const categories = portfolio?.categories || {};
  const personal = categories?.personal_info?.[0] || {};

  // Initialize or load session
  useEffect(() => {
    if (activeSessionInitial) {
      loadSessionData(activeSessionInitial);
    } else if (savedSessions && savedSessions.length > 0) {
      loadSessionData(savedSessions[0]);
    } else {
      initializeDefaultSelections();
    }
  }, [activeSessionInitial, savedSessions, portfolio]);

  const initializeDefaultSelections = () => {
    setSessionName('Custom Tailored Resume');
    setTargetRole('Software Engineer');
    setTemplateName('classic_ats');

    const defaultSum = categories?.professional_summaries?.[0]?.content || '';
    setCustomSummary(defaultSum);

    // Select all by default
    const map = {};
    for (const [key, items] of Object.entries(categories)) {
      if (key !== 'personal_info' && key !== 'professional_summaries') {
        map[key] = items.map((i) => i.id);
      }
    }
    setSelectedRecords(map);
  };

  const loadSessionData = (session) => {
    setCurrentSessionId(session.id || null);
    setSessionName(session.session_name || 'Tailored Resume');
    setTargetRole(session.target_role || 'Software Engineer');
    setTargetCompany(session.target_company || '');
    setTemplateName(session.template_name || 'classic_ats');
    setCustomSummary(
      session.custom_summary || categories?.professional_summaries?.[0]?.content || ''
    );
    if (session.section_order && session.section_order.length > 0) {
      setSectionOrder(session.section_order);
    }
    if (session.optional_sections) {
      setOptionalSections((prev) => ({ ...prev, ...session.optional_sections }));
    }
    if (session.selected_records) {
      setSelectedRecords(session.selected_records);
    }
  };

  const showFeedback = (msg, isError = false) => {
    setFeedback({ msg, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Record selection toggle
  const toggleRecordSelection = (catKey, recordId) => {
    setSelectedRecords((prev) => {
      const currentList = prev[catKey] || categories[catKey]?.map((i) => i.id) || [];
      const exists = currentList.includes(recordId);
      const updated = exists ? currentList.filter((id) => id !== recordId) : [...currentList, recordId];
      return { ...prev, [catKey]: updated };
    });
  };

  const toggleSelectAll = (catKey) => {
    const allIds = (categories[catKey] || []).map((i) => i.id);
    const currentList = selectedRecords[catKey] || [];
    const allSelected = allIds.length > 0 && currentList.length === allIds.length;

    setSelectedRecords((prev) => ({
      ...prev,
      [catKey]: allSelected ? [] : allIds,
    }));
  };

  // Section order reordering
  const moveSection = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= sectionOrder.length) return;
    const newOrder = [...sectionOrder];
    const [removed] = newOrder.splice(idx, 1);
    newOrder.splice(targetIdx, 0, removed);
    setSectionOrder(newOrder);
  };

  const toggleSectionEnabled = (secKey) => {
    setOptionalSections((prev) => ({
      ...prev,
      [secKey]: !prev[secKey],
    }));
  };

  // Save session payload
  const handleSaveCurrentSession = async () => {
    try {
      setIsSaving(true);
      const payload = {
        id: currentSessionId,
        session_name: sessionName || `${targetRole} Resume`,
        target_role: targetRole,
        target_company: targetCompany,
        template_name: templateName,
        custom_summary: customSummary,
        section_order: sectionOrder,
        selected_records: selectedRecords,
        optional_sections: optionalSections,
      };
      const res = await onSaveSession(payload);
      setCurrentSessionId(res.id);
      showFeedback('Resume customization session saved successfully.');
    } catch (err) {
      showFeedback(err.message || 'Failed to save resume session', true);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate & Download PDF
  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);
      const payload = {
        id: currentSessionId,
        session_name: sessionName,
        target_role: targetRole,
        target_company: targetCompany,
        template_name: templateName,
        custom_summary: customSummary,
        section_order: sectionOrder,
        selected_records: selectedRecords,
        optional_sections: optionalSections,
      };

      const res = await onGeneratePdf(payload);
      if (res?.download_url) {
        setLastPdfUrl(res.download_url);
        // Trigger browser download
        const link = document.createElement('a');
        link.href = res.download_url;
        link.download = res.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showFeedback(`Generated & downloaded PDF: ${res.filename}`);
      }
    } catch (err) {
      showFeedback(err.message || 'PDF generation failed.', true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Filtered lists for preview
  const isSelected = (catKey, id) => {
    if (!selectedRecords[catKey]) return true;
    return selectedRecords[catKey].includes(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Session Switcher & Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dynamic Resume Builder</h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              ATS-Optimized
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tailor section order, cherry-pick relevant skills & projects, and export an ATS-compliant PDF.
          </p>
        </div>

        {/* Load saved sessions */}
        {savedSessions && savedSessions.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Load Preset:</span>
            <select
              value={currentSessionId || ''}
              onChange={(e) => {
                const found = savedSessions.find((s) => s.id === parseInt(e.target.value));
                if (found) loadSessionData(found);
              }}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {savedSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center space-x-2 text-xs font-medium ${
            feedback.isError
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: Customization & Selections (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* General Resume Metadata Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Resume Target & ATS Template</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Name</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g. Tailored Resume for Google"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role Title</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Junior AI/ML Engineer"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Company</label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. DeepPulse"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ATS Layout Template</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateName('classic_ats')}
                    className={`p-3 rounded-xl border text-left transition ${
                      templateName === 'classic_ats'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">Classic ATS</div>
                    <div className="text-[11px] text-slate-500">Centered, standard serif/sans divider bars.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateName('modern_minimal')}
                    className={`p-3 rounded-xl border text-left transition ${
                      templateName === 'modern_minimal'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">Modern Minimal</div>
                    <div className="text-[11px] text-slate-500">Left-aligned slate header, modern compact spacing.</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Summary Customizer */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Professional Summary</h3>
              <button
                type="button"
                onClick={() => onOpenAISuggestions(targetRole)}
                className="flex items-center space-x-1 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded-lg transition"
                title="Get fact-preserving wording suggestions from Gemini"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Rewrite</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={customSummary}
              onChange={(e) => setCustomSummary(e.target.value)}
              placeholder="Tailor your professional summary specifically for this job role..."
              className="w-full text-xs leading-relaxed rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Section Ordering & Visibility */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Section Order & Toggles</h3>
              <p className="text-[11px] text-slate-500">
                Use arrows to adjust the vertical order of sections on your resume.
              </p>
            </div>

            <div className="space-y-1.5">
              {sectionOrder.map((secKey, idx) => {
                const isEnabled = optionalSections[secKey] !== false;
                return (
                  <div
                    key={secKey}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border transition ${
                      isEnabled ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-100/50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggleSectionEnabled(secKey)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span className="font-medium">{SECTION_LABELS[secKey] || secKey}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 1)}
                        disabled={idx === sectionOrder.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Record Inclusions / Cherry-picking */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Select Specific Entries</h3>
              <p className="text-[11px] text-slate-500">
                Pick the most relevant projects, skills, and experience items for this target role.
              </p>
            </div>

            {/* Technical Skills selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Technical Skills ({categories.technical_skills?.length || 0})</span>
                <button
                  type="button"
                  onClick={() => toggleSelectAll('technical_skills')}
                  className="text-blue-600 text-[11px] hover:underline"
                >
                  Toggle All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                {categories.technical_skills?.map((sk) => {
                  const checked = isSelected('technical_skills', sk.id);
                  return (
                    <label
                      key={sk.id}
                      className={`flex items-center space-x-1.5 p-1.5 rounded-lg text-xs cursor-pointer transition ${
                        checked ? 'bg-blue-50 text-blue-900 font-medium' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecordSelection('technical_skills', sk.id)}
                        className="rounded text-blue-600 h-3 w-3"
                      />
                      <span className="truncate">{sk.skill_name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Projects selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Projects ({categories.projects?.length || 0})</span>
                <button
                  type="button"
                  onClick={() => toggleSelectAll('projects')}
                  className="text-blue-600 text-[11px] hover:underline"
                >
                  Toggle All
                </button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                {categories.projects?.map((p) => {
                  const checked = isSelected('projects', p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-start space-x-2 p-2 rounded-lg text-xs cursor-pointer transition ${
                        checked ? 'bg-blue-50/70 text-blue-900 font-medium' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecordSelection('projects', p.id)}
                        className="rounded text-blue-600 h-3.5 w-3.5 mt-0.5 flex-shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-semibold truncate">{p.title}</div>
                        <div className="text-[10px] text-slate-500 truncate">{p.tech_stack}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Experience selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Experience ({categories.experience?.length || 0})</span>
                <button
                  type="button"
                  onClick={() => toggleSelectAll('experience')}
                  className="text-blue-600 text-[11px] hover:underline"
                >
                  Toggle All
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                {categories.experience?.map((x) => {
                  const checked = isSelected('experience', x.id);
                  return (
                    <label
                      key={x.id}
                      className={`flex items-start space-x-2 p-2 rounded-lg text-xs cursor-pointer transition ${
                        checked ? 'bg-blue-50/70 text-blue-900 font-medium' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecordSelection('experience', x.id)}
                        className="rounded text-blue-600 h-3.5 w-3.5 mt-0.5 flex-shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-semibold truncate">{x.role}</div>
                        <div className="text-[10px] text-slate-500">{x.company}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Footer for Saving & Exporting */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSaveCurrentSession}
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition"
            >
              {isSaving ? 'Saving...' : 'Save Session Changes'}
            </button>
            <button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
              <span>{isGenerating ? 'Compiling PDF...' : 'Download Final PDF'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Live Resume Preview (7 cols) */}
        <div className="lg:col-span-7 sticky top-24 space-y-4">
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800">Live Resume Preview</span>
              <span className="text-slate-400">|</span>
              <span className="capitalize font-medium text-slate-600">Template: {templateName.replace('_', ' ')}</span>
            </div>

            <button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>

          {/* Paper Sheet Preview */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-300/80 p-8 sm:p-10 font-sans text-slate-900 space-y-5 min-h-[750px]">
            {/* Template Header */}
            <div
              className={`space-y-1.5 pb-4 border-b ${
                templateName === 'modern_minimal'
                  ? 'text-left border-slate-300'
                  : 'text-center border-slate-800'
              }`}
            >
              <h1
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  templateName === 'modern_minimal' ? 'text-slate-900' : 'text-slate-950 uppercase'
                }`}
              >
                {personal.full_name || 'Candidate Name'}
              </h1>

              {targetRole && (
                <div
                  className={`text-xs font-bold uppercase tracking-wider ${
                    templateName === 'modern_minimal' ? 'text-blue-600' : 'text-slate-700'
                  }`}
                >
                  {targetRole}
                </div>
              )}

              <div className="text-[11px] text-slate-600 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 pt-1">
                {personal.email && <span>{personal.email}</span>}
                {personal.phone && <span>• {personal.phone}</span>}
                {personal.location && <span>• {personal.location}</span>}
                {personal.linkedin && <span>• {personal.linkedin}</span>}
                {personal.github && <span>• {personal.github}</span>}
              </div>
            </div>

            {/* Sections in selected order */}
            {sectionOrder.map((secKey) => {
              if (optionalSections[secKey] === false) return null;

              if (secKey === 'summary') {
                if (!customSummary.trim()) return null;
                return (
                  <div key={secKey} className="space-y-1.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Professional Summary
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-700 text-justify">
                      {customSummary}
                    </p>
                  </div>
                );
              }

              if (secKey === 'education') {
                const eduList = (categories.education || []).filter((e) =>
                  isSelected('education', e.id)
                );
                if (eduList.length === 0) return null;
                return (
                  <div key={secKey} className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Education
                    </h2>
                    <div className="space-y-2">
                      {eduList.map((e) => (
                        <div key={e.id} className="text-xs">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>
                              {e.degree} in {e.field_of_study}
                            </span>
                            <span className="font-semibold text-slate-600 text-[11px]">
                              {e.start_date} – {e.end_date || 'Present'}
                              {e.grade ? ` | ${e.grade}` : ''}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-700 font-medium">
                            {e.institution}
                            {e.location ? `, ${e.location}` : ''}
                          </div>
                          {e.coursework && (
                            <p className="text-[11px] text-slate-600 pt-0.5">
                              <span className="font-semibold text-slate-700">Relevant Coursework:</span> {e.coursework}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (secKey === 'technical_skills') {
                const skillsList = (categories.technical_skills || []).filter((s) =>
                  isSelected('technical_skills', s.id)
                );
                if (skillsList.length === 0) return null;

                // Group by category
                const grouped = {};
                for (const s of skillsList) {
                  const cat = s.category || 'General';
                  if (!grouped[cat]) grouped[cat] = [];
                  grouped[cat].push(s.skill_name);
                }

                return (
                  <div key={secKey} className="space-y-1.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Technical Skills
                    </h2>
                    <div className="space-y-1 text-xs">
                      {Object.entries(grouped).map(([cat, names]) => (
                        <p key={cat} className="leading-snug">
                          <span className="font-bold text-slate-800">{cat}:</span>{' '}
                          <span className="text-slate-700">{names.join(', ')}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                );
              }

              if (secKey === 'experience') {
                const expList = (categories.experience || []).filter((x) =>
                  isSelected('experience', x.id)
                );
                if (expList.length === 0) return null;

                return (
                  <div key={secKey} className="space-y-2.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Experience & Internships
                    </h2>
                    <div className="space-y-3 text-xs">
                      {expList.map((x) => (
                        <div key={x.id} className="space-y-1">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{x.role}</span>
                            <span className="font-semibold text-slate-600 text-[11px]">
                              {x.start_date} – {x.end_date || 'Present'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-700 font-medium">
                            {x.company} {x.employment_type ? `(${x.employment_type})` : ''} {x.location ? `• ${x.location}` : ''}
                          </div>
                          {x.technologies && (
                            <div className="text-[10.5px] text-slate-500">
                              <span className="font-semibold text-slate-600">Environment:</span> {x.technologies}
                            </div>
                          )}
                          <p className="text-[11.5px] text-slate-700 leading-relaxed text-justify">
                            {x.description}
                          </p>
                          {x.achievements && (
                            <p className="text-[11.5px] text-slate-700 font-medium">
                              • <span className="font-semibold text-slate-900">Key Result:</span> {x.achievements}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (secKey === 'projects') {
                const projList = (categories.projects || []).filter((p) =>
                  isSelected('projects', p.id)
                );
                if (projList.length === 0) return null;

                return (
                  <div key={secKey} className="space-y-2.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Projects
                    </h2>
                    <div className="space-y-3 text-xs">
                      {projList.map((p) => (
                        <div key={p.id} className="space-y-1">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>
                              {p.title} {p.tech_stack ? <span className="font-normal text-slate-500 italic text-[11px]">| {p.tech_stack}</span> : ''}
                            </span>
                            <span className="font-semibold text-slate-600 text-[11px]">
                              {p.start_date} {p.end_date ? `– ${p.end_date}` : ''}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-700 leading-relaxed text-justify">
                            {p.description}
                          </p>
                          {p.metrics && (
                            <p className="text-[11px] text-slate-600 font-medium">
                              • <span className="font-semibold text-slate-800">Impact:</span> {p.metrics}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (secKey === 'certifications') {
                const certList = (categories.certifications || []).filter((c) =>
                  isSelected('certifications', c.id)
                );
                if (certList.length === 0) return null;

                return (
                  <div key={secKey} className="space-y-1.5 text-xs">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Certifications & Courses
                    </h2>
                    <div className="space-y-1">
                      {certList.map((c) => (
                        <div key={c.id} className="flex justify-between text-[11.5px]">
                          <span>
                            <strong className="text-slate-900">{c.name}</strong> — {c.issuing_organization}
                          </span>
                          <span className="text-slate-500 text-[11px]">{c.issue_date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (secKey === 'achievements') {
                const achList = (categories.achievements || []).filter((a) =>
                  isSelected('achievements', a.id)
                );
                if (achList.length === 0) return null;

                return (
                  <div key={secKey} className="space-y-1.5 text-xs">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Honors & Achievements
                    </h2>
                    <div className="space-y-1.5">
                      {achList.map((a) => (
                        <div key={a.id} className="text-[11.5px]">
                          <div className="flex justify-between font-semibold text-slate-900">
                            <span>{a.title} ({a.issuer})</span>
                            <span className="text-slate-500 font-normal text-[11px]">{a.date_awarded}</span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{a.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (secKey === 'publications') {
                const pubList = (categories.publications || []).filter((p) =>
                  isSelected('publications', p.id)
                );
                if (pubList.length === 0) return null;

                return (
                  <div key={secKey} className="space-y-1.5 text-xs">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Publications
                    </h2>
                    <div className="space-y-1 text-[11.5px]">
                      {pubList.map((p) => (
                        <div key={p.id}>
                          <span className="font-semibold text-slate-900">"{p.title}"</span> — {p.venue} ({p.publication_date})
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (secKey === 'languages') {
                const langList = (categories.languages || []).filter((l) =>
                  isSelected('languages', l.id)
                );
                if (langList.length === 0) return null;

                return (
                  <div key={secKey} className="space-y-1 text-xs">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Languages
                    </h2>
                    <p className="text-[11.5px] text-slate-700">
                      {langList.map((l) => `${l.language_name} (${l.proficiency_level})`).join('  •  ')}
                    </p>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
