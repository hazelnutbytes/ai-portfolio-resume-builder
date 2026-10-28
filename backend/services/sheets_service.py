import json
import logging
from typing import Any

from config import Config
from database.db import log_sync_event

logger = logging.getLogger(__name__)

# Scopes needed for Google Sheets & Drive
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
]

# Tab definitions: Tab Title -> (Category Key, Header Columns)
SHEET_TABS = {
    "Personal Information": {
        "category": "personal_info",
        "headers": [
            "Record ID",
            "Full Name",
            "Headline",
            "Email",
            "Phone",
            "Location",
            "LinkedIn",
            "GitHub",
            "Portfolio URL",
            "Last Updated",
        ],
        "row_fn": lambda r: [
            r.get("id", ""),
            r.get("full_name", ""),
            r.get("headline", ""),
            r.get("email", ""),
            r.get("phone", ""),
            r.get("location", ""),
            r.get("linkedin", ""),
            r.get("github", ""),
            r.get("portfolio_url", ""),
            r.get("updated_at", ""),
        ],
    },
    "Education": {
        "category": "education",
        "headers": [
            "Record ID",
            "Institution",
            "Degree",
            "Field of Study",
            "Start Date",
            "End Date",
            "Grade / GPA",
            "Location",
            "Coursework",
            "Last Updated",
        ],
        "row_fn": lambda r: [
            r.get("id", ""),
            r.get("institution", ""),
            r.get("degree", ""),
            r.get("field_of_study", ""),
            r.get("start_date", ""),
            r.get("end_date", ""),
            r.get("grade", ""),
            r.get("location", ""),
            r.get("coursework", ""),
            r.get("updated_at", ""),
        ],
    },
    "Technical Skills": {
        "category": "technical_skills",
        "headers": [
            "Record ID",
            "Skill Name",
            "Category",
            "Proficiency",
            "Years Experience",
            "Evidence Note",
            "Last Updated",
        ],
        "row_fn": lambda r: [
            r.get("id", ""),
            r.get("skill_name", ""),
            r.get("category", ""),
            r.get("proficiency", ""),
            r.get("years_experience", ""),
            r.get("evidence_note", ""),
            r.get("updated_at", ""),
        ],
    },
    "Projects": {
        "category": "projects",
        "headers": [
            "Record ID",
            "Project Title",
            "Role",
            "Tech Stack",
            "Start Date",
            "End Date",
            "GitHub URL",
            "Demo URL",
            "Description",
            "Key Metrics",
            "Last Updated",
        ],
        "row_fn": lambda r: [
            r.get("id", ""),
            r.get("title", ""),
            r.get("role", ""),
            r.get("tech_stack", ""),
            r.get("start_date", ""),
            r.get("end_date", ""),
            r.get("github_url", ""),
            r.get("project_url", ""),
            r.get("description", ""),
            r.get("metrics", ""),
            r.get("updated_at", ""),
        ],
    },
    "Experience": {
        "category": "experience",
        "headers": [
            "Record ID",
            "Company",
            "Role",
            "Employment Type",
            "Location",
            "Start Date",
            "End Date",
            "Technologies",
            "Description",
            "Key Achievements",
            "Last Updated",
        ],
        "row_fn": lambda r: [
            r.get("id", ""),
            r.get("company", ""),
            r.get("role", ""),
            r.get("employment_type", ""),
            r.get("location", ""),
            r.get("start_date", ""),
            r.get("end_date", ""),
            r.get("technologies", ""),
            r.get("description", ""),
            r.get("achievements", ""),
            r.get("updated_at", ""),
        ],
    },
    "Certifications": {
        "category": "certifications",
        "headers": [
            "Record ID",
            "Certification Name",
            "Issuing Organization",
            "Issue Date",
            "Expiry Date",
            "Credential ID",
            "Skills Covered",
            "Last Updated",
        ],
        "row_fn": lambda r: [
            r.get("id", ""),
            r.get("name", ""),
            r.get("issuing_organization", ""),
            r.get("issue_date", ""),
            r.get("expiry_date", ""),
            r.get("credential_id", ""),
            r.get("skills_covered", ""),
            r.get("updated_at", ""),
        ],
    },
    "Achievements": {
        "category": "achievements",
        "headers": [
            "Record ID",
            "Achievement Title",
            "Issuer",
            "Date Awarded",
            "Category",
            "Description",
            "Impact",
            "Last Updated",
        ],
        "row_fn": lambda r: [
            r.get("id", ""),
            r.get("title", ""),
            r.get("issuer", ""),
            r.get("date_awarded", ""),
            r.get("category", ""),
            r.get("description", ""),
            r.get("impact", ""),
            r.get("updated_at", ""),
        ],
    },
}


def get_sheets_credentials():
    """
    Loads Google Service Account credentials from either JSON string or file.
    Returns credentials object or None.
    """
    from google.oauth2 import service_account

    if Config.GOOGLE_SERVICE_ACCOUNT_JSON:
        try:
            info = json.loads(Config.GOOGLE_SERVICE_ACCOUNT_JSON)
            return service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
        except Exception as exc:
            raise ValueError(f"Invalid GOOGLE_SERVICE_ACCOUNT_JSON format: {exc}") from exc

    sa_path = Config.get_service_account_path()
    if sa_path and sa_path.exists():
        try:
            return service_account.Credentials.from_service_account_file(str(sa_path), scopes=SCOPES)
        except Exception as exc:
            raise ValueError(f"Failed to read service account file '{sa_path.name}': {exc}") from exc

    return None


def get_sheets_service_status() -> dict[str, Any]:
    """
    Checks whether Google Sheets integration is configured and accessible.
    Never pretends it is connected if unconfigured.
    """
    is_cfg, msg = Config.is_sheets_configured()
    spreadsheet_id = Config.GOOGLE_SPREADSHEET_ID

    sa_email = None
    if is_cfg:
        try:
            creds = get_sheets_credentials()
            if creds and hasattr(creds, "service_account_email"):
                sa_email = creds.service_account_email
        except Exception:
            pass

    return {
        "configured": is_cfg,
        "message": msg,
        "spreadsheet_id": spreadsheet_id if is_cfg else None,
        "spreadsheet_url": (
            f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit"
            if is_cfg and spreadsheet_id
            else None
        ),
        "service_account_email": sa_email,
        "setup_guide": (
            "To connect Google Sheets:\n"
            "1. Create a Google Cloud Project and enable 'Google Sheets API'.\n"
            "2. Create a Service Account and download its JSON key.\n"
            "3. Place the key at 'backend/service_account.json' (or set GOOGLE_SERVICE_ACCOUNT_FILE in .env).\n"
            "4. Create a Google Sheet and share it with the service account email with 'Editor' permissions.\n"
            "5. Copy the Spreadsheet ID from the URL into GOOGLE_SPREADSHEET_ID in your .env file."
        ),
    }


def sync_portfolio_to_google_sheets(portfolio_data: dict[str, Any], portfolio_id: int = 1) -> dict[str, Any]:
    """
    Performs full synchronization of portfolio categories to Google Sheets tabs.
    - Creates missing category tabs.
    - Reads existing rows by 'Record ID' to update existing records idempotently rather than duplicating.
    - Adds new records.
    - Returns structured status and logs the event in SQLite.
    """
    is_cfg, msg = Config.is_sheets_configured()
    if not is_cfg:
        result = {
            "success": False,
            "status": "UNCONFIGURED",
            "message": f"Google Sheets is not configured: {msg}",
            "tabs_synced": 0,
            "records_synced": 0,
        }
        log_sync_event(portfolio_id, "UNCONFIGURED", Config.GOOGLE_SPREADSHEET_ID, result["message"], result)
        return result

    try:
        from googleapiclient.discovery import build
        from googleapiclient.errors import HttpError
    except ImportError as exc:
        result = {
            "success": False,
            "status": "DEPENDENCY_ERROR",
            "message": "google-api-python-client is not installed in the backend environment.",
            "tabs_synced": 0,
            "records_synced": 0,
        }
        log_sync_event(portfolio_id, "ERROR", Config.GOOGLE_SPREADSHEET_ID, result["message"], result)
        return result

    try:
        credentials = get_sheets_credentials()
        if not credentials:
            result = {
                "success": False,
                "status": "MISSING_CREDENTIALS",
                "message": "Service account credentials could not be loaded from configuration.",
            }
            log_sync_event(portfolio_id, "ERROR", Config.GOOGLE_SPREADSHEET_ID, result["message"], result)
            return result

        sheets_client = build("sheets", "v4", credentials=credentials)
        spreadsheet_id = Config.GOOGLE_SPREADSHEET_ID

        # 1. Fetch spreadsheet metadata to get existing sheet/tab names
        meta = sheets_client.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        existing_sheets = {s["properties"]["title"]: s["properties"]["sheetId"] for s in meta.get("sheets", [])}

        # 2. Determine which tabs to add based on portfolio data (skip empty categories if desired)
        categories = portfolio_data.get("categories", {})
        active_tabs = {}
        for tab_name, cfg in SHEET_TABS.items():
            cat_key = cfg["category"]
            # Always sync personal_info, education, technical_skills, projects, certifications
            # Only include experience / achievements if there are records
            if cat_key in ("personal_info", "education", "technical_skills", "projects", "certifications") or categories.get(cat_key):
                active_tabs[tab_name] = cfg

        requests_to_add = []
        for tab_name in active_tabs.keys():
            if tab_name not in existing_sheets:
                requests_to_add.append(
                    {"addSheet": {"properties": {"title": tab_name}}}
                )

        if requests_to_add:
            sheets_client.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body={"requests": requests_to_add},
            ).execute()
            # Refresh sheet metadata
            meta = sheets_client.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
            existing_sheets = {s["properties"]["title"]: s["properties"]["sheetId"] for s in meta.get("sheets", [])}

        # 2b. Delete default "Sheet1" and any obsolete empty tabs
        delete_requests = []
        for tab_to_remove in ["Sheet1", "Achievements", "Experience"]:
            cat_key = SHEET_TABS.get(tab_to_remove, {}).get("category", "")
            if tab_to_remove == "Sheet1" and "Sheet1" in existing_sheets:
                delete_requests.append({"deleteSheet": {"sheetId": existing_sheets["Sheet1"]}})
            elif tab_to_remove in existing_sheets and not categories.get(cat_key):
                delete_requests.append({"deleteSheet": {"sheetId": existing_sheets[tab_to_remove]}})

        # Google Sheets requires keeping at least 1 sheet alive
        if delete_requests and len(existing_sheets) > len(delete_requests):
            try:
                sheets_client.spreadsheets().batchUpdate(
                    spreadsheetId=spreadsheet_id,
                    body={"requests": delete_requests},
                ).execute()
                meta = sheets_client.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
                existing_sheets = {s["properties"]["title"]: s["properties"]["sheetId"] for s in meta.get("sheets", [])}
            except Exception as exc:
                logger.warning(f"Notice deleting extra sheets: {exc}")

        # 3. Synchronize each active tab idempotently
        synced_tabs_count = 0
        total_records_synced = 0
        tab_details: dict[str, Any] = {}

        for tab_name, cfg in active_tabs.items():
            cat_key = cfg["category"]
            headers = cfg["headers"]
            row_fn = cfg["row_fn"]
            db_records = categories.get(cat_key, [])

            # Read existing tab contents
            range_name = f"'{tab_name}'!A1:Z1000"
            result_data = (
                sheets_client.spreadsheets()
                .values()
                .get(spreadsheetId=spreadsheet_id, range=range_name)
                .execute()
            )
            existing_values = result_data.get("values", [])

            # Build full new values grid starting with headers
            new_rows = [headers]
            for r in db_records:
                row_cells = [str(x) if x is not None else "" for x in row_fn(r)]
                new_rows.append(row_cells)

            # Clear tab and write updated grid
            sheets_client.spreadsheets().values().clear(
                spreadsheetId=spreadsheet_id, range=f"'{tab_name}'!A1:Z1000"
            ).execute()

            sheets_client.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=f"'{tab_name}'!A1",
                valueInputOption="USER_ENTERED",
                body={"values": new_rows},
            ).execute()

            synced_tabs_count += 1
            total_records_synced += len(db_records)
            tab_details[tab_name] = len(db_records)

        result = {
            "success": True,
            "status": "SUCCESS",
            "message": f"Successfully synchronized {total_records_synced} portfolio records across {synced_tabs_count} tabs to Google Sheets.",
            "spreadsheet_id": spreadsheet_id,
            "spreadsheet_url": f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit",
            "tabs_synced": synced_tabs_count,
            "records_synced": total_records_synced,
            "tab_details": tab_details,
        }
        log_sync_event(portfolio_id, "SUCCESS", spreadsheet_id, result["message"], result)
        return result

    except HttpError as http_err:
        status_code = http_err.resp.status if hasattr(http_err, "resp") else 500
        msg = f"Google Sheets API Error (HTTP {status_code}): {http_err.reason if hasattr(http_err, 'reason') else str(http_err)}"
        if status_code == 403:
            msg = "Permission denied: please share your Google Sheet with the Service Account email as 'Editor'."
        elif status_code == 404:
            msg = f"Spreadsheet ID '{Config.GOOGLE_SPREADSHEET_ID}' was not found. Please verify the ID."

        result = {
            "success": False,
            "status": "API_ERROR",
            "status_code": status_code,
            "message": msg,
        }
        log_sync_event(portfolio_id, "ERROR", Config.GOOGLE_SPREADSHEET_ID, msg, result)
        return result

    except Exception as exc:
        msg = f"Failed to sync to Google Sheets: {exc}"
        result = {
            "success": False,
            "status": "ERROR",
            "message": msg,
        }
        log_sync_event(portfolio_id, "ERROR", Config.GOOGLE_SPREADSHEET_ID, msg, result)
        return result
