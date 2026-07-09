import { create } from 'zustand';

function load(name, fallback = null) {
  try {
    const raw = localStorage.getItem(name);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return fallback;
  }
}

function save(name, value) {
  if (value === null || value === undefined) {
    localStorage.removeItem(name);
    return;
  }
  if (typeof value === 'string') {
    localStorage.setItem(name, value);
    return;
  }
  localStorage.setItem(name, JSON.stringify(value));
}

export const useAuth = create((set, get) => ({
  user: load('anthola-user', null),
  token: load('anthola-token', ''),
  login(token, user) {
    save('anthola-user', user);
    save('anthola-token', token || '');
    set({ user, token: token || '' });
  },
  logout() {
    save('anthola-user', null);
    save('anthola-token', '');
    set({ user: null, token: '' });
  },
  isBusOwner() {
    return get().user?.role === 'BUS_OWNER';
  }
}));
