import { ROUTES as FALLBACK_ROUTES } from './data.js';
import { qs, toast } from './ui.js';
import { apiFetch } from './api.js';
import { getCurrentUser, setReturnUrl } from './storage.js';

async function loadRoutes() {
  try {
    const data = await apiFetch('/api/routes', { auth: false });
    // backend fields: routeId, from, to, duration, price, badges, isActive
    return (data.routes || []).map(r => ({
      id: r.routeId,
      busName: r.busName || 'Bus',
      busNumber: r.busNumber || '',
      busPhotoUrl: r.busPhotoUrl || '',
      seatCount: Number(r.seatCount || 36),
      discountPercent: Number(r.discountPercent || 0),
      busDescription: r.busDescription || '',
      from: r.from,
      to: r.to,
      duration: r.duration,
      price: r.price,
      badges: r.badges || [],
      isActive: r.isActive
    }));
  } catch {
    return FALLBACK_ROUTES.map(r => ({ ...r, isActive: true }));
  }
}

export async function initDestinationsPage() {
  const grid = qs('#destGrid');
  if (!grid) return;

  const routes = await loadRoutes();
  const visible = routes.filter(r => r.isActive !== false);

  const items = visible.map(r => {
    const disc = Math.max(0, Math.min(100, Number(r.discountPercent || 0)));
    const finalPrice = Math.round(Number(r.price || 0) * (1 - disc / 100));
    return { ...r, disc, finalPrice };
  });

  grid.innerHTML = items.map(r => `
    <article class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition">
      ${r.busPhotoUrl ? `<img src="${r.busPhotoUrl}" alt="Bus" class="w-full h-44 object-cover" />` : ''}
      <div class="p-6">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-xl font-bold text-slate-900">${r.from} → ${r.to}</h3>
          <span class="text-slate-900 font-bold">Rs. ${r.finalPrice}</span>
        </div>
        <p class="text-slate-600 mt-1">${r.busName ? `${r.busName}${r.busNumber ? ` • ${r.busNumber}` : ''} • ` : ''}Duration: <b>${r.duration}</b> • Seats: <b>${r.seatCount}</b></p>
        ${r.busDescription ? `<p class="text-slate-600 text-sm mt-2">${r.busDescription}</p>` : ''}
        <div class="mt-3 flex flex-wrap gap-2">
          ${r.disc ? `<span class="text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">${r.disc}% OFF</span>` : ''}
          ${(r.badges || []).map(b => `<span class="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">${b}</span>`).join('')}
        </div>
        <div class="mt-5 flex gap-3">
          <button data-book="${r.id}" class="flex-1 text-center bg-slate-900 hover:bg-slate-950 text-white font-semibold py-3 rounded-xl">Book this bus</button>
          <button data-route="${r.id}" class="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50" type="button" aria-label="Copy link">
            <i class="fa-solid fa-link"></i>
          </button>
        </div>
      </div>
    </article>
  `).join('');

  // booking intent: force login/signup page
  grid.querySelectorAll('button[data-book]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-book');
      const target = `book.html?route=${encodeURIComponent(id)}`;
      const user = getCurrentUser();
      if (!user) {
        const ru = new URL(target, window.location.href).toString();
        setReturnUrl(ru);
        window.location.href = `auth.html?msg=signinfirst&return=${encodeURIComponent(ru)}`;
        return;
      }
      window.location.href = target;
    });
  });

  grid.querySelectorAll('button[data-route]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-route');
      const prefix = (location.origin && location.origin !== 'null')
        ? `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`
        : '';
      const url = `${prefix}book.html?route=${encodeURIComponent(id)}`;
      try {
        await navigator.clipboard.writeText(url);
        toast('Booking link copied!', 'success');
      } catch {
        toast('Copy failed (browser blocked clipboard).', 'error');
      }
    });
  });
}
