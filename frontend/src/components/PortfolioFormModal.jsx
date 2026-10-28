import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

export default function PortfolioFormModal({
  isOpen,
  onClose,
  category,
  categoryMeta,
  item,
  onSave,
}) {
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      // Default empty form
      const empty = {};
      if (category === 'technical_skills') {
        empty.category = 'Programming Languages';
        empty.proficiency = 'Intermediate';
      } else if (category === 'soft_skills') {
        empty.proficiency = 'Strong';
      } else if (category === 'experience') {
        empty.employment_type = 'Internship';
        empty.end_date = 'Present';
      } else if (category === 'education') {
        empty.end_date = 'Present';
      } else if (category === 'languages') {
        empty.proficiency_level = 'Fluent / Professional';
      }
      setFormData(empty);
    }
    setValidationErrors([]);
  }, [item, category, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors([]);

    // Check required fields based on category
    const errors = [];
    const reqs = categoryMeta?.required_fields || [];
    for (const req of reqs) {
      if (!formData[req] || String(formData[req]).trim() === '') {
        const readable = req.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        errors.push(`${readable} is required.`);
      }
    }

    if (category === 'personal_info' && formData.email) {
      if (!formData.email.includes('@') || !formData.email.split('@')[1]?.includes('.')) {
        errors.push('Please enter a valid email address.');
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      setValidationErrors([err.message || 'Failed to save record']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base sm:text-lg">
              {item ? 'Edit Record' : 'Add New Entry'}
            </h3>
            <p className="text-xs text-slate-300">
              {categoryMeta?.label || category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="m-6 mb-0 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <div className="space-y-1">
              <span className="font-semibold">Please correct the following:</span>
              <ul className="list-disc list-inside">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Dynamic Category Forms */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {category === 'personal_info' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name || ''}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Headline / Target Title</label>
                  <input
                    type="text"
                    value={formData.headline || ''}
                    onChange={(e) => handleChange('headline', e.target.value)}
                    placeholder="e.g. B.Tech Computer Science Senior | Aspiring AI Engineer"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="student@example.edu"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Bengaluru, India"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    value={formData.linkedin || ''}
                    onChange={(e) => handleChange('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/username"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Profile</label>
                  <input
                    type="text"
                    value={formData.github || ''}
                    onChange={(e) => handleChange('github', e.target.value)}
                    placeholder="github.com/username"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {category === 'professional_summaries' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Summary Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g. AI & Machine Learning Focus"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role</label>
                  <input
                    type="text"
                    value={formData.target_role || ''}
                    onChange={(e) => handleChange('target_role', e.target.value)}
                    placeholder="e.g. Junior AI/ML Engineer"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Summary Content *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.content || ''}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="2-4 sentences highlighting your background, core technical strengths, and career aspirations..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {category === 'education' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Institution *</label>
                  <input
                    type="text"
                    required
                    value={formData.institution || ''}
                    onChange={(e) => handleChange('institution', e.target.value)}
                    placeholder="e.g. National Institute of Technology"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Degree *</label>
                  <input
                    type="text"
                    required
                    value={formData.degree || ''}
                    onChange={(e) => handleChange('degree', e.target.value)}
                    placeholder="e.g. Bachelor of Technology (B.Tech)"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Field of Study *</label>
                  <input
                    type="text"
                    required
                    value={formData.field_of_study || ''}
                    onChange={(e) => handleChange('field_of_study', e.target.value)}
                    placeholder="e.g. Computer Science and Engineering"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="text"
                    required
                    value={formData.start_date || ''}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    placeholder="e.g. Aug 2021"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="text"
                    value={formData.end_date || ''}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    placeholder="e.g. May 2025 (Expected)"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / GPA</label>
                  <input
                    type="text"
                    value={formData.grade || ''}
                    onChange={(e) => handleChange('grade', e.target.value)}
                    placeholder="e.g. 8.92 / 10.0 CGPA"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g. Surathkal, India"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relevant Coursework</label>
                <input
                  type="text"
                  value={formData.coursework || ''}
                  onChange={(e) => handleChange('coursework', e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms, Machine Learning, Operating Systems"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {category === 'technical_skills' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Skill Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.skill_name || ''}
                    onChange={(e) => handleChange('skill_name', e.target.value)}
                    placeholder="e.g. Python, React, PyTorch"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category || 'Programming Languages'}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Programming Languages">Programming Languages</option>
                    <option value="AI & Data Science">AI & Data Science</option>
                    <option value="Frameworks & Libraries">Frameworks & Libraries</option>
                    <option value="Developer Tools">Developer Tools & Cloud</option>
                    <option value="Databases">Databases & Storage</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proficiency Level</label>
                  <select
                    value={formData.proficiency || 'Intermediate'}
                    onChange={(e) => handleChange('proficiency', e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Years / Experience Duration</label>
                  <input
                    type="text"
                    value={formData.years_experience || ''}
                    onChange={(e) => handleChange('years_experience', e.target.value)}
                    placeholder="e.g. 2 years"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence Note / Verification Context</label>
                <input
                  type="text"
                  value={formData.evidence_note || ''}
                  onChange={(e) => handleChange('evidence_note', e.target.value)}
                  placeholder="e.g. Used for building MedVision diagnostic pipeline and coursework."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {category === 'projects' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g. MedVision: Chest X-Ray AI"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Role</label>
                  <input
                    type="text"
                    value={formData.role || ''}
                    onChange={(e) => handleChange('role', e.target.value)}
                    placeholder="e.g. Lead ML Researcher"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technologies & Libraries *</label>
                <input
                  type="text"
                  required
                  value={formData.tech_stack || ''}
                  onChange={(e) => handleChange('tech_stack', e.target.value)}
                  placeholder="e.g. Python, PyTorch, TorchVision, FastAPI, React"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="text"
                    value={formData.start_date || ''}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    placeholder="e.g. Aug 2023"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="text"
                    value={formData.end_date || ''}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    placeholder="e.g. Dec 2023"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub URL</label>
                  <input
                    type="text"
                    value={formData.github_url || ''}
                    onChange={(e) => handleChange('github_url', e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Live Demo URL</label>
                  <input
                    type="text"
                    value={formData.project_url || ''}
                    onChange={(e) => handleChange('project_url', e.target.value)}
                    placeholder="https://myproject.app"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Core summary of what the project does..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Technical Highlights / Bullets</label>
                <textarea
                  rows={3}
                  value={formData.highlights || ''}
                  onChange={(e) => handleChange('highlights', e.target.value)}
                  placeholder="One bullet point per line describing implementation specifics..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Metrics / Impact</label>
                <input
                  type="text"
                  value={formData.metrics || ''}
                  onChange={(e) => handleChange('metrics', e.target.value)}
                  placeholder="e.g. 94.2% AUROC, 180ms latency, 10,000+ test samples"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {category === 'experience' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.company || ''}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="e.g. Kinetix AI Labs"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Job Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.role || ''}
                    onChange={(e) => handleChange('role', e.target.value)}
                    placeholder="e.g. Machine Learning Research Intern"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={formData.employment_type || 'Internship'}
                    onChange={(e) => handleChange('employment_type', e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Research Fellow">Research Fellow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="text"
                    required
                    value={formData.start_date || ''}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    placeholder="e.g. May 2024"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="text"
                    value={formData.end_date || ''}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    placeholder="e.g. Jul 2024 or Present"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g. Bengaluru, India (Hybrid)"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Technologies Used</label>
                  <input
                    type="text"
                    value={formData.technologies || ''}
                    onChange={(e) => handleChange('technologies', e.target.value)}
                    placeholder="e.g. Python, PyTorch, Transformers, Docker"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Summary of responsibilities and scope..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Achievements & Impact</label>
                <textarea
                  rows={3}
                  value={formData.achievements || ''}
                  onChange={(e) => handleChange('achievements', e.target.value)}
                  placeholder="Measurable accomplishments (one per line)..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {category === 'certifications' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Certification Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Deep Learning Specialization"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issuing Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.issuing_organization || ''}
                    onChange={(e) => handleChange('issuing_organization', e.target.value)}
                    placeholder="e.g. DeepLearning.AI / Coursera"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date *</label>
                  <input
                    type="text"
                    required
                    value={formData.issue_date || ''}
                    onChange={(e) => handleChange('issue_date', e.target.value)}
                    placeholder="e.g. Oct 2023"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={formData.expiry_date || ''}
                    onChange={(e) => handleChange('expiry_date', e.target.value)}
                    placeholder="e.g. Lifetime or Dec 2026"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Skills Covered</label>
                <input
                  type="text"
                  value={formData.skills_covered || ''}
                  onChange={(e) => handleChange('skills_covered', e.target.value)}
                  placeholder="e.g. CNNs, Transformers, PyTorch, Model Optimization"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {category === 'achievements' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g. First Runner-Up, Smart India Hackathon"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issuer / Awarding Body *</label>
                  <input
                    type="text"
                    required
                    value={formData.issuer || ''}
                    onChange={(e) => handleChange('issuer', e.target.value)}
                    placeholder="e.g. Ministry of Education, Govt. of India"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Awarded *</label>
                  <input
                    type="text"
                    required
                    value={formData.date_awarded || ''}
                    onChange={(e) => handleChange('date_awarded', e.target.value)}
                    placeholder="e.g. Dec 2023"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="e.g. Hackathon / Academic"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Details of the achievement..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Impact / Result</label>
                <input
                  type="text"
                  value={formData.impact || ''}
                  onChange={(e) => handleChange('impact', e.target.value)}
                  placeholder="e.g. Selected top 2 out of 1,200 teams nationwide"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {category === 'soft_skills' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Soft Skill *</label>
                <input
                  type="text"
                  required
                  value={formData.skill_name || ''}
                  onChange={(e) => handleChange('skill_name', e.target.value)}
                  placeholder="e.g. Technical Communication, Agile Collaboration"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proficiency</label>
                <input
                  type="text"
                  value={formData.proficiency || 'Strong'}
                  onChange={(e) => handleChange('proficiency', e.target.value)}
                  placeholder="e.g. Strong"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Context / Demonstration</label>
                <textarea
                  rows={2}
                  value={formData.context || ''}
                  onChange={(e) => handleChange('context', e.target.value)}
                  placeholder="How you demonstrated this skill..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {category === 'publications' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Publication Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g. Explainable Multimodal Deep Learning..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Venue / Conference *</label>
                  <input
                    type="text"
                    required
                    value={formData.venue || ''}
                    onChange={(e) => handleChange('venue', e.target.value)}
                    placeholder="e.g. IEEE ICACI 2024"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Publication Date *</label>
                  <input
                    type="text"
                    required
                    value={formData.publication_date || ''}
                    onChange={(e) => handleChange('publication_date', e.target.value)}
                    placeholder="e.g. Feb 2024"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Authors *</label>
                <input
                  type="text"
                  required
                  value={formData.authors || ''}
                  onChange={(e) => handleChange('authors', e.target.value)}
                  placeholder="e.g. Aarav Sharma, Dr. Rajesh Kulkarni"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Summary *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.summary || ''}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  placeholder="Brief summary of research contributions..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {category === 'languages' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Language Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.language_name || ''}
                    onChange={(e) => handleChange('language_name', e.target.value)}
                    placeholder="e.g. English"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proficiency Level *</label>
                  <input
                    type="text"
                    required
                    value={formData.proficiency_level || ''}
                    onChange={(e) => handleChange('proficiency_level', e.target.value)}
                    placeholder="e.g. Fluent / Professional (CEFR C1)"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Certification / Notes</label>
                <input
                  type="text"
                  value={formData.certification || ''}
                  onChange={(e) => handleChange('certification', e.target.value)}
                  placeholder="e.g. CEFR C1 Certificate"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {category === 'extracurricular' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.organization || ''}
                    onChange={(e) => handleChange('organization', e.target.value)}
                    placeholder="e.g. Developer Students Club"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                  <input
                    type="text"
                    required
                    value={formData.role || ''}
                    onChange={(e) => handleChange('role', e.target.value)}
                    placeholder="e.g. Technical Lead"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="text"
                    required
                    value={formData.start_date || ''}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    placeholder="e.g. Aug 2022"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="text"
                    value={formData.end_date || ''}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    placeholder="e.g. Present"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="What the organization does and your responsibilities..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : item ? 'Update Record' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
