import React, { useState } from 'react';
import {
  Briefcase,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Cpu,
  ChevronDown,
  Layers,
} from 'lucide-react';
import MatchResults from './MatchResults';

const SAMPLE_JOBS = [
  {
    id: 'ai-ml',
    title: 'Junior AI/ML Engineer',
    company: 'DeepPulse Technologies',
    text: `Position: Junior AI/ML Engineer
Company: DeepPulse Technologies
Location: Bengaluru / Remote

About Us:
DeepPulse is building applied AI diagnostic and enterprise intelligence solutions. We are seeking an ambitious Junior AI/ML Engineer.

Key Responsibilities:
• Build, train, fine-tune, and evaluate deep learning and machine learning models using PyTorch, Hugging Face, and Python.
• Develop Retrieval-Augmented Generation (RAG) pipelines and integrate LLM APIs (Gemini, OpenAI) for document understanding.
• Preprocess complex multimodal datasets (imaging, text) using Pandas, NumPy, and OpenCV.
• Deploy production-ready model inference endpoints with FastAPI or Flask and containerize services with Docker.
• Collaborate with cross-functional engineering and product teams to translate model outputs into clinically useful features.

Required Qualifications:
• Bachelor's degree (in progress or completed) in Computer Science, AI, Data Science, or related engineering discipline.
• Strong programming proficiency in Python and solid fundamentals in Data Structures & Algorithms.
• Hands-on project or internship experience with PyTorch, Machine Learning, and Deep Learning architectures.
• Demonstrated understanding of NLP / LLMs, transformers, or Computer Vision.
• Experience with Git & GitHub version control and REST APIs.
• Excellent analytical problem solving and technical communication abilities.

Preferred Qualifications:
• Prior research publications or participation in competitive hackathons (e.g. Smart India Hackathon).
• Experience with Docker containerization and vector databases (ChromaDB, Pinecone).
• Familiarity with model explainability methods (Grad-CAM, SHAP).
• Knowledge of cloud platforms (AWS or GCP).`,
  },
  {
    id: 'full-stack',
    title: 'Full-Stack Developer',
    company: 'CloudForge Systems',
    text: `Position: Full-Stack Developer
Company: CloudForge Systems
Location: Bengaluru / Hybrid

About Us:
CloudForge Systems empowers enterprises with high-velocity SaaS collaborative platforms. We are hiring a versatile Full-Stack Developer to build responsive, robust web applications.

Key Responsibilities:
• Develop dynamic, responsive user interfaces using React, JavaScript (ES6+), TypeScript, and Tailwind CSS.
• Design, implement, and maintain scalable REST APIs using Node.js, Express, or Python Flask.
• Architect relational database schemas, write optimized SQL queries, and manage database migrations in PostgreSQL or SQLite.
• Implement real-time communication protocols (WebSockets) and state management for multi-user collaboration.
• Containerize web services using Docker and maintain CI/CD pipelines with GitHub Actions.
• Participate in Agile sprints, peer code reviews, and system architecture planning.

Required Qualifications:
• B.Tech / B.S. degree in Computer Science, Software Engineering, or equivalent practical experience.
• Strong proficiency in React, JavaScript, and modern HTML5/Tailwind CSS styling.
• Solid backend programming experience with Node.js or Python (Flask/FastAPI) and REST APIs.
• Strong foundation in SQL and relational database design.
• Familiarity with Git & GitHub collaborative workflows.
• Proven ability to work effectively in cross-functional agile teams.

Preferred Qualifications:
• Experience with TypeScript in both frontend and backend codebases.
• Experience with Docker and Redis caching.
• Understanding of automated testing, linting, and CI/CD best practices.
• Portfolio of live web applications or open-source contributions.`,
  },
];

export default function JobAnalyzer({
  onAnalyzeJob,
  onNavigateToResumeBuilder,
  integrations,
}) {
  const [jobText, setJobText] = useState(SAMPLE_JOBS[0].text);
  const [jobTitle, setJobTitle] = useState(SAMPLE_JOBS[0].title);
  const [company, setCompany] = useState(SAMPLE_JOBS[0].company);
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiWarning, setAiWarning] = useState('');
  const [activeTab, setActiveTab] = useState('match'); // 'match' | 'extracted'

  const geminiAvailable = integrations?.gemini?.configured;

  const handleSelectSample = (sample) => {
    setJobTitle(sample.title);
    setCompany(sample.company);
    setJobText(sample.text);
    setActiveAnalysis(null);
    setErrorMsg('');
  };

  const handleAnalyze = async () => {
    if (!jobText.trim()) {
      setErrorMsg('Please paste or write a job description before analyzing.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMsg('');
      setAiWarning('');

      const result = await onAnalyzeJob({
        raw_text: jobText,
        title: jobTitle,
        company: company,
        save: true,
      });

      setActiveAnalysis(result);
      if (result.ai_warning) {
        setAiWarning(result.ai_warning);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Job analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBuildResume = () => {
    if (!activeAnalysis) return;
    onNavigateToResumeBuilder({
      jobId: activeAnalysis.job?.id,
      targetRole: activeAnalysis.extracted_data?.job_title || jobTitle,
      targetCompany: activeAnalysis.extracted_data?.company || company,
      matchResults: activeAnalysis.match_results,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
        <div className="flex items-center space-x-2">
          <Briefcase className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Job Description Analyzer & Matcher</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Paste any job description to extract core competencies and audit exact matches against your saved portfolio records.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        {/* Sample Loaders */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Load College Demonstration Jobs:</span>
          </div>
          <div className="flex gap-2">
            {SAMPLE_JOBS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSample(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition ${
                  jobTitle === s.title
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Junior AI/ML Engineer"
              className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization (Optional)</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. DeepPulse Technologies"
              className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Job Description Text (Paste full JD below)
          </label>
          <textarea
            rows={8}
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste complete job description, requirements, and responsibilities here..."
            className="w-full font-mono text-xs leading-relaxed rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Status / Warnings */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {aiWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{aiWarning}</span>
          </div>
        )}

        {/* CTA Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Cpu className="w-4 h-4 text-slate-400" />
            <span>
              Analysis Engine:{' '}
              <strong className="text-slate-700 font-semibold">
                {geminiAvailable ? 'Google Gemini AI (Active)' : 'Deterministic Rules & ATS Keyword Matcher'}
              </strong>
            </span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <Search className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing & Matching...' : 'Run Job & Portfolio Audit'}</span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      {activeAnalysis && (
        <div className="space-y-6">
          {/* Result Sub-tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('match')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition ${
                activeTab === 'match'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Portfolio Match Evidence
            </button>
            <button
              onClick={() => setActiveTab('extracted')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition ${
                activeTab === 'extracted'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Extracted Job Profile
            </button>
          </div>

          {activeTab === 'match' && (
            <MatchResults
              jobTitle={activeAnalysis.extracted_data?.job_title || jobTitle}
              company={activeAnalysis.extracted_data?.company || company}
              matchResults={activeAnalysis.match_results}
              onBuildResumeWithJob={handleBuildResume}
            />
          )}

          {activeTab === 'extracted' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {activeAnalysis.extracted_data?.job_title}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeAnalysis.extracted_data?.company || 'Company not specified'} • Extracted by{' '}
                  <span className="font-semibold text-slate-700">{activeAnalysis.analysis_source}</span>
                </p>
              </div>

              {/* Technical & Soft Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Target Technical Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAnalysis.extracted_data?.technical_skills?.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-50 text-blue-800 font-medium px-2.5 py-1 rounded-lg border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Target Soft Skills & Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAnalysis.extracted_data?.soft_skills?.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-purple-50 text-purple-800 font-medium px-2.5 py-1 rounded-lg border border-purple-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Required vs Preferred Qualifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                    Required Qualifications
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                    {activeAnalysis.extracted_data?.required_qualifications?.map((req, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    Preferred / Nice-to-Have
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                    {activeAnalysis.extracted_data?.preferred_qualifications?.map((pref, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {pref}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Responsibilities */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Key Responsibilities
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {activeAnalysis.extracted_data?.responsibilities?.map((resp, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleBuildResume}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition"
                >
                  Use for Resume Building →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
