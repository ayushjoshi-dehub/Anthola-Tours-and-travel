export const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  del(key) {
    localStorage.removeItem(key);
  }
};

export function getToken() {
  return Storage.get('authToken', null);
}

export function setToken(token) {
  Storage.set('authToken', token);
}

export function clearAuth() {
  Storage.del('authToken');
  Storage.del('currentUser');
}

export function getCurrentUser() {
  const u = Storage.get('currentUser', null);
  return u && typeof u === 'object' ? u : null;
}

export function setCurrentUser(user) {
  Storage.set('currentUser', user);
}

export function signOut() {
  clearAuth();
}

// Redirect helpers (used for booking -> login -> return)
export function setReturnUrl(url) {
  Storage.set('returnUrl', String(url || ''));
}

export function popReturnUrl() {
  const url = Storage.get('returnUrl', '');
  Storage.del('returnUrl');
  return url || null;
}

// Legacy demo helpers (kept for backward compatibility; no longer used in fullstack mode)
export function getUsers() {
  return Storage.get('users', []);
}

export function saveUsers(users) {
  Storage.set('users', users);
}
