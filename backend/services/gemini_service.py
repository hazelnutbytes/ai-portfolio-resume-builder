import json
import re
from typing import Any

from config import Config
from services.matcher_service import match_portfolio_to_job


class GeminiServiceError(Exception):
    """Raised when Gemini API is unconfigured, unreachable, or returns an error."""

    def __init__(self, message: str, error_code: str = "GEMINI_ERROR", status_code: int = 503):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


def _get_client():
    if not Config.is_gemini_configured():
        raise GeminiServiceError(
            "Google Gemini API key is not configured. Add a valid GEMINI_API_KEY in your .env file to enable live Gemini AI features.",
            error_code="MISSING_API_KEY",
            status_code=503,
        )
    try:
        from google import genai

        return genai.Client(api_key=Config.GEMINI_API_KEY)
    except Exception as exc:
        raise GeminiServiceError(
            f"Failed to initialize Google Gen AI SDK client: {exc}",
            error_code="SDK_INIT_ERROR",
            status_code=500,
        ) from exc


def _parse_json_response(raw_text: str) -> dict[str, Any]:
    if not raw_text:
        raise GeminiServiceError("Gemini returned an empty response.", "EMPTY_RESPONSE", 502)

    cleaned = raw_text.strip()
    # Strip markdown code fences if present
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
        raise ValueError("Expected top-level JSON object.")
    except Exception as exc:
        raise GeminiServiceError(
            f"Gemini returned malformed JSON that could not be parsed: {exc}",
            error_code="INVALID_AI_RESPONSE",
            status_code=502,
        ) from exc


def _call_gemini_json(prompt: str, system_instruction: str) -> dict[str, Any]:
    client = _get_client()
    try:
        from google.genai import types

        response = client.models.generate_content(
            model=Config.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )
        return _parse_json_response(response.text or "")
    except GeminiServiceError:
        raise
    except Exception as exc:
        err_str = str(exc)
        low = err_str.lower()
        if "429" in low or "quota" in low or "resource_exhausted" in low:
            raise GeminiServiceError(
                "Gemini API quota limit reached (HTTP 429). Please wait a moment or check your Google AI Studio quota.",
                error_code="QUOTA_EXCEEDED",
                status_code=429,
            ) from exc
        if "api_key_invalid" in low or "401" in low or "403" in low or "invalid api key" in low:
            raise GeminiServiceError(
                "The configured GEMINI_API_KEY was rejected by Google Gemini API. Please verify your key in .env.",
                error_code="INVALID_API_KEY",
                status_code=401,
            ) from exc
        raise GeminiServiceError(
            f"Gemini API request failed: {err_str}",
            error_code="API_REQUEST_FAILED",
            status_code=502,
        ) from exc


def organize_unstructured_portfolio(unstructured_text: str) -> dict[str, Any]:
    """
    Feature 3A: Portfolio organization.
    Accepts unstructured text pasted by the user and extracts structured candidate items
    for review & approval before saving into SQLite.
    """
    system_instruction = (
        "You are a precise portfolio parser for a student resume application. "
        "Extract ONLY factual records explicitly stated in the user's unstructured text. "
        "Do NOT invent degrees, dates, metrics, or skills not present in the input."
    )
    prompt = f"""
Extract structured portfolio entries from the following unstructured text.
Return a JSON object with these exact keys (use empty arrays [] if none found):
{{
  "education": [
    {{
      "institution": "string",
      "degree": "string",
      "field_of_study": "string",
      "start_date": "string (e.g. 2022)",
      "end_date": "string (e.g. 2026 or Present)",
      "grade": "string",
      "location": "string",
      "coursework": "string",
      "description": "string"
    }}
  ],
  "technical_skills": [
    {{
      "skill_name": "string",
      "category": "Programming Languages | Frameworks & Libraries | AI & Data Science | Databases & Cloud | Developer Tools",
      "proficiency": "Beginner | Intermediate | Advanced",
      "years_experience": "string",
      "evidence_note": "string explaining where it was mentioned in the pasted text"
    }}
  ],
  "soft_skills": [
    {{
      "skill_name": "string",
      "proficiency": "Strong",
      "context": "string"
    }}
  ],
  "projects": [
    {{
      "title": "string",
      "role": "string",
      "tech_stack": "comma-separated string",
      "start_date": "string",
      "end_date": "string",
      "description": "string",
      "highlights": "string",
      "metrics": "string"
    }}
  ],
  "experience": [
    {{
      "company": "string",
      "role": "string",
      "employment_type": "Internship | Part-Time | Full-Time | Research",
      "location": "string",
      "start_date": "string",
      "end_date": "string",
      "technologies": "string",
      "description": "string",
      "achievements": "string"
    }}
  ],
  "certifications": [
    {{
      "name": "string",
      "issuing_organization": "string",
      "issue_date": "string",
      "skills_covered": "string"
    }}
  ],
  "achievements": [
    {{
      "title": "string",
      "issuer": "string",
      "date_awarded": "string",
      "category": "Academic | Hackathon | Competition | Leadership",
      "description": "string",
      "impact": "string"
    }}
  ]
}}

UNSTRUCTURED INPUT TEXT:
\"\"\"
{unstructured_text[:12000]}
\"\"\"
"""
    data = _call_gemini_json(prompt, system_instruction)
    expected_keys = [
        "education",
        "technical_skills",
        "soft_skills",
        "projects",
        "experience",
        "certifications",
        "achievements",
    ]
    normalized: dict[str, list[dict[str, Any]]] = {}
    total_extracted = 0
    for k in expected_keys:
        val = data.get(k, [])
        if isinstance(val, list):
            normalized[k] = [item for item in val if isinstance(item, dict)]
            total_extracted += len(normalized[k])
        else:
            normalized[k] = []

    return {
        "source": "gemini",
        "model": Config.GEMINI_MODEL,
        "total_extracted": total_extracted,
        "extracted_categories": normalized,
    }


def analyze_job_with_gemini(
    raw_text: str, title_hint: str = "", company_hint: str = ""
) -> dict[str, Any]:
    """
    Feature 3B: Job description analysis using Gemini API.
    """
    system_instruction = (
        "You are an expert technical recruiter and ATS analyst. "
        "Analyze the job description and extract structured requirements accurately. "
        "Separate required qualifications from preferred/nice-to-have qualifications."
    )
    prompt = f"""
Analyze the following job description and return a JSON object with this exact structure:
{{
  "job_title": "string",
  "company": "string",
  "technical_skills": ["string"],
  "soft_skills": ["string"],
  "required_qualifications": ["string"],
  "preferred_qualifications": ["string"],
  "responsibilities": ["string"],
  "keywords": ["string"]
}}

Title hint (if any): {title_hint}
Company hint (if any): {company_hint}

JOB DESCRIPTION:
\"\"\"
{raw_text[:15000]}
\"\"\"
"""
    data = _call_gemini_json(prompt, system_instruction)
    return {
        "job_title": str(data.get("job_title") or title_hint or "Target Role").strip(),
        "company": str(data.get("company") or company_hint or "").strip(),
        "technical_skills": [str(x) for x in data.get("technical_skills", []) if x],
        "soft_skills": [str(x) for x in data.get("soft_skills", []) if x],
        "required_qualifications": [str(x) for x in data.get("required_qualifications", []) if x],
        "preferred_qualifications": [str(x) for x in data.get("preferred_qualifications", []) if x],
        "responsibilities": [str(x) for x in data.get("responsibilities", []) if x],
        "keywords": [str(x) for x in data.get("keywords", []) if x],
        "analysis_mode": "gemini",
        "model": Config.GEMINI_MODEL,
    }


def match_portfolio_with_gemini(
    portfolio_data: dict[str, Any], extracted_job: dict[str, Any]
) -> dict[str, Any]:
    """
    Feature 3C: Portfolio-to-job matching with strict ground-truth verification.
    Uses Gemini to evaluate semantic alignment while verifying every cited record ID against SQLite.
    """
    # Build ground-truth baseline first
    baseline_match = match_portfolio_to_job(portfolio_data, extracted_job)

    # Create compact catalog of actual saved records with their exact IDs
    categories = portfolio_data.get("categories", {})
    valid_records_lookup: dict[tuple[str, int], dict[str, Any]] = {}
    compact_portfolio: dict[str, list[dict[str, Any]]] = {}

    for cat_key in [
        "education",
        "technical_skills",
        "soft_skills",
        "projects",
        "experience",
        "certifications",
        "achievements",
    ]:
        compact_portfolio[cat_key] = []
        for item in categories.get(cat_key, []):
            rid = int(item["id"])
            title = (
                item.get("title")
                or item.get("skill_name")
                or item.get("name")
                or item.get("degree")
                or item.get("role")
                or f"Record #{rid}"
            )
            valid_records_lookup[(cat_key, rid)] = {
                "category": cat_key,
                "category_label": cat_key.replace("_", " ").title(),
                "record_id": rid,
                "title": str(title),
                "evidence": str(
                    item.get("description")
                    or item.get("evidence_note")
                    or item.get("tech_stack")
                    or item.get("coursework")
                    or item.get("context")
                    or title
                )[:160],
            }
            compact_portfolio[cat_key].append(
                {
                    "id": rid,
                    "title": title,
                    "details": valid_records_lookup[(cat_key, rid)]["evidence"],
                }
            )

    system_instruction = (
        "You are a strict, fact-preserving portfolio-to-job matching auditor. "
        "You must ONLY cite record IDs that actually exist in the candidate's saved portfolio JSON. "
        "NEVER claim the candidate has a skill, certification, degree, or experience not supported by a saved record. "
        "Clearly distinguish between 'missing_qualification' (e.g., 5+ years experience or degree not held) and "
        "'not_entered_or_unsupported' (a specific tool or skill not found in any saved portfolio record)."
    )
    prompt = f"""
Compare the JOB REQUIREMENTS against the SAVED PORTFOLIO RECORDS.
Return JSON with this structure:
{{
  "overall_match_score": 0-100,
  "executive_assessment": "2-3 sentence honest summary of fit and main gaps",
  "matched_requirements": [
    {{
      "requirement": "string",
      "requirement_type": "technical_skill | soft_skill | required_qualification | preferred_qualification",
      "explanation": "string explaining how the cited records prove this",
      "supporting_refs": [{{"category": "projects|technical_skills|education|experience|certifications|achievements|soft_skills", "record_id": 1}}]
    }}
  ],
  "partial_matches": [
    {{
      "requirement": "string",
      "requirement_type": "string",
      "explanation": "string explaining what is supported vs what is partial",
      "supporting_refs": [{{"category": "string", "record_id": 1}}]
    }}
  ],
  "missing_or_unsupported": [
    {{
      "requirement": "string",
      "requirement_type": "string",
      "gap_type": "not_entered_or_unsupported | missing_qualification",
      "gap_label": "Not Found in Saved Portfolio (Unverified / Not Entered) | Genuinely Missing Qualification / Experience Level",
      "explanation": "string"
    }}
  ]
}}

JOB REQUIREMENTS:
{json.dumps(extracted_job, indent=2)}

SAVED PORTFOLIO RECORDS:
{json.dumps(compact_portfolio, indent=2)}
"""
    ai_data = _call_gemini_json(prompt, system_instruction)

    # Verify every single supporting_ref against `valid_records_lookup`
    verified_matched = []
    for item in ai_data.get("matched_requirements", []):
        if not isinstance(item, dict):
            continue
        verified_refs = []
        for ref in item.get("supporting_refs", []):
            if not isinstance(ref, dict):
                continue
            key = (str(ref.get("category", "")), int(ref.get("record_id") or 0))
            if key in valid_records_lookup:
                verified_refs.append(valid_records_lookup[key])
        if verified_refs:
            verified_matched.append(
                {
                    "requirement": str(item.get("requirement", "")),
                    "requirement_type": str(item.get("requirement_type", "requirement")),
                    "status": "matched",
                    "supporting_records": verified_refs,
                    "explanation": str(item.get("explanation", "")),
                }
            )

    verified_partial = []
    for item in ai_data.get("partial_matches", []):
        if not isinstance(item, dict):
            continue
        verified_refs = []
        for ref in item.get("supporting_refs", []):
            if not isinstance(ref, dict):
                continue
            key = (str(ref.get("category", "")), int(ref.get("record_id") or 0))
            if key in valid_records_lookup:
                verified_refs.append(valid_records_lookup[key])
        if verified_refs:
            verified_partial.append(
                {
                    "requirement": str(item.get("requirement", "")),
                    "requirement_type": str(item.get("requirement_type", "requirement")),
                    "status": "partial",
                    "supporting_records": verified_refs,
                    "explanation": str(item.get("explanation", "")),
                }
            )

    verified_missing = []
    for item in ai_data.get("missing_or_unsupported", []):
        if not isinstance(item, dict):
            continue
        verified_missing.append(
            {
                "requirement": str(item.get("requirement", "")),
                "requirement_type": str(item.get("requirement_type", "requirement")),
                "status": "missing",
                "gap_type": str(item.get("gap_type") or "not_entered_or_unsupported"),
                "gap_label": str(
                    item.get("gap_label")
                    or "Not Found in Saved Portfolio (Unverified / Not Entered)"
                ),
                "supporting_records": [],
                "explanation": str(item.get("explanation", "")),
            }
        )

    # If Gemini returned valid verified items, merge with baseline recommendations
    if verified_matched or verified_partial or verified_missing:
        baseline_match["matched_requirements"] = verified_matched
        baseline_match["partial_matches"] = verified_partial
        baseline_match["missing_or_unsupported"] = verified_missing
        baseline_match["summary_counts"] = {
            "matched": len(verified_matched),
            "partial": len(verified_partial),
            "missing": len(verified_missing),
            "total_evaluated": len(verified_matched) + len(verified_partial) + len(verified_missing),
        }
        if isinstance(ai_data.get("overall_match_score"), (int, float)):
            baseline_match["overall_match_score"] = int(
                max(0, min(100, round(float(ai_data["overall_match_score"]))))
            )
        if ai_data.get("executive_assessment"):
            baseline_match["executive_assessment"] = str(ai_data["executive_assessment"])

    baseline_match["analysis_mode"] = "gemini"
    baseline_match["model"] = Config.GEMINI_MODEL
    return baseline_match


def suggest_portfolio_improvements(
    portfolio_data: dict[str, Any],
    target_role: str = "",
    job_description: str = "",
) -> dict[str, Any]:
    """
    Feature 3D: AI suggestions.
    Suggests fact-preserving wording improvements to the professional summary and existing
    projects/experience descriptions without changing underlying facts or auto-overwriting.
    """
    categories = portfolio_data.get("categories", {})
    summaries = categories.get("professional_summaries", [])
    projects = categories.get("projects", [])
    experiences = categories.get("experience", [])

    input_payload = {
        "target_role": target_role or "Software / AI Engineer",
        "job_description_excerpt": (job_description or "")[:3000],
        "professional_summaries": [
            {"id": s["id"], "title": s["title"], "content": s["content"]} for s in summaries[:3]
        ],
        "projects": [
            {
                "id": p["id"],
                "title": p["title"],
                "tech_stack": p["tech_stack"],
                "description": p["description"],
                "highlights": p.get("highlights", ""),
                "metrics": p.get("metrics", ""),
            }
            for p in projects[:5]
        ],
        "experience": [
            {
                "id": e["id"],
                "company": e["company"],
                "role": e["role"],
                "technologies": e.get("technologies", ""),
                "description": e["description"],
                "achievements": e.get("achievements", ""),
            }
            for e in experiences[:4]
        ],
    }

    system_instruction = (
        "You are an ethical career coach and technical resume editor. "
        "Suggest clearer, stronger, ATS-friendly wording for the candidate's existing summary, projects, "
        "and experience. STRICT RULE: Do NOT invent new metrics, tools, percentages, or responsibilities "
        "that are not already present in the original record. Only reorganize and sharpen existing facts."
    )
    prompt = f"""
Review the candidate's existing portfolio records below and provide fact-preserving wording suggestions
tailored toward: "{target_role or 'Technical Roles'}".

Return JSON with this exact structure:
{{
  "summary_suggestions": [
    {{
      "record_id": 1,
      "title": "string",
      "original_text": "string",
      "suggested_text": "string",
      "rationale": "string explaining how clarity/relevance improved without adding new facts"
    }}
  ],
  "project_suggestions": [
    {{
      "record_id": 1,
      "title": "string",
      "original_description": "string",
      "suggested_description": "string",
      "rationale": "string"
    }}
  ],
  "experience_suggestions": [
    {{
      "record_id": 1,
      "title": "string",
      "original_description": "string",
      "suggested_description": "string",
      "rationale": "string"
    }}
  ]
}}

CANDIDATE RECORDS:
{json.dumps(input_payload, indent=2)}
"""
    data = _call_gemini_json(prompt, system_instruction)
    return {
        "source": "gemini",
        "model": Config.GEMINI_MODEL,
        "target_role": target_role,
        "summary_suggestions": data.get("summary_suggestions", []),
        "project_suggestions": data.get("project_suggestions", []),
        "experience_suggestions": data.get("experience_suggestions", []),
        "fact_preservation_notice": (
            "Suggestions are displayed for review only. Nothing in your SQLite portfolio is overwritten "
            "unless you explicitly click 'Approve & Apply to Record' or 'Use in Current Resume'."
        ),
    }
