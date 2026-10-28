import json
import os
import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import app
from database.db import get_complete_portfolio, init_db
from database.seed import seed_database
from services.matcher_service import (
    analyze_job_description_deterministic,
    match_portfolio_to_job,
)
from services.pdf_service import build_resume_pdf


class PortfolioAppTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Initialize and seed with Hazel Lakshmana 2nd-year data
        seed_database(reset=True)
        cls.client = app.test_client()

    def test_01_health_check(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("gemini_configured", data)
        self.assertIn("sheets_configured", data)

    def test_02_portfolio_stats_and_overview(self):
        resp = self.client.get("/api/portfolio/stats")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["candidate_name"], "Hazel Lakshmana")
        self.assertEqual(data["total_projects"], 3)
        self.assertEqual(data["total_experience"], 0)
        self.assertEqual(data["total_achievements"], 0)
        self.assertEqual(data["total_certifications"], 3)
        self.assertGreaterEqual(data["total_technical_skills"], 10)

    def test_03_portfolio_crud_lifecycle(self):
        # 1. Create new Project
        new_project = {
            "title": "Autonomous Drone Navigation",
            "role": "Robotics Developer",
            "tech_stack": "Python, OpenCV, ROS, C++",
            "start_date": "Jan 2026",
            "end_date": "May 2026",
            "description": "Visual SLAM and obstacle avoidance algorithms for indoor autonomous quadcopters.",
            "metrics": "Zero collision in 50 flight runs.",
        }
        res_create = self.client.post("/api/portfolio/projects", json=new_project)
        self.assertEqual(res_create.status_code, 201)
        created_data = res_create.get_json()
        project_id = created_data["id"]
        self.assertEqual(created_data["title"], "Autonomous Drone Navigation")

        # 2. Read back
        res_list = self.client.get("/api/portfolio/projects")
        self.assertEqual(res_list.status_code, 200)
        projects = res_list.get_json()
        self.assertTrue(any(p["id"] == project_id for p in projects))

        # 3. Update Project
        res_update = self.client.put(
            f"/api/portfolio/projects/{project_id}",
            json={**new_project, "metrics": "Zero collision in 100 test flights."},
        )
        self.assertEqual(res_update.status_code, 200)
        updated_data = res_update.get_json()
        self.assertEqual(updated_data["metrics"], "Zero collision in 100 test flights.")

        # 4. Delete Project
        res_del = self.client.delete(f"/api/portfolio/projects/{project_id}")
        self.assertEqual(res_del.status_code, 200)

        # 5. Verify Deletion
        res_after = self.client.get("/api/portfolio/projects")
        self.assertFalse(any(p["id"] == project_id for p in res_after.get_json()))

    def test_04_job_analysis_and_matching_fullstack(self):
        fs_jd = """
        Position: Junior Full-Stack Developer
        Company: TechNova Solutions
        Requirements:
        • Degree in Computer Science Engineering
        • Programming in Python, React, JavaScript, and SQL
        • Experience with PostgreSQL, MongoDB, and Postman
        • 5+ years of senior commercial experience
        """
        resp = self.client.post(
            "/api/jobs/analyze",
            json={"raw_text": fs_jd, "title": "Junior Full-Stack Developer", "mode": "rule_based"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()

        # Check extracted requirements
        extracted = data["extracted_data"]
        self.assertIn("Python", extracted["technical_skills"])
        self.assertIn("React", extracted["technical_skills"])

        # Check match results
        match = data["match_results"]
        self.assertGreater(match["overall_match_score"], 40)
        matched_reqs = match["matched_requirements"]
        missing_reqs = match["missing_or_unsupported"]

        # Python and React should cite real SQLite records
        python_match = next((m for m in matched_reqs if "Python" in m["requirement"]), None)
        self.assertIsNotNone(python_match)
        self.assertGreater(len(python_match["supporting_records"]), 0)
        for ref in python_match["supporting_records"]:
            self.assertIn("record_id", ref)
            self.assertIn("title", ref)

        # 5+ years experience should be identified as missing rather than fabricated
        senior_missing = next(
            (m for m in missing_reqs if "5+ years" in m["requirement"].lower()), None
        )
        self.assertIsNotNone(senior_missing)
        self.assertEqual(senior_missing["gap_type"], "missing_qualification")

    def test_05_role_differentiation_same_portfolio_generates_distinct_resumes(self):
        # Retrieve both seeded sessions from SQLite
        res = self.client.get("/api/resumes")
        self.assertEqual(res.status_code, 200)
        sessions = res.get_json()
        self.assertGreaterEqual(len(sessions), 2)

        fs_session = next(
            (s for s in sessions if "Full-Stack" in s["target_role"] or "Full-Stack" in s["session_name"]),
            None,
        )
        fe_session = next(
            (s for s in sessions if "Frontend" in s["target_role"] or "Frontend" in s["session_name"]),
            None,
        )

        self.assertIsNotNone(fs_session, "Full-Stack Developer session must exist")
        self.assertIsNotNone(fe_session, "Frontend Developer session must exist")

        # Preview both resumes
        preview_fs = self.client.post("/api/resumes/preview", json=fs_session).get_json()
        preview_fe = self.client.post("/api/resumes/preview", json=fe_session).get_json()

        fs_skills = [
            s["skill_name"]
            for s in preview_fs["filtered_sections"].get("technical_skills", [])
        ]
        fe_skills = [
            s["skill_name"]
            for s in preview_fe["filtered_sections"].get("technical_skills", [])
        ]

        # Verify Full-Stack resume emphasizes Python and SQL
        self.assertIn("Python", fs_skills)
        self.assertIn("SQL (MySQL)", fs_skills)

        # Verify Frontend resume emphasizes React and HTML5 & CSS3
        self.assertIn("React.js", fe_skills)
        self.assertIn("HTML5 & CSS3", fe_skills)

        # Verify Project Differentiation
        fs_projects = [
            p["title"] for p in preview_fs["filtered_sections"].get("projects", [])
        ]
        fe_projects = [
            p["title"] for p in preview_fe["filtered_sections"].get("projects", [])
        ]

        self.assertTrue(any("Hospital Management System" in p for p in fs_projects))
        self.assertTrue(any("Red Bull" in p for p in fe_projects))

        # Verify distinct templates
        self.assertEqual(fs_session["template_name"], "classic_ats")
        self.assertEqual(fe_session["template_name"], "modern_minimal")

    def test_06_pdf_compilation_and_download(self):
        sessions = self.client.get("/api/resumes").get_json()
        target_session = sessions[0]

        # Request PDF compilation
        res_gen = self.client.post("/api/resumes/generate-pdf", json=target_session)
        self.assertEqual(res_gen.status_code, 200)
        data = res_gen.get_json()
        self.assertTrue(data["success"])
        self.assertTrue(data["filename"].endswith(".pdf"))
        self.assertGreater(data["file_size_bytes"], 1000)

        # Test download endpoint
        res_dl = self.client.get(data["download_url"])
        self.assertEqual(res_dl.status_code, 200)
        self.assertEqual(res_dl.mimetype, "application/pdf")
        self.assertGreater(len(res_dl.data), 1000)
        res_dl.close()

    def test_07_google_sheets_connectivity(self):
        # Status endpoint
        resp = self.client.get("/api/sheets/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("configured", data)
        self.assertIn("setup_guide", data)

        # Audit logs should record events in SQLite
        from database.db import log_sync_event
        log_sync_event(1, "SUCCESS", "1HSH4qsBJLFfA4AwDSJsxq3Z8pKTmyz37H-8nJbWabK0", "Verified Google Sheets sync event")
        logs_resp = self.client.get("/api/sheets/logs")
        self.assertEqual(logs_resp.status_code, 200)
        logs = logs_resp.get_json()
        self.assertGreater(len(logs), 0)

    def test_08_input_validation(self):
        bad_personal = {"email": "invalid-email"}
        resp = self.client.post("/api/portfolio/personal_info", json=bad_personal)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Full Name is required", resp.get_json()["message"])

        resp_bad_cat = self.client.get("/api/portfolio/unknown_category_xyz")
        self.assertEqual(resp_bad_cat.status_code, 400)


if __name__ == "__main__":
    unittest.main()
