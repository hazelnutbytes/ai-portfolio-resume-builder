# AI-Powered Portfolio Manager & Dynamic Resume Builder

**PortfolioForge** is an end-to-end, full-stack web application designed for students and graduates. It centralizes a candidate's complete academic and professional portfolio in an ACID-compliant SQLite database, analyzes job descriptions using Google Gemini AI, and dynamically generates tailored, ATS-friendly PDF resumes. The same master portfolio generates distinctly customized resumes for different target roles (e.g., AI/ML Engineer vs. Full-Stack Developer) with verifiable evidence citation and strict non-fabrication policies.

---

## Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)
4. [Demonstration & Sample Data](#demonstration--sample-data)
5. [Prerequisites & System Requirements](#prerequisites--system-requirements)
6. [Installation & Setup (macOS)](#installation--setup-macos)
7. [Running the Application](#running-the-application)
8. [Configuring External Integrations](#configuring-external-integrations)
   - [Google Gemini API](#1-google-gemini-ai-configuration)
   - [Google Sheets API](#2-google-sheets-api-configuration)
9. [REST API Endpoints Documentation](#rest-api-endpoints-documentation)
10. [Automated Testing & Feature Checklist](#automated-testing--feature-checklist)
11. [Security, Ethics & Production Deployment Notes](#security-ethics--production-deployment-notes)

---

## Features

### 1. Centralized 12-Category Portfolio Management
Store, browse, add, edit, and delete records across all 12 professional categories:
1. **Personal Information & Contact Details** (Full name, target title, email, phone, location, LinkedIn, GitHub, portfolio URL)
2. **Professional Summaries** (Multiple role-targeted summary variants with active defaults)
3. **Education** (Institutions, degrees, fields of study, GPAs, dates, locations, relevant coursework)
4. **Technical Skills** (Categorized by Programming Languages, AI & Data Science, Frameworks, Developer Tools, and Databases, with proficiency levels and evidence context)
5. **Soft Skills** (Core interpersonal and workflow competencies with demonstration context)
6. **Certifications & Courses** (Issuing body, credential IDs, verification links, covered skills)
7. **Projects** (Title, role, tech stack, dates, live/code URLs, detailed implementation notes, and quantifiable metrics)
8. **Experience & Internships** (Company, role, employment type, location, technologies, and measurable achievements)
9. **Achievements & Awards** (National hackathons, university merit honors, and grant awards)
10. **Publications** (Peer-reviewed IEEE conference papers, DOIs, authors, and executive abstracts)
11. **Languages** (Proficiency levels and certifications)
12. **Extracurricular Activities** (Student club leadership, workshop mentorship, and community drives)

### 2. Dual-Engine Job Description Analyzer & Matcher
- **Live Gemini AI Mode** (using the official `google-genai` SDK): Automatically extracts required technical skills, soft skills, required qualifications, preferred qualifications, responsibilities, and relevant keywords.
- **Deterministic Rule-Based Fallback Mode**: If no Gemini API key is configured or offline, a rule-based keyword extraction and classification engine runs automatically without crashing or stalling.
- **Fact-Preserving Portfolio Matching**: Compares the job criteria against the student's saved SQLite records. Every match cites exact supporting record IDs and titles.
- **Honest Gap Detection**: Distinguishes between qualifications not yet entered into the portfolio vs. genuine experience thresholds (e.g., 5+ years seniority) not met by the candidate. **Never hallucinates or fabricates unverified skills.**

### 3. Dynamic ATS-Compliant Resume Builder
- **Two ATS-Optimized Templates**:
  - `Classic ATS`: Centered header, clean horizontal dividers, standard readable serif/sans typography, strict text hierarchy.
  - `Modern Minimal`: Left-aligned navy/slate header, subtle dividers, compact vertical rhythm.
- **Drag-and-Drop / Button Section Reordering**: Move any section up or down (Education, Technical Skills, Experience, Projects, etc.).
- **Granular Record Selection**: Check or uncheck individual skills, projects, and experiences to tailor the resume for the target role.
- **Role-Targeted Summary Editor**: Edit the summary on-the-fly or click **AI Rewrite** to get fact-preserving suggestions from Gemini.
- **Live Two-Panel Preview**: Visualizes the layout with real-time updates before generating.
- **PDF Export via ReportLab**: Generates clean, ATS-scannable PDFs with dynamic filenames: `<Candidate>_<TargetRole>_<Date>.pdf`.

### 4. Gemini AI Assistant
- **Feature 3A (Portfolio Organization)**: Paste unstructured notes, LinkedIn profiles, or past resume text. Gemini parses and extracts structured records into a review modal where the user inspects, approves, or edits items before committing them into SQLite.
- **Feature 3D (Wording Suggestions)**: Recommends clearer, action-driven phrasing for summaries, projects, and experiences tailored to a target job without altering underlying facts.

### 5. Idempotent Google Sheets Synchronization
- Uses Google Sheets API v4 with a backend Service Account.
- Creates separate category tabs (`Personal Information`, `Education`, `Technical Skills`, `Projects`, `Experience`, `Certifications`, `Achievements`).
- Updates existing rows by `Record ID` rather than blindly appending duplicate rows.
- Full audit logging: Stores synchronization outcomes in SQLite with visible timestamps and error messaging.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React Icons |
| **Backend** | Python 3.10+, Flask 3.1, Flask-CORS, python-dotenv |
| **Database** | SQLite 3 (Centralized relational schema with foreign key constraints) |
| **AI Integration** | Official Google Gen AI Python SDK (`google-genai` >= 1.0.0) |
| **External Integration** | Google Sheets API v4 (`google-api-python-client`, `google-auth`) |
| **Document Export** | ReportLab 5.1 (Clean, ATS-parseable PDF generation) |

---

## Project Architecture

```
portfolio_web_app/
├── backend/
│   ├── config.py                     # Environment variables & integration configuration
│   ├── app.py                        # Flask REST API endpoints and error handlers
│   ├── requirements.txt              # Backend Python dependencies
│   ├── database/
│   │   ├── __init__.py
│   │   ├── schema.sql                # Relational SQLite schema with 14 tables
│   │   ├── db.py                     # CRUD operations & database queries
│   │   └── seed.py                   # Fictional demonstration data & sample job sessions
│   ├── services/
│   │   ├── __init__.py
│   │   ├── matcher_service.py        # Deterministic job analyzer & SQLite evidence auditor
│   │   ├── gemini_service.py         # Google Gen AI integration (parsing, matching, suggestions)
│   │   ├── pdf_service.py            # ReportLab ATS PDF generator (Classic & Modern templates)
│   │   └── sheets_service.py         # Google Sheets API v4 multi-tab sync service
│   ├── generated_resumes/            # Generated PDF resumes
│   └── tests/
│       └── test_app.py               # Automated test suite (8 test cases)
├── frontend/
│   ├── index.html                    # Root HTML
│   ├── package.json                  # React + Vite + Tailwind dependencies
│   ├── vite.config.js                # Vite configuration with IPv4 proxy to Flask
│   ├── tailwind.config.js            # Tailwind styling theme
│   ├── postcss.config.js             # PostCSS setup
│   └── src/
│       ├── main.jsx                  # React application entry point
│       ├── App.jsx                   # Master dashboard state, routing & modals
│       ├── index.css                 # Tailwind utilities & base styles
│       ├── services/
│       │   └── api.js                # Frontend API client with CORS & proxy fallback
│       └── components/
│           ├── Navbar.jsx            # Top navigation bar with quick triggers
│           ├── DashboardOverview.jsx # Statistics cards, quick links, integration status
│           ├── PortfolioManager.jsx  # 12-category record browser with add/edit/delete
│           ├── PortfolioFormModal.jsx# Category-specific modal forms with validation
│           ├── JobAnalyzer.jsx       # Job description analyzer & sample job loaders
│           ├── MatchResults.jsx      # Audit score, verified citations, missing requirements
│           ├── ResumeBuilder.jsx     # 2-panel builder: section reordering, record toggles & PDF
│           ├── AIAssistantModal.jsx  # Unstructured text parser & wording suggestion modal
│           └── IntegrationSettings.jsx# Gemini & Sheets status, manual sync, audit log & guide
├── .env.example                      # Template for environment configuration
├── .gitignore                        # Git exclusion rules (secrets, venv, DB, PDF files)
└── README.md                         # Complete project documentation
```

---

## Demonstration & Sample Data

The application includes rich fictional candidate records for demonstration during college evaluation:
- **Candidate**: Aarav Sharma, B.Tech Computer Science Senior (NIT Karnataka)
- **12 Categories Populated**:
  - 2 Education entries (B.Tech Computer Science with 8.92 CGPA and Class XII Gold Medal)
  - 20 Technical Skills across Programming Languages, AI & Data Science, Frameworks, and Tools
  - 4 Soft Skills with concrete context notes
  - 3 Industry Certifications (Deep Learning Specialization, Meta Front-End Developer, Google Cloud)
  - 4 Projects (MedVision X-Ray AI, QueryDoc Multilingual RAG, DevSync Collaborative Kanban, EcoTrack)
  - 2 Internships (ML Research Intern at Kinetix AI Labs, Full-Stack Intern at Zenith Web Tech)
  - 3 Achievements (Smart India Hackathon First Runner-Up, Academic Excellence Merit)
  - 1 Peer-Reviewed IEEE Conference Publication
  - 3 Languages (English, Hindi, German)
  - 2 Extracurricular leadership roles (Developer Students Club Mentor, Outreach Coordinator)

### The Two Pre-Configured Demonstration Resumes
To demonstrate how the **same underlying portfolio generates 2 distinctly tailored resumes**:
1. **Junior AI/ML Engineer Resume**:
   - Emphasizes: PyTorch, Python, Machine Learning, NLP / LLMs, Computer Vision.
   - Selected Projects: *MedVision* (Chest X-Ray DenseNet/Grad-CAM) and *QueryDoc* (RAG pipeline).
   - Selected Experience: *Kinetix AI Labs* (LLM 4-bit quantization research).
   - Selected Publications: IEEE Medical Image Analysis Paper.
   - Template: *Classic ATS*.
2. **Full-Stack Developer Resume**:
   - Emphasizes: React, JavaScript ES6+, TypeScript, Tailwind CSS, Node.js, Flask, PostgreSQL, Docker.
   - Selected Projects: *DevSync* (Real-Time WebSocket Kanban) and *EcoTrack* (Sustainability portal).
   - Selected Experience: *Zenith Web Technologies* (REST API refactoring & performance optimization).
   - Template: *Modern Minimal*.

---

## Prerequisites & System Requirements

- **macOS** (Apple Silicon or Intel)
- **Python 3.10+** (tested on Python 3.14)
- **Node.js 18+** & **npm 9+**
- Modern web browser (Chrome, Safari, Edge, or Firefox)

---

## Installation & Setup (macOS)

### 1. Clone or Open the Workspace
```bash
cd /Users/macbook/Downloads/portfolio_web_app
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(The application works out-of-the-box in deterministic mode without external API keys. To enable live Gemini AI or Google Sheets, see the configuration section below).*

### 3. Setup Python Backend Environment
```bash
# Create Python virtual environment
python3 -m venv backend/venv

# Activate virtual environment
source backend/venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Initialize & seed SQLite database with demonstration records
python backend/database/seed.py
```

### 4. Setup React Frontend
In a new terminal window:
```bash
cd frontend
npm install
```

---

## Running the Application

### 1. Start the Flask Backend Server (Port 5001)
```bash
source backend/venv/bin/activate
python backend/app.py
```
*The backend starts at `http://127.0.0.1:5001`.*

### 2. Start the Vite Frontend Development Server (Port 5173)
In another terminal window:
```bash
cd frontend
npm run dev
```
*The frontend starts at `http://localhost:5173`.*

### 3. Open in Browser
Open `http://localhost:5173` in your browser.

---

## Configuring External Integrations

### 1. Google Gemini AI Configuration
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create an API key.
3. Open your `.env` file and paste your key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```
4. Restart the Flask backend.
5. In the app, navigate to **Integrations & Settings** to verify the green **Configured** status badge.

### 2. Google Sheets API Configuration
1. Open [Google Cloud Console](https://console.cloud.google.com) and create or select a project.
2. Under **APIs & Services > Library**, search for **Google Sheets API** and click **Enable**.
3. Under **IAM & Admin > Service Accounts**, click **Create Service Account**.
4. In the service account, go to **Keys > Add Key > Create new key**, select **JSON**, and download the file.
5. Save the downloaded JSON file as `backend/service_account.json` (this file is excluded by `.gitignore`).
6. Create a new Google Sheet at [sheets.new](https://sheets.new).
7. Click **Share** on your Google Sheet and share it with your Service Account's email address as **Editor**.
8. Copy the spreadsheet ID from the URL (`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`).
9. Update `.env`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_FILE=backend/service_account.json
   GOOGLE_SPREADSHEET_ID=your_actual_spreadsheet_id_here
   ```
10. Click **Sync to Google Sheets Now** in the dashboard. The backend will automatically create all category tabs and sync existing records idempotently.

---

## REST API Endpoints Documentation

### System & Integrations
- `GET /api/health` — Returns server health, active environment, and integration status flags.
- `GET /api/integrations/status` — Returns detailed Gemini AI and Google Sheets configuration status.

### Portfolio Management
- `GET /api/portfolio` — Returns the complete portfolio with all 12 categories and counts.
- `GET /api/portfolio/stats` — Returns high-level statistics for the dashboard cards.
- `GET /api/portfolio/categories` — Returns metadata for all 12 supported portfolio categories.
- `GET /api/portfolio/:category` — Lists all records within a given category.
- `POST /api/portfolio/:category` — Creates a new record in the specified category (with server-side validation).
- `PUT /api/portfolio/:category/:id` — Updates an existing record.
- `DELETE /api/portfolio/:category/:id` — Deletes a record.
- `POST /api/portfolio/reset-sample` — Re-seeds the SQLite database with demonstration records.

### AI Endpoints
- `POST /api/ai/organize` — Parses unstructured text via Gemini AI into structured categories for review.
- `POST /api/ai/organize/commit` — Saves approved items from the unstructured parsing modal into SQLite.
- `POST /api/ai/suggestions` — Generates fact-preserving wording suggestions for summaries, projects, and experiences.

### Job Analysis & Matching
- `GET /api/jobs` — Lists saved job descriptions.
- `GET /api/jobs/:id` — Retrieves a specific job description and its match analysis.
- `POST /api/jobs/analyze` — Analyzes a job description (Gemini AI or deterministic fallback) and audits match evidence against SQLite portfolio records.
- `DELETE /api/jobs/:id` — Deletes a job description record.

### Resume Builder & PDF Generation
- `GET /api/resumes` — Lists saved resume tailoring sessions.
- `GET /api/resumes/:id` — Retrieves a specific resume session.
- `POST /api/resumes` — Creates or updates a resume session (target role, template, section order, selected records).
- `DELETE /api/resumes/:id` — Deletes a resume session.
- `POST /api/resumes/preview` — Prepares filtered portfolio data for live client-side preview rendering.
- `POST /api/resumes/generate-pdf` — Compiles the ATS-friendly PDF with ReportLab and returns the download URL.
- `GET /api/resumes/download-pdf/:filename` — Serves the generated PDF file as an attachment.

### Google Sheets Synchronization
- `GET /api/sheets/status` — Checks service account and spreadsheet ID connectivity.
- `POST /api/sheets/sync` — Synchronizes portfolio records across 7 dedicated category tabs idempotently.
- `GET /api/sheets/logs` — Retrieves recent synchronization audit logs.

---

## Automated Testing & Feature Checklist

The application includes an automated test suite (`backend/tests/test_app.py`) covering all core requirements.

To run the test suite:
```bash
source backend/venv/bin/activate
python backend/tests/test_app.py
```

### Verified Feature Test Checklist

| Feature | Requirement | Test Method | Status |
|---|---|---|:---:|
| **Centralized Database** | Centralized SQLite database with relational tables and timestamps | `test_01_health_check` & `test_02_portfolio_stats` | **PASSED** |
| **Portfolio Management** | Full CRUD on all 12 categories with input validation and empty states | `test_03_portfolio_crud_lifecycle` & `test_08_input_validation` | **PASSED** |
| **Demonstration Data** | Fictional demonstration candidate (Aarav Sharma) with 12 populated categories | `seed.py` execution & database verification | **PASSED** |
| **Job Description Analysis** | Extraction of technical skills, soft skills, required & preferred qualifications | `test_04_job_analysis_and_matching_ai_engineer` | **PASSED** |
| **Portfolio Matching** | Match audit citing exact SQLite record IDs and titles for evidence | `test_04_job_analysis_and_matching_ai_engineer` | **PASSED** |
| **Fact-Preservation** | Never hallucinates skills; unmet seniority (5+ years) marked as missing qualification | `test_04_job_analysis_and_matching_ai_engineer` | **PASSED** |
| **Resume Tailoring** | Same portfolio generates 2 distinct resumes (AI/ML vs Full-Stack) | `test_05_role_differentiation_same_portfolio_generates_distinct_resumes` | **PASSED** |
| **ATS Templates** | Support for Classic ATS and Modern Minimal templates | `test_05_role_differentiation` & `pdf_service.py` | **PASSED** |
| **PDF Generation** | ReportLab compiles downloadable ATS-friendly PDF with candidate & role filename | `test_06_pdf_compilation_and_download` | **PASSED** |
| **Google Sheets Sync** | Idempotent multi-tab sync with clear error messaging when unconfigured | `test_07_google_sheets_unconfigured_error_handling` | **PASSED** |
| **Input Validation** | Server-side validation rejecting invalid payloads without crashing | `test_08_input_validation` | **PASSED** |
| **Frontend Production Build** | Vite production bundle compiles cleanly with zero JSX/CSS errors | `npm run build` | **PASSED** |

---

## Security, Ethics & Production Deployment Notes

- **Credential Hygiene**: API keys (`GEMINI_API_KEY`) and service account credentials (`service_account.json`) are stored strictly on the backend and in `.env`. They are never exposed in frontend code.
- **Untrusted User Input**: All job descriptions and pasted unstructured text are treated as untrusted input and sanitized before processing.
- **Fact-Preservation Policy**: This application strictly disallows automatic fabrication of candidate credentials. Wording suggestions are fact-preserving rephrasings of existing achievements.
- **College Project Scope**: This application is architected for local college project demonstration. For public multi-user production deployment:
  1. Add user authentication (e.g., JWT or OAuth2 sessions) with isolated per-user portfolio rows.
  2. Use a managed production database (e.g., PostgreSQL).
  3. Deploy behind a reverse proxy (e.g., NGINX) using Gunicorn/Uvicorn with SSL/TLS encryption.
