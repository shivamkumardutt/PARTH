
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error('Invalid response received from PARTH server.');
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Something went wrong.');
  }

  return result.data;
}

// Authentication

export function registerUser({ name, email, password, role }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
}

export function loginUser({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(token) {
  return request('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Student education options

export function getStudentOptions(token) {
  return request('/student/options', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Student profile

export function getStudentProfile(token) {
  return request('/student/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateStudentProfile(token, profileData) {
  return request('/student/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });
}
