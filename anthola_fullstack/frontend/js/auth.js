import { setCurrentUser, setToken, popReturnUrl } from './storage.js';
import { apiFetch } from './api.js';
import { toast, qs, bindSafe } from './ui.js';

export function initAuthModal() {
  const tabIn = qs('#tab-signin');
  const tabUp = qs('#tab-signup');
  const formIn = qs('#signin-form');
  const formUp = qs('#signup-form');

  if (!tabIn || !tabUp || !formIn || !formUp) return;

  const show = (which) => {
    const isUp = which === 'signup';
    formIn.classList.toggle('hidden', isUp);
    formUp.classList.toggle('hidden', !isUp);
    tabIn.classList.toggle('bg-white', !isUp);
    tabIn.classList.toggle('shadow', !isUp);
    tabUp.classList.toggle('bg-white', isUp);
    tabUp.classList.toggle('shadow', isUp);
    tabIn.classList.toggle('text-slate-700', isUp);
    tabUp.classList.toggle('text-slate-700', !isUp);
  };

  tabIn.addEventListener('click', () => show('signin'));
  tabUp.addEventListener('click', () => show('signup'));

  formIn.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = qs('#si-username').value.trim();
    const password = qs('#si-password').value.trim();

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: { username, password }
      });
      setToken(data.token);
      setCurrentUser(data.user);
      toast(`Welcome, ${data.user.username}!`, 'success');
      // Redirect logic:
      // - If user came from booking, go back
      // - Prevent customers from being sent to owner/admin pages
      const ru = popReturnUrl();
      const role = data.user.role;
      const isPriv = ru && (ru.includes('owner.html') || ru.includes('admin.html'));
      if (ru && !(role === 'owner' || role === 'admin') && isPriv) {
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

  formUp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = qs('#su-phone').value.trim();
    const username = qs('#su-username').value.trim();
    const email = qs('#su-email').value.trim();
    const p1 = qs('#su-password').value.trim();
    const p2 = qs('#su-password2').value.trim();
    const role = (document.querySelector('input[name="su-role"]:checked')?.value || 'customer').trim();

    if (!/^[0-9+\-()\s]{6,}$/.test(phone)) return toast('Enter a valid phone', 'error');
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Invalid email address', 'error');
    if (p1.length < 4) return toast('Password is too short', 'error');
    if (p1 !== p2) return toast('Passwords do not match', 'error');

    try {
      await apiFetch('/api/auth/signup', {
        method: 'POST',
        auth: false,
        body: { phone, username, email, password: p1, role }
      });
      toast(role === 'owner' ? 'Owner account created! Please sign in to add your buses.' : 'Account created! Please sign in.', 'success');
      show('signin');
    } catch (err) {
      toast(err.message || 'Signup failed', 'error');
    }
  });
}

export function bindNavAuthButtons() {
  // if pages include standalone sign-in buttons (optional)
  bindSafe(qs('#open-auth'), 'click', () => {
    const modal = qs('#auth-modal');
    if (modal) modal.classList.remove('hidden');
  });
}
