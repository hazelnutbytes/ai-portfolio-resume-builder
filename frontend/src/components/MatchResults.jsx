import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function MatchResults({
  jobTitle,
  company,
  matchResults,
  onBuildResumeWithJob,
}) {
  if (!matchResults) return null;

  const score = matchResults.overall_match_score || 0;
  const counts = matchResults.summary_counts || {};
  const matched = matchResults.matched_requirements || [];
  const partial = matchResults.partial_matches || [];
  const missing = matchResults.missing_or_unsupported || [];

  const getScoreColor = (sc) => {
    if (sc >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (sc >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* Score Overview Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Match Audit</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                Verified against SQLite Records
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {jobTitle} {company ? `at ${company}` : ''}
            </h2>
            <p className="text-xs text-slate-500">
              Every matched item below cites an actual record ID from your portfolio.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`px-4 py-3 rounded-2xl border text-center ${getScoreColor(score)}`}>
              <div className="text-3xl font-extrabold tracking-tight">{score}%</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider">Overall Match</div>
            </div>

            <button
              onClick={onBuildResumeWithJob}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition shadow-md shadow-blue-600/20"
            >
              <span>Build Tailored Resume</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Breakdown counters */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-lg font-bold text-emerald-700">{counts.matched || matched.length}</div>
            <div className="text-xs font-medium text-emerald-800">Fully Supported</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
            <div className="text-lg font-bold text-amber-700">{counts.partial || partial.length}</div>
            <div className="text-xs font-medium text-amber-800">Partially Supported</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
            <div className="text-lg font-bold text-slate-700">{counts.missing || missing.length}</div>
            <div className="text-xs font-medium text-slate-600">Missing / Unverified</div>
          </div>
        </div>

        {/* Fact Checking Guarantee Notice */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start space-x-2 text-xs text-blue-800">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold">Fact-Preservation Policy:</span> {matchResults.fact_check_policy ||
              'Only verified portfolio records are cited. The application will never hallucinate or invent candidate qualifications.'}
          </p>
        </div>
      </div>

      {/* 1. Fully Matched Requirements */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Fully Supported Requirements ({matched.length})
          </h3>
        </div>

        {matched.length === 0 ? (
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
            No direct matches identified for this job criteria yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {matched.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm space-y-2 hover:border-emerald-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                    {item.requirement}
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                    {item.requirement_type?.replace(/_/g, ' ') || 'Requirement'}
                  </span>
                </div>

                {item.explanation && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.explanation}
                  </p>
                )}

                {/* Supporting Records Cited */}
                {item.supporting_records?.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Supporting Portfolio Records:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.supporting_records.map((rec, rIdx) => (
                        <div
                          key={rIdx}
                          className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg flex items-center space-x-1.5"
                        >
                          <span className="font-mono text-[10px] bg-slate-200 px-1 py-0.2 rounded text-slate-800">
                            #{rec.record_id}
                          </span>
                          <span className="font-medium">{rec.title}</span>
                          <span className="text-slate-400 text-[10px]">({rec.category_label || rec.category})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Partially Matched Requirements */}
      {partial.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Partially Supported Requirements ({partial.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {partial.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                    {item.requirement}
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                    Partial
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.explanation}
                </p>

                {item.supporting_records?.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {item.supporting_records.map((rec, rIdx) => (
                      <div
                        key={rIdx}
                        className="text-xs bg-amber-50/50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg flex items-center space-x-1.5"
                      >
                        <span className="font-mono text-[10px] bg-amber-200 px-1 py-0.2 rounded text-amber-900">
                          #{rec.record_id}
                        </span>
                        <span className="font-medium">{rec.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Missing or Unsupported Requirements */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Missing or Unsupported Requirements ({missing.length})
          </h3>
        </div>

        {missing.length === 0 ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
            Outstanding! Your saved portfolio covers every single requirement extracted from this job description.
          </div>
        ) : (
          <div className="space-y-2.5">
            {missing.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                    {item.requirement}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                      item.gap_type === 'missing_qualification'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.gap_label || 'Not in Portfolio'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h4 className="font-bold text-base">Ready to craft a customized resume?</h4>
          <p className="text-xs text-blue-100">
            Proceed with verified records auto-selected according to relevance for this role.
          </p>
        </div>
        <button
          onClick={onBuildResumeWithJob}
          className="bg-white hover:bg-blue-50 text-blue-700 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow"
        >
          Open Resume Builder
        </button>
      </div>
    </div>
  );
}
