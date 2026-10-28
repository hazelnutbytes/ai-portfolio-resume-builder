import json
import sqlite3
import sys
from pathlib import Path

# Add backend directory to sys.path so scripts can be run directly
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config import Config
from database.db import get_connection, init_db, now_iso

PORTFOLIO_NAME = "Hazel Lakshmana — Computer Science Engineering Portfolio"
PORTFOLIO_DESC = (
    "Official portfolio for Hazel Lakshmana, 2nd-year Computer Science Engineering student at ITM Skills University, "
    "specializing in full-stack web development, Python, MySQL/PostgreSQL databases, and React.js."
)

PERSONAL_INFO = {
    "full_name": "Hazel Lakshmana",
    "headline": "2nd-Year Computer Science Engineering Student | Full-Stack & Frontend Developer",
    "email": "hazellakshmana684@gmail.com",
    "phone": "+91 8291398024",
    "location": "Maharashtra, India",
    "linkedin": "https://www.linkedin.com/in/hazel-lakshmana-21b566379/",
    "github": "https://github.com/hazelnutbytes",
    "portfolio_url": "https://github.com/hazelnutbytes",
    "is_sample": 0,
}

SUMMARIES = [
    {
        "title": "Full-Stack Web Development",
        "target_role": "Full-Stack Developer",
        "content": (
            "Driven 2nd-year Computer Science Engineering student specializing in full-stack web development. "
            "Skilled in building structured backend applications with Python and MySQL, alongside creating "
            "responsive and animated user interfaces using React.js, JavaScript, and modern CSS. "
            "Enthusiastic about learning new technologies and applying core computer science fundamentals to real-world software projects."
        ),
        "is_default": 1,
        "is_sample": 0,
    },
    {
        "title": "Frontend & React.js Focus",
        "target_role": "Frontend Developer",
        "content": (
            "Passionate 2nd-year Computer Science undergraduate with hands-on project experience in React.js, "
            "JavaScript, HTML5, modern CSS3, and custom keyframe animations. Demonstrated capability in rebuilding "
            "high-fidelity responsive web interfaces, designing modular component architectures, and managing version control via Git and GitHub."
        ),
        "is_default": 0,
        "is_sample": 0,
    },
]

EDUCATION = [
    {
        "institution": "ITM Skills University",
        "degree": "Bachelor of Computer Science Engineering",
        "field_of_study": "Computer Science Engineering",
        "start_date": "Aug 2025",
        "end_date": "Jul 2029 (Expected)",
        "grade": "9.3 / 10.0 CGPA (Expected)",
        "location": "Navi Mumbai, Maharashtra, India",
        "coursework": (
            "Data Structures & Algorithms, Object-Oriented Programming (Java/C++), Database Management Systems (SQL), "
            "Web Development, Operating Systems Fundamentals"
        ),
        "description": "2nd-year undergraduate maintaining strong academic standing with a 9.3 cumulative CGPA.",
        "is_sample": 0,
    }
]

# All proficiencies set to Basic or Intermediate
TECH_SKILLS = [
    # Programming Languages
    {"skill_name": "Python", "category": "Programming Languages", "proficiency": "Intermediate", "years_experience": "1.5 years", "evidence_note": "Backend development for Hospital Management System and scripting.", "is_sample": 0},
    {"skill_name": "JavaScript (ES6+)", "category": "Programming Languages", "proficiency": "Intermediate", "years_experience": "1.5 years", "evidence_note": "Core scripting for React.js components and interactive DOM logic.", "is_sample": 0},
    {"skill_name": "SQL (MySQL)", "category": "Programming Languages", "proficiency": "Intermediate", "years_experience": "1.5 years", "evidence_note": "Relational schema design, queries, and HackerRank certified.", "is_sample": 0},
    {"skill_name": "Java", "category": "Programming Languages", "proficiency": "Intermediate", "years_experience": "1 year", "evidence_note": "OOP concepts, classes, inheritance, and HackerRank Java Basic certified.", "is_sample": 0},
    {"skill_name": "C++", "category": "Programming Languages", "proficiency": "Basic", "years_experience": "1 year", "evidence_note": "Foundational programming and algorithmic problem solving.", "is_sample": 0},
    {"skill_name": "HTML5 & CSS3", "category": "Programming Languages", "proficiency": "Intermediate", "years_experience": "2 years", "evidence_note": "Responsive layouts, Flexbox, Grid, custom keyframes, and CSS animations.", "is_sample": 0},

    # Frameworks & Libraries
    {"skill_name": "React.js", "category": "Frameworks & Libraries", "proficiency": "Intermediate", "years_experience": "1 year", "evidence_note": "Component hierarchy, hooks, state handling, and portfolio development.", "is_sample": 0},
    {"skill_name": "Node.js (Learning)", "category": "Frameworks & Libraries", "proficiency": "Basic", "years_experience": "< 1 year", "evidence_note": "Exploring backend JavaScript runtimes and basic HTTP server concepts.", "is_sample": 0},
    {"skill_name": "Tailwind CSS", "category": "Frameworks & Libraries", "proficiency": "Intermediate", "years_experience": "1 year", "evidence_note": "Responsive utility-first styling for modern web dashboards.", "is_sample": 0},

    # Databases & Storage
    {"skill_name": "PostgreSQL", "category": "Databases", "proficiency": "Basic", "years_experience": "< 1 year", "evidence_note": "Relational table creation and basic querying.", "is_sample": 0},
    {"skill_name": "MongoDB & Atlas", "category": "Databases", "proficiency": "Basic", "years_experience": "< 1 year", "evidence_note": "Document-based collections and cloud Atlas cluster setup.", "is_sample": 0},
    {"skill_name": "Firebase", "category": "Databases", "proficiency": "Basic", "years_experience": "< 1 year", "evidence_note": "Real-time document storage and basic database setup.", "is_sample": 0},

    # Developer Tools & API Testing
    {"skill_name": "Git & GitHub", "category": "Developer Tools", "proficiency": "Intermediate", "years_experience": "1.5 years", "evidence_note": "Version control, branching, committing, and team code collaboration.", "is_sample": 0},
    {"skill_name": "Postman & Thunderclient", "category": "Developer Tools", "proficiency": "Intermediate", "years_experience": "1 year", "evidence_note": "Testing REST API endpoints, inspecting JSON responses and status codes.", "is_sample": 0},
    {"skill_name": "MySQL Workbench", "category": "Developer Tools", "proficiency": "Intermediate", "years_experience": "1 year", "evidence_note": "Database diagramming and SQL query execution.", "is_sample": 0},
    {"skill_name": "VS Code", "category": "Developer Tools", "proficiency": "Intermediate", "years_experience": "2 years", "evidence_note": "Primary code editor for web development and Python scripts.", "is_sample": 0},
]

SOFT_SKILLS = [
    {"skill_name": "Collaborative Teamwork", "proficiency": "Intermediate", "context": "Participated in group development projects and hackathon team sprints.", "is_sample": 0},
    {"skill_name": "Problem Solving", "proficiency": "Intermediate", "context": "Debugging code logic and implementing algorithmic solutions.", "is_sample": 0},
    {"skill_name": "Continuous Learning", "proficiency": "Intermediate", "context": "Eagerly adopting new full-stack tools and backend frameworks.", "is_sample": 0},
    {"skill_name": "Attention to UI Detail", "proficiency": "Intermediate", "context": "Crafting animated keyframe effects and responsive web layouts.", "is_sample": 0},
]

# HackerRank Certifications for SQL and Java (Basic & Intermediate)
CERTIFICATIONS = [
    {
        "name": "SQL (Basic) Certificate",
        "issuing_organization": "HackerRank",
        "issue_date": "2025",
        "expiry_date": "Lifetime",
        "credential_id": "HR-SQL-BASIC",
        "credential_url": "https://www.hackerrank.com/certificates",
        "skills_covered": "Relational Queries, SELECT statements, WHERE filtering, Sorting, Aggregations",
        "is_sample": 0,
    },
    {
        "name": "SQL (Intermediate) Certificate",
        "issuing_organization": "HackerRank",
        "issue_date": "2025",
        "expiry_date": "Lifetime",
        "credential_id": "HR-SQL-INTER",
        "credential_url": "https://www.hackerrank.com/certificates",
        "skills_covered": "Complex JOINs, Subqueries, GROUP BY, HAVING, Relational schema queries",
        "is_sample": 0,
    },
    {
        "name": "Java (Basic) Certificate",
        "issuing_organization": "HackerRank",
        "issue_date": "2025",
        "expiry_date": "Lifetime",
        "credential_id": "HR-JAVA-BASIC",
        "credential_url": "https://www.hackerrank.com/certificates",
        "skills_covered": "Core Java, Object-Oriented Programming, Control Flow, Strings, Arrays",
        "is_sample": 0,
    },
]

PROJECTS = [
    {
        "title": "Hospital Management System (Full-Stack)",
        "role": "Backend & Database Developer",
        "tech_stack": "Python, MySQL, SQL, REST APIs, MySQL Workbench",
        "start_date": "Oct 2025",
        "end_date": "Dec 2025",
        "project_url": "https://github.com/hazelnutbytes",
        "github_url": "https://github.com/hazelnutbytes/hospital-management-system",
        "description": (
            "Designed and built a desktop/web application to streamline patient records, doctor schedules, and billing data using Python. "
            "Structured and optimized a relational MySQL database to maintain patient confidentiality and eliminate data redundancy."
        ),
        "highlights": (
            "Architected normalized relational tables for patients, appointments, doctors, and billing with foreign key constraints.\n"
            "Engineered Python database connectivity with parameter-safe SQL queries to prevent SQL injection vulnerabilities.\n"
            "Implemented an automated doctor scheduling and billing calculation module, reducing administrative lookup time."
        ),
        "metrics": "Streamlined patient appointment scheduling; sub-50ms query response on complex billing lookups.",
        "is_sample": 0,
    },
    {
        "title": "Red Bull Website Clone",
        "role": "Frontend Developer (Group Project)",
        "tech_stack": "React.js, JavaScript, HTML5, CSS3, Keyframe Animations, Git",
        "start_date": "Aug 2025",
        "end_date": "Sep 2025",
        "project_url": "https://github.com/hazelnutbytes",
        "github_url": "https://github.com/hazelnutbytes/redbull-clone",
        "description": (
            "Collaborated in a team of developers to rebuild a high-fidelity clone of the Red Bull landing page, "
            "authoring custom CSS animations and keyframes to deliver an engaging, high-energy user experience."
        ),
        "highlights": (
            "Authored custom CSS3 keyframe animations and scroll-triggered transitions delivering a dynamic visual identity.\n"
            "Constructed a fully responsive grid and navigation menu optimized across mobile, tablet, and desktop viewports.\n"
            "Coordinated Git pull requests and branch merges, ensuring zero styling regressions across the group repository."
        ),
        "metrics": "Maintained 60 FPS smooth animation rendering; 100% responsive cross-browser compatibility.",
        "is_sample": 0,
    },
    {
        "title": "Personal Portfolio Website",
        "role": "Independent Creator",
        "tech_stack": "React.js, Tailwind CSS, JavaScript, HTML5, GitHub Pages",
        "start_date": "Nov 2025",
        "end_date": "Present",
        "project_url": "https://github.com/hazelnutbytes",
        "github_url": "https://github.com/hazelnutbytes/personal-portfolio",
        "description": (
            "Architected a modular personal portfolio using React.js to showcase ongoing engineering projects, "
            "technical skill competencies, and open-source contributions."
        ),
        "highlights": (
            "Engineered reusable React component architecture with clean separation of layout and data models.\n"
            "Implemented modern responsive styling using Tailwind CSS with clean accessibility standards.\n"
            "Deployed continuous integration and automatic updates via GitHub workflows."
        ),
        "metrics": "100% Google Lighthouse accessibility rating; fast sub-second initial contentful paint.",
        "is_sample": 0,
    },
]

# User requested NO internship / experience (empty)
EXPERIENCE = []

# User requested to REMOVE achievements completely (empty)
ACHIEVEMENTS = []

PUBLICATIONS = []

LANGUAGES = [
    {"language_name": "English", "proficiency_level": "Fluent / Professional", "certification": "", "notes": "Primary language of higher education and technical development.", "is_sample": 0},
    {"language_name": "Hindi", "proficiency_level": "Native / Bilingual", "certification": "", "notes": "Mother tongue.", "is_sample": 0},
]

EXTRACURRICULAR = [
    {
        "organization": "SummerHacks Hackathon (ITM Skills University)",
        "role": "Participant & Team Collaborator",
        "start_date": "Jul 2025",
        "end_date": "Jul 2025",
        "description": "Competed in an intensive, time-constrained hackathon to ideate and build software solutions for real-world challenge statements.",
        "contributions": "Collaborated with peer developers, managed version control via GitHub, and tested REST APIs using Postman.",
        "is_sample": 0,
    }
]

SAMPLE_JOB_DESCRIPTIONS = [
    {
        "title": "Junior Full-Stack Developer",
        "company": "TechNova Solutions",
        "raw_text": """
Position: Junior Full-Stack Developer
Company: TechNova Solutions
Location: Navi Mumbai / Hybrid

About Us:
TechNova builds modern data-driven web applications and scalable enterprise software. We are looking for an enthusiastic 2nd-year or early-career Full-Stack Developer.

Key Responsibilities:
• Build responsive, interactive web interfaces using React.js, JavaScript (ES6+), HTML5, and CSS3.
• Develop structured backend services and relational database operations with Python and MySQL.
• Design, optimize, and maintain relational database tables using SQL.
• Use Git and GitHub for collaborative branching, code reviews, and version control.
• Test and debug RESTful APIs using Postman or Thunderclient.
• Collaborate in team sprints to deliver clean, maintainable code.

Required Qualifications:
• Student or graduate in Computer Science Engineering.
• Practical project experience in React.js, JavaScript, HTML5, and modern CSS.
• Solid proficiency in Python and SQL (MySQL / PostgreSQL).
• Familiarity with database modeling and basic querying.
• Experience using Git/GitHub for version control and Postman for API testing.
• Eagerness to learn and collaborate in team environments.

Preferred Qualifications:
• Certifications in SQL or Java (e.g. HackerRank).
• Portfolio of live web applications or GitHub repositories.
""",
        "is_sample": 0,
    },
    {
        "title": "Junior Frontend & React.js Developer",
        "company": "PulseDigital Creative Studios",
        "raw_text": """
Position: Junior Frontend & React.js Developer
Company: PulseDigital Creative Studios
Location: Mumbai / Remote

About Us:
PulseDigital crafts high-energy, animated web experiences. We are hiring a motivated Frontend Developer.

Key Responsibilities:
• Transform creative UI/UX designs into responsive, high-performance web pages with React.js.
• Write custom CSS3 keyframe animations and interactive transitions for immersive user experiences.
• Connect frontend views to backend REST APIs and test with Postman/Thunderclient.
• Optimize website speed, asset delivery, and mobile responsiveness.
• Maintain version control workflows using Git and GitHub.

Required Qualifications:
• Computer Science Engineering background.
• Solid command of React.js, JavaScript (ES6+), HTML5, and modern CSS3.
• Demonstrated ability to create engaging CSS animations and responsive layouts.
• Version control experience with Git and GitHub.
• Passion for clean UI, typography, and frontend craftsmanship.
""",
        "is_sample": 0,
    },
]


def seed_database(reset: bool = True) -> None:
    """
    Seeds the SQLite database with Hazel Lakshmana's actual 2nd-year student resume data:
    - No internships / work experience (empty)
    - Basic / Intermediate proficiencies
    - SQL (Basic & Intermediate) and Java (Basic) from HackerRank
    - Achievements removed completely
    - Tailored resume sessions highlighting Projects, Skills, and Certifications
    """
    init_db()
    conn = get_connection()
    ts = now_iso()

    try:
        if reset:
            tables_to_clear = [
                "resume_sessions",
                "job_descriptions",
                "sync_logs",
                "extracurricular",
                "languages",
                "publications",
                "achievements",
                "experience",
                "projects",
                "certifications",
                "soft_skills",
                "technical_skills",
                "education",
                "professional_summaries",
                "personal_info",
                "portfolios",
            ]
            for t in tables_to_clear:
                conn.execute(f"DELETE FROM {t}")
            try:
                conn.execute("DELETE FROM sqlite_sequence")
            except Exception:
                pass
            conn.commit()

        # 1. Insert Portfolio
        cur = conn.execute(
            """
            INSERT INTO portfolios (name, description, is_sample, created_at, updated_at)
            VALUES (?, ?, 0, ?, ?)
            """,
            (PORTFOLIO_NAME, PORTFOLIO_DESC, ts, ts),
        )
        portfolio_id = cur.lastrowid

        # 2. Insert Personal Info
        conn.execute(
            """
            INSERT INTO personal_info
            (portfolio_id, full_name, headline, email, phone, location, linkedin, github, portfolio_url, is_sample, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            """,
            (
                portfolio_id,
                PERSONAL_INFO["full_name"],
                PERSONAL_INFO["headline"],
                PERSONAL_INFO["email"],
                PERSONAL_INFO["phone"],
                PERSONAL_INFO["location"],
                PERSONAL_INFO["linkedin"],
                PERSONAL_INFO["github"],
                PERSONAL_INFO["portfolio_url"],
                ts,
                ts,
            ),
        )

        # 3. Insert Summaries
        for s in SUMMARIES:
            conn.execute(
                """
                INSERT INTO professional_summaries
                (portfolio_id, title, target_role, content, is_default, is_sample, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (portfolio_id, s["title"], s["target_role"], s["content"], s["is_default"], ts, ts),
            )

        # 4. Insert Education
        for e in EDUCATION:
            conn.execute(
                """
                INSERT INTO education
                (portfolio_id, institution, degree, field_of_study, start_date, end_date, grade, location, coursework, description, is_sample, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (
                    portfolio_id,
                    e["institution"],
                    e["degree"],
                    e["field_of_study"],
                    e["start_date"],
                    e["end_date"],
                    e["grade"],
                    e["location"],
                    e["coursework"],
                    e["description"],
                    ts,
                    ts,
                ),
            )

        # 5. Insert Technical Skills
        skill_id_map: dict[str, int] = {}
        for sk in TECH_SKILLS:
            cur = conn.execute(
                """
                INSERT INTO technical_skills
                (portfolio_id, skill_name, category, proficiency, years_experience, evidence_note, is_sample, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (
                    portfolio_id,
                    sk["skill_name"],
                    sk["category"],
                    sk["proficiency"],
                    sk["years_experience"],
                    sk["evidence_note"],
                    ts,
                    ts,
                ),
            )
            skill_id_map[sk["skill_name"]] = cur.lastrowid

        # 6. Insert Soft Skills
        soft_id_map: dict[str, int] = {}
        for ssk in SOFT_SKILLS:
            cur = conn.execute(
                """
                INSERT INTO soft_skills
                (portfolio_id, skill_name, proficiency, context, is_sample, created_at, updated_at)
                VALUES (?, ?, ?, ?, 0, ?, ?)
                """,
                (portfolio_id, ssk["skill_name"], ssk["proficiency"], ssk["context"], ts, ts),
            )
            soft_id_map[ssk["skill_name"]] = cur.lastrowid

        # 7. Insert Certifications (HackerRank)
        cert_id_map: dict[str, int] = {}
        for c in CERTIFICATIONS:
            cur = conn.execute(
                """
                INSERT INTO certifications
                (portfolio_id, name, issuing_organization, issue_date, expiry_date, credential_id, credential_url, skills_covered, is_sample, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (
                    portfolio_id,
                    c["name"],
                    c["issuing_organization"],
                    c["issue_date"],
                    c["expiry_date"],
                    c["credential_id"],
                    c["credential_url"],
                    c["skills_covered"],
                    ts,
                    ts,
                ),
            )
            cert_id_map[c["name"]] = cur.lastrowid

        # 8. Insert Projects
        project_id_map: dict[str, int] = {}
        for p in PROJECTS:
            cur = conn.execute(
                """
                INSERT INTO projects
                (portfolio_id, title, role, tech_stack, start_date, end_date, project_url, github_url, description, highlights, metrics, is_sample, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (
                    portfolio_id,
                    p["title"],
                    p["role"],
                    p["tech_stack"],
                    p["start_date"],
                    p["end_date"],
                    p["project_url"],
                    p["github_url"],
                    p["description"],
                    p["highlights"],
                    p["metrics"],
                    ts,
                    ts,
                ),
            )
            project_id_map[p["title"]] = cur.lastrowid

        # 9. Experience (Empty as requested)
        exp_id_map: dict[str, int] = {}

        # 10. Achievements (Empty as requested)
        ach_id_map: dict[str, int] = {}

        # 11. Languages
        lang_id_map: dict[str, int] = {}
        for l in LANGUAGES:
            cur = conn.execute(
                """
                INSERT INTO languages
                (portfolio_id, language_name, proficiency_level, certification, notes, is_sample, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (portfolio_id, l["language_name"], l["proficiency_level"], l["certification"], l["notes"], ts, ts),
            )
            lang_id_map[l["language_name"]] = cur.lastrowid

        # 12. Extracurricular (Hackathon participation)
        extra_id_map: dict[str, int] = {}
        for ex in EXTRACURRICULAR:
            cur = conn.execute(
                """
                INSERT INTO extracurricular
                (portfolio_id, organization, role, start_date, end_date, description, contributions, is_sample, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (portfolio_id, ex["organization"], ex["role"], ex["start_date"], ex["end_date"], ex["description"], ex["contributions"], ts, ts),
            )
            extra_id_map[ex["organization"]] = cur.lastrowid

        # 13. Insert Job Descriptions & Match Results
        from services.matcher_service import analyze_job_description_deterministic, match_portfolio_to_job
        from database.db import get_complete_portfolio

        conn.commit()
        full_portfolio = get_complete_portfolio(portfolio_id)

        job_ids = []
        for jd in SAMPLE_JOB_DESCRIPTIONS:
            extracted = analyze_job_description_deterministic(jd["raw_text"], jd["title"], jd["company"])
            matched = match_portfolio_to_job(full_portfolio, extracted)
            cur = conn.execute(
                """
                INSERT INTO job_descriptions
                (portfolio_id, title, company, raw_text, analysis_source, extracted_data_json, match_results_json, is_sample, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'rule_based', ?, ?, 0, ?, ?)
                """,
                (
                    portfolio_id,
                    jd["title"],
                    jd["company"],
                    jd["raw_text"],
                    json.dumps(extracted),
                    json.dumps(matched),
                    ts,
                    ts,
                ),
            )
            job_ids.append(cur.lastrowid)

        # 14. Create Two Tailored Resume Sessions for Hazel (Education + Projects + Skills + Certifications)
        # Resume 1: Full-Stack Developer
        fs_skills = [
            skill_id_map["Python"],
            skill_id_map["JavaScript (ES6+)"],
            skill_id_map["SQL (MySQL)"],
            skill_id_map["React.js"],
            skill_id_map["Node.js (Learning)"],
            skill_id_map["PostgreSQL"],
            skill_id_map["MongoDB & Atlas"],
            skill_id_map["Git & GitHub"],
            skill_id_map["Postman & Thunderclient"],
            skill_id_map["MySQL Workbench"],
        ]
        fs_projects = [
            project_id_map["Hospital Management System (Full-Stack)"],
            project_id_map["Red Bull Website Clone"],
            project_id_map["Personal Portfolio Website"],
        ]
        fs_certs = [
            cert_id_map["SQL (Basic) Certificate"],
            cert_id_map["SQL (Intermediate) Certificate"],
            cert_id_map["Java (Basic) Certificate"],
        ]

        conn.execute(
            """
            INSERT INTO resume_sessions
            (portfolio_id, job_description_id, session_name, target_role, target_company, template_name,
             custom_summary, section_order_json, selected_records_json, optional_sections_json, last_pdf_filename, is_sample, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            """,
            (
                portfolio_id,
                job_ids[0],
                "Hazel Lakshmana — Full-Stack Developer Resume",
                "Full-Stack Developer",
                "TechNova Solutions",
                "classic_ats",
                SUMMARIES[0]["content"],
                json.dumps([
                    "summary",
                    "education",
                    "technical_skills",
                    "projects",
                    "certifications",
                    "extracurricular",
                    "languages",
                ]),
                json.dumps({
                    "technical_skills": fs_skills,
                    "projects": fs_projects,
                    "certifications": fs_certs,
                    "extracurricular": list(extra_id_map.values()),
                }),
                json.dumps({
                    "summary": True,
                    "education": True,
                    "technical_skills": True,
                    "projects": True,
                    "certifications": True,
                    "experience": False,
                    "achievements": False,
                    "publications": False,
                    "soft_skills": False,
                    "languages": True,
                    "extracurricular": True,
                }),
                "Hazel_Lakshmana_Full_Stack_Developer.pdf",
                ts,
                ts,
            ),
        )

        # Resume 2: Frontend & React.js Developer
        fe_skills = [
            skill_id_map["React.js"],
            skill_id_map["JavaScript (ES6+)"],
            skill_id_map["HTML5 & CSS3"],
            skill_id_map["Tailwind CSS"],
            skill_id_map["Git & GitHub"],
            skill_id_map["Postman & Thunderclient"],
            skill_id_map["VS Code"],
            skill_id_map["Python"],
        ]
        fe_projects = [
            project_id_map["Red Bull Website Clone"],
            project_id_map["Personal Portfolio Website"],
            project_id_map["Hospital Management System (Full-Stack)"],
        ]
        fe_certs = [
            cert_id_map["SQL (Basic) Certificate"],
            cert_id_map["Java (Basic) Certificate"],
        ]

        conn.execute(
            """
            INSERT INTO resume_sessions
            (portfolio_id, job_description_id, session_name, target_role, target_company, template_name,
             custom_summary, section_order_json, selected_records_json, optional_sections_json, last_pdf_filename, is_sample, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            """,
            (
                portfolio_id,
                job_ids[1],
                "Hazel Lakshmana — Frontend Developer Resume",
                "Frontend & React.js Developer",
                "PulseDigital Creative Studios",
                "modern_minimal",
                SUMMARIES[1]["content"],
                json.dumps([
                    "summary",
                    "education",
                    "technical_skills",
                    "projects",
                    "certifications",
                    "extracurricular",
                    "languages",
                ]),
                json.dumps({
                    "technical_skills": fe_skills,
                    "projects": fe_projects,
                    "certifications": fe_certs,
                    "extracurricular": list(extra_id_map.values()),
                }),
                json.dumps({
                    "summary": True,
                    "education": True,
                    "technical_skills": True,
                    "projects": True,
                    "certifications": True,
                    "experience": False,
                    "achievements": False,
                    "publications": False,
                    "soft_skills": False,
                    "languages": True,
                    "extracurricular": True,
                }),
                "Hazel_Lakshmana_Frontend_Developer.pdf",
                ts,
                ts,
            ),
        )

        conn.commit()
        print(f"Successfully seeded database at {Config.DATABASE_PATH} with Hazel Lakshmana's exact 2nd-year profile.")
    finally:
        conn.close()


if __name__ == "__main__":
    seed_database(reset=True)
