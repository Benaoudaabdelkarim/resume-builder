const BASE_URL = '/api';

export async function fetchStatus() {
  const res = await fetch(`${BASE_URL}/status`);
  return res.json();
}

export async function saveApiKey(apiKey) {
  const res = await fetch(`${BASE_URL}/api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save API key');
  return data;
}

export async function fetchProfile() {
  const res = await fetch(`${BASE_URL}/profile`);
  return res.json();
}

export async function saveProfile(content) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save profile');
  return data;
}

export async function generateApplication(params) {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate tailored application');
  return data;
}

export async function saveBundle(bundleData) {
  const res = await fetch(`${BASE_URL}/save-bundle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bundleData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save application bundle');
  return data;
}

export async function fetchApplications() {
  const res = await fetch(`${BASE_URL}/applications`);
  return res.json();
}

export async function fetchApplicationDetails(folderName) {
  const res = await fetch(`${BASE_URL}/applications/${encodeURIComponent(folderName)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load application');
  return data;
}

export async function fetchJobUrl(url) {
  const res = await fetch(`${BASE_URL}/fetch-job-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch job content from URL');
  return data;
}

export async function checkClippedJob() {
  const res = await fetch(`${BASE_URL}/clip-job`);
  return res.json();
}



