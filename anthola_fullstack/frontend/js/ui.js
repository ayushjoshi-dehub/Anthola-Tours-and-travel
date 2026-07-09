let toastRoot = null;

export function ensureToastRoot() {
  if (toastRoot) return toastRoot;
  toastRoot = document.createElement('div');
  toastRoot.className = 'toast-container';
  document.body.appendChild(toastRoot);
  return toastRoot;
}

export function toast(message, type = 'info', timeoutMs = 2600) {
  ensureToastRoot();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  toastRoot.appendChild(el);
  window.setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-4px)';
    el.style.transition = 'all 180ms ease';
    window.setTimeout(() => el.remove(), 200);
  }, timeoutMs);
}

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function bindSafe(el, eventName, handler) {
  if (!el) return;
  el.addEventListener(eventName, handler);
}

export function openDialog(dialogId) {
  const d = document.getElementById(dialogId);
  if (!d) return;
  d.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

export function closeDialog(dialogId) {
  const d = document.getElementById(dialogId);
  if (!d) return;
  d.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}
