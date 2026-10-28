import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  AlertCircle,
  FileText,
  UploadCloud,
  CheckCircle2,
  Cpu,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function AIAssistantModal({
  isOpen,
  onClose,
  initialTab = 'organize', // 'organize' | 'suggestions'
  targetRoleHint = '',
  onOrganizeText,
  onCommitApproved,
  onGetSuggestions,
  onApplySummarySuggestion,
  integrations,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [unstructuredText, setUnstructuredText] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [approvedItems, setApprovedItems] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Suggestions state
  const [targetRole, setTargetRole] = useState(targetRoleHint || 'Junior AI/ML Engineer');
  const [jobExcerpt, setJobExcerpt] = useState('');
  const [suggestionsResult, setSuggestionsResult] = useState(null);

  if (!isOpen) return null;

  const geminiActive = integrations?.gemini?.configured;

  const handleOrganizeSubmit = async (e) => {
    e.preventDefault();
    if (!unstructuredText.trim()) {
      setErrorMessage('Please paste your unstructured notes or resume text.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');
      setSuccessMessage('');

      const result = await onOrganizeText(unstructuredText);
      setExtractedData(result);

      // Pre-select all extracted items as approved by default
      const initialApproval = {};
      const cats = result.extracted_categories || {};
      for (const [catKey, items] of Object.entries(cats)) {
        initialApproval[catKey] = [...items];
      }
      setApprovedItems(initialApproval);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to parse unstructured text.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleApproveItem = (catKey, itemIndex) => {
    setApprovedItems((prev) => {
      const currentList = prev[catKey] || [];
      const itemToToggle = extractedData?.extracted_categories?.[catKey]?.[itemIndex];
      if (!itemToToggle) return prev;

      const exists = currentList.some((i) => JSON.stringify(i) === JSON.stringify(itemToToggle));
      const updated = exists
        ? currentList.filter((i) => JSON.stringify(i) !== JSON.stringify(itemToToggle))
        : [...currentList, itemToToggle];
      return { ...prev, [catKey]: updated };
    });
  };

  const handleCommitApproved = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage('');

      const res = await onCommitApproved(approvedItems);
      setSuccessMessage(res.message || 'Selected records added to your portfolio.');
      setExtractedData(null);
      setUnstructuredText('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save approved records.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFetchSuggestions = async (e) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await onGetSuggestions(targetRole, jobExcerpt);
      setSuggestionsResult(res);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate AI suggestions.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-purple-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Gemini AI Career Assistant</h3>
              <p className="text-xs text-purple-200">
                Official Google Gen AI SDK • Model: {integrations?.gemini?.model || 'gemini-2.5-flash'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gemini status notice if unconfigured */}
        {!geminiActive && (
          <div className="bg-amber-50 border-b border-amber-200 p-3.5 text-xs text-amber-800 flex items-center space-x-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Gemini API Key Required:</strong> To invoke live Google Gemini AI calls, please set your <code className="bg-amber-100 px-1 py-0.5 rounded">GEMINI_API_KEY</code> in the <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code> file.
            </span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50/50 flex-shrink-0">
          <button
            onClick={() => {
              setActiveTab('organize');
              setErrorMessage('');
            }}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'organize'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3A. Portfolio Organizer (Unstructured Parsing)
          </button>
          <button
            onClick={() => {
              setActiveTab('suggestions');
              setErrorMessage('');
            }}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'suggestions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3D. AI Wording & Summary Suggestions
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="m-6 mb-0 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="m-6 mb-0 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Unstructured Portfolio Organizer */}
        {activeTab === 'organize' && (
          <div className="p-6 overflow-y-auto space-y-5">
            {!extractedData ? (
              <form onSubmit={handleOrganizeSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Paste Unstructured Portfolio Information
                  </h4>
                  <p className="text-xs text-slate-500">
                    Paste your raw notes, LinkedIn "About" or experience text, project blurbs, or past resume drafts.
                    Gemini AI will extract structured education, technical skills, projects, and experience for your approval.
                  </p>
                </div>

                <textarea
                  rows={8}
                  required
                  value={unstructuredText}
                  onChange={(e) => setUnstructuredText(e.target.value)}
                  placeholder="e.g. I am a B.Tech senior at NITK with an 8.9 CGPA. I have built projects like an X-ray diagnostic pipeline in PyTorch and a RAG app using LangChain. I interned at Kinetix AI Labs where I quantized LLMs by 42%..."
                  className="w-full text-xs font-mono leading-relaxed rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setUnstructuredText(
                        `Academic background: Final year B.Tech Computer Science student at National Institute of Technology Karnataka (CGPA: 8.92/10). Coursework includes Machine Learning, Operating Systems, and Distributed Systems.\n\nTechnical Skills: Python, PyTorch, React, Node.js, SQL, Docker, Tailwind CSS, Hugging Face Transformers.\n\nKey Project: MedVision - Built chest radiography classifier using DenseNet-121 and Grad-CAM in PyTorch, achieving 94.2% AUROC with FastAPI inference backend.\n\nExperience: ML Research Intern at Kinetix AI Labs (May-Jul 2024), where I reduced model memory by 42% via 4-bit quantization and built test benchmarks.`
                      )
                    }
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Insert Example Text
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{isProcessing ? 'Parsing via Gemini...' : 'Extract Structured Records'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Review & Approval UI */
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>
                      Found <strong>{extractedData.total_extracted}</strong> potential records. Check items to approve and save into SQLite.
                    </span>
                  </div>
                  <button
                    onClick={() => setExtractedData(null)}
                    className="text-indigo-700 hover:underline font-semibold"
                  >
                    Discard & Re-paste
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {Object.entries(extractedData.extracted_categories || {}).map(([catKey, items]) => {
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={catKey} className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
                        <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
                          {catKey.replace(/_/g, ' ')} ({items.length})
                        </div>
                        <div className="space-y-2">
                          {items.map((item, idx) => {
                            const isApproved = approvedItems[catKey]?.some(
                              (i) => JSON.stringify(i) === JSON.stringify(item)
                            );
                            return (
                              <div
                                key={idx}
                                onClick={() => toggleApproveItem(catKey, idx)}
                                className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-start space-x-2.5 ${
                                  isApproved
                                    ? 'bg-white border-indigo-300 shadow-sm ring-1 ring-indigo-200'
                                    : 'bg-slate-100 border-slate-200 text-slate-400'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isApproved}
                                  onChange={() => {}}
                                  className="rounded text-indigo-600 h-4 w-4 mt-0.5"
                                />
                                <div className="space-y-0.5 flex-1">
                                  <div className="font-semibold text-slate-900">
                                    {item.title ||
                                      item.skill_name ||
                                      item.degree ||
                                      item.company ||
                                      item.name ||
                                      'Extracted Item'}
                                  </div>
                                  <div className="text-slate-600 text-[11px]">
                                    {item.description || item.tech_stack || item.institution || item.skills_covered || ''}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                  <button
                    onClick={() => setExtractedData(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommitApproved}
                    disabled={isProcessing}
                    className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition"
                  >
                    {isProcessing ? 'Saving to Database...' : 'Approve & Save Selected Records'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Suggestions (Feature 3D) */}
        {activeTab === 'suggestions' && (
          <div className="p-6 overflow-y-auto space-y-5">
            <form onSubmit={handleFetchSuggestions} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Junior AI/ML Engineer"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Excerpt (Optional)</label>
                  <input
                    type="text"
                    value={jobExcerpt}
                    onChange={(e) => setJobExcerpt(e.target.value)}
                    placeholder="Key terms or job description snippet..."
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Fact-Preserving: Never invents unverified achievements.</span>
                </div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow transition disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Generating Suggestions...' : 'Generate Wording Suggestions'}</span>
                </button>
              </div>
            </form>

            {suggestionsResult && (
              <div className="space-y-4 pt-2">
                {/* Summary Suggestions */}
                {suggestionsResult.summary_suggestions?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                      Professional Summary Suggestions
                    </h4>
                    {suggestionsResult.summary_suggestions.map((s, idx) => (
                      <div key={idx} className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-purple-950">{s.title || 'Summary Improvement'}</span>
                          {onApplySummarySuggestion && (
                            <button
                              type="button"
                              onClick={() => {
                                onApplySummarySuggestion(s.suggested_text);
                                setSuccessMessage('Applied suggestion to active resume summary!');
                              }}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg shadow-sm"
                            >
                              Use in Active Resume
                            </button>
                          )}
                        </div>

                        <div className="p-2.5 bg-white rounded-lg border border-purple-100 text-slate-800 leading-relaxed">
                          {s.suggested_text}
                        </div>

                        {s.rationale && (
                          <p className="text-[11px] text-slate-500 italic">
                            <strong>Rationale:</strong> {s.rationale}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Project Suggestions */}
                {suggestionsResult.project_suggestions?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Project Description Enhancements
                    </h4>
                    {suggestionsResult.project_suggestions.map((p, idx) => (
                      <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="font-semibold text-slate-900">{p.title}</div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-100 text-slate-700 leading-relaxed">
                          {p.suggested_description}
                        </div>
                        {p.rationale && (
                          <div className="text-[11px] text-slate-500">
                            <strong>Clarity Improvement:</strong> {p.rationale}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
