// In development with Vite on 5173, direct to Flask on 5001 (supported via CORS) or use proxy fallback
const API_BASE =
  typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://127.0.0.1:5001/api'
    : '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the backend server. Make sure the Flask service is running on port 5001.');
    }
    throw err;
  }
}

export const api = {
  // System & Integrations
  getHealth: () => request('/health'),
  getIntegrationsStatus: () => request('/integrations/status'),

  // Portfolio
  getPortfolio: () => request('/portfolio'),
  getStats: () => request('/portfolio/stats'),
  resetSamplePortfolio: () => request('/portfolio/reset-sample', { method: 'POST' }),

  // Category CRUD
  listCategory: (category) => request(`/portfolio/${category}`),
  createCategoryItem: (category, data) => request(`/portfolio/${category}`, { method: 'POST', body: data }),
  updateCategoryItem: (category, id, data) => request(`/portfolio/${category}/${id}`, { method: 'PUT', body: data }),
  deleteCategoryItem: (category, id) => request(`/portfolio/${category}/${id}`, { method: 'DELETE' }),

  // AI features
  organizeUnstructured: (rawText) => request('/ai/organize', { method: 'POST', body: { raw_text: rawText } }),
  commitApprovedItems: (items) => request('/ai/organize/commit', { method: 'POST', body: { items } }),
  getAISuggestions: (targetRole, jobDescription) =>
    request('/ai/suggestions', { method: 'POST', body: { target_role: targetRole, job_description: jobDescription } }),

  // Job Descriptions & Matching
  listJobs: () => request('/jobs'),
  getJob: (id) => request(`/jobs/${id}`),
  deleteJob: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),
  analyzeJob: ({ raw_text, title, company, save = true, job_id = null, mode = null }) =>
    request('/jobs/analyze', {
      method: 'POST',
      body: { raw_text, title, company, save, job_id, mode },
    }),

  // Resume Builder & Sessions
  listResumes: () => request('/resumes'),
  getResume: (id) => request(`/resumes/${id}`),
  saveResume: (sessionData) => request('/resumes', { method: 'POST', body: sessionData }),
  deleteResume: (id) => request(`/resumes/${id}`, { method: 'DELETE' }),
  previewResume: (sessionData) => request('/resumes/preview', { method: 'POST', body: sessionData }),
  generatePdf: (sessionData) => request('/resumes/generate-pdf', { method: 'POST', body: sessionData }),
  getPdfDownloadUrl: (filename, attachment = true) =>
    `${API_BASE}/resumes/download-pdf/${encodeURIComponent(filename)}?attachment=${attachment}`,

  // Google Sheets
  getSheetsStatus: () => request('/sheets/status'),
  syncSheets: () => request('/sheets/sync', { method: 'POST' }),
  getSheetsLogs: (limit = 10) => request(`/sheets/logs?limit=${limit}`),
};
