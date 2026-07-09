import { getApiBaseUrl, getSocketUrl } from './config';
import { useAuth } from '../store/auth';

export function getTokens() {
  const store = useAuth.getState();
  return {
    accessToken: store.token || '',
    refreshToken: localStorage.getItem('anthola-refreshToken') || ''
  };
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem('anthola-token', accessToken);
  if (refreshToken) localStorage.setItem('anthola-refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('anthola-token');
  localStorage.removeItem('anthola-refreshToken');
  useAuth.getState().logout();
}

export async function api(path, { method = 'GET', body, auth: requireAuthToken = true } = {}) {
  const headers = {};
  const isFormData = body instanceof FormData;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  if (requireAuthToken) {
    const token = getTokens().accessToken;
    if (!token) {
      // Fail fast instead of sending an unauthenticated request that 401s.
      const err = new Error('No authentication token found. Please sign in again.');
      err.status = 401;
      throw err;
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  const res = await fetch(url, {
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
  const token = getTokens().accessToken;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return res.blob();
}
