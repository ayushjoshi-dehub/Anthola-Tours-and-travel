import { qs, toast, bindSafe } from './ui.js';
import { getCurrentUser, setReturnUrl } from './storage.js';
import { apiFetch } from './api.js';

function esc(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fmtMoney(n) {
  const v = Number(n || 0);
  return `Rs. ${v.toLocaleString()}`;
}

export async function initMyPage() {
  const root = qs('#myRoot');
  if (!root) return;

  const user = getCurrentUser();
  if (!user) {
    setReturnUrl(window.location.href);
    root.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-3xl p-8">
        <h2 class="text-2xl font-extrabold">Please sign in</h2>
        <p class="mt-2 text-slate-600">Your bookings and history are available after you log in.</p>
        <button id="openAuth" class="mt-5 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold">Sign in / Sign up</button>
      </div>
    `;
    bindSafe(qs('#openAuth'), 'click', () => {
      const ru = encodeURIComponent(window.location.href);
      window.location.href = `auth.html?msg=signinfirst&return=${ru}`;
    });
    return;
  }

  root.innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-3xl md:text-4xl font-extrabold">My Trips</h1>
        <p class="text-slate-600 mt-1">Booked trips and booking history.</p>
      </div>
      <button id="refresh" class="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold">Refresh</button>
    </div>
    <div class="mt-6" id="list"></div>
  `;

  const render = async () => {
    const mount = qs('#list');
    mount.innerHTML = `<div class="bg-white border border-slate-200 rounded-3xl p-6">Loading...</div>`;
    try {
      const data = await apiFetch('/api/bookings/me');
      const bookings = (data.bookings || []).slice();
      if (bookings.length === 0) {
        mount.innerHTML = `
          <div class="bg-white border border-slate-200 rounded-3xl p-8">
            <h2 class="text-xl font-extrabold">No bookings yet</h2>
            <p class="mt-2 text-slate-600">Go to Destinations and book your first trip.</p>
            <a href="destinations.html" class="inline-block mt-4 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-semibold">Browse routes</a>
          </div>
        `;
        return;
      }

      mount.innerHTML = `
        <div class="grid gap-4">
          ${bookings.map(b => {
            const status = b.bookingStatus || 'CONFIRMED';
            const statusCls = status === 'CONFIRMED'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : status === 'CANCELLED'
                ? 'bg-red-50 text-red-700 border border-red-100'
                : 'bg-slate-100 text-slate-600 border border-slate-200';
            return `
              <article class="bg-white border border-slate-200 rounded-3xl p-6">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-xl font-extrabold">${esc(b.from)} → ${esc(b.to)}</h3>
                    <p class="text-slate-600 text-sm mt-1">Date: <b>${esc(b.date)}</b> • Seats: <b>${esc((b.seats || []).join(', '))}</b></p>
                    <p class="text-slate-600 text-sm mt-1">Booking ID: <b>${esc(b.bookingId || '')}</b></p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusCls}">${esc(status)}</span>
                </div>
                <div class="mt-4 grid md:grid-cols-3 gap-3 text-sm">
                  <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200"><p class="text-slate-600">Price/Seat</p><p class="font-extrabold">${fmtMoney(b.pricePerSeat)}</p></div>
                  <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200"><p class="text-slate-600">Total</p><p class="font-extrabold">${fmtMoney(b.total)}</p></div>
                  <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200"><p class="text-slate-600">Payment</p><p class="font-extrabold">${esc(b.paymentStatus || 'SUCCESS')}</p></div>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      toast(err.message || 'Failed to load bookings', 'error');
      mount.innerHTML = `<div class="bg-white border border-slate-200 rounded-3xl p-6">Failed to load bookings.</div>`;
    }
  };

  bindSafe(qs('#refresh'), 'click', render);
  await render();
}
