import { getCurrentUser, signOut, setReturnUrl } from './storage.js';
import { bindSafe, openDialog, closeDialog, toast, qs, qsa } from './ui.js';

export function renderNav(active = '') {
  const mount = qs('#site-nav');
  if (!mount) return;

  const user = getCurrentUser();
  const linkCls = (key) =>
    `hover:text-orange-400 font-medium ${active===key ? 'text-orange-400' : 'text-white'}`;

  mount.innerHTML = `
  <nav class="bg-slate-900 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <a href="index.html" class="flex items-center gap-3">
        <span class="bg-orange-500 p-2 rounded-full"><i class="fa-solid fa-bus text-white text-2xl"></i></span>
        <span class="text-2xl font-bold">Anthola</span>
      </a>

      <div class="hidden md:flex items-center gap-8">
        <a href="index.html" class="${linkCls('home')}">Home</a>
        <a href="destinations.html" class="${linkCls('destinations')}">Destinations</a>
        <a href="book.html" class="${linkCls('book')}">Book Now</a>
        <a href="features.html" class="${linkCls('features')}">Features</a>
        <a href="contact.html" class="${linkCls('contact')}">Contact</a>

        ${user ? `<a href="my.html" class="${linkCls('my')}">My Trips</a>` : ``}

        ${(user && (user.role === 'owner' || user.role === 'admin')) ? `
          <a href="owner.html" class="${linkCls('owner')}">Owner</a>
        ` : ``}

        ${user ? `
          <div class="flex items-center gap-3">
            <span class="text-sm opacity-90">Hi, <b>${escapeHtml(user.username || 'User')}</b></span>
            <button id="signout-btn" class="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-full">Sign out</button>
          </div>
        ` : `
          <button id="signin-btn" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-medium transition transform hover:-translate-y-0.5">
            Sign In
          </button>
        `}
      </div>

      <button id="mobile-menu-button" class="md:hidden text-white" aria-label="Open menu">
        <i class="fa-solid fa-bars text-2xl"></i>
      </button>
    </div>

    <div id="mobile-menu" class="md:hidden hidden bg-slate-900 py-4 px-6 absolute left-0 right-0 top-full shadow-lg border-t border-white/10">
      <div class="flex flex-col space-y-4">
        <a href="index.html" class="hover:text-orange-400">Home</a>
        <a href="destinations.html" class="hover:text-orange-400">Destinations</a>
        <a href="book.html" class="hover:text-orange-400">Book Now</a>
        <a href="features.html" class="hover:text-orange-400">Features</a>
        <a href="contact.html" class="hover:text-orange-400">Contact</a>
        ${user ? `<a href="my.html" class="hover:text-orange-400">My Trips</a>` : ``}
        ${(user && (user.role === 'owner' || user.role === 'admin')) ? `
          <a href="owner.html" class="hover:text-orange-400">Owner</a>
        ` : ``}
        ${user ? `
          <button id="mobile-signout-btn" class="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-full text-center">Sign out</button>
        ` : `
          <button id="mobile-signin-btn" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-center">Sign In</button>
        `}
      </div>
    </div>
  </nav>
  `;

  // menu toggle
  const menuBtn = qs('#mobile-menu-button');
  const menu = qs('#mobile-menu');
  bindSafe(menuBtn, 'click', () => menu.classList.toggle('hidden'));

  // close on navigation
  qsa('#mobile-menu a').forEach(a => {
    a.addEventListener('click', () => menu.classList.add('hidden'));
  });

  // auth
  const signinBtn = qs('#signin-btn');
  const mobileSigninBtn = qs('#mobile-signin-btn');
  // Prefer dedicated auth page (cleaner redirect + better UX), keep modal available for legacy flows.
  bindSafe(signinBtn, 'click', () => {
    setReturnUrl(window.location.href);
    window.location.href = `auth.html?msg=signin&return=${encodeURIComponent(window.location.href)}`;
  });
  bindSafe(mobileSigninBtn, 'click', () => {
    setReturnUrl(window.location.href);
    menu.classList.add('hidden');
    window.location.href = `auth.html?msg=signin&return=${encodeURIComponent(window.location.href)}`;
  });

  const signoutBtn = qs('#signout-btn');
  const mobileSignoutBtn = qs('#mobile-signout-btn');
  const doSignout = () => { signOut(); toast('Signed out', 'info'); window.location.reload(); };
  bindSafe(signoutBtn, 'click', doSignout);
  bindSafe(mobileSignoutBtn, 'click', () => { menu.classList.add('hidden'); doSignout(); });
}

export function renderFooter() {
  const mount = qs('#site-footer');
  if (!mount) return;
  const year = new Date().getFullYear();
  mount.innerHTML = `
    <footer class="mt-16 border-t border-slate-200 bg-white">
      <div class="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center gap-3 mb-3">
            <span class="bg-slate-900 text-white p-2 rounded-full"><i class="fa-solid fa-bus"></i></span>
            <span class="text-xl font-bold text-slate-900">Anthola</span>
          </div>
          <p class="text-slate-600 text-sm">Smart, fast, and reliable bus booking. Seats update live. Pay securely. Travel confidently.</p>
        </div>
        <div>
          <h3 class="font-semibold text-slate-900 mb-3">Explore</h3>
          <ul class="text-slate-600 text-sm space-y-2">
            <li><a class="hover:text-orange-600" href="destinations.html">Destinations</a></li>
            <li><a class="hover:text-orange-600" href="book.html">Book Now</a></li>
            <li><a class="hover:text-orange-600" href="features.html">Features</a></li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold text-slate-900 mb-3">Support</h3>
          <ul class="text-slate-600 text-sm space-y-2">
            <li><a class="hover:text-orange-600" href="contact.html">Contact</a></li>
            <li><a class="hover:text-orange-600" href="contact.html#faq">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold text-slate-900 mb-3">Legal</h3>
          <p class="text-slate-600 text-sm">Demo UI only. Use a real backend for payments and authentication.</p>
        </div>
      </div>
      <div class="border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-6 py-4 text-sm text-slate-500 flex flex-col md:flex-row gap-2 md:justify-between">
          <span>© ${year} Anthola</span>
          <span>Built with Tailwind + modular JS</span>
        </div>
      </div>
    </footer>
  `;
}

export function renderAuthModal() {
  const mount = qs('#auth-root');
  if (!mount) return;
  mount.innerHTML = `
  <div id="auth-modal" class="hidden fixed inset-0 z-[999]">
    <div class="absolute inset-0 bg-black/50" data-close="1"></div>
    <div class="relative mx-auto max-w-lg p-6">
      <div class="glass bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">Sign in</h2>
            <p class="text-slate-600 text-sm">Use backend auth (JWT). Seeded owner: <b>owner / owner123</b>.</p>
          </div>
          <button class="p-2 rounded-xl hover:bg-slate-100" aria-label="Close" data-close="1">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="mt-5">
          <div class="inline-flex rounded-xl bg-slate-100 p-1">
            <button id="tab-signin" class="px-4 py-2 rounded-xl text-sm font-semibold bg-white shadow">Sign In</button>
            <button id="tab-signup" class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700">Sign Up</button>
          </div>

          <form id="signin-form" class="mt-4 space-y-3">
            <input class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-200" id="si-username" placeholder="Username" required />
            <input class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-200" id="si-password" type="password" placeholder="Password" required />
            <button class="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl">Login</button>
          </form>

          <form id="signup-form" class="hidden mt-4 space-y-3">
            <input class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-200" id="su-phone" placeholder="Phone" required />
            <div class="grid grid-cols-2 gap-2">
              <label class="px-3 py-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 text-sm font-semibold flex items-center gap-2">
                <input type="radio" name="su-role" value="customer" checked />
                Customer
              </label>
              <label class="px-3 py-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 text-sm font-semibold flex items-center gap-2">
                <input type="radio" name="su-role" value="owner" />
                Bus Owner
              </label>
            </div>
            <input class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-200" id="su-username" placeholder="Username" required />
            <input class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-200" id="su-email" type="email" placeholder="Email" required />
            <input class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-200" id="su-password" type="password" placeholder="Password" required />
            <input class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-200" id="su-password2" type="password" placeholder="Confirm password" required />
            <button class="w-full bg-slate-900 hover:bg-slate-950 text-white font-semibold py-3 rounded-xl">Create account</button>
          </form>
        </div>
      </div>
    </div>
  </div>
  `;

  // close handlers
  const closeAll = () => closeDialog('auth-modal');
  qsa('#auth-modal [data-close="1"]').forEach(el => el.addEventListener('click', closeAll));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
