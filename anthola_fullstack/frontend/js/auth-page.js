import { setCurrentUser, setToken, setReturnUrl, popReturnUrl } from './storage.js';
import { apiFetch } from './api.js';
import { toast, qs } from './ui.js';

function getParam(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

function setTab(which) {
  const signInTab = qs('#tab-signin');
  const signUpTab = qs('#tab-signup');
  const formIn = qs('#signin-form');
  const formUp = qs('#signup-form');
  const isUp = which === 'signup';

  formIn?.classList.toggle('hidden', isUp);
  formUp?.classList.toggle('hidden', !isUp);
  signInTab?.classList.toggle('bg-white', !isUp);
  signUpTab?.classList.toggle('bg-white', isUp);
  signInTab?.classList.toggle('text-slate-900', !isUp);
  signUpTab?.classList.toggle('text-slate-900', isUp);
}

export function initAuthPage() {
  const root = qs('#authPageRoot');
  if (!root) return;

  const ret = getParam('return');
  if (ret) setReturnUrl(ret);

  const msg = getParam('msg');
  const banner = qs('#authBanner');
  if (banner) {
    if (msg === 'signinfirst') {
      banner.innerHTML = `
        <div class="bg-orange-50 border border-orange-100 text-orange-800 px-4 py-3 rounded-2xl text-sm">
          <b>Sign in first</b> to book a bus and lock seats live.
        </div>
      `;
    } else {
      banner.innerHTML = '';
    }
  }

  // Tabs
  qs('#tab-signin')?.addEventListener('click', () => setTab('signin'));
  qs('#tab-signup')?.addEventListener('click', () => setTab('signup'));

  // Default tab
  setTab(getParam('tab') === 'signup' ? 'signup' : 'signin');

  // Sign in
  qs('#signin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = qs('#si-username')?.value.trim();
    const password = qs('#si-password')?.value.trim();

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: { username, password }
      });
      setToken(data.token);
      setCurrentUser(data.user);
      toast(`Welcome, ${data.user.username}!`, 'success');

      const ru = popReturnUrl();
      const role = data.user.role;
      const isPriv = ru && (ru.includes('owner.html') || ru.includes('admin.html'));

      if (ru && role === 'customer' && isPriv) {
        window.location.href = 'my.html';
      } else if (ru) {
        window.location.href = ru;
      } else if (role === 'owner' || role === 'admin') {
        window.location.href = 'owner.html';
      } else {
        window.location.href = 'my.html';
      }
    } catch (err) {
      toast(err.message || 'Login failed', 'error');
    }
  });

  // Sign up
  qs('#signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = qs('#su-phone')?.value.trim();
    const username = qs('#su-username')?.value.trim();
    const email = qs('#su-email')?.value.trim();
    const p1 = qs('#su-password')?.value.trim();
    const p2 = qs('#su-password2')?.value.trim();
    const role = (qs('input[name="su-role"]:checked')?.value || 'customer').trim();

    if (!/^[0-9+\-()\s]{6,}$/.test(phone || '')) return toast('Enter a valid phone', 'error');
    if (!/^\S+@\S+\.\S+$/.test(email || '')) return toast('Invalid email address', 'error');
    if ((p1 || '').length < 4) return toast('Password is too short', 'error');
    if (p1 !== p2) return toast('Passwords do not match', 'error');

    try {
      await apiFetch('/api/auth/signup', {
        method: 'POST',
        auth: false,
        body: { phone, username, email, password: p1, role }
      });
      toast(role === 'owner' ? 'Owner account created! Please sign in to add your buses.' : 'Account created! Please sign in.', 'success');
      setTab('signin');
    } catch (err) {
      toast(err.message || 'Signup failed', 'error');
    }
  });
}
