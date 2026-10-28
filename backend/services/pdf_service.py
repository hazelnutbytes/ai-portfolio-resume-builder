import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from config import Config


def _slugify(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text).strip()
    return re.sub(r"[-\s]+", "_", cleaned)


def generate_resume_filename(candidate_name: str, target_role: str) -> str:
    cand_slug = _slugify(candidate_name or "Candidate")
    role_slug = _slugify(target_role or "Resume")
    timestamp = datetime.now().strftime("%Y%m%d")
    return f"{cand_slug}_{role_slug}_{timestamp}.pdf"


def _clean_str(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def build_resume_pdf(
    portfolio_data: dict[str, Any],
    session_config: dict[str, Any],
    output_filepath: str | Path | None = None,
) -> str:
    """
    Builds an ATS-friendly PDF resume using ReportLab.
    Supports 2 clean ATS templates:
      - 'classic_ats' (Timeless serif / sans, clean horizontal dividers, centered header, strong text hierarchy)
      - 'modern_minimal' (Left-aligned header with subtle accent bar, clean modern spacing)
    Ensures safe page breaks, readable fonts, zero decorative graphics/bars, and strictly ATS-parseable text.
    """
    categories = portfolio_data.get("categories", {})
    personal_list = categories.get("personal_info", [])
    personal = personal_list[0] if personal_list else {}

    template_name = session_config.get("template_name", "classic_ats")
    candidate_name = personal.get("full_name") or "Student Candidate"
    target_role = session_config.get("target_role") or personal.get("headline") or "Software Engineer"

    # Destination file
    Config.GENERATED_RESUMES_DIR.mkdir(parents=True, exist_ok=True)
    if not output_filepath:
        fname = generate_resume_filename(candidate_name, target_role)
        output_filepath = Config.GENERATED_RESUMES_DIR / fname
    else:
        output_filepath = Path(output_filepath)
        output_filepath.parent.mkdir(parents=True, exist_ok=True)

    # Document margins: ATS standards recommend 0.5 to 0.75 inch
    doc = SimpleDocTemplate(
        str(output_filepath),
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
        title=f"Resume - {candidate_name}",
        author=candidate_name,
    )

    styles = getSampleStyleSheet()

    # Color palettes
    if template_name == "modern_minimal":
        primary_color = HexColor("#0F2942")     # Deep slate navy
        secondary_color = HexColor("#2563EB")   # Accent royal blue
        body_color = HexColor("#1E293B")        # Charcoal text
        light_line = HexColor("#CBD5E1")        # Subtle divider
        font_family = "Helvetica"
        font_family_bold = "Helvetica-Bold"
        header_align = TA_LEFT
    else:
        # classic_ats
        primary_color = HexColor("#111827")     # Dark charcoal / off-black
        secondary_color = HexColor("#374151")   # Muted slate
        body_color = HexColor("#1F2937")        # Dark slate body
        light_line = HexColor("#9CA3AF")        # Mid-gray divider
        font_family = "Helvetica"
        font_family_bold = "Helvetica-Bold"
        header_align = TA_CENTER

    # Typography styles
    name_style = ParagraphStyle(
        "CandidateName",
        parent=styles["Normal"],
        fontName=font_family_bold,
        fontSize=20 if template_name == "modern_minimal" else 21,
        leading=23,
        alignment=header_align,
        textColor=primary_color,
    )

    headline_style = ParagraphStyle(
        "HeadlineStyle",
        parent=styles["Normal"],
        fontName=font_family_bold,
        fontSize=10.5,
        leading=13,
        alignment=header_align,
        textColor=secondary_color,
    )

    contact_style = ParagraphStyle(
        "ContactLine",
        parent=styles["Normal"],
        fontName=font_family,
        fontSize=9,
        leading=12,
        alignment=header_align,
        textColor=HexColor("#4B5563"),
    )

    section_heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName=font_family_bold,
        fontSize=11.5,
        leading=14,
        textColor=primary_color,
        spaceBefore=7,
        spaceAfter=2,
        keepWithNext=True,
    )

    item_title_style = ParagraphStyle(
        "ItemTitle",
        parent=styles["Normal"],
        fontName=font_family_bold,
        fontSize=10,
        leading=12.5,
        textColor=HexColor("#111827"),
    )

    item_subtitle_style = ParagraphStyle(
        "ItemSubtitle",
        parent=styles["Normal"],
        fontName=font_family,
        fontSize=9.5,
        leading=12,
        textColor=HexColor("#374151"),
    )

    item_date_style = ParagraphStyle(
        "ItemDate",
        parent=styles["Normal"],
        fontName=font_family_bold,
        fontSize=9,
        leading=12,
        alignment=TA_RIGHT,
        textColor=HexColor("#4B5563"),
    )

    bullet_style = ParagraphStyle(
        "BulletText",
        parent=styles["Normal"],
        fontName=font_family,
        fontSize=9,
        leading=12,
        alignment=TA_LEFT,
        textColor=body_color,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2,
    )

    body_paragraph_style = ParagraphStyle(
        "BodyParagraph",
        parent=styles["Normal"],
        fontName=font_family,
        fontSize=9.2,
        leading=12.5,
        alignment=TA_JUSTIFY,
        textColor=body_color,
        spaceAfter=3,
    )

    story: list[Any] = []

    # 1. Header (Candidate Contact & Target Role)
    story.append(Paragraph(candidate_name, name_style))
    story.append(Spacer(1, 2))

    if target_role:
        story.append(Paragraph(target_role.upper(), headline_style))
        story.append(Spacer(1, 3))

    contact_parts = []
    if personal.get("email"):
        contact_parts.append(personal["email"])
    if personal.get("phone"):
        contact_parts.append(personal["phone"])
    if personal.get("location"):
        contact_parts.append(personal["location"])
    if personal.get("linkedin"):
        contact_parts.append(personal["linkedin"])
    if personal.get("github"):
        contact_parts.append(personal["github"])
    if personal.get("portfolio_url"):
        contact_parts.append(personal["portfolio_url"])

    if contact_parts:
        contact_str = "  |  ".join(contact_parts)
        story.append(Paragraph(contact_str, contact_style))

    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.2, color=primary_color, spaceBefore=2, spaceAfter=8))

    # Helper for adding section headings
    def add_section_header(title: str):
        story.append(Paragraph(title.upper(), section_heading_style))
        story.append(
            HRFlowable(width="100%", thickness=0.6, color=light_line, spaceBefore=1, spaceAfter=5)
        )

    # 2. Process configured sections
    default_order = [
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
    section_order = session_config.get("section_order") or default_order
    selected_records = session_config.get("selected_records") or {}
    optional_sections = session_config.get("optional_sections") or {}

    def is_section_enabled(sec_name: str) -> bool:
        # Default all main sections to True unless explicitly disabled in optional_sections
        return optional_sections.get(sec_name, True)

    def is_record_selected(cat_key: str, rec_id: int) -> bool:
        if cat_key not in selected_records:
            return True  # If no filter map provided, include all
        rec_ids = selected_records.get(cat_key, [])
        return rec_id in rec_ids

    usable_width = 7.4 * inch  # 8.5" - 2*0.55"

    for section in section_order:
        if not is_section_enabled(section):
            continue

        if section == "summary":
            summary_text = (
                session_config.get("custom_summary")
                or (categories.get("professional_summaries", [{}])[0].get("content", ""))
            ).strip()
            if summary_text:
                add_section_header("Professional Summary")
                story.append(Paragraph(summary_text, body_paragraph_style))
                story.append(Spacer(1, 4))

        elif section == "education":
            edu_items = [
                e for e in categories.get("education", [])
                if is_record_selected("education", int(e["id"]))
            ]
            if edu_items:
                add_section_header("Education")
                for e in edu_items:
                    degree_str = f"<b>{_clean_str(e.get('degree'))} in {_clean_str(e.get('field_of_study'))}</b>"
                    inst_str = _clean_str(e.get("institution"))
                    loc_str = _clean_str(e.get("location"))
                    inst_line = f"{inst_str}{', ' + loc_str if loc_str else ''}"

                    start = _clean_str(e.get("start_date"))
                    end = _clean_str(e.get("end_date") or "Present")
                    date_str = f"{start} – {end}"
                    grade = _clean_str(e.get("grade"))
                    if grade:
                        date_str += f" | GPA: {grade}"

                    row_table = Table(
                        [
                            [Paragraph(degree_str, item_title_style), Paragraph(date_str, item_date_style)],
                            [Paragraph(inst_line, item_subtitle_style), Paragraph("", item_date_style)],
                        ],
                        colWidths=[5.4 * inch, 2.0 * inch],
                    )
                    row_table.setStyle(
                        TableStyle(
                            [
                                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                ("TOPPADDING", (0, 0), (-1, -1), 0),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                            ]
                        )
                    )
                    story.append(row_table)

                    coursework = _clean_str(e.get("coursework"))
                    if coursework:
                        story.append(Paragraph(f"<b>Relevant Coursework:</b> {coursework}", bullet_style))
                    desc = _clean_str(e.get("description"))
                    if desc:
                        story.append(Paragraph(desc, bullet_style))

                    story.append(Spacer(1, 3))

        elif section == "technical_skills":
            skills = [
                s for s in categories.get("technical_skills", [])
                if is_record_selected("technical_skills", int(s["id"]))
            ]
            if skills:
                add_section_header("Technical Skills")
                # Group by category
                grouped: dict[str, list[str]] = {}
                for s in skills:
                    cat = _clean_str(s.get("category")) or "General"
                    s_name = _clean_str(s.get("skill_name"))
                    grouped.setdefault(cat, []).append(s_name)

                for cat, sk_names in grouped.items():
                    skills_line = f"<b>{cat}:</b> " + ", ".join(sk_names)
                    story.append(Paragraph(f"• {skills_line}", bullet_style))
                story.append(Spacer(1, 3))

        elif section == "experience":
            exp_items = [
                x for x in categories.get("experience", [])
                if is_record_selected("experience", int(x["id"]))
            ]
            if exp_items:
                add_section_header("Experience & Internships")
                for x in exp_items:
                    role_str = f"<b>{_clean_str(x.get('role'))}</b>"
                    company_str = _clean_str(x.get("company"))
                    emp_type = _clean_str(x.get("employment_type"))
                    if emp_type and emp_type.lower() != "full-time":
                        company_str += f" ({emp_type})"
                    loc = _clean_str(x.get("location"))
                    if loc:
                        company_str += f", {loc}"

                    start = _clean_str(x.get("start_date"))
                    end = _clean_str(x.get("end_date") or "Present")
                    date_str = f"{start} – {end}"

                    exp_table = Table(
                        [
                            [Paragraph(role_str, item_title_style), Paragraph(date_str, item_date_style)],
                            [Paragraph(company_str, item_subtitle_style), Paragraph("", item_date_style)],
                        ],
                        colWidths=[5.4 * inch, 2.0 * inch],
                    )
                    exp_table.setStyle(
                        TableStyle(
                            [
                                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                ("TOPPADDING", (0, 0), (-1, -1), 0),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                            ]
                        )
                    )

                    elem_group = [exp_table]
                    techs = _clean_str(x.get("technologies"))
                    if techs:
                        elem_group.append(Paragraph(f"<b>Environment:</b> {techs}", bullet_style))

                    desc = _clean_str(x.get("description"))
                    if desc:
                        # Split by newlines or bullets if multi-line
                        lines = [l.strip(" -•*") for l in desc.splitlines() if l.strip()]
                        for l in lines:
                            elem_group.append(Paragraph(f"• {l}", bullet_style))

                    ach = _clean_str(x.get("achievements"))
                    if ach:
                        for l in [a.strip(" -•*") for a in ach.splitlines() if a.strip()]:
                            elem_group.append(Paragraph(f"• <b>Key Result:</b> {l}", bullet_style))

                    elem_group.append(Spacer(1, 3))
                    story.append(KeepTogether(elem_group))

        elif section == "projects":
            proj_items = [
                p for p in categories.get("projects", [])
                if is_record_selected("projects", int(p["id"]))
            ]
            if proj_items:
                add_section_header("Projects")
                for p in proj_items:
                    title_str = f"<b>{_clean_str(p.get('title'))}</b>"
                    tech_str = _clean_str(p.get("tech_stack"))
                    if tech_str:
                        title_str += f" | <i>{tech_str}</i>"

                    start = _clean_str(p.get("start_date"))
                    end = _clean_str(p.get("end_date"))
                    date_str = f"{start} – {end}" if start and end else (start or end or "")

                    proj_table = Table(
                        [
                            [Paragraph(title_str, item_title_style), Paragraph(date_str, item_date_style)],
                        ],
                        colWidths=[5.6 * inch, 1.8 * inch],
                    )
                    proj_table.setStyle(
                        TableStyle(
                            [
                                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                ("TOPPADDING", (0, 0), (-1, -1), 0),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                            ]
                        )
                    )

                    elem_group = [proj_table]

                    # Links (GitHub / Live)
                    links = []
                    if p.get("github_url"):
                        links.append(f"GitHub: {_clean_str(p.get('github_url'))}")
                    if p.get("project_url"):
                        links.append(f"Demo: {_clean_str(p.get('project_url'))}")
                    if links:
                        elem_group.append(Paragraph("  |  ".join(links), bullet_style))

                    desc = _clean_str(p.get("description"))
                    if desc:
                        lines = [l.strip(" -•*") for l in desc.splitlines() if l.strip()]
                        for l in lines:
                            elem_group.append(Paragraph(f"• {l}", bullet_style))

                    highlights = _clean_str(p.get("highlights"))
                    if highlights:
                        for l in [h.strip(" -•*") for h in highlights.splitlines() if h.strip()]:
                            elem_group.append(Paragraph(f"• {l}", bullet_style))

                    metrics = _clean_str(p.get("metrics"))
                    if metrics:
                        elem_group.append(Paragraph(f"• <b>Impact / Metrics:</b> {metrics}", bullet_style))

                    elem_group.append(Spacer(1, 3))
                    story.append(KeepTogether(elem_group))

        elif section == "certifications":
            cert_items = [
                c for c in categories.get("certifications", [])
                if is_record_selected("certifications", int(c["id"]))
            ]
            if cert_items:
                add_section_header("Certifications & Courses")
                for c in cert_items:
                    name_str = f"<b>{_clean_str(c.get('name'))}</b> — {_clean_str(c.get('issuing_organization'))}"
                    date_str = _clean_str(c.get("issue_date"))
                    cert_table = Table(
                        [
                            [Paragraph(name_str, item_subtitle_style), Paragraph(date_str, item_date_style)],
                        ],
                        colWidths=[5.6 * inch, 1.8 * inch],
                    )
                    cert_table.setStyle(
                        TableStyle(
                            [
                                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                ("TOPPADDING", (0, 0), (-1, -1), 0),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                            ]
                        )
                    )
                    story.append(cert_table)
                    skills_cov = _clean_str(c.get("skills_covered"))
                    if skills_cov:
                        story.append(Paragraph(f"• <i>Key Competencies:</i> {skills_cov}", bullet_style))
                    story.append(Spacer(1, 2))

        elif section == "achievements":
            ach_items = [
                a for a in categories.get("achievements", [])
                if is_record_selected("achievements", int(a["id"]))
            ]
            if ach_items:
                add_section_header("Honors & Achievements")
                for a in ach_items:
                    title_str = f"<b>{_clean_str(a.get('title'))}</b> ({_clean_str(a.get('issuer'))})"
                    date_str = _clean_str(a.get("date_awarded"))
                    ach_table = Table(
                        [
                            [Paragraph(title_str, item_subtitle_style), Paragraph(date_str, item_date_style)],
                        ],
                        colWidths=[5.6 * inch, 1.8 * inch],
                    )
                    ach_table.setStyle(
                        TableStyle(
                            [
                                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                ("TOPPADDING", (0, 0), (-1, -1), 0),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                            ]
                        )
                    )
                    story.append(ach_table)
                    desc = _clean_str(a.get("description"))
                    if desc:
                        story.append(Paragraph(f"• {desc}", bullet_style))
                    story.append(Spacer(1, 2))

        elif section == "publications":
            pub_items = [
                p for p in categories.get("publications", [])
                if is_record_selected("publications", int(p["id"]))
            ]
            if pub_items:
                add_section_header("Publications")
                for p in pub_items:
                    title_str = f"<b>\"{_clean_str(p.get('title'))}\"</b> — {_clean_str(p.get('venue'))}"
                    date_str = _clean_str(p.get("publication_date"))
                    pub_table = Table(
                        [
                            [Paragraph(title_str, item_subtitle_style), Paragraph(date_str, item_date_style)],
                        ],
                        colWidths=[5.6 * inch, 1.8 * inch],
                    )
                    pub_table.setStyle(
                        TableStyle(
                            [
                                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                ("TOPPADDING", (0, 0), (-1, -1), 0),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                            ]
                        )
                    )
                    story.append(pub_table)
                    authors = _clean_str(p.get("authors"))
                    summary = _clean_str(p.get("summary"))
                    if authors:
                        story.append(Paragraph(f"• Authors: {authors}", bullet_style))
                    if summary:
                        story.append(Paragraph(f"• Summary: {summary}", bullet_style))
                    story.append(Spacer(1, 2))

        elif section == "soft_skills":
            soft_items = [
                s for s in categories.get("soft_skills", [])
                if is_record_selected("soft_skills", int(s["id"]))
            ]
            if soft_items:
                add_section_header("Professional Competencies")
                skill_names = [f"<b>{_clean_str(s.get('skill_name'))}</b> ({_clean_str(s.get('context') or s.get('proficiency'))})" for s in soft_items]
                story.append(Paragraph("• " + " • ".join(skill_names), bullet_style))
                story.append(Spacer(1, 2))

        elif section == "languages":
            lang_items = [
                l for l in categories.get("languages", [])
                if is_record_selected("languages", int(l["id"]))
            ]
            if lang_items:
                add_section_header("Languages")
                lang_parts = [f"<b>{_clean_str(l.get('language_name'))}</b> ({_clean_str(l.get('proficiency_level'))})" for l in lang_items]
                story.append(Paragraph("  |  ".join(lang_parts), bullet_style))
                story.append(Spacer(1, 2))

        elif section == "extracurricular":
            extra_items = [
                e for e in categories.get("extracurricular", [])
                if is_record_selected("extracurricular", int(e["id"]))
            ]
            if extra_items:
                add_section_header("Leadership & Extracurricular")
                for e in extra_items:
                    role_org = f"<b>{_clean_str(e.get('role'))}</b> — {_clean_str(e.get('organization'))}"
                    start = _clean_str(e.get("start_date"))
                    end = _clean_str(e.get("end_date") or "Present")
                    extra_table = Table(
                        [
                            [Paragraph(role_org, item_subtitle_style), Paragraph(f"{start} – {end}", item_date_style)],
                        ],
                        colWidths=[5.6 * inch, 1.8 * inch],
                    )
                    extra_table.setStyle(
                        TableStyle(
                            [
                                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                ("TOPPADDING", (0, 0), (-1, -1), 0),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                            ]
                        )
                    )
                    story.append(extra_table)
                    desc = _clean_str(e.get("description"))
                    if desc:
                        story.append(Paragraph(f"• {desc}", bullet_style))
                    story.append(Spacer(1, 2))

    # Build the document
    doc.build(story)
    return str(output_filepath)
