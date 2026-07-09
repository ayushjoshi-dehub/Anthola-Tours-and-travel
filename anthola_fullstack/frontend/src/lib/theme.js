import { create } from 'zustand';

export const THEMES = ['dark', 'light', 'staging'];

function applyTheme(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }
}

const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('anthola-theme')) || 'dark';
const initial = THEMES.includes(stored) ? stored : 'dark';
applyTheme(initial);

export const useTheme = create((set) => ({
  theme: initial,
  setTheme(theme) {
    const next = THEMES.includes(theme) ? theme : 'dark';
    applyTheme(next);
    if (typeof localStorage !== 'undefined') localStorage.setItem('anthola-theme', next);
    set({ theme: next });
  }
}));
