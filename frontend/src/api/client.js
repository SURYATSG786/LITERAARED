const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('literaai_token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    const err = new Error(
      'Cannot reach the LiteraAI server. Start the backend first: cd backend && npm run dev'
    );
    err.status = 0;
    err.cause = networkErr;
    throw err;
  }

  if (options.raw) return res;

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!res.ok) {
    let message = data.error || data.message;
    if (!message) {
      if (res.status === 404 || res.status === 502 || res.status === 503) {
        message = 'Backend not reachable on port 5000. Open a terminal, run: cd backend && npm install && npm run dev';
      } else if (res.status === 409) {
        message = 'Email already registered. Please log in instead.';
      } else {
        message = `Request failed (${res.status})`;
      }
    }
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  mentorLogin: (body) => request('/api/auth/mentor-login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/user/me'),
  updateMe: (body) => request('/api/user/me', { method: 'PUT', body: JSON.stringify(body) }),
  awardWritingReward: (event_id, reward_type) => request('/api/user/rewards/writing', { method: 'POST', body: JSON.stringify({ event_id, reward_type }) }),
  awardPracticeReward: (event_id, reward_type) => request('/api/user/rewards/practice', { method: 'POST', body: JSON.stringify({ event_id, reward_type }) }),
  awardBadge: (badge_id) => request('/api/user/badge', { method: 'POST', body: JSON.stringify({ badge_id }) }),
  buySkin: (skin) => request('/api/user/shop/buy-skin', { method: 'POST', body: JSON.stringify({ skin }) }),
  equipSkin: (skin) => request('/api/user/shop/equip-skin', { method: 'POST', body: JSON.stringify({ skin }) }),
  buyStreakSaver: () => request('/api/user/shop/buy-streak-saver', { method: 'POST', body: JSON.stringify({}) }),
  useStreakSaver: () => request('/api/user/shop/use-streak-saver', { method: 'POST', body: JSON.stringify({}) }),
  getAlphabetWritingProgress: () => request('/api/user/writing/alphabet-progress'),
  saveAlphabetWritingProgress: (body) => request('/api/user/writing/alphabet-progress', { method: 'POST', body: JSON.stringify(body) }),
  getAlphabetWritingMentorAnalytics: () => request('/api/mentor/analytics/alphabet-progress'),
  getAssessment: () => request('/api/assessment'),
  submitAssessment: (answers) => request('/api/assessment/submit', { method: 'POST', body: JSON.stringify({ answers }) }),
  recommended: () => request('/api/courses/recommended'),
  getCourse: (id) => request(`/api/courses/${id}`),
  lessonProgress: (lessonId, body) => request(`/api/lessons/${lessonId}/progress`, { method: 'POST', body: JSON.stringify(body) }),
  getCourseScores: (courseId) => request(`/api/courses/${courseId}/scores`),
  checkpoint: (courseId, payload) => {
    const answers = Array.isArray(payload) ? payload : (payload?.answers || []);
    return request(`/api/checkpoint/${courseId}`, { method: 'POST', body: JSON.stringify({ answers }) });
  },
  certificate: (courseId) => request(`/api/certificate/generate${courseId ? `?course_id=${encodeURIComponent(courseId)}` : ''}`),
  certificatePdfUrl: (courseId) => `${API_BASE}/api/certificate/generate?format=pdf${courseId ? `&course_id=${encodeURIComponent(courseId)}` : ''}`,
  getLeagueStatus: () => request('/api/league/status'),
  getLeaderboard: () => request('/api/league/leaderboard'),
  getLeagueExam: () => request('/api/league/exam'),
  submitLeagueExam: (answers) => request('/api/league/exam/submit', { method: 'POST', body: JSON.stringify({ answers }) }),
  downloadLeagueCertificate: async (league) => {
    const query = league ? `?league=${league}` : '';
    const res = await request(`/api/certificate/league${query}`, { raw: true });
    if (!res.ok) throw new Error('League PDF download failed');
    return res.blob();
  },
  coach: () => request('/api/coach', { method: 'POST', body: JSON.stringify({}) }),
  transcribeTamilAudio: (audioBase64, mimeType) =>
    request('/api/ai/transcribe-tamil', { method: 'POST', body: JSON.stringify({ audioBase64, mimeType }) }),
  downloadCertificate: async (courseId) => {
    const query = courseId ? `&course_id=${encodeURIComponent(courseId)}` : '';
    const res = await request(`/api/certificate/generate?format=pdf${query}`, { raw: true });
    if (!res.ok) throw new Error('PDF download failed');
    return res.blob();
  },
  getCommunityPosts: () => request('/api/community'),
  createCommunityPost: (body) => request('/api/community', { method: 'POST', body: JSON.stringify(body) }),
  likeCommunityPost: (id) => request(`/api/community/${id}/like`, { method: 'POST' }),
  deleteCommunityPost: (id) => request(`/api/community/${id}`, { method: 'DELETE' }),
  getMentorDashboard: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/mentor/dashboard${q ? `?${q}` : ''}`);
  },
  getLearnerDetails: (id) => request(`/api/mentor/learner/${id}`),
  assignCourseToLearner: (learnerId, courseId) =>
    request('/api/mentor/assign-course', { method: 'POST', body: JSON.stringify({ learnerId, courseId }) }),
  sendLearnerReminder: (learnerId, note) =>
    request('/api/mentor/send-reminder', { method: 'POST', body: JSON.stringify({ learnerId, note }) }),
  addLearnerDirect: (payload) =>
    request('/api/mentor/add-learner', { method: 'POST', body: JSON.stringify(payload) }),
  // Admin Portal API
  getAdminDashboard: () => request('/api/admin/dashboard'),
  getAdminLearners: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/admin/learners${q ? `?${q}` : ''}`);
  },
  getAdminLearnerDetails: (id) => request(`/api/admin/learner/${id}`),
  getAdminNeedsAttention: () => request('/api/admin/needs-attention'),
  sendAdminReminder: (learnerId, note, channel = 'in_app') =>
    request('/api/admin/reminders', { method: 'POST', body: JSON.stringify({ learnerId, note, channel }) }),
  getAdminReports: () => request('/api/admin/reports'),
  exportAdminLearnersCsv: async () => {
    const res = await request('/api/admin/reports/export-csv', { raw: true });
    if (!res.ok) throw new Error('CSV export failed');
    return res.blob();
  },
  getAdminSettings: () => request('/api/admin/settings'),
  updateAdminSettings: (body) => request('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(body) }),
  quickFindLearners: (q) => request(`/api/admin/quick-find?q=${encodeURIComponent(q)}`),
};

export default api;
