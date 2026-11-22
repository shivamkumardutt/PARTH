const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('Invalid response received from PARTH server.'); }
  if (!response.ok || !result.success) throw new Error(result.message || 'Something went wrong.');
  return result.data;
}

export function registerUser({ name, email, password, role }) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) });
}
export function loginUser({ email, password }) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export function getCurrentUser(token) {
  return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
}
export function getStudentOptions(token) {
  return request('/student/options', { headers: { Authorization: `Bearer ${token}` } });
}
export function getStudentProfile(token) {
  return request('/student/profile', { headers: { Authorization: `Bearer ${token}` } });
}
export function updateStudentProfile(token, profileData) {
  return request('/student/profile', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(profileData) });
}
export function getPublishedCourses(token, page = 1, limit = 8) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return request(`/student/courses?${params}`, { headers: { Authorization: `Bearer ${token}` } });
}
export function getPublishedCourse(token, courseId) {
  return request(`/student/courses/${encodeURIComponent(courseId)}`, { headers: { Authorization: `Bearer ${token}` } });
}
export function getStudentPathways(token) {
  return request('/student/pathways', { headers: { Authorization: `Bearer ${token}` } });
}

export function getStudentLearning(token) {
  return request('/student/learning', { headers: { Authorization: `Bearer ${token}` } });
}
export function getStudentLearningCourse(token, enrollmentId) {
  return request(`/student/learning/${encodeURIComponent(enrollmentId)}`, { headers: { Authorization: `Bearer ${token}` } });
}
export function enrollStudentInCourse(token, courseId) {
  return request(`/student/courses/${encodeURIComponent(courseId)}/enroll`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}
export function updateLessonProgress(token, enrollmentId, lessonId, completed) {
  return request(`/student/learning/${encodeURIComponent(enrollmentId)}/lessons/${encodeURIComponent(lessonId)}/progress`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ completed }) });
}
