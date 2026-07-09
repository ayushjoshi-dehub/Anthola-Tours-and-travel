import { auth } from './firebase';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

export function getTokens() {
  return { accessToken: '', refreshToken: '' };
}

export function setTokens() {}

export function clearTokens() {}

async function getFirebaseToken() {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (err) {
    console.error('[api] Failed to get Firebase ID token:', err);
    return null;
  }
}

export async function api(path, { method = 'GET', body, auth: requireAuthToken = true } = {}) {
  const headers = {};
  const isFormData = body instanceof FormData;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  
  if (requireAuthToken) {
    const token = await getFirebaseToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function apiDownload(path) {
  const token = await getFirebaseToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return res.blob();
}
