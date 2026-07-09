import { qs, qsa, toast, bindSafe } from './ui.js';
import { getCurrentUser } from './storage.js';
import { apiFetch } from './api.js';

function isOwnerUser(user) {
  return !!(user && (user.role === 'owner' || user.role === 'admin'));
}

function fmtMoney(n) {
  const v = Number(n || 0);
  return `Rs. ${v.toLocaleString()}`;
}

function esc(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function initOwnerPage() {
  const root = qs('#ownerRoot');
  if (!root) return;

  const user = getCurrentUser();
  if (!isOwnerUser(user)) {
    root.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-3xl p-8">
        <h2 class="text-2xl font-extrabold">Owner access required</h2>
        <p class="mt-2 text-slate-600">Please sign in as a <b>bus owner</b> to view this page.</p>
        <p class="mt-4 text-sm text-slate-500">Backend seeds an owner by default: <b>owner / owner123</b>.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-3xl md:text-4xl font-extrabold">Owner Dashboard</h1>
        <p class="text-slate-600 mt-1">Manage your routes, seats, pricing, and bookings.</p>
      </div>
      <div class="flex gap-2">
        <button id="adm-export" class="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold">Export JSON</button>
      </div>
    </div>

    <div class="mt-8 grid lg:grid-cols-4 gap-4" id="adm-stats"></div>

    <div class="mt-8 bg-white rounded-3xl border border-slate-200 overflow-hidden">
      <div class="p-4 border-b border-slate-200 flex flex-wrap gap-2" id="adm-tabs"></div>
      <div class="p-6" id="adm-panel"></div>
    </div>

    <dialog id="routeDlg" class="rounded-2xl p-0 w-full max-w-xl">
      <form method="dialog" class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div class="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-extrabold" id="routeDlgTitle">Add route</h3>
            <p class="text-sm text-slate-600">This updates the routes used by Destinations + Booking.</p>
          </div>
          <button value="cancel" class="p-2 rounded-xl hover:bg-slate-100" aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="p-5 grid gap-3">
          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-semibold text-slate-700">Route ID</label>
              <input id="r-id" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="e.g. ktm-pok" required />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-700">Duration</label>
              <input id="r-duration" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="e.g. 6h 30m" required />
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-semibold text-slate-700">From</label>
              <input id="r-from" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Kathmandu" required />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-700">To</label>
              <input id="r-to" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Pokhara" required />
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-semibold text-slate-700">Price</label>
              <input id="r-price" type="number" min="0" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="1500" required />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-700">Badges (comma separated)</label>
              <input id="r-badges" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Popular, AC Deluxe" />
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-semibold text-slate-700">Bus name</label>
              <input id="r-busName" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Anthola Express" />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-700">Bus number</label>
              <input id="r-busNumber" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="BA 2 KHA 1234" />
            </div>
          </div>

          <div>
            <label class="text-sm font-semibold text-slate-700">Bus description</label>
            <textarea id="r-busDesc" rows="3" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Short description customers will see..."></textarea>
          </div>

          <div>
            <label class="text-sm font-semibold text-slate-700">Bus gallery URLs (comma separated)</label>
            <input id="r-gallery" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="https://..., https://..." />
          </div>

          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-semibold text-slate-700">Seat count</label>
              <input id="r-seatCount" type="number" min="1" max="80" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="36" />
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-semibold text-slate-700">Discount (%)</label>
              <input id="r-discount" type="number" min="0" max="100" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="0" />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-700">Bus photo URL</label>
              <input id="r-photo" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="https://..." />
            </div>
          </div>

          <div class="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-extrabold text-slate-900">Payment details (shown to customers)</p>
            <div class="mt-3 grid md:grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-semibold text-slate-700">Provider</label>
                <select id="r-payProvider" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200">
                  <option value="eSewa">eSewa</option>
                  <option value="Khalti">Khalti</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-semibold text-slate-700">Account name</label>
                <input id="r-payName" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Your business name" />
              </div>
            </div>
            <div class="mt-3 grid md:grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-semibold text-slate-700">Phone / ID</label>
                <input id="r-payPhone" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="98XXXXXXXX" />
              </div>
              <div>
                <label class="text-sm font-semibold text-slate-700">QR image URL</label>
                <input id="r-payQr" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="https://..." />
              </div>
            </div>
            <div class="mt-3">
              <label class="text-sm font-semibold text-slate-700">Payment note</label>
              <input id="r-payNote" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Example: Pay & show screenshot at counter" />
            </div>
          </div>

          <label class="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input id="r-active" type="checkbox" class="rounded" checked />
            Active (visible to users)
          </label>
        </div>

        <div class="p-5 border-t border-slate-200 flex gap-2 justify-end">
          <button value="cancel" class="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold">Cancel</button>
          <button id="routeSaveBtn" value="default" class="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold">Save route</button>
        </div>
      </form>
    </dialog>
  `;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'fa-chart-line' },
    { key: 'routes', label: 'Routes', icon: 'fa-route' },
    { key: 'bookings', label: 'Bookings', icon: 'fa-ticket' },
    { key: 'messages', label: 'Messages', icon: 'fa-envelope' }
  ];

  const tabRoot = qs('#adm-tabs');
  tabRoot.innerHTML = tabs.map((t, i) => `
    <button data-tab="${t.key}" class="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 ${i===0 ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-950' : ''}">
      <i class="fa-solid ${t.icon} mr-2"></i>${t.label}
    </button>
  `).join('');

  const panel = qs('#adm-panel');
  let activeTab = 'overview';

  const render = async (key) => {
    await refreshStats();
    if (key === 'overview') return renderOverview(panel);
    if (key === 'routes') return renderRoutes(panel);
    if (key === 'bookings') return renderBookings(panel);
    if (key === 'messages') return renderMessages(panel);
  };

  qsa('#adm-tabs [data-tab]').forEach(btn => {
    btn.addEventListener('click', async () => {
      activeTab = btn.getAttribute('data-tab');
      qsa('#adm-tabs [data-tab]').forEach(b => b.className = b.className
        .replace('bg-slate-900 text-white border-slate-900 hover:bg-slate-950', '')
        .trim());
      btn.className = btn.className + ' bg-slate-900 text-white border-slate-900 hover:bg-slate-950';
      await render(activeTab);
    });
  });

  bindSafe(qs('#adm-export'), 'click', exportJson);

  // initial
  render(activeTab);

  async function refreshStats() {
    const mount = qs('#adm-stats');
    try {
      const s = await apiFetch('/api/owner/stats');
      const stat = [
        { label: 'Total bookings', value: String(s.bookingCount), sub: `${s.confirmedCount} confirmed` },
        { label: "Today's revenue", value: fmtMoney(s.todayRevenue), sub: `${s.todayBookingCount} bookings today` },
        { label: 'Routes', value: String(s.routesCount), sub: `${s.activeRoutesCount} active` },
        { label: 'Users / Messages', value: `${s.userCount} / ${s.msgCount}`, sub: 'registered / inbox' }
      ];

      mount.innerHTML = stat.map(x => `
        <div class="bg-white rounded-3xl border border-slate-200 p-6">
          <p class="text-sm text-slate-600">${x.label}</p>
          <p class="mt-2 text-2xl font-extrabold text-slate-900">${x.value}</p>
          <p class="mt-1 text-xs text-slate-500">${x.sub}</p>
        </div>
      `).join('');
    } catch (err) {
      mount.innerHTML = `
        <div class="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6">
          <p class="text-slate-600">Could not load stats. ${esc(err.message || '')}</p>
        </div>
      `;
    }
  }

  function renderOverview(mount) {
    mount.innerHTML = `
      <div class="grid md:grid-cols-2 gap-4">
        <div class="p-6 rounded-2xl border border-slate-200 bg-slate-50">
          <h3 class="font-extrabold text-slate-900">What you can manage</h3>
          <ul class="mt-3 space-y-2 text-slate-700 text-sm">
            <li><i class="fa-solid fa-route text-orange-500 mr-2"></i>Routes and pricing (create / edit / activate)</li>
            <li><i class="fa-solid fa-ticket text-orange-500 mr-2"></i>Bookings (view + cancel)</li>
            <li><i class="fa-solid fa-bus text-orange-500 mr-2"></i>Bus details (photo, seats, discounts)</li>
            <li><i class="fa-solid fa-envelope text-orange-500 mr-2"></i>Contact messages (resolve)</li>
          </ul>
        </div>
        <div class="p-6 rounded-2xl border border-slate-200 bg-white">
          <h3 class="font-extrabold text-slate-900">Backend notes</h3>
          <p class="mt-2 text-slate-600 text-sm">All actions here call protected backend APIs using JWT + role-based access.</p>
          <p class="mt-2 text-slate-600 text-sm">Seat selection is real-time locked to prevent double-booking. Add payments next.</p>
        </div>
      </div>
    `;
  }

  async function renderRoutes(mount) {
    let routes = [];
    try {
      const data = await apiFetch('/api/routes?includeInactive=1&mine=1');
      routes = (data.routes || []).map(r => ({
        routeId: r.routeId,
        busName: r.busName || 'Bus',
        busNumber: r.busNumber || '',
        busPhotoUrl: r.busPhotoUrl || '',
        busGalleryUrls: r.busGalleryUrls || [],
        busDescription: r.busDescription || '',
        seatCount: Number(r.seatCount || 36),
        discountPercent: Number(r.discountPercent || 0),
        paymentProvider: r.paymentProvider || 'eSewa',
        paymentAccountName: r.paymentAccountName || '',
        paymentPhone: r.paymentPhone || '',
        paymentQrUrl: r.paymentQrUrl || '',
        paymentNote: r.paymentNote || '',
        from: r.from,
        to: r.to,
        duration: r.duration,
        price: r.price,
        badges: r.badges || [],
        paymentProvider: r.paymentProvider || 'eSewa',
        paymentAccountName: r.paymentAccountName || '',
        paymentPhone: r.paymentPhone || '',
        paymentQrUrl: r.paymentQrUrl || '',
        paymentNote: r.paymentNote || '',
        isActive: r.isActive
      }));
    } catch (err) {
      toast(err.message || 'Failed to load routes', 'error');
    }

    mount.innerHTML = `
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 class="text-xl font-extrabold">Routes</h3>
          <p class="text-slate-600 text-sm">Routes shown on Destinations + Booking pages.</p>
        </div>
        <button id="addRouteBtn" class="px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold">
          <i class="fa-solid fa-plus mr-2"></i>Add route
        </button>
      </div>

      <div class="mt-5 overflow-x-auto">
        <table class="min-w-[900px] w-full text-sm">
          <thead>
            <tr class="text-left text-slate-600">
              <th class="py-2">Route ID</th>
              <th>From</th>
              <th>To</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Seats</th>
              <th>Discount</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${routes.map(r => `
              <tr class="border-t border-slate-200">
                <td class="py-3 font-semibold">${esc(r.routeId)}</td>
                <td>${esc(r.from)}</td>
                <td>${esc(r.to)}</td>
                <td>${esc(r.duration)}</td>
                <td>${fmtMoney(r.price)}</td>
                <td>${Number(r.seatCount || 36)}</td>
                <td>${Number(r.discountPercent || 0)}%</td>
                <td>
                  <span class="px-3 py-1 rounded-full text-xs font-semibold ${r.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}">
                    ${r.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td class="text-right">
                  <button data-edit="${esc(r.routeId)}" class="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50">Edit</button>
                  <button data-toggle="${esc(r.routeId)}" data-active="${r.isActive ? '1' : '0'}" class="ml-2 px-3 py-2 rounded-xl ${r.isActive ? 'bg-slate-900 text-white hover:bg-slate-950' : 'bg-white border border-slate-200 hover:bg-slate-50'}">
                    ${r.isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const dlg = qs('#routeDlg');
    const openDlg = (mode, route) => {
      qs('#routeDlgTitle').textContent = mode === 'edit' ? 'Edit route' : 'Add route';
      qs('#r-id').value = route?.routeId || '';
      qs('#r-id').disabled = mode === 'edit';
      qs('#r-from').value = route?.from || '';
      qs('#r-to').value = route?.to || '';
      qs('#r-duration').value = route?.duration || '';
      qs('#r-price').value = route?.price ?? '';
      qs('#r-badges').value = (route?.badges || []).join(', ');
      qs('#r-busName').value = route?.busName || '';
      qs('#r-busNumber').value = route?.busNumber || '';
      qs('#r-seatCount').value = route?.seatCount ?? '';
      qs('#r-discount').value = route?.discountPercent ?? '';
      qs('#r-photo').value = route?.busPhotoUrl || '';
      qs('#r-gallery').value = Array.isArray(route?.busGalleryUrls) ? route.busGalleryUrls.join(', ') : '';
      qs('#r-busDesc').value = route?.busDescription || '';
      qs('#r-payProvider').value = route?.paymentProvider || 'eSewa';
      qs('#r-payName').value = route?.paymentAccountName || '';
      qs('#r-payPhone').value = route?.paymentPhone || '';
      qs('#r-payQr').value = route?.paymentQrUrl || '';
      qs('#r-payNote').value = route?.paymentNote || '';
      qs('#r-active').checked = route ? !!route.isActive : true;
      dlg.showModal();
    };

    bindSafe(qs('#addRouteBtn'), 'click', () => openDlg('add'));

    qsa('button[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit');
        const route = routes.find(x => x.routeId === id);
        openDlg('edit', route);
      });
    });

    qsa('button[data-toggle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-toggle');
        const active = btn.getAttribute('data-active') === '1';
        try {
          await apiFetch(`/api/routes/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: { isActive: !active } });
          toast('Route updated', 'success');
          await render('routes');
        } catch (err) {
          toast(err.message || 'Failed to update route', 'error');
        }
      });
    });

    const saveBtn = qs('#routeSaveBtn');
    saveBtn.onclick = async (e) => {
      e.preventDefault();
      const payload = {
        routeId: qs('#r-id').value.trim(),
        busName: qs('#r-busName').value.trim(),
        busNumber: qs('#r-busNumber').value.trim(),
        busPhotoUrl: qs('#r-photo').value.trim(),
        busGalleryUrls: qs('#r-gallery').value.split(',').map(s => s.trim()).filter(Boolean),
        busDescription: qs('#r-busDesc').value.trim(),
        seatCount: Number(qs('#r-seatCount').value || 36),
        discountPercent: Number(qs('#r-discount').value || 0),
        paymentProvider: qs('#r-payProvider').value.trim(),
        paymentAccountName: qs('#r-payName').value.trim(),
        paymentPhone: qs('#r-payPhone').value.trim(),
        paymentQrUrl: qs('#r-payQr').value.trim(),
        paymentNote: qs('#r-payNote').value.trim(),
        from: qs('#r-from').value.trim(),
        to: qs('#r-to').value.trim(),
        duration: qs('#r-duration').value.trim(),
        price: Number(qs('#r-price').value || 0),
        badges: qs('#r-badges').value.split(',').map(s => s.trim()).filter(Boolean),
        isActive: qs('#r-active').checked
      };
      try {
        await apiFetch('/api/routes', { method: 'POST', body: payload });
        dlg.close();
        toast('Route saved', 'success');
        await render('routes');
      } catch (err) {
        toast(err.message || 'Failed to save route', 'error');
      }
    };
  }

  async function renderBookings(mount) {
    let bookings = [];
    try {
      const data = await apiFetch('/api/bookings');
      bookings = data.bookings || [];
    } catch (err) {
      toast(err.message || 'Failed to load bookings', 'error');
    }

    mount.innerHTML = `
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 class="text-xl font-extrabold">Bookings</h3>
          <p class="text-slate-600 text-sm">All bookings from all users.</p>
        </div>
        <button id="refBookings" class="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold">
          Refresh
        </button>
      </div>

      <div class="mt-5 overflow-x-auto">
        <table class="min-w-[1000px] w-full text-sm">
          <thead>
            <tr class="text-left text-slate-600">
              <th class="py-2">Booking</th>
              <th>Route</th>
              <th>Date</th>
              <th>Seats</th>
              <th>Total</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${bookings.map(b => `
              <tr class="border-t border-slate-200">
                <td class="py-3">
                  <div class="font-semibold">${esc(b.bookingId || b._id)}</div>
                  <div class="text-xs text-slate-500">${esc(b.passenger || '')}</div>
                </td>
                <td>${esc(b.from)} → ${esc(b.to)}</td>
                <td>${esc(b.date)}</td>
                <td>${(b.seats || []).map(esc).join(', ')}</td>
                <td>${fmtMoney(b.total)}</td>
                <td>
                  <span class="px-3 py-1 rounded-full text-xs font-semibold ${b.bookingStatus === 'CANCELLED' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-green-50 text-green-700 border border-green-100'}">
                    ${esc(b.bookingStatus || 'CONFIRMED')}
                  </span>
                </td>
                <td class="text-right">
                  ${b.bookingStatus === 'CANCELLED' ? '' : `<button data-cancel="${esc(b._id)}" class="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white">Cancel</button>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    bindSafe(qs('#refBookings'), 'click', () => render('bookings'));

    qsa('button[data-cancel]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Cancel this booking?')) return;
        try {
          await apiFetch(`/api/bookings/${btn.getAttribute('data-cancel')}/cancel`, { method: 'PATCH' });
          toast('Booking cancelled', 'success');
          await render('bookings');
        } catch (err) {
          toast(err.message || 'Failed to cancel booking', 'error');
        }
      });
    });
  }

  async function renderUsers(mount) {
    let users = [];
    try {
      const data = await apiFetch('/api/users');
      users = data.users || [];
    } catch (err) {
      toast(err.message || 'Failed to load users', 'error');
    }

    mount.innerHTML = `
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 class="text-xl font-extrabold">Users</h3>
          <p class="text-slate-600 text-sm">Block abusive users and protect the platform.</p>
        </div>
        <button id="refUsers" class="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold">Refresh</button>
      </div>

      <div class="mt-5 overflow-x-auto">
        <table class="min-w-[900px] w-full text-sm">
          <thead>
            <tr class="text-left text-slate-600">
              <th class="py-2">Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr class="border-t border-slate-200">
                <td class="py-3 font-semibold">${esc(u.username)}</td>
                <td>${esc(u.email)}</td>
                <td>${esc(u.phone)}</td>
                <td>${esc(u.role)}</td>
                <td>
                  <span class="px-3 py-1 rounded-full text-xs font-semibold ${u.isBlocked ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}">
                    ${u.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td class="text-right">
                  ${u.role === 'admin' ? '' : `
                    <button data-block="${esc(u.id)}" data-isblocked="${u.isBlocked ? '1' : '0'}" class="px-3 py-2 rounded-xl ${u.isBlocked ? 'bg-slate-900 text-white hover:bg-slate-950' : 'bg-red-600 hover:bg-red-700 text-white'}">
                      ${u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    bindSafe(qs('#refUsers'), 'click', () => render('users'));

    qsa('button[data-block]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-block');
        const isBlocked = btn.getAttribute('data-isblocked') === '1';
        try {
          await apiFetch(`/api/users/${encodeURIComponent(id)}/block`, { method: 'PATCH', body: { isBlocked: !isBlocked } });
          toast('User updated', 'success');
          await render('users');
        } catch (err) {
          toast(err.message || 'Failed to update user', 'error');
        }
      });
    });
  }

  async function renderMessages(mount) {
    let messages = [];
    try {
      const data = await apiFetch('/api/contact');
      messages = data.messages || [];
    } catch (err) {
      toast(err.message || 'Failed to load messages', 'error');
    }

    mount.innerHTML = `
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 class="text-xl font-extrabold">Messages</h3>
          <p class="text-slate-600 text-sm">Inbox from the Contact page.</p>
        </div>
        <button id="refMsgs" class="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold">Refresh</button>
      </div>

      <div class="mt-5 space-y-3">
        ${messages.length ? messages.map(m => `
          <div class="p-5 rounded-2xl border border-slate-200 bg-white">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-bold text-slate-900">${esc(m.name)} <span class="text-slate-500 font-medium">(${esc(m.email)})</span></p>
                <p class="mt-2 text-slate-700">${esc(m.message)}</p>
                <p class="mt-2 text-xs text-slate-500">${new Date(m.createdAt).toLocaleString()}</p>
              </div>
              <div class="text-right">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${m.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}">
                  ${esc(m.status || 'OPEN')}
                </span>
                ${m.status === 'RESOLVED' ? '' : `<div class="mt-3"><button data-resolve="${esc(m._id)}" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-semibold">Resolve</button></div>`}
              </div>
            </div>
          </div>
        `).join('') : `<p class="text-slate-600 text-sm">No messages yet.</p>`}
      </div>
    `;

    bindSafe(qs('#refMsgs'), 'click', () => render('messages'));

    qsa('button[data-resolve]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiFetch(`/api/contact/${btn.getAttribute('data-resolve')}/resolve`, { method: 'PATCH' });
          toast('Marked as resolved', 'success');
          await render('messages');
        } catch (err) {
          toast(err.message || 'Failed to resolve', 'error');
        }
      });
    });
  }

  async function exportJson() {
    try {
      const [routes, bookings, messages, stats] = await Promise.all([
        apiFetch('/api/routes?includeInactive=1&mine=1'),
        apiFetch('/api/bookings'),
        apiFetch('/api/contact'),
        apiFetch('/api/owner/stats')
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        stats,
        routes: routes.routes,
        bookings: bookings.bookings,
        messages: messages.messages
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `anthola-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('Exported JSON', 'success');
    } catch (err) {
      toast(err.message || 'Export failed', 'error');
    }
  }
}
