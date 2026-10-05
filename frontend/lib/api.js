// ==============================================================================
// Simple API Client Helper (frontend/lib/api.js)
// ==============================================================================
// This file centralizes all network calls from our Next.js frontend to our
// Express backend running at http://localhost:5000.
//
// Beginners can see:
// 1. How fetch() works
// 2. How authentication tokens (JWT) are stored and sent in headers
// 3. How JSON request & response data flows between frontend and backend
// ==============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper: Get stored JWT token from the browser's localStorage
export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pulsewatch_token');
  }
  return null;
}

// Helper: Save JWT token to localStorage after successful login/signup
export function setToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulsewatch_token', token);
  }
}

// Helper: Remove token on logout
export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pulsewatch_token');
    localStorage.removeItem('pulsewatch_user');
  }
}

// Helper: Save user profile info for quick display
export function setUser(user) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulsewatch_user', JSON.stringify(user));
  }
}

export function getUser() {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('pulsewatch_user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
}

// ==============================================================================
// API Request Methods
// ==============================================================================

// 1. User Registration: POST /api/auth/register
export async function apiRegister(name, email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return response.json();
}

// 2. User Login: POST /api/auth/login
export async function apiLogin(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
}

// 3. Get Current User Profile: GET /api/auth/me
export async function apiGetMe() {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.json();
}

// 4. Fetch All Monitors: GET /api/monitors
export async function apiGetMonitors() {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/monitors`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.json();
}

// 5. Create New Monitor: POST /api/monitors
export async function apiCreateMonitor(name, url) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/monitors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, url })
  });
  return response.json();
}

// 6. Pause / Resume Monitor: PATCH /api/monitors/:id/toggle
export async function apiToggleMonitor(id) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/monitors/${id}/toggle`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.json();
}

// 7. Delete Monitor: DELETE /api/monitors/:id
export async function apiDeleteMonitor(id) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/monitors/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.json();
}

// 8. Get Ping Logs (Heartbeats): GET /api/monitors/:id/heartbeats
export async function apiGetHeartbeats(id) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/monitors/${id}/heartbeats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.json();
}
