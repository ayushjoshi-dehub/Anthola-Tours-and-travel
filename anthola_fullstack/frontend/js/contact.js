import { qs, toast } from './ui.js';
import { apiFetch } from './api.js';

export function initContactPage(){
  const form = qs('#contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = qs('#c-name').value.trim();
    const email = qs('#c-email').value.trim();
    const message = qs('#c-message').value.trim();

    if (!name || !email || !message) return toast('Please fill all fields', 'error');
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Invalid email', 'error');

    try {
      await apiFetch('/api/contact', { method: 'POST', auth: false, body: { name, email, message } });
      form.reset();
      toast('Message sent! We will get back to you.', 'success');
    } catch (err) {
      toast(err.message || 'Failed to send message', 'error');
    }
  });
}
