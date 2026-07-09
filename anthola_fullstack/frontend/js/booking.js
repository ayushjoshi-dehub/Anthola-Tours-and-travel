import { qs, qsa, toast, bindSafe } from './ui.js';
import { apiFetch } from './api.js';
import { getCurrentUser, setReturnUrl } from './storage.js';

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

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function seatId(row, col) {
  return `${row}${col}`; // e.g., A1
}

function makeSeatList(count) {
  // Layout: 4 columns per row (2 + aisle + 2), 9 rows by default = 36
  const cols = ['1', '2', '3', '4'];
  const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, 20);
  const seats = [];
  for (const r of rows) {
    for (const c of cols) {
      seats.push(seatId(r, c));
      if (seats.length >= count) return seats;
    }
  }
  return seats;
}

export async function initBookingPage() {
  const routeSel = qs('#route');
  const dateInp = qs('#travelDate');
  const seatsMount = qs('#seats');
  const summaryMount = qs('#summary');
  const payBtn = qs('#payBtn');
  const recentMount = qs('#recentBookings');
  if (!routeSel || !dateInp || !seatsMount || !summaryMount || !payBtn) return;

  // --- state ---
  let routes = [];
  let seatCount = 36;
  let selected = new Set();
  let seatState = { booked: new Set(), lockedOthers: new Set(), lockedMine: new Set() };

  // socket
  let socket = null;
  let currentRoom = null;
  let refreshTimer = null;

  const debounceRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refreshSeatState(), 250);
  };

  function getSelectedRoute() {
    const id = routeSel.value;
    return routes.find(r => r.routeId === id) || null;
  }

  function isOccupied(seat) {
    return seatState.booked.has(seat) || seatState.lockedOthers.has(seat);
  }

  function calcPricePerSeat(route) {
    const base = Number(route?.price || 0);
    const disc = Math.max(0, Math.min(100, Number(route?.discountPercent || 0)));
    return Math.round(base * (1 - disc / 100));
  }

  function renderSummary() {
    const route = getSelectedRoute();
    const when = dateInp.value || '';
    const seats = [...selected].sort();
    const pricePerSeat = calcPricePerSeat(route);
    const total = pricePerSeat * seats.length;

    const payHtml = route ? `
      <div class="mt-3 pt-3 border-t border-slate-200">
        <div class="flex items-center justify-between"><span class="text-slate-600">Bus</span><b>${esc(route.busName || 'Bus')}${route.busNumber ? ` • ${esc(route.busNumber)}` : ''}</b></div>
        ${route.busDescription ? `<p class="text-slate-600 text-sm mt-1">${esc(route.busDescription)}</p>` : ''}
        <div class="mt-3 bg-white border border-slate-200 rounded-xl p-3">
          <p class="text-xs font-bold text-slate-700">Payment</p>
          <p class="text-sm text-slate-700 mt-1"><b>${esc(route.paymentProvider || 'eSewa')}</b>${route.paymentAccountName ? ` • ${esc(route.paymentAccountName)}` : ''}</p>
          ${route.paymentPhone ? `<p class="text-sm text-slate-700">${esc(route.paymentPhone)}</p>` : ''}
          ${route.paymentNote ? `<p class="text-xs text-slate-500 mt-1">${esc(route.paymentNote)}</p>` : ''}
          ${route.paymentQrUrl ? `<img src="${esc(route.paymentQrUrl)}" alt="Payment QR" class="mt-3 w-40 h-40 object-contain rounded-xl border border-slate-200" />` : ''}
        </div>
      </div>
    ` : '';

    summaryMount.innerHTML = `
      <div class="flex items-center justify-between"><span class="text-slate-600">Route</span><b>${route ? `${esc(route.from)} → ${esc(route.to)}` : '-'}</b></div>
      <div class="flex items-center justify-between"><span class="text-slate-600">Date</span><b>${when ? esc(when) : '-'}</b></div>
      <div class="flex items-center justify-between"><span class="text-slate-600">Seats</span><b>${seats.length ? esc(seats.join(', ')) : '-'}</b></div>
      <div class="flex items-center justify-between"><span class="text-slate-600">Price/Seat</span><b>${fmtMoney(pricePerSeat)}</b></div>
      <div class="flex items-center justify-between"><span class="text-slate-600">Total</span><b>${fmtMoney(total)}</b></div>
      ${payHtml}
    `;

    payBtn.disabled = !route || !when || seats.length === 0;
  }

  function renderSeats() {
    const route = getSelectedRoute();
    const all = makeSeatList(seatCount);

    // Grid: 4 columns per row, add "aisle" spacing using css grid columns
    // We'll render in rows of 4 with a gap.
    seatsMount.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
    seatsMount.innerHTML = all.map(s => {
      const occ = isOccupied(s);
      const sel = selected.has(s);
      const cls = sel
        ? 'bg-orange-500 text-white border-orange-500'
        : occ
          ? 'bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed'
          : 'bg-white hover:bg-orange-50 border-slate-200';
      const title = occ ? 'Occupied' : 'Available';
      return `<button data-seat="${esc(s)}" title="${title}" class="seatBtn px-3 py-3 rounded-xl border font-semibold transition ${cls}">${esc(s)}</button>`;
    }).join('');

    // bind
    qsa('.seatBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const seat = btn.getAttribute('data-seat');
        if (!seat) return;
        if (isOccupied(seat) && !selected.has(seat)) return;

        const user = getCurrentUser();
        if (!user) {
          setReturnUrl(window.location.href);
          window.location.href = `auth.html?msg=signinfirst&return=${encodeURIComponent(window.location.href)}`;
          return;
        }

        const route0 = getSelectedRoute();
        const date0 = dateInp.value;
        if (!route0 || !date0) {
          toast('Please select route and date first', 'info');
          return;
        }

        try {
          if (selected.has(seat)) {
            // unlock
            selected.delete(seat);
            renderSummary();
            renderSeats();
            await apiFetch('/api/seats/unlock', { method: 'POST', body: { routeId: route0.routeId, date: date0, seat } });
            await refreshSeatState();
          } else {
            await apiFetch('/api/seats/lock', { method: 'POST', body: { routeId: route0.routeId, date: date0, seat } });
            selected.add(seat);
            renderSummary();
            renderSeats();
            await refreshSeatState();
          }
        } catch (err) {
          toast(err.message || 'Could not lock seat', 'error');
          await refreshSeatState();
        }
      });
    });

    // Show a quick hint if no route/date yet
    if (!route || !dateInp.value) {
      seatsMount.innerHTML = `<div class="col-span-4 text-slate-600 text-sm">Select a route and date to see live seat availability.</div>`;
    }
  }

  async function unlockAllSelected() {
    const route = getSelectedRoute();
    const date = dateInp.value;
    if (!route || !date) return;
    const seats = [...selected];
    selected = new Set();
    for (const seat of seats) {
      try {
        await apiFetch('/api/seats/unlock', { method: 'POST', body: { routeId: route.routeId, date, seat } });
      } catch { /* ignore */ }
    }
  }

  async function refreshSeatState() {
    const route = getSelectedRoute();
    const date = dateInp.value;
    seatState = { booked: new Set(), lockedOthers: new Set(), lockedMine: new Set() };

    if (!route || !date) {
      renderSeats();
      renderSummary();
      return;
    }

    try {
      const st = await apiFetch(`/api/seats/state?routeId=${encodeURIComponent(route.routeId)}&date=${encodeURIComponent(date)}`, { auth: !!getCurrentUser() });
      (st.booked || []).forEach(s => seatState.booked.add(String(s)));
      (st.locked || []).forEach(l => {
        const seat = String(l.seat);
        if (l.mine) seatState.lockedMine.add(seat);
        else seatState.lockedOthers.add(seat);
      });

      // Remove selections that are no longer locked by me
      for (const seat of [...selected]) {
        if (!seatState.lockedMine.has(seat)) {
          selected.delete(seat);
        }
      }

      renderSeats();
      renderSummary();
    } catch (err) {
      toast(err.message || 'Failed to load seat state', 'error');
      renderSeats();
      renderSummary();
    }
  }

  function ensureSocket() {
    if (socket) return socket;
    if (!window.io) return null;
    socket = window.io();
    socket.on('connect', () => {
      if (currentRoom) socket.emit('join', { room: currentRoom });
    });
    socket.on('seat:locked', debounceRefresh);
    socket.on('seat:unlocked', debounceRefresh);
    socket.on('seat:booked', debounceRefresh);
    return socket;
  }

  function joinRoom() {
    const route = getSelectedRoute();
    const date = dateInp.value;
    const s = ensureSocket();
    if (!s || !route || !date) return;
    const nextRoom = `${route.routeId}|${date}`;
    if (currentRoom === nextRoom) return;
    if (currentRoom) s.emit('leave', { room: currentRoom });
    currentRoom = nextRoom;
    s.emit('join', { room: currentRoom });
  }

  async function renderRecentBookings() {
    if (!recentMount) return;
    try {
      const me = getCurrentUser();
      if (!me) {
        const back = encodeURIComponent(window.location.href);
        recentMount.innerHTML = `<p class="text-slate-600 text-sm">Sign in to see your bookings here. <a class="text-orange-600 font-semibold hover:underline" href="auth.html?msg=signinfirst&return=${back}">Sign in</a></p>`;
        return;
      }
      const data = await apiFetch('/api/bookings/me');
      const list = (data.bookings || []).slice(0, 5);
      if (list.length === 0) {
        recentMount.innerHTML = `<p class="text-slate-600 text-sm">No bookings yet.</p>`;
        return;
      }
      recentMount.innerHTML = list.map(b => {
        const status = b.bookingStatus || 'CONFIRMED';
        const cls = status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200';
        return `
          <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-bold">${esc(b.from)} → ${esc(b.to)}</p>
                <p class="text-slate-600 text-sm">${esc(b.date)} • Seats: ${esc((b.seats||[]).join(', '))}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-semibold border ${cls}">${esc(status)}</span>
            </div>
          </div>
        `;
      }).join('');
    } catch {
      recentMount.innerHTML = `<p class="text-slate-600 text-sm">Could not load bookings.</p>`;
    }
  }

  async function loadRoutes() {
    const data = await apiFetch('/api/routes', { auth: false });
    routes = (data.routes || []).map(r => ({
      routeId: r.routeId,
      from: r.from,
      to: r.to,
      duration: r.duration,
      price: r.price,
      seatCount: Number(r.seatCount || 36),
      discountPercent: Number(r.discountPercent || 0),
      busName: r.busName || 'Bus',
      busNumber: r.busNumber || '',
      busPhotoUrl: r.busPhotoUrl || '',
      busDescription: r.busDescription || '',
      paymentProvider: r.paymentProvider || 'eSewa',
      paymentAccountName: r.paymentAccountName || '',
      paymentPhone: r.paymentPhone || '',
      paymentQrUrl: r.paymentQrUrl || '',
      paymentNote: r.paymentNote || ''
    }));

    if (routes.length === 0) {
      routeSel.innerHTML = `<option value="">No routes available</option>`;
      return;
    }

    routeSel.innerHTML = routes.map(r => {
      const disc = Number(r.discountPercent || 0);
      const pricePer = Math.round(Number(r.price || 0) * (1 - disc / 100));
      const label = `${r.from} → ${r.to} (${fmtMoney(pricePer)}${disc ? ` • ${disc}% off` : ''})`;
      return `<option value="${esc(r.routeId)}">${esc(label)}</option>`;
    }).join('');
  }

  // --- init ---
  dateInp.value = todayISO();

  try {
    await loadRoutes();
  } catch (err) {
    toast(err.message || 'Failed to load routes', 'error');
  }

  // set seatCount from first route
  const r0 = getSelectedRoute();
  seatCount = Number(r0?.seatCount || 36);

  // listeners
  routeSel.addEventListener('change', async () => {
    await unlockAllSelected();
    const r = getSelectedRoute();
    seatCount = Number(r?.seatCount || 36);
    selected = new Set();
    joinRoom();
    await refreshSeatState();
  });

  dateInp.addEventListener('change', async () => {
    await unlockAllSelected();
    selected = new Set();
    joinRoom();
    await refreshSeatState();
  });

  bindSafe(payBtn, 'click', async () => {
    const user = getCurrentUser();
    if (!user) {
      setReturnUrl(window.location.href);
      window.location.href = `auth.html?msg=signinfirst&return=${encodeURIComponent(window.location.href)}`;
      return;
    }

    const route = getSelectedRoute();
    const date = dateInp.value;
    const seats = [...selected].sort();
    if (!route || !date || seats.length === 0) {
      toast('Select route, date and seats', 'info');
      return;
    }

    try {
      payBtn.disabled = true;
      payBtn.textContent = 'Confirming...';
      const res = await apiFetch('/api/bookings', { method: 'POST', body: { routeId: route.routeId, date, seats } });
      toast(`Booked! ${res.booking.bookingId}`, 'success');
      selected = new Set();
      await refreshSeatState();
      await renderRecentBookings();
    } catch (err) {
      toast(err.message || 'Booking failed', 'error');
      await refreshSeatState();
    } finally {
      payBtn.textContent = 'Pay & Confirm';
      payBtn.disabled = false;
      renderSummary();
    }
  });

  // initial render
  joinRoom();
  await refreshSeatState();
  renderSeats();
  renderSummary();
  await renderRecentBookings();

  // cleanup
  window.addEventListener('beforeunload', () => {
    // best-effort unlock (fire-and-forget)
    unlockAllSelected();
  });
}
