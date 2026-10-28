# AI-Powered Portfolio Manager & Dynamic Resume Builder

**PortfolioForge** is an end-to-end, full-stack web application designed for Computer Science Engineering students. It centralizes a candidate's academic coursework, technical competencies, projects, certifications, and hackathon experiences in an ACID-compliant SQLite database, analyzes job descriptions using **Google Gemini AI**, audits match evidence citing verified database records, exports data to **Google Sheets**, and dynamically compiles tailored, ATS-friendly PDF resumes using **ReportLab**.

The same master portfolio dynamically generates distinctly customized resumes for different target roles (e.g., **Full-Stack Developer** vs. **Frontend & React.js Developer**) with verifiable evidence citation and strict non-fabrication policies.

---

## 👤 Portfolio Profile: Hazel Lakshmana

- **Candidate:** Hazel Lakshmana
- **Education:** Bachelor of Computer Science Engineering (Aug 2025 – Jul 2029 Expected)
- **Institution:** ITM Skills University, Navi Mumbai, Maharashtra, India
- **Cumulative CGPA:** **9.3 / 10.0** (Top Academic Standing)
- **Profiles:** [LinkedIn](https://www.linkedin.com/in/hazel-lakshmana-21b566379/) • [GitHub](https://github.com/hazelnutbytes)
- **Live Deployed Application:** [https://ai-portfolio-resume-builder.onrender.com](https://ai-portfolio-resume-builder.onrender.com)
- **Live Google Sheet:** [View Synchronized Portfolio on Google Sheets](https://docs.google.com/spreadsheets/d/1HSH4qsBJLFfA4AwDSJsxq3Z8pKTmyz37H-8nJbWabK0/edit)

---

## 🚀 Features

### 1. Centralized Portfolio Database (SQLite)
Maintains all professional student information in one place across structured categories:
- **Personal Information & Contact Details** (Full name, target title, email, phone, location, LinkedIn, GitHub)
- **Professional Summaries** (Role-targeted summary variants: Full-Stack Engineering and Frontend & React.js Focus)
- **Education** (ITM Skills University, degree, 9.3 CGPA, coursework)
- **Technical Skills** (Categorized by Programming Languages, Frameworks, Databases, and Developer Tools with Basic & Intermediate proficiencies)
- **Certifications & Courses** (HackerRank SQL Basic, SQL Intermediate, and Java Basic certifications)
- **Projects**
  - *Hospital Management System (Full-Stack):* Python, MySQL, SQL queries, relational schema optimization
  - *Red Bull Website Clone:* React.js, modern CSS, custom keyframe animations, 60 FPS performance
  - *Personal Portfolio Website:* React.js, Tailwind CSS, modular component architecture
- **Extracurricular & Competitions** (SummerHacks Hackathon participant at ITM Skills University)
- **Languages** (English, Hindi, Marathi)

### 2. Dual-Engine Job Description Analyzer & Evidence Matcher
- **Live Google Gemini AI Mode** (using the official `google-genai` Python SDK): Automatically extracts required technical skills, soft skills, required qualifications, preferred qualifications, responsibilities, and relevant keywords.
- **Deterministic Rule-Based Fallback Mode**: If no Gemini API key is configured or offline, a rule-based keyword extraction and classification engine runs automatically without crashing or stalling.
- **Fact-Preserving Portfolio Matching**: Compares the job criteria against the student's saved SQLite records. Every match cites exact supporting record IDs and titles.
- **Honest Gap Detection**: Differentiates between qualifications not yet entered into the portfolio vs. genuine senior experience thresholds (e.g., 5+ years experience) not met by the candidate. **Never hallucinates or fabricates unverified skills.**

### 3. Dynamic ATS-Compliant Resume Builder
- **Two ATS-Optimized Templates**:
  - `Classic ATS`: Centered header, clean horizontal dividers, standard readable serif/sans typography, strict text hierarchy.
  - `Modern Minimal`: Left-aligned navy/slate header, subtle dividers, compact vertical rhythm.
- **Drag-and-Drop / Button Section Reordering**: Move any section up or down (Education, Technical Skills, Projects, Certifications, etc.).
- **Granular Record Selection**: Check or uncheck individual skills, projects, and certifications to tailor the resume for the target role.
- **Role-Targeted Summary Editor**: Edit the summary on-the-fly or click **AI Rewrite** to get fact-preserving suggestions from Gemini.
- **Live Two-Panel Preview**: Visualizes the layout with real-time updates before generating.
- **PDF Export via ReportLab**: Generates clean, ATS-scannable PDFs with dynamic filenames: `Hazel_Lakshmana_<TargetRole>.pdf`.

### 4. Gemini AI Assistant
- **Feature 3A (Portfolio Organization)**: Paste raw unstructured notes or resume drafts. Gemini parses and extracts structured records into a review modal where the user inspects, approves, or edits items before committing them into SQLite.
- **Feature 3D (Wording Suggestions)**: Recommends clearer, action-driven phrasing for summaries, projects, and skills tailored to a target job without altering underlying facts.

### 5. Idempotent Google Sheets Synchronization
- Connected to Google Sheets API v4 with a secure backend Service Account.
- Automatically maintains **5 clean, dedicated category tabs**:
  1. `Personal Information`
  2. `Education`
  3. `Technical Skills`
  4. `Projects`
  5. `Certifications`
- Updates existing rows by `Record ID` rather than appending duplicate rows.
- Full audit logging: Stores synchronization outcomes in SQLite with visible timestamps and status codes.

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React Icons |
| **Backend** | Python 3.10+, Flask 3.1, Flask-CORS, python-dotenv |
| **Database** | SQLite 3 (Centralized relational schema with foreign key constraints) |
| **AI Integration** | Official Google Gen AI Python SDK (`google-genai` >= 1.0.0) |
| **External Integration** | Google Sheets API v4 (`google-api-python-client`, `google-auth`) |
| **Document Export** | ReportLab 5.1 (Clean, ATS-parseable PDF generation) |

---

## 📁 Project Structure

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
│   │   └── seed.py                   # Hazel Lakshmana 2nd-year student profile & sample sessions
│   ├── services/
│   │   ├── __init__.py
│   │   ├── matcher_service.py        # Deterministic job analyzer & SQLite evidence auditor
│   │   ├── gemini_service.py         # Google Gen AI integration (parsing, matching, suggestions)
│   │   ├── pdf_service.py            # ReportLab ATS PDF generator (Classic & Modern templates)
│   │   └── sheets_service.py         # Google Sheets API v4 multi-tab sync service
│   ├── generated_resumes/            # Directory for compiled PDF resumes
│   └── tests/
│       └── test_app.py               # Automated test suite (8 test cases, all passing)
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
│           ├── AIAssistantModal.jsx  # Unstructured parser & AI wording suggestions
│           └── IntegrationSettings.jsx# Gemini & Sheets status, manual sync, audit log & guide
├── .env.example                      # Template for environment configuration
├── .gitignore                        # Git exclusion rules (secrets, venv, DB, private keys)
└── README.md                         # Complete project documentation
```

---

## 💻 Quick Start (Run Locally)

### 1. Start the Flask Backend (Terminal 1)
```bash
cd /Users/macbook/Downloads/portfolio_web_app
source backend/venv/bin/activate
python backend/app.py
```
*Backend runs on `http://127.0.0.1:5001`.*

### 2. Start the React Frontend (Terminal 2)
```bash
cd /Users/macbook/Downloads/portfolio_web_app/frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

Open your browser at **`http://localhost:5173`**.

---

## 🔒 Security & Credential Hygiene

- All credentials (`.env`, `backend/service_account.json`, `portfolio.db`, private keys) are strictly excluded from git tracking via `.gitignore`.
- API keys are handled only on the Python Flask backend and never exposed in client-side code.
- A safe `.env.example` template is provided with placeholder values for repository cloning.

---

## 🧪 Automated Testing

Run the automated test suite verifying portfolio CRUD, job description matching, PDF generation, and Google Sheets handling:
```bash
source backend/venv/bin/activate
python backend/tests/test_app.py
```
```text
Ran 8 tests in 0.088s
OK
```
