import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Avatar } from '@heroui/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../store/auth';

gsap.registerPlugin(ScrollTrigger);

const LINKS = [
  { href: '#routes', label: 'Routes' },
  { href: '#fleet', label: 'Fleet' },
  { href: '#why', label: 'Why Us' },
  { href: '#reviews', label: 'Reviews' },
];

const ROUTES = [
  { from: 'KTM', to: 'MDN', time: '5:00 PM', duration: '~14 hrs', price: '1,800' },
  { from: 'KTM', to: 'DHN', time: '4:30 PM', duration: '~13 hrs', price: '1,700' },
  { from: 'KTM', to: 'KOH', time: '5:30 PM', duration: '~11 hrs', price: '1,500' },
  { from: 'KTM', to: 'BTL', time: '7:00 AM', duration: '~7 hrs', price: '1,100' },
  { from: 'KTM', to: 'NGT', time: 'Every 2 hrs', duration: '~5 hrs', price: '700' },
  { from: 'PKR', to: 'KTM', time: '7:00 AM', duration: '~6 hrs', price: '900' },
];

const FEATURES = [
  {
    icon: '◐',
    title: 'Reclining sofa seating',
    body: 'Wide individual sofa-style seats with a deeper recline than a standard coach chair, built for overnight routes.',
  },
  {
    icon: '❄',
    title: 'Full air conditioning',
    body: 'Cabin climate control front to back, so the last row stays as comfortable as the first.',
  },
  {
    icon: '⚡',
    title: 'Charging at every seat',
    body: 'USB and standard outlets built into each row — no fighting over the one socket near the driver.',
  },
  {
    icon: '✦',
    title: 'Experienced highway drivers',
    body: 'Our drivers average over ten years on Nepal’s hill routes, rotated on long journeys for rest.',
  },
];

const STATS = [
  { target: 22, label: 'Years on the road' },
  { target: 46, label: 'Coaches in fleet' },
  { target: 18, label: 'Routes served' },
  { target: 3200, label: 'Daily passengers' },
];

const REVIEWS = [
  {
    initials: 'RS',
    name: 'Rojina S.',
    route: 'Kathmandu → Mahendranagar',
    quote:
      'The sofa seats made the Mahendranagar leg genuinely restful. First overnight coach I’ve taken where I actually slept.',
  },
  {
    initials: 'BT',
    name: 'Bikash T.',
    route: 'Kathmandu → Dhangadi',
    quote:
      'Left on time from the New Buspark and the driver called ahead about a road closure — rerouted us without any drama.',
  },
  {
    initials: 'SK',
    name: 'Sabina K.',
    route: 'Kathmandu → Butwal',
    quote:
      'Booked the morning Butwal service for a work trip. Clean coach, cold air conditioning, and cheaper than I expected.',
  },
];

function Navbar() {
  const auth = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuRef.current) return;
    if (open) {
      gsap.set(menuRef.current, { display: 'flex' });
      gsap.fromTo(
        menuRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.35, ease: 'power2.out' },
      );
      gsap.fromTo(
        menuRef.current.querySelectorAll('a, button'),
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.06, delay: 0.1, ease: 'power2.out' },
      );
    } else {
      gsap.to(menuRef.current, {
        autoAlpha: 0,
        duration: 0.25,
        onComplete: () => gsap.set(menuRef.current, { display: 'none' }),
      });
    }
  }, [open]);

  const goTo = (href) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[100] transition-all duration-300 ${
          scrolled ? 'bg-[#0d1e2c]/95 py-3.5 shadow-lg shadow-black/20' : 'bg-transparent py-5'
        }`}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-7">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              goTo('#top');
            }}
            className="font-['Oswald'] text-[22px] font-bold tracking-wide text-white"
          >
            MAHAKALI <span className="text-[13px] font-medium tracking-[0.12em] text-[#f0c877]">YATAYAT</span>
          </a>

          <nav className="hidden items-center gap-9 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(link.href);
                }}
                className="group relative py-1 text-[14.5px] font-medium text-[#eee8d8]"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#d9a441] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <Link
            to={auth.user ? (auth.user.role === 'BUS_OWNER' ? '/dashboard' : '/booking') : '/auth'}
            className="hidden rounded-full bg-[#d9a441] px-5 py-2.5 text-sm font-semibold text-[#0d1e2c] transition hover:bg-[#f0c877] md:inline-flex"
          >
            {auth.user ? (auth.user.role === 'BUS_OWNER' ? 'Dashboard' : 'Book ticket') : 'Sign in'}
          </Link>

          <button
            aria-label="Open menu"
            className="flex flex-col gap-1.5 p-1.5 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block h-0.5 w-6 bg-white" />
            <span className="block h-0.5 w-6 bg-white" />
            <span className="block h-0.5 w-6 bg-white" />
          </button>
        </div>
      </header>

      <div
        ref={menuRef}
        style={{ display: 'none' }}
        className="fixed inset-0 z-[99] hidden flex-col items-center justify-center gap-9 bg-[#0d1e2c]"
      >
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => {
              e.preventDefault();
              goTo(link.href);
            }}
            className="font-['Oswald'] text-[26px] uppercase text-[#f0e9d8]"
          >
            {link.label}
          </a>
        ))}
        <Link
          to={auth.user ? (auth.user.role === 'BUS_OWNER' ? '/dashboard' : '/booking') : '/auth'}
          className="rounded-full bg-[#d9a441] px-5 py-2.5 text-sm font-semibold text-[#0d1e2c]"
        >
          {auth.user ? (auth.user.role === 'BUS_OWNER' ? 'Dashboard' : 'Book ticket') : 'Sign in'}
        </Link>
      </div>
    </>
  );
}

function Hero() {
  const auth = useAuth();
  const scope = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.hero-eyebrow', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.15)
        .fromTo('.hero-headline', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 }, 0.3)
        .fromTo('.hero-sub', { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, 0.5)
        .fromTo('.hero-cta > *', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1 }, 0.68)
        .fromTo('.hero-img', { scale: 1.12 }, { scale: 1.02, duration: 2.4, ease: 'power2.out' }, 0);
    }, scope);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={scope} id="top" className="relative flex h-screen min-h-[640px] items-end overflow-hidden">
      <video
        className="hero-img absolute inset-0 h-full w-full object-cover"
        src="/assets/landing-video.mp4"
        poster="/assets/langing.jpg"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1e2c]/25 via-[#0d1e2c]/15 to-[#0d1e2c]/92" />

      <div className="relative z-10 w-full pb-28">
        <div className="mx-auto max-w-[1180px] px-7">
          <span className="hero-eyebrow mb-4 block font-['Oswald'] text-sm uppercase tracking-[0.18em] text-[#f0c877] opacity-0">
            Kathmandu — Sudurpaschim &amp; beyond
          </span>
          <h1 className="hero-headline max-w-[820px] text-[clamp(38px,6vw,72px)] font-bold leading-[1.03] text-white opacity-0">
            Every mountain road,
            <br />
            one <span className="text-[#d9a441]">steady</span> ride.
          </h1>
          <p className="hero-sub mt-5 max-w-[520px] text-[17px] leading-relaxed text-[#dfe6ea] opacity-0">
            Mahakali Yatayat has carried Nepal’s highways for over two decades — VIP sofa seating,
            tempered comfort, and drivers who know every switchback by name.
          </p>
          <div className="hero-cta mt-8 flex flex-wrap gap-4">
            <Link
              to={auth.user ? (auth.user.role === 'BUS_OWNER' ? '/dashboard' : '/booking') : '/auth'}
              className="rounded-full bg-[#d9a441] px-6 py-3 text-base font-semibold text-[#0d1e2c] transition hover:bg-[#f0c877]"
            >
              {auth.user ? (auth.user.role === 'BUS_OWNER' ? 'Open dashboard' : 'Find a route') : 'Sign in'}
            </Link>
            <a
              href="#fleet"
              className="rounded-full border border-white/50 bg-transparent px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              See the fleet
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Ticker() {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const half = track.scrollWidth / 2;
    const tween = gsap.to(track, {
      x: -half,
      duration: 28,
      ease: 'none',
      repeat: -1,
    });
    return () => tween.kill();
  }, []);

  const items = [...ROUTES, ...ROUTES];

  return (
    <div className="relative z-10 overflow-hidden border-t border-[#d9a441]/35 bg-[#0d1e2c] py-3.5">
      <div ref={trackRef} className="flex w-max whitespace-nowrap">
        {items.map((route, i) => (
          <span
            key={i}
            className="flex items-center gap-4 px-7 font-['Oswald'] text-sm uppercase tracking-[0.12em] text-[#f0c877]"
          >
            <span className="text-[8px] text-[#b23a2e]">●</span>
            {route.from} → {route.to}
          </span>
        ))}
      </div>
    </div>
  );
}

function Routes() {
  const gridRef = useRef(null);

  useEffect(() => {
    const cards = gridRef.current.querySelectorAll('.route-card');
    gsap.fromTo(
      cards,
      { y: 28, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: { trigger: gridRef.current, start: 'top 82%' },
      },
    );
  }, []);

  const onEnter = (e) => {
    gsap.to(e.currentTarget.querySelector('.route-line-fill'), { width: '100%', duration: 0.5, ease: 'power2.out' });
  };
  const onLeave = (e) => {
    gsap.to(e.currentTarget.querySelector('.route-line-fill'), { width: '0%', duration: 0.3, ease: 'power2.in' });
  };

  return (
    <section id="routes" className="py-24">
      <div className="mx-auto max-w-[1180px] px-7">
        <div className="mb-14 max-w-xl">
          <span className="mb-3.5 block font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.16em] text-[#b23a2e]">
            Where we go
          </span>
          <h2 className="text-[clamp(28px,3.6vw,42px)] leading-[1.15] text-[#12283b]">
            Daily departures across the country
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#525c62]">
            Overnight and day services connecting the capital to the far west, timed around the roads
            rather than a fixed clock.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 md:grid-cols-3">
          {ROUTES.map((r, i) => (
            <Card
              key={i}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
              className="route-card rounded-none border-none bg-[#f6f1e4] shadow-none hover:bg-[#fffdf6]"
            >
              <CardBody className="p-8">
                <div className="flex items-center gap-2 font-['Oswald'] text-[19px] font-semibold text-[#12283b]">
                  {r.from}
                  <span className="relative mx-0.5 h-px flex-1 bg-black/10">
                    <span className="route-line-fill absolute left-0 top-0 h-px w-0 bg-[#d9a441]" />
                    <span className="absolute -top-[2.5px] right-0 h-1.5 w-1.5 rounded-full bg-[#b23a2e]" />
                  </span>
                  {r.to}
                </div>
                <div className="mt-5 flex justify-between text-[13.5px] text-[#6c757a]">
                  <span>
                    Departs <strong className="font-semibold text-[#2f4a3a]">{r.time}</strong>
                  </span>
                  <span>{r.duration}</span>
                </div>
                <div className="mt-4 font-['Oswald'] text-[22px] text-[#b23a2e]">
                  Rs. {r.price} <span className="font-['Inter'] text-xs text-[#8a9095]">/ seat</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Fleet() {
  const imgWrap = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      imgWrap.current,
      { y: 40, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: imgWrap.current, start: 'top 85%' },
      },
    );
  }, []);

  return (
    <section id="fleet" className="pb-24">
      <div className="mx-auto max-w-[1180px] px-7">
        <div className="mb-14 max-w-xl">
          <span className="mb-3.5 block font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.16em] text-[#b23a2e]">
            The fleet
          </span>
          <h2 className="text-[clamp(28px,3.6vw,42px)] leading-[1.15] text-[#12283b]">
            Built for the long haul
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#525c62]">
            Our New VIP Sofa coaches run the toughest highway stretches in the country — wide-body
            suspension, reclining sofa rows, and a paint job you can spot from the terminal gate.
          </p>
        </div>
        <div ref={imgWrap} className="overflow-hidden rounded-sm shadow-2xl shadow-[#12283b]/20">
          <img
            src="/assets/langing.jpg"
            alt="Three New Mahakali VIP Sofa coaches parked side by side"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="why" className="bg-[#12283b] py-24 text-[#eef2f3]">
      <div className="mx-auto max-w-[1180px] px-7">
        <div className="mb-14 max-w-xl">
          <span className="mb-3.5 block font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.16em] text-[#f0c877]">
            Why riders choose us
          </span>
          <h2 className="text-[clamp(28px,3.6vw,42px)] leading-[1.15] text-white">
            Comfort that survives the whole route
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#b9c3c8]">
            Nothing here is an afterthought — every coach is fitted out the same way, on every
            departure, on every road.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden bg-white/10 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-5 bg-[#12283b] p-8">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-[1.5px] border-[#d9a441] text-[19px] text-[#d9a441]">
                {f.icon}
              </div>
              <div>
                <h3 className="mb-2 text-[17px] tracking-normal text-white">{f.title}</h3>
                <p className="m-0 text-[14.5px] leading-relaxed text-[#a9b4b9]">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const nums = wrapRef.current.querySelectorAll('.stat-num');
    nums.forEach((el) => {
      const target = Number(el.dataset.target);
      const counter = { val: 0 };
      gsap.to(counter, {
        val: target,
        duration: 1.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: wrapRef.current, start: 'top 85%', once: true },
        onUpdate: () => {
          el.textContent = Math.floor(counter.val).toLocaleString();
        },
      });
    });
  }, []);

  return (
    <section className="border-y border-black/10 bg-[#f6f1e4]">
      <div ref={wrapRef} className="mx-auto grid max-w-[1180px] grid-cols-2 gap-y-8 px-7 py-13 text-center md:grid-cols-4">
        {STATS.map((s, i) => (
          <div key={s.label} className={`px-3 ${i !== STATS.length - 1 ? 'md:border-r md:border-black/10' : ''}`}>
            <div className="stat-num font-['Oswald'] text-[clamp(30px,4vw,46px)] font-semibold text-[#b23a2e]" data-target={s.target}>
              0
            </div>
            <div className="mt-2 text-[13px] uppercase tracking-[0.05em] text-[#5c656b]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const gridRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      gridRef.current.querySelectorAll('.review-card'),
      { y: 24, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: gridRef.current, start: 'top 85%' },
      },
    );
  }, []);

  return (
    <section id="reviews" className="py-24">
      <div className="mx-auto max-w-[1180px] px-7">
        <div className="mb-14 max-w-xl">
          <span className="mb-3.5 block font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.16em] text-[#b23a2e]">
            Rider notes
          </span>
          <h2 className="text-[clamp(28px,3.6vw,42px)] leading-[1.15] text-[#12283b]">What the road says back</h2>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <Card key={r.name} className="review-card rounded-sm border border-black/10 bg-[#fffdf6] shadow-none">
              <CardBody className="p-7">
                <p className="text-[15px] leading-relaxed text-[#3a4045]">{r.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar className="h-9 w-9 !bg-[#2f4a3a] !text-white">
                    <Avatar.Fallback>{r.initials}</Avatar.Fallback>
                  </Avatar>
                  <div>
                    <div className="text-[14px] font-semibold text-[#12283b]">{r.name}</div>
                    <div className="text-[12.5px] text-[#8a9095]">{r.route}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section
      id="contact"
      className="bg-gradient-to-br from-[#2f4a3a] to-[#12283b] px-7 py-24 text-center text-white"
    >
      <div className="mx-auto max-w-2xl">
        <h2 className="text-[clamp(28px,4vw,44px)] leading-tight">
          Your seat is waiting at the New Buspark counter.
        </h2>
        <p className="mt-4 text-[16px] text-[#cfd8db]">
          Call ahead or walk in — tickets open two weeks before travel on every route.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="tel:+9779800000000"
            className="inline-flex items-center justify-center rounded-full bg-[#d9a441] px-6 py-3 text-base font-semibold text-[#0d1e2c] transition hover:bg-[#f0c877]"
          >
            Call +977-98-0000-0000
          </a>
          <a
            href="#top"
            className="inline-flex items-center justify-center rounded-full border border-white/50 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Back to top
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0d1e2c] py-16 text-[#c6cdd1]">
      <div className="mx-auto max-w-[1180px] px-7">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-11 md:grid-cols-4">
          <div>
            <div className="mb-3.5 font-['Oswald'] text-[22px] font-bold text-white">MAHAKALI YATAYAT</div>
            <p className="max-w-[280px] text-[14px] leading-[1.9] text-[#a6afb3]">
              VIP sofa coach service connecting Kathmandu to the far-western highway towns, running
              since 2004.
            </p>
            <div className="mt-4 flex gap-3.5">
              {['f', 'ig', 'yt'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-[13px] hover:border-[#d9a441] hover:text-[#f0c877]"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-['Oswald'] text-[14px] uppercase tracking-[0.1em] text-white">Routes</h4>
            <ul className="space-y-0 text-[14px] leading-[2] text-[#a6afb3]">
              <li><a href="#routes" className="hover:text-[#f0c877]">Kathmandu → Mahendranagar</a></li>
              <li><a href="#routes" className="hover:text-[#f0c877]">Kathmandu → Dhangadi</a></li>
              <li><a href="#routes" className="hover:text-[#f0c877]">Kathmandu → Kohalpur</a></li>
              <li><a href="#routes" className="hover:text-[#f0c877]">Kathmandu → Butwal</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-['Oswald'] text-[14px] uppercase tracking-[0.1em] text-white">Company</h4>
            <ul className="space-y-0 text-[14px] leading-[2] text-[#a6afb3]">
              <li><a href="#fleet" className="hover:text-[#f0c877]">Our fleet</a></li>
              <li><a href="#why" className="hover:text-[#f0c877]">Why us</a></li>
              <li><a href="#reviews" className="hover:text-[#f0c877]">Rider reviews</a></li>
              <li><a href="#contact" className="hover:text-[#f0c877]">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-['Oswald'] text-[14px] uppercase tracking-[0.1em] text-white">Terminal</h4>
            <p className="text-[14px] leading-[1.9] text-[#a6afb3]">
              New Buspark, Gongabu
              <br />
              Kathmandu, Nepal
            </p>
            <p className="text-[14px] leading-[1.9] text-[#a6afb3]">Open daily · 5:00 AM – 9:00 PM</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 text-[13px] text-[#7c868b]">
          <span>© 2026 Mahakali Yatayat Pvt. Ltd. All rights reserved.</span>
          <span>Built for the highway, not the brochure.</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingMvp() {
  return (
    <div className="bg-[#f6f1e4] text-[#12283b]">
      <Navbar />
      <Hero />
      <Ticker />
      <Routes />
      <Fleet />
      <Features />
      <Stats />
      <Testimonials />
      <CtaBanner />
      <Footer />
    </div>
  );
}
