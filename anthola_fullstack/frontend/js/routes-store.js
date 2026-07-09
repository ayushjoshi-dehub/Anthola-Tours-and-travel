import { ROUTES as SEED_ROUTES } from './data.js';
import { Storage } from './storage.js';

const KEY = 'routes';

function normalizeRoute(r) {
  return {
    id: String(r.id || '').trim(),
    from: String(r.from || '').trim(),
    to: String(r.to || '').trim(),
    duration: String(r.duration || '').trim(),
    price: Number(r.price || 0),
    badges: Array.isArray(r.badges) ? r.badges.map(b => String(b)) : [],
    isActive: r.isActive !== false
  };
}

export function ensureRoutesSeeded() {
  const existing = Storage.get(KEY, null);
  if (Array.isArray(existing) && existing.length) return;
  const seeded = SEED_ROUTES.map(r => normalizeRoute({ ...r, isActive: true }));
  Storage.set(KEY, seeded);
}

export function getRoutes({ includeInactive = false } = {}) {
  ensureRoutesSeeded();
  const routes = Storage.get(KEY, []).map(normalizeRoute);
  return includeInactive ? routes : routes.filter(r => r.isActive);
}

export function saveRoutes(routes) {
  const cleaned = (Array.isArray(routes) ? routes : []).map(normalizeRoute);
  Storage.set(KEY, cleaned);
}

export function upsertRoute(route) {
  ensureRoutesSeeded();
  const routes = Storage.get(KEY, []).map(normalizeRoute);
  const nr = normalizeRoute(route);
  const idx = routes.findIndex(r => r.id === nr.id);
  if (idx >= 0) routes[idx] = { ...routes[idx], ...nr };
  else routes.unshift(nr);
  saveRoutes(routes);
  return routes;
}

export function setRouteActive(routeId, isActive) {
  ensureRoutesSeeded();
  const routes = Storage.get(KEY, []).map(normalizeRoute);
  const idx = routes.findIndex(r => r.id === routeId);
  if (idx >= 0) {
    routes[idx].isActive = !!isActive;
    saveRoutes(routes);
  }
  return routes;
}
