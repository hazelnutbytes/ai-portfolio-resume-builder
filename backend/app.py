import logging
import os
import sys
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from config import Config
from database.db import (
    CATEGORY_CONFIG,
    create_category_record,
    delete_category_record,
    delete_job_description,
    delete_resume_session,
    get_complete_portfolio,
    get_job_description,
    get_recent_sync_logs,
    get_resume_session,
    init_db,
    list_category_records,
    list_job_descriptions,
    list_resume_sessions,
    save_job_analysis,
    save_resume_session,
    update_category_record,
)
from database.seed import seed_database
from services.gemini_service import (
    GeminiServiceError,
    analyze_job_with_gemini,
    match_portfolio_with_gemini,
    organize_unstructured_portfolio,
    suggest_portfolio_improvements,
)
from services.matcher_service import (
    analyze_job_description_deterministic,
    match_portfolio_to_job,
)
from services.pdf_service import build_resume_pdf, generate_resume_filename
from services.sheets_service import (
    get_sheets_service_status,
    sync_portfolio_to_google_sheets,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("portfolio_app")

app = Flask(__name__)
# Enable CORS for frontend Vite dev server (e.g. http://localhost:5173) and any local origins
CORS(app, resources={r"/api/*": {"origins": "*"}})


# Ensure DB is initialized on boot
init_db()


# -------------------------------------------------------------
# Error Handlers
# -------------------------------------------------------------
@app.errorhandler(400)
def bad_request(err):
    return jsonify({"error": "Bad Request", "message": str(err)}), 400


@app.errorhandler(404)
def not_found(err):
    return jsonify({"error": "Not Found", "message": str(err)}), 404


@app.errorhandler(500)
def server_error(err):
    logger.exception("Internal Server Error")
    return jsonify({"error": "Internal Server Error", "message": str(err)}), 500


# -------------------------------------------------------------
# System & Status Endpoints
# -------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify(
        {
            "status": "healthy",
            "app_name": "AI-Powered Portfolio Manager & Dynamic Resume Builder",
            "environment": Config.FLASK_ENV,
            "gemini_configured": Config.is_gemini_configured(),
            "gemini_model": Config.GEMINI_MODEL,
            "sheets_configured": Config.is_sheets_configured()[0],
        }
    )


@app.route("/api/integrations/status", methods=["GET"])
def integrations_status():
    sheets_info = get_sheets_service_status()
    gemini_cfg = Config.is_gemini_configured()
    return jsonify(
        {
            "gemini": {
                "configured": gemini_cfg,
                "model": Config.GEMINI_MODEL,
                "message": (
                    f"Gemini API is active using model '{Config.GEMINI_MODEL}'."
                    if gemini_cfg
                    else "GEMINI_API_KEY is not configured in .env. Rule-based fallback analyzer is active."
                ),
            },
            "google_sheets": sheets_info,
        }
    )


# -------------------------------------------------------------
# Portfolio Management Endpoints
# -------------------------------------------------------------
@app.route("/api/portfolio", methods=["GET"])
def get_portfolio():
    portfolio = get_complete_portfolio()
    return jsonify(portfolio)


@app.route("/api/portfolio/stats", methods=["GET"])
def get_portfolio_stats():
    portfolio = get_complete_portfolio()
    counts = portfolio.get("counts", {})
    categories = portfolio.get("categories", {})

    personal = categories.get("personal_info", [{}])[0] if categories.get("personal_info") else {}
    summary = categories.get("professional_summaries", [{}])[0] if categories.get("professional_summaries") else {}

    return jsonify(
        {
            "candidate_name": personal.get("full_name") or "Portfolio Candidate",
            "headline": personal.get("headline") or "Student / Software Engineer",
            "email": personal.get("email") or "",
            "total_projects": counts.get("projects", 0),
            "total_technical_skills": counts.get("technical_skills", 0),
            "total_soft_skills": counts.get("soft_skills", 0),
            "total_experience": counts.get("experience", 0),
            "total_certifications": counts.get("certifications", 0),
            "total_achievements": counts.get("achievements", 0),
            "total_publications": counts.get("publications", 0),
            "total_education": counts.get("education", 0),
            "total_languages": counts.get("languages", 0),
            "total_extracurricular": counts.get("extracurricular", 0),
            "active_summary": summary.get("content", ""),
            "counts": counts,
        }
    )


@app.route("/api/portfolio/categories", methods=["GET"])
def get_category_metadata():
    metadata = {}
    for cat_key, cfg in CATEGORY_CONFIG.items():
        metadata[cat_key] = {
            "key": cat_key,
            "label": cfg["label"],
            "fields": cfg["fields"],
            "required_fields": cfg["required_fields"],
        }
    return jsonify(metadata)


@app.route("/api/portfolio/<category>", methods=["GET"])
def get_category_items(category):
    try:
        items = list_category_records(category)
        return jsonify(items)
    except ValueError as val_err:
        return jsonify({"error": "Invalid Category", "message": str(val_err)}), 400


@app.route("/api/portfolio/<category>", methods=["POST"])
def add_category_item(category):
    payload = request.get_json(silent=True) or {}
    try:
        record = create_category_record(category, payload)
        return jsonify(record), 201
    except ValueError as val_err:
        return jsonify({"error": "Validation Error", "message": str(val_err)}), 400
    except Exception as exc:
        logger.exception("Failed to add category item")
        return jsonify({"error": "Database Error", "message": str(exc)}), 500


@app.route("/api/portfolio/<category>/<int:record_id>", methods=["PUT"])
def edit_category_item(category, record_id):
    payload = request.get_json(silent=True) or {}
    try:
        record = update_category_record(category, record_id, payload)
        return jsonify(record), 200
    except LookupError as lk_err:
        return jsonify({"error": "Not Found", "message": str(lk_err)}), 404
    except ValueError as val_err:
        return jsonify({"error": "Validation Error", "message": str(val_err)}), 400
    except Exception as exc:
        logger.exception("Failed to update category item")
        return jsonify({"error": "Database Error", "message": str(exc)}), 500


@app.route("/api/portfolio/<category>/<int:record_id>", methods=["DELETE"])
def remove_category_item(category, record_id):
    try:
        deleted = delete_category_record(category, record_id)
        if not deleted:
            return jsonify({"error": "Not Found", "message": f"Record #{record_id} was not found."}), 404
        return jsonify({"success": True, "message": f"Record #{record_id} deleted successfully."}), 200
    except ValueError as val_err:
        return jsonify({"error": "Invalid Category", "message": str(val_err)}), 400


@app.route("/api/portfolio/reset-sample", methods=["POST"])
def reset_sample_portfolio():
    """
    Convenient demonstration endpoint to re-seed the SQLite database with clearly labeled sample data.
    """
    try:
        seed_database(reset=True)
        portfolio = get_complete_portfolio()
        return jsonify(
            {
                "success": True,
                "message": "Portfolio database successfully re-seeded with fictional sample data.",
                "portfolio": portfolio,
            }
        ), 200
    except Exception as exc:
        logger.exception("Reset failed")
        return jsonify({"error": "Reset Failed", "message": str(exc)}), 500


# -------------------------------------------------------------
# Gemini AI Endpoints
# -------------------------------------------------------------
@app.route("/api/ai/organize", methods=["POST"])
def ai_organize_unstructured():
    """
    Feature 3A: Accept unstructured text pasted by user.
    Extracts structured candidate records for review.
    Does NOT auto-commit into DB without user approval.
    """
    payload = request.get_json(silent=True) or {}
    raw_text = str(payload.get("raw_text") or "").strip()
    if not raw_text:
        return jsonify({"error": "Validation Error", "message": "Pasted text cannot be empty."}), 400

    try:
        extracted = organize_unstructured_portfolio(raw_text)
        return jsonify(extracted)
    except GeminiServiceError as g_err:
        return jsonify({"error": g_err.error_code, "message": g_err.message}), g_err.status_code
    except Exception as exc:
        logger.exception("AI Organize failed")
        return jsonify({"error": "AI_ERROR", "message": str(exc)}), 500


@app.route("/api/ai/organize/commit", methods=["POST"])
def ai_commit_approved_items():
    """
    Saves the user-reviewed/edited items from unstructured parsing into SQLite.
    """
    payload = request.get_json(silent=True) or {}
    items_to_save = payload.get("items") or {}

    created_counts = {}
    errors = []

    for category, records in items_to_save.items():
        if category not in CATEGORY_CONFIG:
            continue
        created_counts[category] = 0
        for rec in records:
            try:
                create_category_record(category, rec)
                created_counts[category] += 1
            except Exception as exc:
                errors.append(f"{category}: {exc}")

    return jsonify(
        {
            "success": len(errors) == 0,
            "created_counts": created_counts,
            "errors": errors,
            "message": f"Saved {sum(created_counts.values())} approved records into your portfolio.",
        }
    )


@app.route("/api/ai/suggestions", methods=["POST"])
def ai_suggestions():
    """
    Feature 3D: Fact-preserving wording improvements for professional summary,
    projects, and experience. Displays separately for review.
    """
    payload = request.get_json(silent=True) or {}
    target_role = str(payload.get("target_role") or "").strip()
    job_description = str(payload.get("job_description") or "").strip()

    portfolio = get_complete_portfolio()
    try:
        suggestions = suggest_portfolio_improvements(portfolio, target_role, job_description)
        return jsonify(suggestions)
    except GeminiServiceError as g_err:
        return jsonify({"error": g_err.error_code, "message": g_err.message}), g_err.status_code
    except Exception as exc:
        logger.exception("Suggestions failed")
        return jsonify({"error": "AI_ERROR", "message": str(exc)}), 500


# -------------------------------------------------------------
# Job Description Analysis & Matching
# -------------------------------------------------------------
@app.route("/api/jobs", methods=["GET"])
def list_jobs():
    jobs = list_job_descriptions()
    return jsonify(jobs)


@app.route("/api/jobs/<int:job_id>", methods=["GET"])
def get_job(job_id):
    job = get_job_description(job_id)
    if not job:
        return jsonify({"error": "Not Found", "message": f"Job #{job_id} not found."}), 404
    return jsonify(job)


@app.route("/api/jobs/<int:job_id>", methods=["DELETE"])
def remove_job(job_id):
    deleted = delete_job_description(job_id)
    if not deleted:
        return jsonify({"error": "Not Found", "message": f"Job #{job_id} not found."}), 404
    return jsonify({"success": True, "message": "Job description deleted."}), 200


@app.route("/api/jobs/analyze", methods=["POST"])
def analyze_and_match_job():
    """
    Features 3B & 3C:
    1. Analyzes job description (via Gemini if configured, else deterministic fallback).
    2. Matches against SQLite portfolio evidence.
    3. Returns matched, partially matched, and missing/unsupported requirements citing exact records.
    4. Optionally saves the analysis to SQLite if 'save' flag is True.
    """
    payload = request.get_json(silent=True) or {}
    raw_text = str(payload.get("raw_text") or "").strip()
    title_hint = str(payload.get("title") or "").strip()
    company_hint = str(payload.get("company") or "").strip()
    save_result = payload.get("save", True)
    existing_job_id = payload.get("job_id")
    force_mode = payload.get("mode")  # 'gemini' | 'rule_based' | None (auto)

    if not raw_text:
        return jsonify({"error": "Validation Error", "message": "Job description text cannot be empty."}), 400

    portfolio = get_complete_portfolio()
    gemini_available = Config.is_gemini_configured() and force_mode != "rule_based"

    extracted_data = None
    match_results = None
    analysis_source = "rule_based"
    ai_warning = None

    if gemini_available or force_mode == "gemini":
        try:
            extracted_data = analyze_job_with_gemini(raw_text, title_hint, company_hint)
            match_results = match_portfolio_with_gemini(portfolio, extracted_data)
            analysis_source = "gemini"
        except GeminiServiceError as g_err:
            if force_mode == "gemini":
                return jsonify({"error": g_err.error_code, "message": g_err.message}), g_err.status_code
            logger.warning("Gemini failed, falling back to rule-based: %s", g_err.message)
            ai_warning = f"Gemini API was unavailable ({g_err.message}). Used deterministic keyword matching fallback."
        except Exception as exc:
            if force_mode == "gemini":
                return jsonify({"error": "GEMINI_ERROR", "message": str(exc)}), 500
            ai_warning = f"Gemini error: {exc}. Used deterministic keyword matching fallback."

    if not extracted_data:
        extracted_data = analyze_job_description_deterministic(raw_text, title_hint, company_hint)
        match_results = match_portfolio_to_job(portfolio, extracted_data)
        analysis_source = "rule_based"

    saved_row = None
    if save_result:
        saved_row = save_job_analysis(
            portfolio_id=1,
            title=extracted_data.get("job_title") or title_hint or "Target Role",
            company=extracted_data.get("company") or company_hint or "",
            raw_text=raw_text,
            analysis_source=analysis_source,
            extracted_data=extracted_data,
            match_results=match_results,
            is_sample=0,
            job_id=existing_job_id,
        )

    response_data = {
        "job": saved_row,
        "extracted_data": extracted_data,
        "match_results": match_results,
        "analysis_source": analysis_source,
        "ai_warning": ai_warning,
    }
    return jsonify(response_data), 200


# -------------------------------------------------------------
# Dynamic Resume Builder & PDF Generation
# -------------------------------------------------------------
@app.route("/api/resumes", methods=["GET"])
def list_resumes():
    sessions = list_resume_sessions()
    return jsonify(sessions)


@app.route("/api/resumes/<int:session_id>", methods=["GET"])
def get_resume(session_id):
    session = get_resume_session(session_id)
    if not session:
        return jsonify({"error": "Not Found", "message": f"Resume session #{session_id} not found."}), 404
    return jsonify(session)


@app.route("/api/resumes", methods=["POST"])
def create_or_update_resume():
    payload = request.get_json(silent=True) or {}
    try:
        session = save_resume_session(payload)
        return jsonify(session), 200
    except Exception as exc:
        logger.exception("Failed to save resume session")
        return jsonify({"error": "Save Error", "message": str(exc)}), 500


@app.route("/api/resumes/<int:session_id>", methods=["DELETE"])
def remove_resume(session_id):
    deleted = delete_resume_session(session_id)
    if not deleted:
        return jsonify({"error": "Not Found", "message": f"Resume session #{session_id} not found."}), 404
    return jsonify({"success": True, "message": "Resume session deleted."}), 200


@app.route("/api/resumes/preview", methods=["POST"])
def preview_resume_data():
    """
    Prepares the resume payload for live client-side preview rendering.
    Filters portfolio records according to `selected_records` and `section_order`.
    """
    session_config = request.get_json(silent=True) or {}
    portfolio = get_complete_portfolio()
    categories = portfolio.get("categories", {})

    personal_list = categories.get("personal_info", [])
    personal = personal_list[0] if personal_list else {}

    selected_records = session_config.get("selected_records") or {}
    optional_sections = session_config.get("optional_sections") or {}
    section_order = session_config.get("section_order") or [
        "summary",
        "education",
        "technical_skills",
        "experience",
        "projects",
        "certifications",
        "achievements",
        "publications",
        "extracurricular",
        "languages",
        "soft_skills",
    ]

    filtered_sections = {}
    for cat_key, items in categories.items():
        if cat_key in ("personal_info", "professional_summaries"):
            continue
        allowed_ids = selected_records.get(cat_key)
        if allowed_ids is None:
            filtered_sections[cat_key] = items
        else:
            filtered_sections[cat_key] = [i for i in items if int(i["id"]) in allowed_ids]

    summary_text = (
        session_config.get("custom_summary")
        or (categories.get("professional_summaries", [{}])[0].get("content", ""))
    )

    return jsonify(
        {
            "personal_info": personal,
            "custom_summary": summary_text,
            "target_role": session_config.get("target_role") or "Software Engineer",
            "target_company": session_config.get("target_company") or "",
            "template_name": session_config.get("template_name") or "classic_ats",
            "section_order": section_order,
            "optional_sections": optional_sections,
            "filtered_sections": filtered_sections,
            "suggested_filename": generate_resume_filename(
                personal.get("full_name") or "Candidate",
                session_config.get("target_role") or "Resume",
            ),
        }
    )


@app.route("/api/resumes/generate-pdf", methods=["POST"])
def generate_pdf_endpoint():
    """
    Builds the ATS-friendly PDF using ReportLab and returns the filename and download URL.
    """
    session_config = request.get_json(silent=True) or {}
    portfolio = get_complete_portfolio()
    personal_list = portfolio.get("categories", {}).get("personal_info", [])
    cand_name = personal_list[0].get("full_name") if personal_list else "Candidate"
    target_role = session_config.get("target_role") or "Resume"

    filename = generate_resume_filename(cand_name, target_role)
    out_path = Config.GENERATED_RESUMES_DIR / filename

    try:
        build_resume_pdf(portfolio, session_config, out_path)

        # Update session with filename if session_id passed
        if session_config.get("id"):
            session_config["last_pdf_filename"] = filename
            save_resume_session(session_config)

        return jsonify(
            {
                "success": True,
                "filename": filename,
                "download_url": f"/api/resumes/download-pdf/{filename}",
                "file_size_bytes": out_path.stat().st_size,
            }
        )
    except Exception as exc:
        logger.exception("Failed to build PDF")
        return jsonify({"error": "PDF Generation Failed", "message": str(exc)}), 500


@app.route("/api/resumes/download-pdf/<filename>", methods=["GET"])
def download_pdf_file(filename):
    # Sanitize filename to prevent directory traversal
    safe_name = os.path.basename(filename)
    file_path = Config.GENERATED_RESUMES_DIR / safe_name
    if not file_path.exists():
        return jsonify({"error": "Not Found", "message": f"File '{safe_name}' does not exist."}), 404

    as_attachment = request.args.get("attachment", "false").lower() in ("true", "1")
    return send_file(
        str(file_path),
        mimetype="application/pdf",
        as_attachment=as_attachment,
        download_name=safe_name,
    )


# -------------------------------------------------------------
# Google Sheets Synchronization
# -------------------------------------------------------------
@app.route("/api/sheets/status", methods=["GET"])
def sheets_status():
    status_info = get_sheets_service_status()
    return jsonify(status_info)


@app.route("/api/sheets/sync", methods=["POST"])
def trigger_sheets_sync():
    """
    Feature 5: Manual 'Sync to Google Sheets'.
    Updates existing records, creates missing tabs, never fakes success.
    """
    portfolio = get_complete_portfolio()
    result = sync_portfolio_to_google_sheets(portfolio)
    status_code = 200 if result.get("success") else (503 if result.get("status") == "UNCONFIGURED" else 500)
    return jsonify(result), status_code


@app.route("/api/sheets/logs", methods=["GET"])
def get_sheets_sync_logs():
    limit = int(request.args.get("limit", 10))
    logs = get_recent_sync_logs(portfolio_id=1, limit=limit)
    return jsonify(logs)


# -------------------------------------------------------------
# Main Application Launcher
# -------------------------------------------------------------
if __name__ == "__main__":
    port = Config.FLASK_PORT
    print(f"Starting Flask server on http://localhost:{port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
