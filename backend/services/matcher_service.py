import re
from typing import Any

# Canonical dictionary of known technical skills and aliases for deterministic extraction
KNOWN_TECH_SKILLS: dict[str, list[str]] = {
    "Python": ["python", "python3"],
    "JavaScript": ["javascript", "js", "es6"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "react.js", "reactjs"],
    "Node.js": ["node.js", "nodejs", "express", "express.js"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi"],
    "Django": ["django"],
    "SQL": ["sql", "sqlite", "postgresql", "postgres", "mysql"],
    "NoSQL / MongoDB": ["mongodb", "nosql", "dynamodb", "firestore"],
    "PyTorch": ["pytorch", "torch"],
    "TensorFlow": ["tensorflow", "keras"],
    "Scikit-Learn": ["scikit-learn", "sklearn"],
    "Pandas & NumPy": ["pandas", "numpy"],
    "Machine Learning": ["machine learning", "ml", "supervised learning", "classification", "regression"],
    "Deep Learning": ["deep learning", "neural networks", "cnn", "rnn", "transformers"],
    "NLP / LLMs": ["nlp", "natural language processing", "llm", "large language models", "rag", "generative ai", "gemini", "openai", "langchain"],
    "Computer Vision": ["computer vision", "opencv", "image processing", "yolo"],
    "REST APIs": ["rest api", "restful", "rest apis", "api design", "graphql"],
    "Tailwind CSS": ["tailwind", "tailwindcss", "css3", "html5", "responsive design"],
    "Git & GitHub": ["git", "github", "version control", "gitlab"],
    "Docker": ["docker", "containerization", "containers"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS / Cloud": ["aws", "amazon web services", "gcp", "google cloud", "azure", "cloud deployment"],
    "CI/CD": ["ci/cd", "github actions", "jenkins", "automated testing"],
    "Linux / Bash": ["linux", "unix", "bash", "shell scripting"],
    "Data Visualization": ["matplotlib", "seaborn", "plotly", "tableau", "power bi"],
    "C++": ["c++", "cpp"],
    "Java": ["java", "spring boot"],
    "Go": ["golang"],
    "Rust": ["rust"],
    "Redis": ["redis", "caching"],
}

KNOWN_SOFT_SKILLS: dict[str, list[str]] = {
    "Problem Solving": ["problem solving", "problem-solving", "analytical thinking", "debugging", "troubleshooting"],
    "Team Collaboration": ["collaboration", "teamwork", "cross-functional", "team player", "pair programming"],
    "Technical Communication": ["communication", "written and verbal", "documentation", "presenting", "stakeholder"],
    "Agile / Scrum": ["agile", "scrum", "sprint", "kanban"],
    "Time Management": ["time management", "prioritization", "self-starter", "fast-paced", "deadline"],
    "Leadership & Mentorship": ["leadership", "mentoring", "mentorship", "leading", "initiative"],
    "Adaptability & Fast Learning": ["adaptability", "quick learner", "fast learner", "curiosity", "continuous learning"],
}


def _contains_term(text_lower: str, term: str) -> bool:
    pattern = r"(?<![a-z0-9])" + re.escape(term.lower()) + r"(?![a-z0-9])"
    return bool(re.search(pattern, text_lower))


def analyze_job_description_deterministic(
    raw_text: str, title_hint: str = "", company_hint: str = ""
) -> dict[str, Any]:
    """
    Deterministic keyword and structure analyzer for job descriptions.
    Explicitly labeled as 'rule_based' so the user knows whether Gemini AI or local rules ran.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    text_lower = raw_text.lower()

    # Infer job title if not provided
    inferred_title = title_hint.strip()
    inferred_company = company_hint.strip()

    if not inferred_title and lines:
        for line in lines[:5]:
            cleaned = re.sub(r"^(job title|position|role)\s*:\s*", "", line, flags=re.I).strip()
            if 3 <= len(cleaned) <= 80 and not cleaned.endswith("."):
                inferred_title = cleaned
                break
    if not inferred_title:
        inferred_title = "Target Role"

    if not inferred_company:
        for line in lines[:8]:
            m = re.search(r"^(?:company|organization|employer)\s*:\s*(.+)$", line, flags=re.I)
            if m:
                inferred_company = m.group(1).strip()
                break

    # Extract technical skills
    extracted_tech: list[str] = []
    for canonical, aliases in KNOWN_TECH_SKILLS.items():
        if any(_contains_term(text_lower, alias) for alias in aliases):
            extracted_tech.append(canonical)

    # Extract soft skills
    extracted_soft: list[str] = []
    for canonical, aliases in KNOWN_SOFT_SKILLS.items():
        if any(_contains_term(text_lower, alias) for alias in aliases):
            extracted_soft.append(canonical)

    # Parse bullet lines into sections (required, preferred, responsibilities)
    required_qualifications: list[str] = []
    preferred_qualifications: list[str] = []
    responsibilities: list[str] = []

    current_bucket = "general"
    for line in lines:
        low = line.lower().rstrip(":")
        if any(
            h in low
            for h in [
                "preferred qualification",
                "nice to have",
                "bonus",
                "preferred skills",
                "plus",
                "desirable",
            ]
        ) and len(line) < 75:
            current_bucket = "preferred"
            continue
        elif any(
            h in low
            for h in [
                "required qualification",
                "requirements",
                "what you bring",
                "minimum qualification",
                "must have",
                "qualifications",
            ]
        ) and len(line) < 75:
            current_bucket = "required"
            continue
        elif any(
            h in low
            for h in [
                "responsibilities",
                "what you'll do",
                "what you will do",
                "role overview",
                "duties",
                "day-to-day",
            ]
        ) and len(line) < 75:
            current_bucket = "responsibilities"
            continue

        is_bullet = bool(re.match(r"^[-*•\d+.)]\s+", line))
        clean_bullet = re.sub(r"^[-*•\d+.)]\s+", "", line).strip()
        if not clean_bullet or len(clean_bullet) < 10:
            continue

        if current_bucket == "preferred" or any(
            w in clean_bullet.lower() for w in ["preferred", "nice to have", "bonus:", "plus:", "ideally"]
        ):
            preferred_qualifications.append(clean_bullet)
        elif current_bucket == "responsibilities":
            responsibilities.append(clean_bullet)
        elif current_bucket == "required" or is_bullet:
            required_qualifications.append(clean_bullet)

    # Fallback if prose JD had no bullets
    if not required_qualifications and extracted_tech:
        required_qualifications = [f"Proficiency in {skill}" for skill in extracted_tech[:6]]
    if not responsibilities and lines:
        responsibilities = [l for l in lines if len(l) > 35][:4]

    keywords = list(dict.fromkeys(extracted_tech + extracted_soft))

    return {
        "job_title": inferred_title,
        "company": inferred_company,
        "technical_skills": extracted_tech,
        "soft_skills": extracted_soft,
        "required_qualifications": required_qualifications[:12],
        "preferred_qualifications": preferred_qualifications[:10],
        "responsibilities": responsibilities[:10],
        "keywords": keywords[:20],
        "analysis_mode": "rule_based",
    }


def _build_portfolio_evidence_index(portfolio_data: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Flattens all saved portfolio records into searchable evidence items with exact record IDs,
    categories, titles, and text snippets so every match cites real saved SQLite records.
    """
    categories = portfolio_data.get("categories", {})
    evidence_items: list[dict[str, Any]] = []

    for edu in categories.get("education", []):
        title = f"{edu.get('degree', '')} in {edu.get('field_of_study', '')} — {edu.get('institution', '')}"
        searchable = " ".join(
            [
                str(edu.get("degree", "")),
                str(edu.get("field_of_study", "")),
                str(edu.get("institution", "")),
                str(edu.get("coursework", "")),
                str(edu.get("description", "")),
            ]
        )
        evidence_items.append(
            {
                "category": "education",
                "category_label": "Education",
                "record_id": edu["id"],
                "title": title.strip(" —"),
                "snippet": f"Coursework & Focus: {edu.get('coursework') or edu.get('description') or edu.get('field_of_study')}",
                "searchable": searchable.lower(),
            }
        )

    for sk in categories.get("technical_skills", []):
        title = f"{sk.get('skill_name', '')} ({sk.get('category', '')}, {sk.get('proficiency', '')})"
        searchable = " ".join(
            [
                str(sk.get("skill_name", "")),
                str(sk.get("category", "")),
                str(sk.get("evidence_note", "")),
            ]
        )
        evidence_items.append(
            {
                "category": "technical_skills",
                "category_label": "Technical Skills",
                "record_id": sk["id"],
                "title": title,
                "snippet": sk.get("evidence_note") or f"{sk.get('proficiency', 'Intermediate')} proficiency ({sk.get('years_experience', '1+ yr')})",
                "searchable": searchable.lower(),
                "raw_name": str(sk.get("skill_name", "")).lower(),
            }
        )

    for ssk in categories.get("soft_skills", []):
        title = f"{ssk.get('skill_name', '')}"
        searchable = f"{ssk.get('skill_name', '')} {ssk.get('context', '')}"
        evidence_items.append(
            {
                "category": "soft_skills",
                "category_label": "Soft Skills",
                "record_id": ssk["id"],
                "title": title,
                "snippet": ssk.get("context") or ssk.get("proficiency", ""),
                "searchable": searchable.lower(),
            }
        )

    for proj in categories.get("projects", []):
        title = f"{proj.get('title', '')} [{proj.get('tech_stack', '')}]"
        searchable = " ".join(
            [
                str(proj.get("title", "")),
                str(proj.get("tech_stack", "")),
                str(proj.get("description", "")),
                str(proj.get("highlights", "")),
                str(proj.get("metrics", "")),
            ]
        )
        evidence_items.append(
            {
                "category": "projects",
                "category_label": "Projects",
                "record_id": proj["id"],
                "title": proj.get("title", "Project"),
                "snippet": f"Tech: {proj.get('tech_stack', '')} | {proj.get('description', '')[:140]}",
                "searchable": searchable.lower(),
            }
        )

    for exp in categories.get("experience", []):
        title = f"{exp.get('role', '')} at {exp.get('company', '')}"
        searchable = " ".join(
            [
                str(exp.get("role", "")),
                str(exp.get("company", "")),
                str(exp.get("technologies", "")),
                str(exp.get("description", "")),
                str(exp.get("achievements", "")),
            ]
        )
        evidence_items.append(
            {
                "category": "experience",
                "category_label": "Experience",
                "record_id": exp["id"],
                "title": title,
                "snippet": f"Tech: {exp.get('technologies', '')} | {exp.get('description', '')[:140]}",
                "searchable": searchable.lower(),
            }
        )

    for cert in categories.get("certifications", []):
        title = f"{cert.get('name', '')} ({cert.get('issuing_organization', '')})"
        searchable = " ".join(
            [
                str(cert.get("name", "")),
                str(cert.get("issuing_organization", "")),
                str(cert.get("skills_covered", "")),
            ]
        )
        evidence_items.append(
            {
                "category": "certifications",
                "category_label": "Certifications",
                "record_id": cert["id"],
                "title": title,
                "snippet": f"Skills covered: {cert.get('skills_covered') or cert.get('name')}",
                "searchable": searchable.lower(),
            }
        )

    for ach in categories.get("achievements", []):
        title = f"{ach.get('title', '')} ({ach.get('issuer', '')})"
        searchable = f"{ach.get('title', '')} {ach.get('description', '')} {ach.get('impact', '')}"
        evidence_items.append(
            {
                "category": "achievements",
                "category_label": "Achievements",
                "record_id": ach["id"],
                "title": title,
                "snippet": ach.get("description", "")[:140],
                "searchable": searchable.lower(),
            }
        )

    for pub in categories.get("publications", []):
        title = f"{pub.get('title', '')} ({pub.get('venue', '')})"
        searchable = f"{pub.get('title', '')} {pub.get('venue', '')} {pub.get('summary', '')}"
        evidence_items.append(
            {
                "category": "publications",
                "category_label": "Publications",
                "record_id": pub["id"],
                "title": title,
                "snippet": pub.get("summary", "")[:140],
                "searchable": searchable.lower(),
            }
        )

    for extra in categories.get("extracurricular", []):
        title = f"{extra.get('role', '')} — {extra.get('organization', '')}"
        searchable = f"{extra.get('role', '')} {extra.get('organization', '')} {extra.get('description', '')} {extra.get('contributions', '')}"
        evidence_items.append(
            {
                "category": "extracurricular",
                "category_label": "Extracurricular",
                "record_id": extra["id"],
                "title": title,
                "snippet": extra.get("description", "")[:140],
                "searchable": searchable.lower(),
            }
        )

    return evidence_items


ENGLISH_STOP_WORDS = {
    "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "with", "by",
    "from", "as", "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "but", "if", "than", "then", "into", "through",
    "during", "before", "after", "above", "below", "between", "under", "again",
    "further", "once", "here", "there", "when", "where", "why", "how", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "too", "very", "can", "will", "just",
    "should", "now", "experience", "knowledge", "proficiency", "strong", "good",
    "understanding", "ability", "working", "using", "build", "building", "develop",
    "developing", "years", "year", "plus", "preferred", "required", "familiarity",
    "hands", "degree", "bachelor", "master", "phd", "computer", "science",
    "engineering", "related", "field", "role", "team", "software", "environment",
    "application", "applications", "5+", "3+", "2+", "1+", "commercial", "production",
}


def _find_supporting_records_for_term(
    term: str, evidence_items: list[dict[str, Any]]
) -> tuple[list[dict[str, Any]], str]:
    """
    Searches the portfolio evidence index for records supporting `term`.
    Returns (supporting_records, match_level: 'matched' | 'partial' | 'none').
    """
    term_lower = term.lower().strip()
    search_aliases = [term_lower]

    for canonical, aliases in {**KNOWN_TECH_SKILLS, **KNOWN_SOFT_SKILLS}.items():
        if canonical.lower() == term_lower or term_lower in aliases:
            search_aliases = list(set([canonical.lower()] + aliases))
            break

    # Extract meaningful content tokens (excluding stop words)
    tokens = [
        t
        for t in re.findall(r"[a-zA-Z0-9+#.]{2,}", term_lower)
        if t not in ENGLISH_STOP_WORDS and len(t) > 2
    ]

    direct_matches: list[dict[str, Any]] = []
    partial_matches: list[dict[str, Any]] = []

    # Check if requirement is explicitly asking for a CS/Engineering degree
    is_degree_req = bool(
        re.search(r"\b(b\.?tech|b\.?s\.?|bachelor|undergraduate|degree)\b", term_lower)
        and any(w in term_lower for w in ["computer science", "engineering", "ai", "data science"])
    )

    # Check if requirement is an unmet senior experience threshold
    is_senior_experience_req = bool(
        re.search(r"(5\+|4\+|3\+|5\s*plus|several years|senior level|\d+\+\s*years)", term_lower)
    )

    if is_senior_experience_req:
        return [], "none"

    for item in evidence_items:
        haystack = item["searchable"]
        if any(_contains_term(haystack, alias) for alias in search_aliases):
            direct_matches.append(
                {
                    "category": item["category"],
                    "category_label": item["category_label"],
                    "record_id": item["record_id"],
                    "title": item["title"],
                    "evidence": item["snippet"],
                }
            )
            continue

        if is_degree_req and item["category"] == "education":
            if any(w in haystack for w in ["computer science", "b.tech", "bachelor", "engineering"]):
                direct_matches.append(
                    {
                        "category": item["category"],
                        "category_label": item["category_label"],
                        "record_id": item["record_id"],
                        "title": item["title"],
                        "evidence": item["snippet"],
                    }
                )
                continue

        if tokens:
            hit_tokens = [tok for tok in tokens if _contains_term(haystack, tok)]
            ratio = len(hit_tokens) / max(len(tokens), 1)
            if ratio >= 0.70 and len(hit_tokens) >= 2:
                direct_matches.append(
                    {
                        "category": item["category"],
                        "category_label": item["category_label"],
                        "record_id": item["record_id"],
                        "title": item["title"],
                        "evidence": item["snippet"],
                    }
                )
            elif len(hit_tokens) >= 1 and any(len(t) >= 4 for t in hit_tokens):
                partial_matches.append(
                    {
                        "category": item["category"],
                        "category_label": item["category_label"],
                        "record_id": item["record_id"],
                        "title": item["title"],
                        "evidence": item["snippet"],
                        "matched_keywords": hit_tokens,
                    }
                )

    if direct_matches:
        return direct_matches[:5], "matched"
    if partial_matches:
        return partial_matches[:4], "partial"
    return [], "none"


def match_portfolio_to_job(
    portfolio_data: dict[str, Any], extracted_job: dict[str, Any]
) -> dict[str, Any]:
    """
    Compares extracted job requirements against actual SQLite portfolio records.
    Strictly enforces fact-preservation: never claims a qualification without a supporting record ID.
    Distinguishes between:
      - 'not_entered_in_portfolio': Skill/tool might be known by student but has no record in SQLite yet
      - 'missing_qualification': Experience level, specialized certification, or domain requirement not met by current records
    """
    evidence_items = _build_portfolio_evidence_index(portfolio_data)

    matched_requirements: list[dict[str, Any]] = []
    partial_matches: list[dict[str, Any]] = []
    missing_or_unsupported: list[dict[str, Any]] = []

    # Track relevance scores per portfolio record: (category, record_id) -> score
    record_scores: dict[tuple[str, int], int] = {}

    def _evaluate_requirement(req_text: str, req_type: str, weight: int = 2) -> None:
        supporting, level = _find_supporting_records_for_term(req_text, evidence_items)
        if level == "matched":
            for s in supporting:
                key = (s["category"], int(s["record_id"]))
                record_scores[key] = record_scores.get(key, 0) + weight * 2
            matched_requirements.append(
                {
                    "requirement": req_text,
                    "requirement_type": req_type,
                    "status": "matched",
                    "supporting_records": supporting,
                    "explanation": f"Directly supported by {len(supporting)} saved portfolio record(s): "
                    + ", ".join(f"[{s['category_label']} #{s['record_id']}] {s['title']}" for s in supporting[:3]),
                }
            )
        elif level == "partial":
            for s in supporting:
                key = (s["category"], int(s["record_id"]))
                record_scores[key] = record_scores.get(key, 0) + weight
            partial_matches.append(
                {
                    "requirement": req_text,
                    "requirement_type": req_type,
                    "status": "partial",
                    "supporting_records": supporting,
                    "explanation": "Partially supported by related coursework/projects in your portfolio ("
                    + ", ".join(f"[{s['category_label']} #{s['record_id']}] {s['title']}" for s in supporting[:2])
                    + "), though not all specific tools or seniority aspects in this requirement are explicitly documented.",
                }
            )
        else:
            # Distinguish between a specific tool/skill not entered in portfolio vs a formal qualification/experience gap
            low = req_text.lower()
            is_formal_gap = any(
                phrase in low
                for phrase in [
                    "years of experience",
                    "5+ years",
                    "3+ years",
                    "phd",
                    "master's degree",
                    "security clearance",
                    "production scale",
                    "commercial experience",
                ]
            )
            gap_category = (
                "missing_qualification"
                if is_formal_gap
                else "not_entered_or_unsupported"
            )
            gap_label = (
                "Genuinely Missing Qualification / Experience Level"
                if is_formal_gap
                else "Not Found in Saved Portfolio (Unverified / Not Entered)"
            )
            guidance = (
                "Your saved portfolio records do not meet this formal experience/degree threshold. The resume builder will NOT fabricate or claim this qualification."
                if is_formal_gap
                else "No saved record in SQLite mentions this skill or requirement. If you actually have experience with it, add a Technical Skill or Project record first; otherwise it will be excluded from your resume."
            )
            missing_or_unsupported.append(
                {
                    "requirement": req_text,
                    "requirement_type": req_type,
                    "status": "missing",
                    "gap_type": gap_category,
                    "gap_label": gap_label,
                    "supporting_records": [],
                    "explanation": guidance,
                }
            )

    # 1. Evaluate Technical Skills
    for skill in extracted_job.get("technical_skills", []):
        _evaluate_requirement(skill, "technical_skill", weight=3)

    # 2. Evaluate Soft Skills
    for sskill in extracted_job.get("soft_skills", []):
        _evaluate_requirement(sskill, "soft_skill", weight=1)

    # 3. Evaluate Required Qualifications
    for req in extracted_job.get("required_qualifications", []):
        _evaluate_requirement(req, "required_qualification", weight=3)

    # 4. Evaluate Preferred Qualifications
    for pref in extracted_job.get("preferred_qualifications", []):
        _evaluate_requirement(pref, "preferred_qualification", weight=1)

    total_reqs = len(matched_requirements) + len(partial_matches) + len(missing_or_unsupported)
    if total_reqs > 0:
        raw_score = (
            (len(matched_requirements) * 1.0 + len(partial_matches) * 0.5) / total_reqs
        ) * 100
        overall_score = int(round(min(100.0, max(5.0, raw_score))))
    else:
        overall_score = 50

    # Compute recommended record selections per category based on match scores
    categories = portfolio_data.get("categories", {})
    recommended_selections: dict[str, list[int]] = {}
    record_relevance_notes: dict[str, str] = {}

    for cat_key, items in categories.items():
        if cat_key in ("personal_info", "professional_summaries"):
            continue
        scored_items = []
        for item in items:
            rid = int(item["id"])
            score = record_scores.get((cat_key, rid), 0)
            scored_items.append((score, rid, item))
            if score > 0:
                record_relevance_notes[f"{cat_key}:{rid}"] = f"Matched {score} relevance points for this job"

        scored_items.sort(key=lambda x: (-x[0], x[1]))

        if cat_key in ("education", "languages"):
            # Usually include all education & languages by default
            recommended_selections[cat_key] = [rid for _, rid, _ in scored_items]
        elif cat_key == "projects":
            # Select matched projects first; if fewer than 2 matched, take top 2-3 most relevant
            matched_ids = [rid for sc, rid, _ in scored_items if sc > 0]
            if len(matched_ids) >= 2:
                recommended_selections[cat_key] = matched_ids[:4]
            else:
                recommended_selections[cat_key] = [rid for _, rid, _ in scored_items[:3]]
        elif cat_key == "technical_skills":
            matched_ids = [rid for sc, rid, _ in scored_items if sc > 0]
            if len(matched_ids) >= 4:
                recommended_selections[cat_key] = matched_ids
            else:
                recommended_selections[cat_key] = [rid for _, rid, _ in scored_items[:8]]
        elif cat_key == "experience":
            matched_ids = [rid for sc, rid, _ in scored_items if sc > 0]
            recommended_selections[cat_key] = (
                matched_ids if matched_ids else [rid for _, rid, _ in scored_items[:2]]
            )
        else:
            matched_ids = [rid for sc, rid, _ in scored_items if sc > 0]
            recommended_selections[cat_key] = (
                matched_ids if matched_ids else [rid for _, rid, _ in scored_items[:2]]
            )

    # Pick the best matching professional summary
    summaries = categories.get("professional_summaries", [])
    recommended_summary_id = None
    recommended_summary_text = ""
    job_title_low = str(extracted_job.get("job_title", "")).lower()

    if summaries:
        best_sum = summaries[0]
        best_sc = -1
        for s in summaries:
            sc = 0
            target_low = str(s.get("target_role", "")).lower()
            title_low = str(s.get("title", "")).lower()
            content_low = str(s.get("content", "")).lower()
            if any(w in target_low or w in title_low for w in job_title_low.split() if len(w) > 2):
                sc += 10
            for kw in extracted_job.get("technical_skills", []):
                if kw.lower() in content_low:
                    sc += 2
            if sc > best_sc:
                best_sc = sc
                best_sum = s
        recommended_summary_id = best_sum["id"]
        recommended_summary_text = best_sum["content"]

    return {
        "overall_match_score": overall_score,
        "summary_counts": {
            "matched": len(matched_requirements),
            "partial": len(partial_matches),
            "missing": len(missing_or_unsupported),
            "total_evaluated": total_reqs,
        },
        "matched_requirements": matched_requirements,
        "partial_matches": partial_matches,
        "missing_or_unsupported": missing_or_unsupported,
        "recommended_selections": recommended_selections,
        "recommended_summary_id": recommended_summary_id,
        "recommended_summary_text": recommended_summary_text,
        "record_relevance_notes": record_relevance_notes,
        "fact_check_policy": (
            "All matched items are verified against existing SQLite portfolio record IDs. "
            "Unsupported or missing requirements are excluded from automatic resume claims."
        ),
    }
