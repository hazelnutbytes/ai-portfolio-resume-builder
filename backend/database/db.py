import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import Config

SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"

# Supported portfolio categories and their table / field definitions
CATEGORY_CONFIG: dict[str, dict[str, Any]] = {
    "personal_info": {
        "table": "personal_info",
        "label": "Personal Information & Contact Details",
        "required_fields": ["full_name", "email"],
        "fields": [
            "full_name",
            "headline",
            "email",
            "phone",
            "location",
            "linkedin",
            "github",
            "portfolio_url",
            "is_sample",
        ],
    },
    "professional_summaries": {
        "table": "professional_summaries",
        "label": "Professional Summary",
        "required_fields": ["title", "content"],
        "fields": ["title", "target_role", "content", "is_default", "is_sample"],
    },
    "education": {
        "table": "education",
        "label": "Education",
        "required_fields": ["institution", "degree", "field_of_study", "start_date"],
        "fields": [
            "institution",
            "degree",
            "field_of_study",
            "start_date",
            "end_date",
            "grade",
            "location",
            "coursework",
            "description",
            "is_sample",
        ],
    },
    "technical_skills": {
        "table": "technical_skills",
        "label": "Technical Skills",
        "required_fields": ["skill_name", "category"],
        "fields": [
            "skill_name",
            "category",
            "proficiency",
            "years_experience",
            "evidence_note",
            "is_sample",
        ],
    },
    "soft_skills": {
        "table": "soft_skills",
        "label": "Soft Skills",
        "required_fields": ["skill_name"],
        "fields": ["skill_name", "proficiency", "context", "is_sample"],
    },
    "certifications": {
        "table": "certifications",
        "label": "Certifications & Courses",
        "required_fields": ["name", "issuing_organization", "issue_date"],
        "fields": [
            "name",
            "issuing_organization",
            "issue_date",
            "expiry_date",
            "credential_id",
            "credential_url",
            "skills_covered",
            "is_sample",
        ],
    },
    "projects": {
        "table": "projects",
        "label": "Projects",
        "required_fields": ["title", "tech_stack", "description"],
        "fields": [
            "title",
            "role",
            "tech_stack",
            "start_date",
            "end_date",
            "project_url",
            "github_url",
            "description",
            "highlights",
            "metrics",
            "is_sample",
        ],
    },
    "experience": {
        "table": "experience",
        "label": "Internships & Work Experience",
        "required_fields": ["company", "role", "start_date", "description"],
        "fields": [
            "company",
            "role",
            "employment_type",
            "location",
            "start_date",
            "end_date",
            "technologies",
            "description",
            "achievements",
            "is_sample",
        ],
    },
    "achievements": {
        "table": "achievements",
        "label": "Achievements & Awards",
        "required_fields": ["title", "issuer", "date_awarded", "description"],
        "fields": [
            "title",
            "issuer",
            "date_awarded",
            "category",
            "description",
            "impact",
            "is_sample",
        ],
    },
    "publications": {
        "table": "publications",
        "label": "Publications",
        "required_fields": ["title", "venue", "publication_date", "authors", "summary"],
        "fields": [
            "title",
            "venue",
            "publication_date",
            "authors",
            "url",
            "doi",
            "summary",
            "is_sample",
        ],
    },
    "languages": {
        "table": "languages",
        "label": "Languages",
        "required_fields": ["language_name", "proficiency_level"],
        "fields": [
            "language_name",
            "proficiency_level",
            "certification",
            "notes",
            "is_sample",
        ],
    },
    "extracurricular": {
        "table": "extracurricular",
        "label": "Extracurricular Activities",
        "required_fields": ["organization", "role", "start_date", "description"],
        "fields": [
            "organization",
            "role",
            "start_date",
            "end_date",
            "description",
            "contributions",
            "is_sample",
        ],
    },
}


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def get_connection() -> sqlite3.Connection:
    db_path = Config.DATABASE_PATH
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
        conn.executescript(schema_sql)
        conn.commit()
    finally:
        conn.close()


def sanitize_text(value: Any, max_len: int = 10000) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if len(text) > max_len:
        text = text[:max_len]
    return text


def validate_category_payload(category: str, payload: dict[str, Any]) -> tuple[bool, list[str], dict[str, Any]]:
    if category not in CATEGORY_CONFIG:
        return False, [f"Unsupported category: '{category}'"], {}

    cfg = CATEGORY_CONFIG[category]
    errors: list[str] = []
    cleaned: dict[str, Any] = {}

    for field in cfg["fields"]:
        if field in ("is_sample", "is_default"):
            val = payload.get(field, 0)
            cleaned[field] = 1 if val in (1, True, "1", "true", "True") else 0
        else:
            cleaned[field] = sanitize_text(payload.get(field, ""), max_len=5000)

    for req_field in cfg["required_fields"]:
        if not cleaned.get(req_field):
            readable = req_field.replace("_", " ").title()
            errors.append(f"{readable} is required.")

    if category == "personal_info" and cleaned.get("email"):
        email = cleaned["email"]
        if "@" not in email or "." not in email.split("@")[-1]:
            errors.append("Please provide a valid email address.")

    return len(errors) == 0, errors, cleaned


def get_all_portfolios() -> list[dict[str, Any]]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM portfolios ORDER BY id ASC").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def ensure_default_portfolio(conn: sqlite3.Connection) -> int:
    row = conn.execute("SELECT id FROM portfolios ORDER BY id ASC LIMIT 1").fetchone()
    if row:
        return int(row["id"])
    ts = now_iso()
    cur = conn.execute(
        "INSERT INTO portfolios (name, description, is_sample, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (
            "Primary Student Portfolio (Sample Data)",
            "Comprehensive academic and technical portfolio for college project demonstration.",
            1,
            ts,
            ts,
        ),
    )
    conn.commit()
    return int(cur.lastrowid)


def resolve_portfolio_id(conn: sqlite3.Connection, portfolio_id: int | None = None) -> int:
    if portfolio_id and portfolio_id > 0:
        row = conn.execute("SELECT id FROM portfolios WHERE id = ?", (portfolio_id,)).fetchone()
        if row:
            return int(row["id"])
    row = conn.execute("SELECT id FROM portfolios ORDER BY id ASC LIMIT 1").fetchone()
    if row:
        return int(row["id"])
    return ensure_default_portfolio(conn)


def get_complete_portfolio(portfolio_id: int | None = None) -> dict[str, Any]:
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        p_row = conn.execute("SELECT * FROM portfolios WHERE id = ?", (pid,)).fetchone()

        result: dict[str, Any] = {
            "portfolio": dict(p_row) if p_row else {"id": pid, "name": "Default Portfolio"},
            "categories": {},
            "counts": {},
        }

        for cat_key, cfg in CATEGORY_CONFIG.items():
            table = cfg["table"]
            rows = conn.execute(
                f"SELECT * FROM {table} WHERE portfolio_id = ? ORDER BY id ASC",
                (pid,),
            ).fetchall()
            items = [dict(r) for r in rows]
            result["categories"][cat_key] = items
            result["counts"][cat_key] = len(items)

        return result
    finally:
        conn.close()


def list_category_records(category: str, portfolio_id: int | None = None) -> list[dict[str, Any]]:
    if category not in CATEGORY_CONFIG:
        raise ValueError(f"Unknown category: {category}")
    table = CATEGORY_CONFIG[category]["table"]
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        rows = conn.execute(
            f"SELECT * FROM {table} WHERE portfolio_id = ? ORDER BY id ASC",
            (pid,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def create_category_record(category: str, payload: dict[str, Any], portfolio_id: int | None = None) -> dict[str, Any]:
    valid, errors, cleaned = validate_category_payload(category, payload)
    if not valid:
        raise ValueError("; ".join(errors))

    table = CATEGORY_CONFIG[category]["table"]
    ts = now_iso()
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        fields = ["portfolio_id"] + list(cleaned.keys()) + ["created_at", "updated_at"]
        placeholders = ", ".join(["?"] * len(fields))
        col_names = ", ".join(fields)
        values = [pid] + [cleaned[k] for k in cleaned.keys()] + [ts, ts]

        cur = conn.execute(
            f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})",
            values,
        )
        conn.commit()
        new_id = cur.lastrowid
        row = conn.execute(f"SELECT * FROM {table} WHERE id = ?", (new_id,)).fetchone()
        return dict(row)
    finally:
        conn.close()


def update_category_record(
    category: str, record_id: int, payload: dict[str, Any], portfolio_id: int | None = None
) -> dict[str, Any]:
    valid, errors, cleaned = validate_category_payload(category, payload)
    if not valid:
        raise ValueError("; ".join(errors))

    table = CATEGORY_CONFIG[category]["table"]
    ts = now_iso()
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        existing = conn.execute(
            f"SELECT * FROM {table} WHERE id = ? AND portfolio_id = ?",
            (record_id, pid),
        ).fetchone()
        if not existing:
            raise LookupError(f"Record #{record_id} not found in {category}.")

        set_clause = ", ".join([f"{k} = ?" for k in cleaned.keys()] + ["updated_at = ?"])
        values = [cleaned[k] for k in cleaned.keys()] + [ts, record_id, pid]
        conn.execute(
            f"UPDATE {table} SET {set_clause} WHERE id = ? AND portfolio_id = ?",
            values,
        )
        conn.commit()
        row = conn.execute(f"SELECT * FROM {table} WHERE id = ?", (record_id,)).fetchone()
        return dict(row)
    finally:
        conn.close()


def delete_category_record(category: str, record_id: int, portfolio_id: int | None = None) -> bool:
    if category not in CATEGORY_CONFIG:
        raise ValueError(f"Unknown category: {category}")
    table = CATEGORY_CONFIG[category]["table"]
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        cur = conn.execute(
            f"DELETE FROM {table} WHERE id = ? AND portfolio_id = ?",
            (record_id, pid),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def save_job_analysis(
    portfolio_id: int,
    title: str,
    company: str,
    raw_text: str,
    analysis_source: str,
    extracted_data: dict[str, Any],
    match_results: dict[str, Any],
    is_sample: int = 0,
    job_id: int | None = None,
) -> dict[str, Any]:
    ts = now_iso()
    conn = get_connection()
    try:
        ensure_default_portfolio(conn)
        if job_id:
            conn.execute(
                """
                UPDATE job_descriptions
                SET title = ?, company = ?, raw_text = ?, analysis_source = ?,
                    extracted_data_json = ?, match_results_json = ?, updated_at = ?
                WHERE id = ? AND portfolio_id = ?
                """,
                (
                    sanitize_text(title, 300) or "Target Role",
                    sanitize_text(company, 300),
                    sanitize_text(raw_text, 25000),
                    analysis_source,
                    json.dumps(extracted_data),
                    json.dumps(match_results),
                    ts,
                    job_id,
                    portfolio_id,
                ),
            )
            conn.commit()
            target_id = job_id
        else:
            cur = conn.execute(
                """
                INSERT INTO job_descriptions
                (portfolio_id, title, company, raw_text, analysis_source, extracted_data_json, match_results_json, is_sample, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    portfolio_id,
                    sanitize_text(title, 300) or "Target Role",
                    sanitize_text(company, 300),
                    sanitize_text(raw_text, 25000),
                    analysis_source,
                    json.dumps(extracted_data),
                    json.dumps(match_results),
                    is_sample,
                    ts,
                    ts,
                ),
            )
            conn.commit()
            target_id = cur.lastrowid

        row = conn.execute("SELECT * FROM job_descriptions WHERE id = ?", (target_id,)).fetchone()
        return _format_job_row(dict(row))
    finally:
        conn.close()


def _format_job_row(d: dict[str, Any]) -> dict[str, Any]:
    try:
        d["extracted_data"] = json.loads(d.get("extracted_data_json") or "{}")
    except Exception:
        d["extracted_data"] = {}
    try:
        d["match_results"] = json.loads(d.get("match_results_json") or "{}")
    except Exception:
        d["match_results"] = {}
    return d


def list_job_descriptions(portfolio_id: int | None = None) -> list[dict[str, Any]]:
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        rows = conn.execute(
            "SELECT * FROM job_descriptions WHERE portfolio_id = ? ORDER BY id DESC",
            (pid,),
        ).fetchall()
        return [_format_job_row(dict(r)) for r in rows]
    finally:
        conn.close()


def get_job_description(job_id: int, portfolio_id: int | None = None) -> dict[str, Any] | None:
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        row = conn.execute(
            "SELECT * FROM job_descriptions WHERE id = ? AND portfolio_id = ?",
            (job_id, pid),
        ).fetchone()
        return _format_job_row(dict(row)) if row else None
    finally:
        conn.close()


def delete_job_description(job_id: int, portfolio_id: int | None = None) -> bool:
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        cur = conn.execute(
            "DELETE FROM job_descriptions WHERE id = ? AND portfolio_id = ?",
            (job_id, pid),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def _format_resume_session_row(d: dict[str, Any]) -> dict[str, Any]:
    for key, out_key, default_val in [
        ("section_order_json", "section_order", []),
        ("selected_records_json", "selected_records", {}),
        ("optional_sections_json", "optional_sections", {}),
    ]:
        try:
            d[out_key] = json.loads(d.get(key) or json.dumps(default_val))
        except Exception:
            d[out_key] = default_val
    return d


def list_resume_sessions(portfolio_id: int | None = None) -> list[dict[str, Any]]:
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        rows = conn.execute(
            "SELECT * FROM resume_sessions WHERE portfolio_id = ? ORDER BY updated_at DESC, id DESC",
            (pid,),
        ).fetchall()
        return [_format_resume_session_row(dict(r)) for r in rows]
    finally:
        conn.close()


def get_resume_session(session_id: int, portfolio_id: int | None = None) -> dict[str, Any] | None:
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        row = conn.execute(
            "SELECT * FROM resume_sessions WHERE id = ? AND portfolio_id = ?",
            (session_id, pid),
        ).fetchone()
        return _format_resume_session_row(dict(row)) if row else None
    finally:
        conn.close()


def save_resume_session(payload: dict[str, Any], portfolio_id: int | None = None) -> dict[str, Any]:
    ts = now_iso()
    session_id = payload.get("id")
    session_name = sanitize_text(payload.get("session_name") or "Tailored Resume", 250)
    target_role = sanitize_text(payload.get("target_role") or "Software Engineer", 250)
    target_company = sanitize_text(payload.get("target_company") or "", 250)
    template_name = sanitize_text(payload.get("template_name") or "classic_ats", 100)
    custom_summary = sanitize_text(payload.get("custom_summary") or "", 5000)
    job_description_id = payload.get("job_description_id")
    section_order = payload.get("section_order") or [
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
    selected_records = payload.get("selected_records") or {}
    optional_sections = payload.get("optional_sections") or {}
    last_pdf_filename = sanitize_text(payload.get("last_pdf_filename") or "", 300)
    is_sample = 1 if payload.get("is_sample") in (1, True, "1", "true") else 0

    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        if session_id:
            existing = conn.execute(
                "SELECT id FROM resume_sessions WHERE id = ? AND portfolio_id = ?",
                (session_id, pid),
            ).fetchone()
            if existing:
                conn.execute(
                    """
                    UPDATE resume_sessions
                    SET job_description_id = ?, session_name = ?, target_role = ?, target_company = ?,
                        template_name = ?, custom_summary = ?, section_order_json = ?,
                        selected_records_json = ?, optional_sections_json = ?,
                        last_pdf_filename = ?, updated_at = ?
                    WHERE id = ? AND portfolio_id = ?
                    """,
                    (
                        job_description_id,
                        session_name,
                        target_role,
                        target_company,
                        template_name,
                        custom_summary,
                        json.dumps(section_order),
                        json.dumps(selected_records),
                        json.dumps(optional_sections),
                        last_pdf_filename,
                        ts,
                        session_id,
                        pid,
                    ),
                )
                conn.commit()
                row = conn.execute("SELECT * FROM resume_sessions WHERE id = ?", (session_id,)).fetchone()
                return _format_resume_session_row(dict(row))

        cur = conn.execute(
            """
            INSERT INTO resume_sessions
            (portfolio_id, job_description_id, session_name, target_role, target_company,
             template_name, custom_summary, section_order_json, selected_records_json,
             optional_sections_json, last_pdf_filename, is_sample, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                pid,
                job_description_id,
                session_name,
                target_role,
                target_company,
                template_name,
                custom_summary,
                json.dumps(section_order),
                json.dumps(selected_records),
                json.dumps(optional_sections),
                last_pdf_filename,
                is_sample,
                ts,
                ts,
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM resume_sessions WHERE id = ?", (cur.lastrowid,)).fetchone()
        return _format_resume_session_row(dict(row))
    finally:
        conn.close()


def delete_resume_session(session_id: int, portfolio_id: int | None = None) -> bool:
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        cur = conn.execute(
            "DELETE FROM resume_sessions WHERE id = ? AND portfolio_id = ?",
            (session_id, pid),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def log_sync_event(
    portfolio_id: int | None,
    status: str,
    spreadsheet_id: str,
    message: str,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    ts = now_iso()
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        cur = conn.execute(
            """
            INSERT INTO sync_logs (portfolio_id, status, spreadsheet_id, message, details_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (pid, status, spreadsheet_id, message, json.dumps(details or {}), ts),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM sync_logs WHERE id = ?", (cur.lastrowid,)).fetchone()
        d = dict(row)
        d["details"] = details or {}
        return d
    finally:
        conn.close()


def get_recent_sync_logs(portfolio_id: int | None = None, limit: int = 10) -> list[dict[str, Any]]:
    conn = get_connection()
    try:
        pid = resolve_portfolio_id(conn, portfolio_id)
        rows = conn.execute(
            "SELECT * FROM sync_logs WHERE portfolio_id = ? ORDER BY id DESC LIMIT ?",
            (pid, limit),
        ).fetchall()
        out = []
        for r in rows:
            d = dict(r)
            try:
                d["details"] = json.loads(d.get("details_json") or "{}")
            except Exception:
                d["details"] = {}
            out.append(d)
        return out
    finally:
        conn.close()
