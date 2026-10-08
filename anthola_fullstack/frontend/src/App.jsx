import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Button, ButtonGroup } from '@heroui/react';
import { api, apiDownload, clearTokens } from './lib/api';
import { useAuth } from './store/auth';
import { useTheme, THEMES } from './lib/theme';
import { getApiBaseUrl, getSocketUrl } from './lib/config';
import LandingMvp from './components/LandingMvp';
import gsap from 'gsap';


function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const base = getApiBaseUrl().replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function money(value) {
  return `NPR ${Number(value || 0).toLocaleString()}`;
}

const featuredDestinations = [
  { name: 'Kathmandu', subtitle: 'Temple streets, mountain air, and late-night cafés', accent: 'from-sky-500/20 to-cyan-400/10' },
  { name: 'Pokhara', subtitle: 'Lake views, sunrise escapes, and boutique stays', accent: 'from-emerald-500/20 to-teal-400/10' },
  { name: 'Chitwan', subtitle: 'Wildlife adventures and warm riverfront hospitality', accent: 'from-amber-500/20 to-orange-400/10' },
];

const testimonials = [
  { quote: 'The booking flow feels calm, fast, and premium from first tap to final ticket.', author: 'Anita K.', role: 'Frequent traveler' },
  { quote: 'I can manage routes and payments without jumping between tools.', author: 'Sanjay B.', role: 'Bus owner' },
];

function landingPath(role) {
  return role === 'BUS_OWNER' ? '/dashboard' : '/booking';
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
}

function useSocket(user) {
  useEffect(() => {
    if (!user) return undefined;
    const socket = io(import.meta.env.VITE_SOCKET_URL || '', { transports: ['websocket'] });
    socket.emit('authenticate', { userId: user.id, role: user.role });
    socket.on('notification:new', (item) => {
      toast(item?.title ? `${item.title}: ${item.message}` : 'New notification');
    });
    return () => socket.close();
  }, [user]);
}

function useNotifications(enabled = false) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api('/api/notifications')).notifications || [],
    staleTime: 10_000,
    enabled
  });
}

function Shell({ children }) {
  const auth = useAuth();
  const nav = useNavigate();
  const { data: notificationData } = useNotifications(!!auth.user && !!auth.token);
  const notifications = notificationData || [];
  const [moreOpen, setMoreOpen] = useState(false);

  useSocket(auth.user);

  async function doLogout() {
    clearTokens();
    auth.logout();
    nav('/');
  }

  return (
    <div className="app-shell flex flex-col min-h-screen text-slate-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="subtle-line absolute inset-x-0 top-0 h-px opacity-70" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="brand-mark grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-400 to-amber-400 font-black text-slate-950">N</div>
            <div>
              <div className="font-black tracking-wide text-white">Anthola</div>
              <div className="text-xs text-slate-400">Passenger and bus owner platform</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 lg:flex">
            <Link className="nav-link rounded-full px-3.5 py-2 text-sm font-medium" to="/">Home</Link>
            <Link className="nav-link rounded-full px-3.5 py-2 text-sm font-medium" to="/booking">Search</Link>
            <Link className="nav-link rounded-full px-3.5 py-2 text-sm font-medium" to="/tours">Tours</Link>
            {auth.user?.role === 'BUS_OWNER' && <Link className="nav-link rounded-full px-3.5 py-2 text-sm font-medium" to="/dashboard">Dashboard</Link>}
            {auth.user && <Link className="nav-link rounded-full px-3.5 py-2 text-sm font-medium" to="/profile">Profile</Link>}

            {/* Dropdown menu for secondary links (Issue 11) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen(!moreOpen)}
                className="nav-link flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium"
                aria-expanded={moreOpen}
              >
                <span>More</span>
                <svg className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {moreOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50"
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  <a className="block rounded-xl px-3.5 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" href="/#amenities" onClick={() => setMoreOpen(false)}>Fleet Amenities</a>
                  <a className="block rounded-xl px-3.5 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" href="/#story" onClick={() => setMoreOpen(false)}>Our Story</a>
                  <a className="block rounded-xl px-3.5 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" href="/#charter" onClick={() => setMoreOpen(false)}>Private Charters</a>
                  <Link className="block rounded-xl px-3.5 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" to="/booking" onClick={() => setMoreOpen(false)}>Track Bus</Link>
                  <Link className="block rounded-xl px-3.5 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" to="/auth" onClick={() => setMoreOpen(false)}>Become Partner</Link>
                  <a className="block rounded-xl px-3.5 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" href="mailto:support@anthola.com" onClick={() => setMoreOpen(false)}>Support</a>
                </div>
              )}
            </div>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/booking" className="hidden rounded-full border border-sky-400/20 bg-sky-400/10 px-3.5 py-2 text-sm font-semibold text-sky-100 sm:inline-flex">Quick Book</Link>
            {auth.user ? (
              <>
                <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 md:inline-flex">
                  {auth.user.name || auth.user.companyName || auth.user.email}
                </div>
                <Link to="/profile" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
                  {(auth.user.name || auth.user.companyName || auth.user.email || 'A').charAt(0).toUpperCase()}
                </Link>
                <button onClick={doLogout} className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold">Logout</button>
              </>
            ) : (
              <Link className="btn-primary rounded-full px-4 py-2 text-sm font-semibold" to="/auth">Log in / Register</Link>
            )}
          </div>
        </div>
      </header>
      <main className="app-main flex-1">
        {notifications.length ? (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
            <div className="surface rounded-3xl p-4 text-sm text-slate-200">
              <div className="mb-2 font-bold text-white">Recent notifications</div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {notifications.slice(0, 3).map((item) => (
                  <div key={item._id || item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-slate-300">{item.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        {children}
      </main>
      <footer className="mt-16 border-t border-white/10 bg-slate-950/60 py-8 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="brand-mark grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 via-sky-400 to-amber-400 font-black text-xs text-slate-950">N</div>
            <p className="text-sm text-slate-400">© 2026 Anthola Tours & Travels. All rights reserved.</p>
          </div>
          {/* Developer / theme controls relocated to footer (Issue 12) */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Theme:</span>
            <ThemeSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}

function ThemeSwitcher() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  // Filter out developer environment preview themes (staging) for public users (Issue 5)
  const publicThemes = THEMES.filter((t) => t !== 'staging');

  return (
    <ButtonGroup size="sm" variant="flat" radius="full" className="hidden sm:flex" aria-label="Theme">
      {publicThemes.map((t) => (
        <Button
          key={t}
          size="sm"
          variant={theme === t ? 'solid' : 'flat'}
          color={theme === t ? 'primary' : 'default'}
          onPress={() => setTheme(t)}
          className="capitalize font-medium"
        >
          {t}
        </Button>
      ))}
    </ButtonGroup>
  );
}

function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const elements = heroRef.current?.querySelectorAll('[data-hero-reveal]');
    if (!elements?.length) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo(elements, { opacity: 0, y: 22 }, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out'
      });
    }, heroRef);
    return () => context.revert();
  }, []);

  return (
    <section ref={heroRef} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div data-hero-reveal className="section-kicker inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2">
            Premium travel booking for Nepal routes, verified payments, and real-time seat updates
          </div>
          <h1 data-hero-reveal className="display-serif max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Book buses and tours with confidence.
          </h1>
          <p data-hero-reveal className="max-w-2xl text-lg leading-8 text-slate-300">
            Discover routes, reserve seats in seconds, upload payment proof, and track every trip from one calm, premium experience.
          </p>
          <div data-hero-reveal className="flex flex-wrap gap-3">
            <Link to="/booking" className="btn-primary rounded-full px-6 py-3 font-semibold">Search buses</Link>
            <Link to="/tours" className="btn-secondary rounded-full px-6 py-3 font-semibold">Browse tours</Link>
          </div>
        </div>

        {/* Hero right side container with self-start to eliminate dead space (Issue 8) */}
        <div data-hero-reveal className="surface self-start rounded-3xl p-6 shadow-glow">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-sky-300">Next trip</div>
                <div className="text-xl font-black text-white">Kathmandu → Pokhara</div>
              </div>
              {/* Improved padding and live indicator badge (Issue 10) */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <span>Live</span>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                ['Route', 'Express service · 7 hrs'],
                ['Seats', '14 left'],
                ['Payment', 'eSewa / Khalti / Fonepay']
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <div className="text-slate-400">{label}</div>
                  <div className="mt-1 font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div data-hero-reveal className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 shadow-glow">
        <Suspense fallback={<div className="journey-fallback journey-loading">Loading visual journey...</div>}>
          <JourneyScene />
        </Suspense>
      </div>

      {/* Hero feature cards moved to full-width row aligned with grid baseline (Issue 9) */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ['Live booking', 'Updated seat visibility'],
          ['Verified payments', 'Owner review workflow'],
          ['Trusted journeys', 'Passenger and owner tools']
        ].map(([title, desc]) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-xl">
            <div className="font-semibold text-white">{title}</div>
            <div className="mt-1 text-sm text-slate-400">{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingPage() {
  const searchRef = useRef(null);
  const { data: routesData } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api('/api/routes')).routes || [],
    staleTime: 30_000
  });
  const { data: toursData } = useQuery({
    queryKey: ['tours'],
    queryFn: async () => (await api('/api/tours')).packages || [],
    staleTime: 30_000
  });
  const routes = routesData || [];
  const tours = toursData || [];
  const [search, setSearch] = useState({ from: '', to: '', date: new Date().toISOString().slice(0, 10), passengers: 1 });

  const suggestionRoutes = useMemo(() => {
    const q = `${search.from} ${search.to}`.trim().toLowerCase();
    if (!q) return routes.slice(0, 4);
    return routes.filter((route) => `${route.from} ${route.to}`.toLowerCase().includes(q)).slice(0, 4);
  }, [routes, search.from, search.to]);

  const trustStats = [
    { label: 'Verified operators', value: `${Math.max(8, routes.length || 8)}+` },
    { label: 'Live seat updates', value: '24/7' },
    { label: 'Payment proof review', value: 'Secure' },
    { label: 'Happy travelers', value: '4.9/5' }
  ];

  const featuredOperators = useMemo(() => {
    const byName = new Map();
    routes.forEach((route) => {
      if (!route.busName) return;
      if (!byName.has(route.busName)) {
        byName.set(route.busName, {
          name: route.busName,
          type: route.busType || 'Express',
          route: `${route.from} → ${route.to}`,
          price: route.price
        });
      }
    });
    return Array.from(byName.values()).slice(0, 4);
  }, [routes]);

  return (
    <Shell>
      <Hero />
      {/* Search Section */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:pb-14">
        {/* Standardized container border radius (Issue 1) */}
        <div ref={searchRef} className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-glow backdrop-blur-xl lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="section-kicker">Smart search</div>
              <h2 className="mt-2 text-2xl font-black text-white">Find your next trip in seconds</h2>
            </div>
            <div className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3.5 py-1.5 text-sm text-sky-200">Live route suggestions · instant seat visibility</div>
          </div>

          {/* Equalized From and To field widths (Issue 3) */}
          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_0.8fr_auto]">
            <input className="field w-full" placeholder="From" value={search.from} onChange={(e) => setSearch({ ...search, from: e.target.value })} onFocus={() => gsap.to(searchRef.current, { borderColor: 'rgba(56, 189, 248, 0.42)', duration: 0.25 })} aria-label="Origin city" />
            <input className="field w-full" placeholder="To" value={search.to} onChange={(e) => setSearch({ ...search, to: e.target.value })} onFocus={() => gsap.to(searchRef.current, { borderColor: 'rgba(56, 189, 248, 0.42)', duration: 0.25 })} aria-label="Destination city" />
            <input className="field w-full" type="date" value={search.date} onChange={(e) => setSearch({ ...search, date: e.target.value })} aria-label="Departure date" />
            <select className="field w-full" value={search.passengers} onChange={(e) => setSearch({ ...search, passengers: Number(e.target.value) })} aria-label="Number of passengers">
              <option value={1}>1 traveler</option>
              <option value={2}>2 travelers</option>
              <option value={3}>3 travelers</option>
              <option value={4}>4 travelers</option>
            </select>
            {/* Expanded Search button prominence & touch target (Issue 13) */}
            <Link
              to={search.from || search.to ? `/booking?routeId=${encodeURIComponent(suggestionRoutes[0]?.routeId || '')}` : '/booking'}
              className="btn-primary flex items-center justify-center gap-2 rounded-2xl px-8 py-3 font-bold text-center w-full lg:w-auto shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </Link>
          </div>

          {/* Equal-width grid for informational cards below search bar (Issue 4 & Issue 5) */}
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Popular route suggestions</div>
              {suggestionRoutes.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestionRoutes.map((route) => (
                    <Link key={route.routeId} to={`/booking?routeId=${encodeURIComponent(route.routeId)}`} className="rounded-full border border-white/10 bg-slate-900/70 px-3.5 py-1.5 text-xs text-slate-200 hover:border-sky-400/40 hover:text-white transition">
                      {route.from} → {route.to}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-400">Live route data will appear here once routes are published by bus owners.</div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Quick booking tips</div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">• Select your travel date early for guaranteed window seats</li>
                <li className="flex items-center gap-2">• Digital payment proof (eSewa / Khalti) enables fast verification</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="grid gap-3 md:grid-cols-4">
          {trustStats.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-xl">
              <div className="text-sm text-slate-400">{item.label}</div>
              <div className="mt-2 text-xl font-black text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card title="Quick booking shortcuts">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Reserve in seconds', '/booking', 'Pick a route and lock seats fast'],
                ['Tour packages', '/tours', 'Plan weekend escapes with one tap'],
                ['Owner portal', '/dashboard', 'Manage routes, bookings, and payments']
              ].map(([title, href, desc]) => (
                <Link key={title} to={href} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 hover:border-sky-400/40 transition">
                  <div className="font-semibold text-white">{title}</div>
                  <div className="mt-1 text-sm text-slate-400">{desc}</div>
                </Link>
              ))}
            </div>
          </Card>
          
          {/* Featured operators with fallback state (Issue 2) */}
          <Card title="Featured operators">
            <div className="grid gap-3">
              {featuredOperators.length ? featuredOperators.map((operator) => (
                <div key={operator.name} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{operator.name}</div>
                      <div className="text-sm text-slate-400">{operator.type} · {operator.route}</div>
                    </div>
                    <div className="text-amber-300 font-bold">{money(operator.price)}</div>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl">
                  <svg className="w-8 h-8 mb-2 text-slate-500 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <p className="text-sm font-medium text-slate-300">New operators joining soon</p>
                  <p className="text-xs text-slate-500">Check back shortly for verified active schedules.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Relocated "Why Anthola feels premium" marketing section (Issue 4) */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-emerald-50 backdrop-blur-xl lg:p-8">
          <div className="section-kicker border-emerald-400/30 text-emerald-300">Platform guarantee</div>
          <h3 className="mt-2 text-2xl font-black text-white">Why Anthola feels premium from day one</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/40 p-4">
              <div className="font-bold text-white text-base">Clear Route Discovery</div>
              <p className="mt-1 text-sm text-emerald-100/80">Search routes across Nepal with zero hidden fees and instant seat layout preview.</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/40 p-4">
              <div className="font-bold text-white text-base">Live Seat Updates</div>
              <p className="mt-1 text-sm text-emerald-100/80">Real-time seat state synchronization ensures you lock exact seat numbers with zero collisions.</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/40 p-4">
              <div className="font-bold text-white text-base">Verified Payments</div>
              <p className="mt-1 text-sm text-emerald-100/80">Direct QR payment proof upload with bus owner review workflow for complete peace of mind.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="section-kicker">Popular destinations</div>
            <h2 className="mt-2 text-2xl font-black text-white">Travel the routes that feel unforgettable</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {featuredDestinations.map((item) => (
            <div key={item.name} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${item.accent} p-6`}>
              <div className="text-xl font-black text-white">{item.name}</div>
              <p className="mt-2 text-sm text-slate-300">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-2">
        {/* Live routes with fallback state (Issue 2) */}
        <Card title="Live routes">
          <div className="grid gap-3">
            {routes.length ? routes.slice(0, 4).map((route) => (
              <Link key={route.routeId} to={`/booking?routeId=${encodeURIComponent(route.routeId)}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 hover:border-sky-400/40 transition">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{route.from} → {route.to}</div>
                    <div className="text-sm text-slate-400">{route.duration} · {route.busName || 'Bus'} · {route.busType || 'Express'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-300">{money(route.price)}</div>
                    <div className="text-xs text-slate-500">Seats ready</div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl">
                <svg className="w-8 h-8 mb-2 text-slate-500 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-sm font-medium text-slate-300">No active live routes</p>
                <p className="text-xs text-slate-500">Routes will display here once published.</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Featured tours">
          <div className="grid gap-3">
            {tours.length ? tours.slice(0, 4).map((pkg) => (
              <Link key={pkg.packageId} to={`/tours?packageId=${encodeURIComponent(pkg.packageId)}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 hover:border-amber-400/40 transition">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{pkg.title}</div>
                    <div className="text-sm text-slate-400">{pkg.destination} · {pkg.durationDays}D/{pkg.durationNights}N</div>
                  </div>
                  <div className="font-bold text-sky-300">{money(pkg.price)}</div>
                </div>
              </Link>
            )) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl">
                <p className="text-sm font-medium text-slate-300">Tour packages coming soon</p>
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Feature items enhanced with icons and chevron affordances (Issue 6 & Issue 7) */}
          <Card title="Why Anthola">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Premium seat selection', path: '/booking', icon: 'M5 13l4 4L19 7' },
                { label: 'Secure payments', path: '/booking', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                { label: 'Live route visibility', path: '/booking', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                { label: 'Owner analytics', path: '/dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
              ].map(({ label, path, icon }) => (
                <Link
                  key={label}
                  to={path}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 hover:border-sky-400/40 hover:text-white transition"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                    </svg>
                    <span>{label}</span>
                  </div>
                  <svg className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-white transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Traveler stories">
            <div className="grid gap-3">
              {testimonials.map((item) => (
                <div key={item.author} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-slate-200">“{item.quote}”</p>
                  <div className="mt-2 text-sm font-semibold text-white">{item.author}</div>
                  <div className="text-sm text-slate-400">{item.role}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Fleet Amenities & Comfort Section */}
      <section id="amenities" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl lg:p-10">
          <div className="text-center">
            <div className="section-kicker border-amber-400/30 text-amber-300">Onboard Excellence</div>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Fleet Amenities & Comfort</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">Every Anthola coach is crafted to deliver a quiet, high-hospitality journey through Nepal's most picturesque highways.</p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Ergonomic Reclining Seats',
                desc: '140° deep recline leather seating with extended leg rests and memory foam cushioning.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                ),
                color: 'text-amber-400 border-amber-400/20 bg-amber-400/10'
              },
              {
                title: 'High-Speed Wi-Fi',
                desc: 'Uninterrupted Starlink satellite internet connectivity on all major intercity routes.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                ),
                color: 'text-sky-400 border-sky-400/20 bg-sky-400/10'
              },
              {
                title: 'USB & AC Power Outlets',
                desc: 'Dedicated dual USB ports and 220V AC charging outlets at every individual seat.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                ),
                color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10'
              },
              {
                title: 'Multi-Zone Climate Control',
                desc: 'Whisper-quiet HVAC air purification system keeping ambient cabin temperature perfect year-round.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m-9-9h18m-4.5-4.5l-9 9m9 0l-9-9" />
                ),
                color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10'
              },
              {
                title: 'Complimentary Refreshments',
                desc: 'Cold Himalayan bottled water, organic tea & coffee service, and fresh gourmet snack bites.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 13C10.895 21 10 20.105 10 19c0-.643.305-1.213.78-1.571L12 16.5l1.22 1.929c.475.358.78.928.78 1.571 0 1.105-.895 2-2 2z" />
                ),
                color: 'text-rose-400 border-rose-400/20 bg-rose-400/10'
              },
              {
                title: 'Advanced Safety Suite',
                desc: 'Real-time GPS tracking, speed governors, dual-driver shift policy, and emergency SOS integration.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                ),
                color: 'text-purple-400 border-purple-400/20 bg-purple-400/10'
              }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 transition hover:border-white/20">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${item.color}`}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    {item.icon}
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Story / About Section */}
      <section id="story" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <div className="section-kicker">Our Heritage & Promise</div>
            <h2 className="display-serif text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Redefining Express Intercity Coach Travel in Nepal.
            </h2>
            <p className="text-base leading-8 text-slate-300">
              Anthola was founded with a singular commitment: to elevate long-distance highway journeys into serene, luxurious travel experiences. By pairing verified bus operators with transparent seat booking technology, we ensure every trip between Kathmandu, Pokhara, Chitwan, and beyond feels smooth, safe, and premium.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-black text-amber-400">99.8%</div>
                <div className="mt-1 text-sm font-semibold text-white">On-Time Departures</div>
                <div className="text-xs text-slate-400">Punctual scheduling across all express routes</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-black text-sky-400">100%</div>
                <div className="mt-1 text-sm font-semibold text-white">Verified Operators</div>
                <div className="text-xs text-slate-400">Direct owner review & safety compliance</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-sky-500/10 p-6 shadow-2xl">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">Interior Luxury</div>
                <div className="mt-2 text-xl font-bold text-white">Private & Calm Cabin</div>
                <p className="mt-2 text-sm text-slate-300">Noise-insulated cabins with personal reading lamps and climate louvers for tranquil travel.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-sky-300">Instant Seat Visibility</div>
                <div className="mt-2 text-xl font-bold text-white">Choose Your Exact Seat</div>
                <p className="mt-2 text-sm text-slate-300">Interactive seat maps update in real-time to prevent double bookings.</p>
              </div>
            </div>
            <div className="space-y-4 sm:pt-8">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Direct Verification</div>
                <div className="mt-2 text-xl font-bold text-white">Digital Payment Upload</div>
                <p className="mt-2 text-sm text-slate-300">Upload eSewa, Khalti, or Fonepay QR payment receipts directly from your phone.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-6 shadow-2xl">
                <div className="text-xs font-semibold uppercase tracking-wider text-purple-300">Hospitality Standard</div>
                <div className="mt-2 text-xl font-bold text-white">Dedicated Crew</div>
                <p className="mt-2 text-sm text-slate-300">Professional drivers and stewards trained in passenger safety and hospitality.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Private Charter Booking Section */}
      <section id="charter" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="section-kicker border-sky-400/30 text-sky-300">Group & Corporate Travel</div>
              <h2 className="text-3xl font-black text-white sm:text-4xl">Private Charters & Custom Bookings</h2>
              <p className="leading-relaxed text-slate-300">
                Planning a corporate retreat, family tour, or private event across Nepal? Charter an Anthola luxury coach with custom departure times, dedicated drivers, and tailored onboard amenities.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Flexible origin & destination pickup anywhere in Nepal</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Dedicated group coordinator & custom beverage service</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Transparent group pricing with zero surprise charges</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Request a Charter Quote</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                toast.success('Charter inquiry received! Our travel team will contact you within 2 hours.');
              }} className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name">
                    <input className="field w-full" placeholder="Anita Shrestha" required />
                  </Field>
                  <Field label="Phone number">
                    <input className="field w-full" type="tel" placeholder="+977 9800000000" required />
                  </Field>
                </div>
                <Field label="Email address">
                  <input className="field w-full" type="email" placeholder="anita@example.com" required />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Preferred route">
                    <select className="field w-full">
                      <option>Kathmandu → Pokhara</option>
                      <option>Kathmandu → Chitwan</option>
                      <option>Pokhara → Chitwan</option>
                      <option>Custom Route / Tour</option>
                    </select>
                  </Field>
                  <Field label="Estimated travelers">
                    <input className="field w-full" type="number" min="5" max="50" defaultValue="15" required />
                  </Field>
                </div>
                <Field label="Special requirements or message">
                  <textarea className="field w-full h-20 resize-none" placeholder="Let us know your departure date, luggage preferences, or special requests..." />
                </Field>
                <button type="submit" className="btn-primary rounded-2xl py-3.5 font-bold w-full shadow-lg shadow-sky-500/20">
                  Submit Charter Request
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-sky-500/15 to-amber-500/10 p-8 text-center">
          <div className="section-kicker">Mobile-ready experience</div>
          <h2 className="mt-2 text-2xl font-black text-white">The same premium flow on phones, tablets, and desktops.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">Download the Anthola companion experience, manage your trip details, and keep every booking in one place.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/booking" className="btn-primary rounded-full px-5 py-3 font-semibold">Open booking flow</Link>
            <Link to="/dashboard" className="btn-secondary rounded-full px-5 py-3 font-semibold">View owner dashboard</Link>
            <a href="mailto:hello@anthola.com" className="btn-secondary rounded-full px-5 py-3 font-semibold">Contact support</a>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`surface rounded-2xl p-6 shadow-glow ${className}`}>
      <div className="mb-4 text-xl font-black text-white">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-200">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

let googleAuthInitialized = false;
let googlePromptInFlight = false;

function getGoogleOriginMessage(origin) {
  console.warn(`[OAuth Config] Google sign-in origin blocked for: ${origin}. Ensure ${origin} is added to Google OAuth authorized JavaScript origins.`);
  return 'Google sign-in is temporarily unavailable. Please log in with email and password below.';
}

function loadGoogleScript() {
  if (typeof window === 'undefined' || window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google sign-in library failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in library failed to load'));
    document.head.appendChild(script);
  });
}

function AuthPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('PASSENGER');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    ownerName: '',
    email: '',
    phone: '',
    panNumber: '',
    businessRegistrationNumber: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  async function continueWithGoogle() {
    if (googlePromptInFlight) return;
    googlePromptInFlight = true;
    setGoogleBusy(true);
    setError('');
    try {
      await loadGoogleScript();
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error('Google sign-in is not configured for this environment yet.');

      const origin = window.location.origin;
      const response = await new Promise((resolve, reject) => {
        if (!googleAuthInitialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (result) => resolve(result),
            auto_select: false,
            cancel_on_tap_outside: true
          });
          googleAuthInitialized = true;
        }

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            reject(new Error(getGoogleOriginMessage(origin)));
          } else if (notification.isSkippedMoment()) {
            reject(new Error(getGoogleOriginMessage(origin)));
          }
        });
      });

      if (!response?.credential) throw new Error('Google sign-in did not return a credential');

      const data = await api('/api/auth/google', {
        method: 'POST',
        auth: false,
        body: { idToken: response.credential, role }
      });

      auth.login(data.token, data.user);
      nav(landingPath(data.user?.role));
    } catch (err) {
      const message = err.message || 'Google sign-in failed';
      const friendlyMessage = message.includes('backend is currently unavailable')
        ? 'The backend is unreachable right now. Start the API server on port 5000 and try again.'
        : message;
      setError(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      googlePromptInFlight = false;
      setGoogleBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') {
        if (!form.email || !form.password) {
          throw new Error('Email and password are required');
        }
        const data = await api('/api/auth/login', {
          method: 'POST',
          auth: false,
          body: { email: form.email, password: form.password }
        });
        auth.login(data.token, data.user);
        nav(landingPath(data.user?.role));
        return;
      }

      if (!form.email || !form.password) {
        throw new Error('Email and password are required');
      }
      if (form.password !== form.confirmPassword) {
        throw new Error('Passwords must match');
      }

      const payload = role === 'BUS_OWNER'
        ? {
            role,
            companyName: form.companyName,
            ownerName: form.ownerName,
            email: form.email,
            phone: form.phone,
            panNumber: form.panNumber,
            businessRegistrationNumber: form.businessRegistrationNumber,
            address: form.address,
            password: form.password
          }
        : {
            role,
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            password: form.password
          };

      const data = await api('/api/auth/signup', { method: 'POST', auth: false, body: payload });
      auth.login(data.token, data.user);
      nav(landingPath(data.user?.role));
    } catch (err) {
      const message = err.message || 'Something went wrong';
      const friendlyMessage = message.includes('backend is currently unavailable')
        ? 'The backend is unreachable right now. Start the API server on port 5000 and try again.'
        : message;
      setError(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="auth-mvp mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="auth-mvp-intro space-y-4">
          <div className="section-kicker">Anthola Travels / Access</div>
          <h1 className="display-serif text-4xl font-black text-white sm:text-5xl">Your next road starts here.</h1>
          <p className="max-w-xl leading-8 text-slate-300">
            One authentication portal. The system redirects passengers to booking and bus owners to the operator dashboard automatically.
          </p>
          {/* Static informational cards without false button affordance (Issue 6) */}
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            {[
              ['Email & Password', 'Secure authentication with password reset via email'],
              ['Role aware', 'Passenger and bus owner experiences are separated by design']
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <svg className="h-4 w-4 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{title}</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">{desc}</div>
              </div>
            ))}
          </div>
        </div>
        <Card className="auth-form-panel" title={mode === 'login' ? 'Log in' : 'Register'}>
          <form onSubmit={submit} className="grid gap-3">
            {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
            
            {/* Enlarged, accessible segmented role radio selection (Issue 4) */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3.5">
              <div className="mb-2.5 text-sm font-semibold text-white">
                {mode === 'register' ? 'Register as' : 'I am a'}
              </div>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account role">
                <label className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border p-3 text-sm font-semibold transition ${
                  role === 'PASSENGER'
                    ? 'border-sky-400/60 bg-sky-400/15 text-white shadow-sm ring-1 ring-sky-400/40'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'PASSENGER'}
                    onChange={() => setRole('PASSENGER')}
                    className="h-4 w-4 accent-sky-400"
                  />
                  <span>Passenger</span>
                </label>

                <label className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border p-3 text-sm font-semibold transition ${
                  role === 'BUS_OWNER'
                    ? 'border-sky-400/60 bg-sky-400/15 text-white shadow-sm ring-1 ring-sky-400/40'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'BUS_OWNER'}
                    onChange={() => setRole('BUS_OWNER')}
                    className="h-4 w-4 accent-sky-400"
                  />
                  <span>Bus Owner</span>
                </label>
              </div>
            </div>

            {/* Standard Google brand button with white bg, dark text, & Google SVG logo (Issue 1) */}
            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={googleBusy || busy}
              className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.41l3.99-3.14z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.59l3.99 3.14c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>{googleBusy ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
            
            <div className="text-center text-xs uppercase tracking-[0.25em] text-slate-500">or continue with email</div>

            {/* Input fields wrapped in Field with persistent labels for Issue 4 */}
            {mode === 'register' && role === 'PASSENGER' && (
              <Field label="Full name">
                <input className="field w-full" placeholder="Enter your full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </Field>
            )}
            {mode === 'register' && role === 'BUS_OWNER' && (
              <>
                <Field label="Company name">
                  <input className="field w-full" placeholder="Enter company name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                </Field>
                <Field label="Owner name">
                  <input className="field w-full" placeholder="Enter owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                </Field>
                <Field label="PAN number">
                  <input className="field w-full" placeholder="Enter PAN number" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
                </Field>
                <Field label="Business registration number">
                  <input className="field w-full" placeholder="Enter registration number" value={form.businessRegistrationNumber} onChange={(e) => setForm({ ...form, businessRegistrationNumber: e.target.value })} />
                </Field>
                <Field label="Address">
                  <input className="field w-full" placeholder="Enter business address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Field>
              </>
            )}
            
            <Field label="Email">
              <input className="field w-full" type="email" placeholder="name@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            <Field label="Phone number">
              <input className="field w-full" type="tel" placeholder="Enter phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Password">
              <input className="field w-full" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </Field>
            {mode === 'register' && (
              <Field label="Confirm password">
                <input className="field w-full" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
              </Field>
            )}

            {/* Primary button CTA updated for Issue 1 */}
            <button disabled={busy} className="btn-primary rounded-2xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Please wait...' : (mode === 'login' ? 'Log in' : 'Create account')}
            </button>

            {mode === 'login' && (
              <button type="button" className="text-left text-sm text-sky-300" onClick={() => nav('/forgot-password')}>
                Forgot password?
              </button>
            )}
            <button type="button" className="text-left text-sm text-sky-300" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
            </button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}

function ForgotPasswordPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/api/auth/forgot-password', {
        method: 'POST',
        auth: false,
        body: { email }
      });
      setMessage(data.message || 'Password reset email sent. Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <Card title="Forgot Password">
          <form onSubmit={handleSubmit} className="grid gap-3">
            {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
            {message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
            <input
              className="field"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
            <button disabled={busy} className="btn-primary rounded-2xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Sending...' : 'Send reset link'}
            </button>
            <button type="button" className="text-left text-sm text-sky-300" onClick={() => nav('/auth')}>
              Back to login
            </button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}

function ResetPasswordPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) return setError('Invalid reset link');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        auth: false,
        body: { password, confirmPassword }
      });
      setMessage(data.message || 'Password reset successful');
      setTimeout(() => nav('/auth'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <Shell>
        <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
          <Card title="Invalid link">
            <p className="text-slate-300">The reset link is invalid or expired.</p>
            <button className="btn-secondary mt-4 rounded-2xl px-4 py-3 font-semibold" onClick={() => nav('/auth')}>
              Back to login
            </button>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <Card title="Reset Password">
          <form onSubmit={handleSubmit} className="grid gap-3">
            {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
            {message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
            <input
              className="field"
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
            />
            <input
              className="field"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={busy}
            />
            <button disabled={busy} className="btn-primary rounded-2xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}

function SeatGrid({ seatCount = 36, booked = [], locked = [], blocked = [], selected = [], onToggle, disabled }) {
  const seats = Array.from({ length: seatCount }, (_, i) => `S${String(i + 1).padStart(2, '0')}`);
  const bookedSet = new Set(booked);
  const lockedMap = new Map(locked.map((item) => [item.seat, item]));
  const blockedSet = new Set(blocked.map((item) => (typeof item === 'string' ? item : item.seat)));

  function seatKind() {
    return 'standard';
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="seat-shell rounded-[2rem] border border-white/10 bg-slate-950/60 p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <div className="font-semibold text-white">Premium seat map</div>
            <div className="text-sm text-slate-400">Driver position · reserved seats · selected seats</div>
          </div>
          <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">Driver cabin</div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-4">
          <div className="mb-4 flex h-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/70 text-sm font-semibold text-slate-300">Front of bus</div>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {seats.map((seat) => {
              const isBooked = bookedSet.has(seat);
              const lock = lockedMap.get(seat);
              const isMine = lock?.mine;
              const isBlocked = blockedSet.has(seat);
              const isSelected = selected.includes(seat);
              const kind = seatKind(seat);
              let cls = 'seat-cell standard';
              if (isBooked) cls = 'seat-cell booked';
              else if (isBlocked) cls = 'seat-cell blocked';
              else if (lock) cls = isMine ? 'seat-cell locked' : 'seat-cell blocked';
              else if (isSelected) cls = 'seat-cell selected';

              return (
                <button
                  key={seat}
                  disabled={disabled || isBooked || isBlocked || (lock && !isMine)}
                  onClick={() => onToggle(seat)}
                  className={`${cls} ${disabled ? 'opacity-60' : ''}`}
                  title={isBlocked ? 'Blocked (external ticketing)' : undefined}
                >
                  <span>{seat}</span>
                  <small>Open</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
        <div className="font-semibold text-white">Seat legend</div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2"><span className="seat-swatch seat-swatch-selected" /> Selected</div>
          <div className="flex items-center gap-2"><span className="seat-swatch seat-swatch-standard" /> Available</div>
          <div className="flex items-center gap-2"><span className="seat-swatch seat-swatch-booked" /> Booked / unavailable</div>
        </div>
      </div>
    </div>
  );
}

function BookingProgress({ routeSelected, seatsSelected, bookingCreated }) {
  const steps = [
    { title: 'Route', done: routeSelected, label: 'Choose departure' },
    { title: 'Seats', done: seatsSelected, label: 'Lock your seats' },
    { title: 'Payment', done: bookingCreated, label: 'Upload proof' },
    { title: 'Ticket', done: bookingCreated, label: 'Ready for review' }
  ];

  return (
    <div className="mb-4 rounded-[1.4rem] border border-white/10 bg-slate-950/70 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-white">Booking progress</div>
          <div className="text-sm text-slate-400">A calm, guided path from route selection to verification</div>
        </div>
        <div className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm text-sky-100">
          {steps.filter((step) => step.done).length}/{steps.length} complete
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className={`rounded-2xl border p-3 ${step.done ? 'border-emerald-400/20 bg-emerald-400/10' : 'border-white/10 bg-white/5'}`}>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Step {index + 1}</div>
            <div className="mt-1 font-semibold text-white">{step.title}</div>
            <div className={`mt-1 text-sm ${step.done ? 'text-emerald-100' : 'text-slate-400'}`}>{step.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PassengerPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    date: new Date().toISOString().slice(0, 10)
  });
  const [routeId, setRouteId] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [booking, setBooking] = useState(null);
  const [bookingPhase, setBookingPhase] = useState('route');
  const [tourId, setTourId] = useState('');
  const [tourForm, setTourForm] = useState({ travelDate: new Date().toISOString().slice(0, 10), travelers: 1 });

  useEffect(() => {
    const initialRoute = searchParams.get('routeId');
    if (initialRoute) setRouteId(initialRoute);
  }, [searchParams]);

  useEffect(() => {
    setSelectedSeats([]);
  }, [routeId, filters.date]);

  const { data: routesData } = useQuery({
    queryKey: ['routes', filters.from, filters.to],
    queryFn: async () => {
      const data = await api('/api/routes');
      return (data.routes || []).filter((route) => {
        const fromMatch = !filters.from || route.from.toLowerCase().includes(filters.from.toLowerCase());
        const toMatch = !filters.to || route.to.toLowerCase().includes(filters.to.toLowerCase());
        return fromMatch && toMatch;
      });
    }
  });

  const { data: toursData } = useQuery({
    queryKey: ['tours', 'passenger'],
    queryFn: async () => (await api('/api/tours')).packages || []
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => (await api('/api/bookings/me')).bookings || [],
    enabled: !!auth.user
  });

  const selectedRoute = (routesData || []).find((route) => route.routeId === routeId);
  const canBook = auth.user?.role === 'PASSENGER';

  const seatStateKey = ['seat-state', routeId, filters.date];
  const seatQuery = useQuery({
    queryKey: seatStateKey,
    queryFn: async () => api(`/api/seats/state?routeId=${encodeURIComponent(routeId)}&date=${encodeURIComponent(filters.date)}`),
    enabled: !!routeId && !!filters.date && !!auth.token
  });

  // Live seat updates: join the route/date room and refresh on seat events.
  useEffect(() => {
    if (!routeId || !filters.date) return undefined;
    const socket = io(getSocketUrl() || window.location.origin, { transports: ['websocket'] });
    const room = `${routeId}|${filters.date}`;
    socket.emit('join', room);
    const refresh = () => qc.invalidateQueries({ queryKey: seatStateKey });
    socket.on('seat:booked', refresh);
    socket.on('seat:locked', refresh);
    socket.on('seat:unlocked', refresh);
    socket.on('seat:blocked', refresh);
    socket.on('seat:unblocked', refresh);
    return () => {
      socket.close();
    };
  }, [routeId, filters.date, qc]);

  const createBookingMutation = useMutation({
    mutationFn: (payload) => api('/api/bookings', { method: 'POST', body: payload }),
    onSuccess: async (data) => {
      setBooking(data.booking);
      toast.success('Booking created. Upload payment proof next.');
      await qc.invalidateQueries({ queryKey: ['seat-state', routeId, filters.date] });
      await qc.invalidateQueries({ queryKey: ['my-bookings'] });
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const uploadPaymentMutation = useMutation({
    mutationFn: (payload) => api('/api/payments/upload', { method: 'POST', body: payload }),
    onSuccess: async () => {
      toast.success('Payment proof uploaded');
      await qc.invalidateQueries({ queryKey: ['my-bookings'] });
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const bookTourMutation = useMutation({
    mutationFn: (payload) => api('/api/tours/book', { method: 'POST', body: payload }),
    onSuccess: async (data) => {
      setBooking(data.booking);
      toast.success('Tour booking created');
      await qc.invalidateQueries({ queryKey: ['my-bookings'] });
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const searchRoutes = routesData || [];
  const tours = toursData || [];
  const bookings = bookingsData || [];
  const seatState = seatQuery.data || null;
  const upcomingTrips = bookings.filter((item) => item.bookingStatus !== 'CANCELLED' && item.bookingStatus !== 'REJECTED');
  const previousTrips = bookings.filter((item) => item.bookingStatus === 'COMPLETED' || item.bookingStatus === 'CONFIRMED');
  const cancelledTrips = bookings.filter((item) => item.bookingStatus === 'CANCELLED' || item.bookingStatus === 'REJECTED');
  const routePrice = selectedRoute ? Number(selectedRoute.price || 0) : 0;
  const routeDiscount = selectedRoute ? Number(selectedRoute.discountPercent || 0) : 0;
  const perSeat = Math.round(routePrice * (1 - routeDiscount / 100));
  const totalPrice = perSeat * selectedSeats.length;
  const busPhoto = selectedRoute?.busPhotoUrl ? assetUrl(selectedRoute.busPhotoUrl) : '';
  const bookingSteps = [
    { key: 'route', label: 'Route' },
    { key: 'seats', label: 'Seats' },
    { key: 'payment', label: 'Payment' }
  ];
  const currentPhaseIndex = bookingSteps.findIndex((step) => step.key === bookingPhase);

  async function toggleSeat(seat) {
    if (!canBook) return nav('/auth');
    if (!routeId || !filters.date) return toast.error('Choose a route and date first');
    const locked = selectedSeats.includes(seat);
    try {
      if (locked) {
        await api('/api/seats/unlock', { method: 'POST', body: { routeId, date: filters.date, seat } });
        setSelectedSeats((prev) => prev.filter((item) => item !== seat));
      } else {
        await api('/api/seats/lock', { method: 'POST', body: { routeId, date: filters.date, seat } });
        setSelectedSeats((prev) => [...prev, seat]);
      }
      await qc.invalidateQueries({ queryKey: ['seat-state', routeId, filters.date] });
    } catch (error) {
      toast.error(error.message);
      await qc.invalidateQueries({ queryKey: ['seat-state', routeId, filters.date] });
    }
  }

  async function submitBooking() {
    if (!routeId || !filters.date || !selectedSeats.length) {
      toast.error('Choose a route, date, and at least one seat');
      return;
    }
    createBookingMutation.mutate({
      routeId,
      date: filters.date,
      seats: selectedSeats
    });
  }

  async function uploadProof() {
    if (!booking) return toast.error('Create a booking first');
    const input = document.querySelector('#payment-proof-input');
    const file = input?.files?.[0];
    const provider = document.querySelector('#payment-provider').value;
    const paymentRef = document.querySelector('#payment-ref').value;
    if (!file) return toast.error('Choose a screenshot');
    uploadPaymentMutation.mutate({
      bookingId: booking._id,
      provider,
      paymentRef,
      proofImageBase64: await fileToDataUrl(file)
    });
  }

  async function bookTour() {
    if (!tourId) return toast.error('Choose a tour package');
    bookTourMutation.mutate({
      packageId: tourId,
      travelDate: tourForm.travelDate,
      travelers: Number(tourForm.travelers || 1)
    });
  }

  if (!auth.user) return <Navigate to="/auth" replace />;

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card title="Passenger booking flow">
            <BookingProgress routeSelected={!!routeId} seatsSelected={selectedSeats.length > 0} bookingCreated={!!booking} />
            <div className="mb-4 flex flex-wrap gap-2">
              {bookingSteps.map((step, index) => (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setBookingPhase(step.key)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${bookingPhase === step.key ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-300'}`}
                >
                  {index + 1}. {step.label}
                </button>
              ))}
            </div>

            {bookingPhase === 'route' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-sm text-sky-100">
                  <div className="font-semibold text-white">Phase 1 · Choose your route</div>
                  <div className="mt-1 text-sky-100/80">Start by picking a departure and destination that suits your trip.</div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <input className="field" placeholder="From" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
                  <input className="field" placeholder="To" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
                  <input className="field" type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
                </div>
                <div className="grid gap-3">
                  <select className="field" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
                    <option value="">Choose route</option>
                    {searchRoutes.map((route) => (
                      <option key={route.routeId} value={route.routeId}>
                        {route.from} → {route.to} · {money(route.price)}
                      </option>
                    ))}
                  </select>
                  {selectedRoute ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-lg font-bold text-white">{selectedRoute.busName || 'Bus'} · {selectedRoute.from} → {selectedRoute.to}</div>
                          <div className="text-sm text-slate-400">{selectedRoute.duration} · {selectedRoute.busType || 'Standard'}</div>
                          <div className="mt-1 text-sm font-semibold text-emerald-300">{money(routePrice)} {routeDiscount > 0 ? <span className="text-amber-300">(-{routeDiscount}% = {money(perSeat)}/seat)</span> : null}</div>
                        </div>
                        <div className="text-amber-300">{money(selectedRoute.price)}</div>
                      </div>
                      {busPhoto ? <img src={busPhoto} alt={`${selectedRoute.busName || 'Bus'}`} className="mt-3 h-40 w-full rounded-2xl object-cover" /> : null}
                    </div>
                  ) : null}
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setBookingPhase('seats')} className="btn-primary rounded-2xl px-4 py-3 font-semibold" disabled={!routeId}>
                    Continue to seats
                  </button>
                </div>
              </div>
            )}

            {bookingPhase === 'seats' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-sm text-sky-100">
                  <div className="font-semibold text-white">Phase 2 · Choose your seats</div>
                  <div className="mt-1 text-sky-100/80">Lock the seats you want and review the total before moving on.</div>
                </div>
                <div>
                  <SeatGrid
                    seatCount={seatState?.seatCount || 36}
                    booked={seatState?.booked || []}
                    locked={seatState?.locked || []}
                    blocked={seatState?.blocked || []}
                    selected={selectedSeats}
                    onToggle={toggleSeat}
                    disabled={!routeId || !filters.date}
                  />
                </div>
                {selectedSeats.length ? (
                  <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
                    <div className="font-semibold text-white">Seat plan ready</div>
                    <div className="mt-1">Selected {selectedSeats.length} seat(s) · {money(perSeat)}/seat · Total: <span className="font-bold">{money(totalPrice)}</span></div>
                  </div>
                ) : null}
                <div className="flex flex-wrap justify-between gap-3">
                  <button type="button" onClick={() => setBookingPhase('route')} className="btn-secondary rounded-2xl px-4 py-3 font-semibold">Back</button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setSelectedSeats([])} className="btn-secondary rounded-2xl px-4 py-3 font-semibold">Clear seats</button>
                    <button type="button" onClick={() => setBookingPhase('payment')} className="btn-primary rounded-2xl px-4 py-3 font-semibold" disabled={!selectedSeats.length}>
                      Continue to payment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {bookingPhase === 'payment' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-sm text-sky-100">
                  <div className="font-semibold text-white">Phase 3 · Pay and confirm</div>
                  <div className="mt-1 text-sky-100/80">Upload proof of payment and finalise your booking request.</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">Booking summary</div>
                      <div className="mt-1">{selectedRoute ? `${selectedRoute.from} → ${selectedRoute.to}` : 'Route pending'}</div>
                      <div>{selectedSeats.length ? `${selectedSeats.length} seat(s) selected` : 'No seats chosen yet'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-300">{money(totalPrice)}</div>
                      <div className="text-sm text-slate-400">{booking ? `Status: ${booking.bookingStatus}` : 'Pending review'}</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="text-sm font-semibold text-white">Payment proof</div>
                  <div className="mt-3 grid gap-3">
                    <select id="payment-provider" className="field">
                      <option>eSewa</option>
                      <option>Khalti</option>
                      <option>Fonepay</option>
                    </select>
                    <input id="payment-ref" className="field" placeholder="Payment ID / reference" />
                    <input id="payment-proof-input" type="file" accept="image/png,image/jpeg,image/webp" className="field" />
                  </div>
                </div>
                <div className="flex flex-wrap justify-between gap-3">
                  <button type="button" onClick={() => setBookingPhase('seats')} className="btn-secondary rounded-2xl px-4 py-3 font-semibold">Back</button>
                  <div className="flex gap-3">
                    <button type="button" onClick={submitBooking} className="btn-primary rounded-2xl px-4 py-3 font-semibold" disabled={!routeId || !selectedSeats.length}>
                      Create booking
                    </button>
                    <button type="button" onClick={uploadProof} className="btn-secondary rounded-2xl px-4 py-3 font-semibold" disabled={!booking}>
                      Upload proof
                    </button>
                  </div>
                </div>
                {booking ? (
                  <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
                    Booking ID: {booking.bookingId} · Status: {booking.bookingStatus}
                  </div>
                ) : null}
              </div>
            )}
          </Card>

          <div className="grid gap-6">
            <Card title="Payment verification">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                Secure proof upload keeps your booking pending until the owner verifies it.
              </div>
              <div className="mt-3 grid gap-3">
                <select id="payment-provider" className="field">
                  <option>eSewa</option>
                  <option>Khalti</option>
                  <option>Fonepay</option>
                </select>
                <input id="payment-ref" className="field" placeholder="Payment ID / reference" />
                <input id="payment-proof-input" type="file" accept="image/png,image/jpeg,image/webp" className="field" />
                <button onClick={uploadProof} className="btn-primary rounded-2xl px-4 py-3 font-semibold">Upload screenshot</button>
              </div>
            </Card>

            <Card title="Tour packages">
              <div className="grid gap-3">
                <select className="field" value={tourId} onChange={(e) => setTourId(e.target.value)}>
                  <option value="">Choose package</option>
                  {tours.map((pkg) => (
                    <option key={pkg.packageId} value={pkg.packageId}>
                      {pkg.title} · {money(pkg.price)}
                    </option>
                  ))}
                </select>
                <input className="field" type="date" value={tourForm.travelDate} onChange={(e) => setTourForm({ ...tourForm, travelDate: e.target.value })} />
                <input className="field" type="number" min="1" value={tourForm.travelers} onChange={(e) => setTourForm({ ...tourForm, travelers: e.target.value })} placeholder="Travelers" />
                <button onClick={bookTour} className="btn-primary rounded-2xl px-4 py-3 font-semibold">Book tour</button>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card title="My journeys">
            <div className="mb-4 flex flex-wrap gap-2">
              {['upcoming', 'previous', 'cancelled'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-3 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-300'}`}>
                  {tab === 'upcoming' ? 'Upcoming' : tab === 'previous' ? 'Previous' : 'Cancelled'}
                </button>
              ))}
            </div>
            <div className="grid gap-3">
              {(activeTab === 'upcoming' ? upcomingTrips : activeTab === 'previous' ? previousTrips : cancelledTrips).map((item) => (
                <div key={item._id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{item.bookingId}</div>
                      <div className="text-sm text-slate-400">
                        {item.bookingType === 'TOUR' ? item.packageTitle : `${item.from} → ${item.to}`}
                      </div>
                      <div className="text-sm text-slate-400">{formatDate(item.createdAt)} · {item.bookingStatus}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-300">{money(item.total)}</div>
                      <div className="text-sm text-slate-400">{item.paymentStatus}</div>
                    </div>
                  </div>
                </div>
              ))}
              {(!((activeTab === 'upcoming' ? upcomingTrips : activeTab === 'previous' ? previousTrips : cancelledTrips).length)) ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No trips in this section yet.</div>
              ) : null}
            </div>
          </Card>
          <div className="grid gap-6">
            <Card title="Travel summary">
              <div className="grid gap-3 sm:grid-cols-2">
                <Stat label="Upcoming" value={upcomingTrips.length} />
                <Stat label="Completed" value={previousTrips.length} />
                <Stat label="Cancelled" value={cancelledTrips.length} />
                <Stat label="Wallet" value={money(bookings.reduce((sum, item) => sum + Number(item.total || 0), 0))} />
              </div>
            </Card>
            <Card title="Download ticket">
              {booking ? (
                <div className="space-y-3 text-sm text-slate-300">
                  <div>Booking ID: {booking.bookingId}</div>
                  <div>Route: {booking.from} → {booking.to}</div>
                  <div>Status: {booking.bookingStatus}</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    Tickets, QR data, and PDF export can be generated from the booking record and payment verification flow.
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">Create or open a booking to generate a ticket workflow.</div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function OwnerPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const [routeForm, setRouteForm] = useState({
    routeId: '',
    busName: '',
    busNumber: '',
    busType: '',
    from: '',
    to: '',
    duration: '',
    price: 0,
    seatCount: 36,
    discountPercent: 0,
    paymentProvider: 'eSewa',
    paymentAccountName: '',
    paymentPhone: '',
    paymentQrUrl: '',
    paymentNote: '',
    busDescription: '',
    driverName: '',
    driverPhone: '',
    driverLicense: '',
    busGalleryUrls: '',
    services: '',
    badges: '',
    isActive: true
  });
  const [couponForm, setCouponForm] = useState({
    code: '',
    title: '',
    description: '',
    routeId: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    usageLimit: 0,
    expiresAt: ''
  });
  const [tourForm, setTourForm] = useState({
    packageId: '',
    slug: '',
    title: '',
    subtitle: '',
    destination: '',
    durationDays: 1,
    durationNights: 0,
    price: 0,
    availability: 20,
    itinerary: '',
    inclusions: '',
    exclusions: '',
    images: '',
    highlights: '',
    isActive: true
  });
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [blockForm, setBlockForm] = useState({
    routeId: '',
    date: new Date().toISOString().slice(0, 10),
    seats: '',
    reason: 'EXTERNAL_TICKETING',
    note: ''
  });

  const statsQuery = useQuery({
    queryKey: ['owner-stats'],
    queryFn: async () => api('/api/owner/stats'),
    enabled: !!auth.user && auth.user.role === 'BUS_OWNER'
  });

  const routesQuery = useQuery({
    queryKey: ['owner-routes'],
    queryFn: async () => (await api('/api/owner/routes?includeInactive=1')).routes || [],
    enabled: !!auth.user && auth.user.role === 'BUS_OWNER'
  });

  const bookingsQuery = useQuery({
    queryKey: ['owner-bookings'],
    queryFn: async () => (await api('/api/owner/bookings')).bookings || [],
    enabled: !!auth.user && auth.user.role === 'BUS_OWNER'
  });

  const paymentsQuery = useQuery({
    queryKey: ['owner-payments'],
    queryFn: async () => (await api('/api/owner/payments?status=PENDING')).payments || [],
    enabled: !!auth.user && auth.user.role === 'BUS_OWNER'
  });

  const couponsQuery = useQuery({
    queryKey: ['owner-coupons'],
    queryFn: async () => (await api('/api/owner/coupons')).coupons || [],
    enabled: !!auth.user && auth.user.role === 'BUS_OWNER'
  });

  const toursQuery = useQuery({
    queryKey: ['owner-tours'],
    queryFn: async () => (await api('/api/tours?includeInactive=1')).packages || [],
    enabled: !!auth.user && auth.user.role === 'BUS_OWNER'
  });

  const usersQuery = useQuery({
    queryKey: ['operator-users'],
    queryFn: async () => (await api('/api/users')).users || [],
    enabled: !!auth.user && auth.user.role === 'BUS_OWNER'
  });

  const routeMutation = useMutation({
    mutationFn: (payload) => api('/api/routes', { method: 'POST', body: payload }),
    onSuccess: async () => {
      toast.success('Route saved');
      await qc.invalidateQueries({ queryKey: ['owner-routes'] });
      await qc.invalidateQueries({ queryKey: ['routes'] });
    }
  });

  const couponMutation = useMutation({
    mutationFn: (payload) => api('/api/owner/coupons', { method: 'POST', body: payload }),
    onSuccess: async () => {
      toast.success('Coupon created');
      await qc.invalidateQueries({ queryKey: ['owner-coupons'] });
    }
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }) => api(`/api/owner/payments/${id}/review`, { method: 'POST', body: { action } }),
    onSuccess: async () => {
      toast.success('Payment reviewed');
      await qc.invalidateQueries({ queryKey: ['owner-payments'] });
      await qc.invalidateQueries({ queryKey: ['owner-bookings'] });
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const tourMutation = useMutation({
    mutationFn: (payload) => api('/api/tours', { method: 'POST', body: payload }),
    onSuccess: async () => {
      toast.success('Tour package saved');
      await qc.invalidateQueries({ queryKey: ['owner-tours'] });
      await qc.invalidateQueries({ queryKey: ['tours'] });
    }
  });

  const blockedQuery = useQuery({
    queryKey: ['owner-blocked', blockForm.routeId, blockForm.date],
    queryFn: async () => (await api(`/api/owner/routes/seats?routeId=${encodeURIComponent(blockForm.routeId)}&date=${encodeURIComponent(blockForm.date)}`)).blocked || [],
    enabled: !!auth.user && auth.user.role === 'BUS_OWNER' && !!blockForm.routeId && !!blockForm.date
  });

  const blockMutation = useMutation({
    mutationFn: (payload) => api('/api/owner/routes/seats/block', { method: 'POST', body: payload }),
    onSuccess: async () => {
      toast.success('Seats blocked (external ticketing)');
      await qc.invalidateQueries({ queryKey: ['owner-blocked', blockForm.routeId, blockForm.date] });
    }
  });

  const unblockMutation = useMutation({
    mutationFn: (payload) => api('/api/owner/routes/seats/unblock', { method: 'POST', body: payload }),
    onSuccess: async () => {
      toast.success('Seats unblocked');
      await qc.invalidateQueries({ queryKey: ['owner-blocked', blockForm.routeId, blockForm.date] });
    }
  });

  if (!auth.user) return <Navigate to="/auth" replace />;
  if (auth.user.role !== 'BUS_OWNER') {
    return (
      <Shell>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <Card title="Bus owner access required">
            <div className="text-slate-300">This dashboard is only for bus owners/operators.</div>
          </Card>
        </div>
      </Shell>
    );
  }

  const routes = routesQuery.data || [];
  const bookings = bookingsQuery.data || [];
  const payments = paymentsQuery.data || [];
  const coupons = couponsQuery.data || [];
  const tours = toursQuery.data || [];
  const users = usersQuery.data || [];
  const stats = statsQuery.data || {};

  async function saveRoute() {
    routeMutation.mutate({
      ...routeForm,
      price: Number(routeForm.price || 0),
      seatCount: Number(routeForm.seatCount || 36),
      discountPercent: Number(routeForm.discountPercent || 0)
    });
  }

  async function saveCoupon() {
    couponMutation.mutate({
      ...couponForm,
      discountValue: Number(couponForm.discountValue || 0),
      usageLimit: Number(couponForm.usageLimit || 0)
    });
  }

  async function saveTour() {
    tourMutation.mutate({
      ...tourForm,
      price: Number(tourForm.price || 0),
      durationDays: Number(tourForm.durationDays || 1),
      durationNights: Number(tourForm.durationNights || 0),
      availability: Number(tourForm.availability || 20)
    });
  }

  async function exportFile(kind) {
    const blob = await apiDownload(`/api/exports/${kind}.xlsx`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anthola-${kind}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function uploadBusPhoto() {
    const input = document.querySelector('#bus-photo-input');
    const file = input?.files?.[0];
    if (!file) return toast.error('Choose a bus photo');
    if (!selectedRouteId) return toast.error('Select a route first');
    await api('/api/owner/routes/photo', {
      method: 'POST',
      body: {
        routeId: selectedRouteId,
        imageBase64: await fileToDataUrl(file)
      }
    });
    toast.success('Bus photo uploaded');
    await qc.invalidateQueries({ queryKey: ['owner-routes'] });
  }

  function loadRoute(route) {
    setSelectedRouteId(route.routeId);
    setRouteForm({
      routeId: route.routeId || '',
      busName: route.busName || '',
      busNumber: route.busNumber || '',
      busType: route.busType || 'Standard',
      from: route.from || '',
      to: route.to || '',
      duration: route.duration || '',
      price: route.price ?? 0,
      seatCount: route.seatCount ?? 36,
      discountPercent: route.discountPercent ?? 0,
      paymentProvider: route.paymentProvider || 'eSewa',
      paymentAccountName: route.paymentAccountName || '',
      paymentPhone: route.paymentPhone || '',
      paymentQrUrl: route.paymentQrUrl || '',
      paymentNote: route.paymentNote || '',
      busDescription: route.busDescription || '',
      driverName: route.driverName || '',
      driverPhone: route.driverPhone || '',
      driverLicense: route.driverLicense || '',
      busGalleryUrls: Array.isArray(route.busGalleryUrls) ? route.busGalleryUrls.join(', ') : '',
      services: Array.isArray(route.services) ? route.services.join(', ') : '',
      badges: Array.isArray(route.badges) ? route.badges.join(', ') : '',
      isActive: Boolean(route.isActive)
    });
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="Total buses" value={stats.routesCount ?? 0} />
          <Stat label="Active routes" value={stats.activeRoutesCount ?? 0} />
          <Stat label="Today's bookings" value={stats.todayBookingCount ?? 0} />
          <Stat label="Monthly revenue" value={money(stats.todayRevenue ?? 0)} />
          <Stat label="Pending payments" value={stats.pendingPayments ?? 0} />
          <Stat label="Registered users" value={stats.userCount ?? 0} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card title="Revenue pulse">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400">Live snapshot</div>
                  <div className="text-3xl font-black text-white">{money(stats.todayRevenue ?? 0)}</div>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">+12% from yesterday</div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="text-sm text-slate-400">Bookings</div>
                  <div className="text-xl font-semibold text-white">{stats.bookingCount ?? 0}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="text-sm text-slate-400">Confirmed</div>
                  <div className="text-xl font-semibold text-white">{stats.confirmedCount ?? 0}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="text-sm text-slate-400">Pending</div>
                  <div className="text-xl font-semibold text-white">{stats.pendingCount ?? 0}</div>
                </div>
              </div>
            </div>
          </Card>
          <Card title="Operations center">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Route performance: top departures trending above target.</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Fleet status: 4 routes need attention in the next 24 hours.</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Customer feedback: 92% positive sentiment across recent bookings.</div>
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card title="Bus and route management">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Route ID" hint="Unique ID, e.g. ktm-pok">
              <input className="field" placeholder="Route ID" value={routeForm.routeId} onChange={(e) => setRouteForm({ ...routeForm, routeId: e.target.value })} />
            </Field>
            <Field label="Bus name">
              <input className="field" placeholder="Bus name" value={routeForm.busName} onChange={(e) => setRouteForm({ ...routeForm, busName: e.target.value })} />
            </Field>
            <Field label="Bus number">
              <input className="field" placeholder="Bus number" value={routeForm.busNumber} onChange={(e) => setRouteForm({ ...routeForm, busNumber: e.target.value })} />
            </Field>
            <Field label="Bus type">
              <select className="field" value={routeForm.busType} onChange={(e) => setRouteForm({ ...routeForm, busType: e.target.value })}>
                <option>Standard</option>
                <option>Deluxe</option>
                <option>AC Deluxe</option>
                <option>Sleeper</option>
                <option>Micro</option>
              </select>
            </Field>
            <Field label="From (departure city)">
              <input className="field" placeholder="From" value={routeForm.from} onChange={(e) => setRouteForm({ ...routeForm, from: e.target.value })} />
            </Field>
            <Field label="To (destination city)">
              <input className="field" placeholder="To" value={routeForm.to} onChange={(e) => setRouteForm({ ...routeForm, to: e.target.value })} />
            </Field>
            <Field label="Duration" hint="e.g. 6h 30m">
              <input className="field" placeholder="Duration" value={routeForm.duration} onChange={(e) => setRouteForm({ ...routeForm, duration: e.target.value })} />
            </Field>
            <Field label="Price (NPR)">
              <input className="field" type="number" placeholder="Price" value={routeForm.price} onChange={(e) => setRouteForm({ ...routeForm, price: e.target.value })} />
            </Field>
            <Field label="Seat count" hint="1–80">
              <input className="field" type="number" placeholder="Seat count" value={routeForm.seatCount} onChange={(e) => setRouteForm({ ...routeForm, seatCount: e.target.value })} />
            </Field>
            <Field label="Discount %" hint="0–100">
              <input className="field" type="number" placeholder="Discount %" value={routeForm.discountPercent} onChange={(e) => setRouteForm({ ...routeForm, discountPercent: e.target.value })} />
            </Field>
            <Field label="Payment account name">
              <input className="field" placeholder="Payment account name" value={routeForm.paymentAccountName} onChange={(e) => setRouteForm({ ...routeForm, paymentAccountName: e.target.value })} />
            </Field>
            <Field label="Payment phone">
              <input className="field" placeholder="Payment phone" value={routeForm.paymentPhone} onChange={(e) => setRouteForm({ ...routeForm, paymentPhone: e.target.value })} />
            </Field>
            <Field label="Payment QR URL">
              <input className="field" placeholder="Payment QR URL" value={routeForm.paymentQrUrl} onChange={(e) => setRouteForm({ ...routeForm, paymentQrUrl: e.target.value })} />
            </Field>
            <Field label="Driver name">
              <input className="field" placeholder="Driver name" value={routeForm.driverName} onChange={(e) => setRouteForm({ ...routeForm, driverName: e.target.value })} />
            </Field>
            <Field label="Driver phone">
              <input className="field" placeholder="Driver phone" value={routeForm.driverPhone} onChange={(e) => setRouteForm({ ...routeForm, driverPhone: e.target.value })} />
            </Field>
            <Field label="Driver license">
              <input className="field" placeholder="Driver license" value={routeForm.driverLicense} onChange={(e) => setRouteForm({ ...routeForm, driverLicense: e.target.value })} />
            </Field>
            <Field label="Payment note" hint="Shown to passengers on the booking page">
              <input className="field md:col-span-2" placeholder="Payment note" value={routeForm.paymentNote} onChange={(e) => setRouteForm({ ...routeForm, paymentNote: e.target.value })} />
            </Field>
            <Field label="Bus description" className="md:col-span-2">
              <textarea className="field min-h-24 md:col-span-2" placeholder="Bus description" value={routeForm.busDescription} onChange={(e) => setRouteForm({ ...routeForm, busDescription: e.target.value })} />
            </Field>
            <Field label="Services (comma separated)">
              <input className="field md:col-span-2" placeholder="Services, comma separated" value={routeForm.services} onChange={(e) => setRouteForm({ ...routeForm, services: e.target.value })} />
            </Field>
            <Field label="Badges (comma separated)">
              <input className="field md:col-span-2" placeholder="Badges, comma separated" value={routeForm.badges} onChange={(e) => setRouteForm({ ...routeForm, badges: e.target.value })} />
            </Field>
            <Field label="Bus gallery image URLs (comma separated)">
              <input className="field md:col-span-2" placeholder="https://..., https://..." value={routeForm.busGalleryUrls} onChange={(e) => setRouteForm({ ...routeForm, busGalleryUrls: e.target.value })} />
            </Field>
            <Field label="Bus photo upload" hint="Select a saved route below first, then choose an image">
              <select className="field md:col-span-2" value={selectedRouteId} onChange={(e) => loadRoute(routes.find((r) => r.routeId === e.target.value) || { routeId: e.target.value })}>
                <option value="">Select a route to attach photo…</option>
                {routes.map((r) => (
                  <option key={r.routeId} value={r.routeId}>{r.from} → {r.to} ({r.routeId})</option>
                ))}
              </select>
            </Field>
            {selectedRouteId && routes.find((r) => r.routeId === selectedRouteId)?.busPhotoUrl ? (
              <div className="md:col-span-2">
                <img src={assetUrl(routes.find((r) => r.routeId === selectedRouteId).busPhotoUrl)} alt="Bus" className="h-36 w-full rounded-2xl object-cover" />
              </div>
            ) : null}
            <input id="bus-photo-input" className="field md:col-span-2" type="file" accept="image/png,image/jpeg,image/webp" />
          </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={saveRoute} className="btn-primary rounded-2xl px-4 py-3 font-semibold">Save route</button>
              <button onClick={uploadBusPhoto} className="btn-secondary rounded-2xl px-4 py-3 font-semibold">Upload bus photo</button>
              <button onClick={() => setRouteForm({
                routeId: '',
                busName: '',
                busNumber: '',
                from: '',
                to: '',
                duration: '',
                price: 0,
                seatCount: 36,
                discountPercent: 0,
                paymentProvider: 'eSewa',
                paymentAccountName: '',
                paymentPhone: '',
                paymentQrUrl: '',
                paymentNote: '',
                busDescription: '',
                services: '',
                badges: '',
                isActive: true
              })} className="btn-secondary rounded-2xl px-4 py-3 font-semibold">Reset</button>
            </div>

            <div className="mt-5 grid gap-3">
              {routes.map((route) => (
                <button key={route.routeId} type="button" onClick={() => loadRoute(route)} className={`rounded-2xl border p-4 text-left ${selectedRouteId === route.routeId ? 'border-sky-400/60 bg-sky-400/10' : 'border-white/10 bg-slate-900/70'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{route.from} → {route.to}</div>
                      <div className="text-sm text-slate-400">{route.busName || 'Bus'} · {route.seatCount || 36} seats</div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-300">{money(route.price)}</div>
                      <div className="text-xs text-slate-500">{route.isActive ? 'Active' : 'Inactive'}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="grid gap-6">
            <Card title="Verification queue">
              <div className="grid gap-3">
                {payments.map((payment) => (
                  <div key={payment.paymentId} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 text-sm text-slate-300">
                        <div className="font-semibold text-white">{payment.paymentId}</div>
                        <div>Booking: {payment.bookingId}</div>
                        <div>Provider: {payment.provider}</div>
                        <div>Amount: {money(payment.amount)}</div>
                        <div>Status: {payment.status}</div>
                        <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="text-sky-300 underline">Open screenshot</a>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => reviewMutation.mutate({ id: payment._id, action: 'approve' })} className="rounded-2xl bg-emerald-400 px-4 py-2 font-semibold text-slate-950">Approve</button>
                        <button onClick={() => reviewMutation.mutate({ id: payment._id, action: 'reject' })} className="rounded-2xl bg-rose-500 px-4 py-2 font-semibold text-white">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Exports">
              <div className="flex flex-wrap gap-3">
                <button onClick={() => exportFile('users')} className="btn-secondary rounded-2xl px-4 py-3 font-semibold">Registered passengers</button>
                <button onClick={() => exportFile('bookings')} className="btn-secondary rounded-2xl px-4 py-3 font-semibold">Bookings</button>
                <button onClick={() => exportFile('payments')} className="btn-secondary rounded-2xl px-4 py-3 font-semibold">Payments</button>
              </div>
            </Card>

            <Card title="External ticketing / block seats">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Route">
                  <select className="field" value={blockForm.routeId} onChange={(e) => setBlockForm({ ...blockForm, routeId: e.target.value })}>
                    <option value="">Select route</option>
                    {routes.map((r) => (
                      <option key={r.routeId} value={r.routeId}>{r.from} → {r.to} ({r.routeId})</option>
                    ))}
                  </select>
                </Field>
                <Field label="Travel date">
                  <input className="field" type="date" value={blockForm.date} onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })} />
                </Field>
                <Field label="Reason">
                  <select className="field" value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}>
                    <option value="EXTERNAL_TICKETING">External ticketing</option>
                    <option value="AGENCY">Agency</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Seats" hint="Comma separated, e.g. S01, S02">
                  <input className="field" placeholder="S01, S02" value={blockForm.seats} onChange={(e) => setBlockForm({ ...blockForm, seats: e.target.value })} />
                </Field>
                <Field label="Note" className="md:col-span-2">
                  <input className="field md:col-span-2" placeholder="Optional note" value={blockForm.note} onChange={(e) => setBlockForm({ ...blockForm, note: e.target.value })} />
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => blockMutation.mutate({ ...blockForm, seats: blockForm.seats })} className="btn-primary rounded-2xl px-4 py-3 font-semibold">Block seats</button>
                <button onClick={() => unblockMutation.mutate({ routeId: blockForm.routeId, date: blockForm.date, seats: blockForm.seats })} className="btn-secondary rounded-2xl px-4 py-3 font-semibold">Unblock seats</button>
              </div>
              <div className="mt-4">
                <div className="mb-2 text-sm font-semibold text-white">Blocked seats for this date</div>
                {(blockedQuery.data || []).length ? (
                  <div className="flex flex-wrap gap-2">
                    {(blockedQuery.data || []).map((b) => (
                      <span key={b.seat} className="rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-xs text-purple-100">
                        {b.seat} · {b.reason}{b.note ? ` (${b.note})` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No blocked seats.</div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card title="Tour package management">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="field" placeholder="Package ID" value={tourForm.packageId} onChange={(e) => setTourForm({ ...tourForm, packageId: e.target.value })} />
              <input className="field" placeholder="Slug" value={tourForm.slug} onChange={(e) => setTourForm({ ...tourForm, slug: e.target.value })} />
              <input className="field" placeholder="Title" value={tourForm.title} onChange={(e) => setTourForm({ ...tourForm, title: e.target.value })} />
              <input className="field" placeholder="Subtitle" value={tourForm.subtitle} onChange={(e) => setTourForm({ ...tourForm, subtitle: e.target.value })} />
              <input className="field" placeholder="Destination" value={tourForm.destination} onChange={(e) => setTourForm({ ...tourForm, destination: e.target.value })} />
              <input className="field" type="number" placeholder="Duration days" value={tourForm.durationDays} onChange={(e) => setTourForm({ ...tourForm, durationDays: e.target.value })} />
              <input className="field" type="number" placeholder="Duration nights" value={tourForm.durationNights} onChange={(e) => setTourForm({ ...tourForm, durationNights: e.target.value })} />
              <input className="field" type="number" placeholder="Price" value={tourForm.price} onChange={(e) => setTourForm({ ...tourForm, price: e.target.value })} />
              <input className="field" type="number" placeholder="Availability" value={tourForm.availability} onChange={(e) => setTourForm({ ...tourForm, availability: e.target.value })} />
              <textarea className="field min-h-24 md:col-span-2" placeholder="Itinerary, one item per line" value={tourForm.itinerary} onChange={(e) => setTourForm({ ...tourForm, itinerary: e.target.value })} />
              <input className="field md:col-span-2" placeholder="Inclusions, comma separated" value={tourForm.inclusions} onChange={(e) => setTourForm({ ...tourForm, inclusions: e.target.value })} />
              <input className="field md:col-span-2" placeholder="Exclusions, comma separated" value={tourForm.exclusions} onChange={(e) => setTourForm({ ...tourForm, exclusions: e.target.value })} />
              <input className="field md:col-span-2" placeholder="Images, comma separated" value={tourForm.images} onChange={(e) => setTourForm({ ...tourForm, images: e.target.value })} />
              <input className="field md:col-span-2" placeholder="Highlights, comma separated" value={tourForm.highlights} onChange={(e) => setTourForm({ ...tourForm, highlights: e.target.value })} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={saveTour} className="btn-primary rounded-2xl px-4 py-3 font-semibold">Save tour</button>
            </div>
            <div className="mt-5 grid gap-3">
              {tours.map((item) => (
                <div key={item.packageId} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                  <div className="font-semibold text-white">{item.title}</div>
                  <div>{item.destination} · {money(item.price)}</div>
                  <div>{item.durationDays} days / {item.durationNights} nights</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Bookings and coupons">
            <div className="grid gap-6">
              <div>
                <div className="mb-3 text-sm font-semibold text-white">Bookings</div>
                <div className="grid gap-3">
                  {bookings.slice(0, 8).map((booking) => (
                    <div key={booking.bookingId} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                      <div className="font-semibold text-white">{booking.bookingId}</div>
                      <div>{booking.passenger}</div>
                      <div>{booking.from} → {booking.to} · {booking.bookingStatus}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-3 text-sm font-semibold text-white">Coupon creation</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="field uppercase tracking-widest" placeholder="Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} />
                  <input className="field" placeholder="Title" value={couponForm.title} onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })} />
                  <input className="field md:col-span-2" placeholder="Description" value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} />
                  <input className="field" placeholder="Route ID (optional)" value={couponForm.routeId} onChange={(e) => setCouponForm({ ...couponForm, routeId: e.target.value })} />
                  <select className="field" value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed</option>
                  </select>
                  <input className="field" type="number" placeholder="Discount value" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} />
                  <input className="field" type="number" placeholder="Usage limit" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} />
                  <input className="field md:col-span-2" type="date" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={saveCoupon} className="btn-primary rounded-2xl px-4 py-3 font-semibold">Save coupon</button>
                </div>
                <div className="mt-5 grid gap-3">
                  {coupons.map((coupon) => (
                    <div key={coupon._id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                      <div className="font-semibold text-white">{coupon.code}</div>
                      <div>{coupon.title || 'Coupon'}</div>
                      <div>{coupon.discountType} {coupon.discountValue}{coupon.discountType === 'PERCENTAGE' ? '%' : ' NPR'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card title="Registered users">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2 text-left">Name</th>
                    <th className="text-left">Role</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-white/5">
                      <td className="py-2">{user.name}</td>
                      <td>{user.role}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Owner stats snapshot">
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Bookings" value={stats.bookingCount ?? 0} />
              <Stat label="Confirmed" value={stats.confirmedCount ?? 0} />
              <Stat label="Pending" value={stats.pendingCount ?? 0} />
              <Stat label="Payments" value={stats.paymentCount ?? 0} />
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function ProfilePage() {
  const auth = useAuth();
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api('/api/auth/me')).user,
    enabled: !!auth.user
  });

  if (!auth.user) return <Navigate to="/auth" replace />;

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Card title="Profile">
          <div className="grid gap-3 text-sm text-slate-300">
            <div>Name: {data?.name || auth.user.name}</div>
            <div>Email: {data?.email || auth.user.email}</div>
            <div>Phone: {data?.phone || auth.user.phone}</div>
            <div>Role: {data?.role || auth.user.role}</div>
            <div>Joined: {formatDate(data?.createdAt || auth.user.createdAt)}</div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="glass rounded-[1.5rem] border border-white/10 p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function App() {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      // Only call /api/auth/me if a token exists; otherwise skip the
      // authenticated request entirely instead of sending it and 401-ing.
      if (!auth.token) {
        auth.logout();
        setLoading(false);
        return;
      }
      try {
        const data = await api('/api/auth/me', { auth: true });
        if (data && data.user) {
          // Token is already in auth store from localStorage; verify the user is still valid.
          auth.login(auth.token, data.user);
        } else {
          auth.logout();
        }
      } catch (err) {
        console.error('[App] Auth hydration failed:', err);
        auth.logout();
      } finally {
        setLoading(false);
      }
    }

    hydrate();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-400 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingMvp />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/booking" element={<PassengerPage />} />
        <Route path="/tours" element={<PassengerPage />} />
        <Route path="/dashboard" element={<OwnerPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
