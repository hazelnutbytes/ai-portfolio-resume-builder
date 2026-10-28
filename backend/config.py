import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load environment variables from project root .env and backend/.env
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(BACKEND_DIR / ".env")


class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    FLASK_PORT = int(os.getenv("FLASK_PORT", "5001"))

    # Database configuration
    _db_env = os.getenv("DATABASE_PATH", "backend/instance/portfolio.db")
    if os.path.isabs(_db_env):
        DATABASE_PATH = Path(_db_env)
    else:
        DATABASE_PATH = PROJECT_ROOT / _db_env

    GENERATED_RESUMES_DIR = BACKEND_DIR / "generated_resumes"

    # Gemini AI configuration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    # Google Sheets configuration
    GOOGLE_SPREADSHEET_ID = os.getenv("GOOGLE_SPREADSHEET_ID", "").strip()
    GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "").strip()
    GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()

    @classmethod
    def is_gemini_configured(cls) -> bool:
        key = cls.GEMINI_API_KEY
        if not key:
            return False
        placeholders = {
            "your_gemini_api_key_here",
            "placeholder",
            "insert_key_here",
            "changeme",
        }
        return key.lower() not in placeholders and len(key) > 10

    @classmethod
    def get_service_account_path(cls) -> Path | None:
        if not cls.GOOGLE_SERVICE_ACCOUNT_FILE:
            return None
        path = Path(cls.GOOGLE_SERVICE_ACCOUNT_FILE)
        if not path.is_absolute():
            path = PROJECT_ROOT / path
        return path

    @classmethod
    def is_sheets_configured(cls) -> tuple[bool, str]:
        sheet_id = cls.GOOGLE_SPREADSHEET_ID
        placeholders = {
            "your_google_spreadsheet_id_here",
            "placeholder",
            "changeme",
        }
        if not sheet_id or sheet_id.lower() in placeholders:
            return False, "GOOGLE_SPREADSHEET_ID is not configured in .env."

        if cls.GOOGLE_SERVICE_ACCOUNT_JSON:
            return True, "Configured via GOOGLE_SERVICE_ACCOUNT_JSON environment variable."

        sa_path = cls.get_service_account_path()
        if not sa_path:
            return False, "GOOGLE_SERVICE_ACCOUNT_FILE is not set in .env."
        if not sa_path.exists():
            return False, f"Service account file not found at: {sa_path.name}"

        return True, "Google Sheets credentials and Spreadsheet ID are present."
