export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
}

export function getSocketUrl() {
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
}
