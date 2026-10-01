const BASE_URL = '/api';

// -------------------------------------------------------------
// Auth & Token Management (Stored in localStorage)
// -------------------------------------------------------------
export function getAuthToken() {
  return localStorage.getItem('auth_token') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function removeAuthToken() {
  localStorage.removeItem('auth_token');
}

export function getAuthHeaders(customHeaders = {}) {
  const token = getAuthToken();
  return {
    ...customHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// -------------------------------------------------------------
// Gemini API Key Management (Stored in browser localStorage)
// -------------------------------------------------------------
export function getStoredApiKey() {
  return localStorage.getItem('gemini_api_key') || '';
}

export function setStoredApiKey(key) {
  if (key) {
    localStorage.setItem('gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('gemini_api_key');
  }
}

export function removeStoredApiKey() {
  localStorage.removeItem('gemini_api_key');
}

// -------------------------------------------------------------
// Auth API Endpoints
// -------------------------------------------------------------
export async function register({ name, email, password }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function login({ email, password }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      removeAuthToken();
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {}
  removeAuthToken();
}

// Helper to safely parse JSON and return meaningful errors
async function parseResponseJson(res, defaultErrMsg = 'Operation failed') {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Could not communicate with backend server (HTTP ${res.status}). Make sure your server is running with 'npm run dev'.`
    );
  }

  if (!res.ok) {
    throw new Error(data?.error || `${defaultErrMsg} (HTTP ${res.status})`);
  }
  return data;
}

// -------------------------------------------------------------
// Key & Profile API Endpoints
// -------------------------------------------------------------
export async function testApiKey(apiKey) {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('Please enter a valid Gemini API Key.');
  }

  // 1. Direct browser validation via Google AI Studio API (instant & independent of proxy)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || `Invalid Gemini API Key (HTTP ${res.status})`);
    }
    return { success: true, message: 'Gemini API Key verified and saved!' };
  } catch (err) {
    // If the error was a real API error from Google (e.g. invalid key), throw it immediately
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }

    // 2. Fallback to server-side check if browser fetch was blocked by an adblocker/extension
    const res = await fetch(`${BASE_URL}/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: cleanKey }),
    });
    return parseResponseJson(res, 'Failed to verify API key');
  }
}

export async function saveApiKey(apiKey) {
  // Test key validity
  const verification = await testApiKey(apiKey);
  // Store verified key in browser localStorage
  setStoredApiKey(apiKey);
  return verification;
}

export async function fetchStatus() {
  try {
    const res = await fetch(`${BASE_URL}/status`, {
      headers: getAuthHeaders(),
    });
    return await parseResponseJson(res, 'Failed to fetch status');
  } catch {
    return { status: 'offline', hasProfile: false };
  }
}

export async function fetchProfile() {
  const res = await fetch(`${BASE_URL}/profile`, {
    headers: getAuthHeaders(),
  });
  return parseResponseJson(res, 'Failed to load profile');
}

export async function saveProfile(content) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ content }),
  });
  return parseResponseJson(res, 'Failed to save profile');
}

// -------------------------------------------------------------
// Resume & Application Endpoints
// -------------------------------------------------------------
export async function generateApplication(params) {
  // Auto-inject stored Gemini API key if not explicitly provided
  const payload = {
    apiKey: getStoredApiKey(),
    ...params,
  };

  const res = await fetch(`${BASE_URL}/generate`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return parseResponseJson(res, 'Failed to generate tailored application');
}

export async function saveBundle(bundleData) {
  const res = await fetch(`${BASE_URL}/save-bundle`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(bundleData),
  });
  return parseResponseJson(res, 'Failed to save application bundle');
}

export async function fetchApplications() {
  const res = await fetch(`${BASE_URL}/applications`, {
    headers: getAuthHeaders(),
  });
  return parseResponseJson(res, 'Failed to load applications');
}

export async function fetchApplicationDetails(folderName) {
  const res = await fetch(`${BASE_URL}/applications/${encodeURIComponent(folderName)}`, {
    headers: getAuthHeaders(),
  });
  return parseResponseJson(res, 'Failed to load application');
}

export async function fetchJobUrl(url) {
  const res = await fetch(`${BASE_URL}/fetch-job-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return parseResponseJson(res, 'Failed to fetch job description from URL');
}

export async function checkClippedJob() {
  try {
    const res = await fetch(`${BASE_URL}/clip-job`);
    return await res.json();
  } catch {
    return { clip: null };
  }
}
