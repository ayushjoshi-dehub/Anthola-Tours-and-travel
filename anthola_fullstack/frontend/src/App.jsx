import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Button, ButtonGroup } from '@heroui/react';
import { api, apiDownload, clearTokens } from './lib/api';
import { useAuth } from './store/auth';
import { useTheme, THEMES } from './lib/theme';
import { getApiBaseUrl, getSocketUrl } from './lib/config';

function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const base = getApiBaseUrl().replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function money(value) {
  return `NPR ${Number(value || 0).toLocaleString()}`;
}

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

  useSocket(auth.user);

  async function doLogout() {
    clearTokens();
    auth.logout();
    nav('/');
  }

  return (
    <div className="app-shell min-h-screen text-slate-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="subtle-line absolute inset-x-0 top-0 h-px opacity-70" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="brand-mark grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-400 to-amber-400 font-black text-slate-950">N</div>
            <div>
              <div className="font-black tracking-wide text-white">Nepal Bus & Tours</div>
              <div className="text-xs text-slate-400">Passenger and Bus Owner platform</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link className="nav-link rounded-full px-4 py-2 text-sm" to="/">Home</Link>
            <Link className="nav-link rounded-full px-4 py-2 text-sm" to="/booking">Booking</Link>
            <Link className="nav-link rounded-full px-4 py-2 text-sm" to="/tours">Tours</Link>
            {auth.user?.role === 'BUS_OWNER' && <Link className="nav-link rounded-full px-4 py-2 text-sm" to="/dashboard">Dashboard</Link>}
            {auth.user && <Link className="nav-link rounded-full px-4 py-2 text-sm" to="/profile">Profile</Link>}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {auth.user ? (
              <>
                <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 sm:inline">
                  {auth.user.name || auth.user.companyName || auth.user.email}
                </span>
                <button onClick={doLogout} className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold">Logout</button>
              </>
            ) : (
              <Link className="btn-primary rounded-full px-4 py-2 text-sm font-semibold" to="/auth">Login / Register</Link>
            )}
          </div>
        </div>
      </header>
      <main className="app-main">
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
    </div>
  );
}

function ThemeSwitcher() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  return (
    <ButtonGroup size="sm" variant="flat" radius="full" className="hidden sm:flex" aria-label="Theme">
      {THEMES.map((t) => (
        <Button
          key={t}
          size="sm"
          variant={theme === t ? 'solid' : 'flat'}
          color={theme === t ? 'primary' : 'default'}
          onPress={() => setTheme(t)}
          className="capitalize"
        >
          {t}
        </Button>
      ))}
    </ButtonGroup>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
      <div className="space-y-6">
        <div className="section-kicker inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2">
          Built for Nepal routes, manual payment verification, and live seat locking
        </div>
        <h1 className="display-serif max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
          A single platform for passengers and bus owners.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          Search buses, reserve seats in real time, upload eSewa or Khalti screenshots, and manage routes, bookings, payments, and tour packages from one operator dashboard.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/booking" className="btn-primary rounded-full px-6 py-3 font-semibold">Search buses</Link>
          <Link to="/tours" className="btn-secondary rounded-full px-6 py-3 font-semibold">Browse tours</Link>
        </div>
      </div>
      <div className="surface rounded-[2rem] p-6 shadow-glow">
        <div className="grid gap-4">
          {[
            ['Passenger', 'Search, book, pay, and download tickets'],
            ['Bus Owner', 'Manage routes, buses, bookings, and tour packages'],
            ['Realtime', 'Socket-powered notifications and seat locking']
          ].map(([title, desc]) => (
            <div key={title} className="grid-card rounded-3xl p-4">
              <div className="font-bold text-white">{title}</div>
              <div className="mt-1 text-sm text-slate-400">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingPage() {
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

  return (
    <Shell>
      <Hero />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-14 sm:px-6 lg:grid-cols-2">
        <Card title="Popular bus routes">
          <div className="grid gap-3">
            {routes.slice(0, 6).map((route) => (
              <Link key={route.routeId} to={`/booking?routeId=${encodeURIComponent(route.routeId)}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 hover:border-sky-400/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{route.from} → {route.to}</div>
                    <div className="text-sm text-slate-400">{route.duration} · {route.busName || 'Bus'}</div>
                  </div>
                  <div className="font-bold text-amber-300">{money(route.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
        <Card title="Tour packages">
          <div className="grid gap-3">
            {tours.slice(0, 6).map((pkg) => (
              <Link key={pkg.packageId} to={`/tours?packageId=${encodeURIComponent(pkg.packageId)}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 hover:border-amber-400/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{pkg.title}</div>
                    <div className="text-sm text-slate-400">{pkg.destination} · {pkg.durationDays}D/{pkg.durationNights}N</div>
                  </div>
                  <div className="font-bold text-sky-300">{money(pkg.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </Shell>
  );
}

function Card({ title, children }) {
  return (
    <div className="surface rounded-[1.75rem] p-6 shadow-glow">
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

function AuthPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('PASSENGER');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
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
      setError(err.message || 'Something went wrong');
      toast.error(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <div className="section-kicker">Secure access</div>
          <h1 className="display-serif text-4xl font-black text-white sm:text-5xl">Login or register for the role you actually need.</h1>
          <p className="max-w-xl leading-8 text-slate-300">
            One login screen. The system redirects passengers to booking and bus owners to the operator dashboard automatically.
          </p>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            {[
              ['Email & Password', 'Secure authentication with password reset via email'],
              ['Role aware', 'Passenger and bus owner experiences are separated by design']
            ].map(([title, desc]) => (
              <div key={title} className="grid-card rounded-3xl p-4">
                <div className="font-semibold text-white">{title}</div>
                <div className="mt-1 text-sm text-slate-400">{desc}</div>
              </div>
            ))}
          </div>
        </div>
        <Card title={mode === 'login' ? 'Login' : 'Register'}>
          <form onSubmit={submit} className="grid gap-3">
            {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 text-sm font-semibold text-white">Register As</div>
              <label className="mr-4 inline-flex items-center gap-2 text-sm">
                <input type="radio" name="role" checked={role === 'PASSENGER'} onChange={() => setRole('PASSENGER')} />
                Passenger
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="role" checked={role === 'BUS_OWNER'} onChange={() => setRole('BUS_OWNER')} />
                Bus Owner
              </label>
            </div>
            {mode === 'register' && role === 'PASSENGER' && (
              <input className="field" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            )}
            {mode === 'register' && role === 'BUS_OWNER' && (
              <>
                <input className="field" placeholder="Company name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                <input className="field" placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                <input className="field" placeholder="PAN number" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
                <input className="field" placeholder="Business registration number" value={form.businessRegistrationNumber} onChange={(e) => setForm({ ...form, businessRegistrationNumber: e.target.value })} />
                <input className="field" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </>
            )}
            <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="field" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="field" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {mode === 'register' && (
              <input className="field" placeholder="Confirm password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
            )}
            <button disabled={busy} className="btn-primary rounded-2xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create account')}
            </button>
            {mode === 'login' && (
              <button type="button" className="text-left text-sm text-sky-300" onClick={() => nav('/forgot-password')}>
                Forgot password?
              </button>
            )}
            <button type="button" className="text-left text-sm text-sky-300" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
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
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_0.7fr]">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4">
        {seats.map((seat) => {
          const isBooked = bookedSet.has(seat);
          const lock = lockedMap.get(seat);
          const isMine = lock?.mine;
          const isBlocked = blockedSet.has(seat);
          const isSelected = selected.includes(seat);
          let cls;
          if (isBooked) cls = 'bg-slate-700 text-slate-400 cursor-not-allowed';
          else if (isBlocked) cls = 'bg-purple-600/80 text-white cursor-not-allowed';
          else if (lock) cls = isMine ? 'bg-emerald-500 text-white' : 'bg-rose-500/80 text-white cursor-not-allowed';
          else if (isSelected) cls = 'bg-amber-400 text-slate-950';
          else cls = 'bg-white/5 text-slate-200';
          return (
            <button
              key={seat}
              disabled={disabled || isBooked || isBlocked || (lock && !isMine)}
              onClick={() => onToggle(seat)}
              className={`rounded-xl px-2 py-3 text-sm font-semibold ${cls}`}
              title={isBlocked ? 'Blocked (external ticketing)' : undefined}
            >
              {seat}
            </button>
          );
        })}
      </div>
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
        <div className="font-semibold text-white">Seat status</div>
        <ul className="mt-3 space-y-2">
          <li>Booked seats are blocked.</li>
          <li>Locked seats are reserved briefly for the current user.</li>
          <li className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded bg-purple-600/80" /> Blocked by external ticketing.</li>
          <li>Selected seats are highlighted in amber.</li>
        </ul>
      </div>
    </div>
  );
}

function PassengerPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    date: new Date().toISOString().slice(0, 10)
  });
  const [routeId, setRouteId] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [booking, setBooking] = useState(null);
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
  const routePrice = selectedRoute ? Number(selectedRoute.price || 0) : 0;
  const routeDiscount = selectedRoute ? Number(selectedRoute.discountPercent || 0) : 0;
  const perSeat = Math.round(routePrice * (1 - routeDiscount / 100));
  const totalPrice = perSeat * selectedSeats.length;
  const busPhoto = selectedRoute?.busPhotoUrl ? assetUrl(selectedRoute.busPhotoUrl) : '';

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
          <Card title="Bus search and seat booking">
            <div className="grid gap-3 md:grid-cols-3">
              <input className="field" placeholder="From" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
              <input className="field" placeholder="To" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
              <input className="field" type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
            </div>
            <div className="mt-4 grid gap-3">
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
                  {busPhoto ? (
                    <img src={busPhoto} alt={`${selectedRoute.busName || 'Bus'}`} className="mt-3 h-40 w-full rounded-2xl object-cover" />
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="mt-4">
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
              <div className="mt-4 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
                Selected {selectedSeats.length} seat(s) · {money(perSeat)}/seat · Total: <span className="font-bold">{money(totalPrice)}</span>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={submitBooking} className="btn-primary rounded-2xl px-4 py-3 font-semibold">Create booking</button>
              <button onClick={() => setSelectedSeats([])} className="btn-secondary rounded-2xl px-4 py-3 font-semibold">Clear seats</button>
            </div>
            {booking ? (
              <div className="mt-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
                Booking ID: {booking.bookingId} · Status: {booking.bookingStatus}
              </div>
            ) : null}
          </Card>

          <div className="grid gap-6">
            <Card title="Payment verification">
              <div className="grid gap-3">
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
          <Card title="My bookings">
            <div className="grid gap-3">
              {bookings.map((item) => (
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
            </div>
          </Card>
          <Card title="Download ticket">
            {booking ? (
              <div className="space-y-3 text-sm text-slate-300">
                <div>Booking ID: {booking.bookingId}</div>
                <div>Route: {booking.from} → {booking.to}</div>
                <div>Status: {booking.bookingStatus}</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  QR and PDF generation can be attached to the booking ID and payment verification flow in the next pass.
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">Create or open a booking to generate a ticket workflow.</div>
            )}
          </Card>
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
        <Route path="/" element={<LandingPage />} />
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
