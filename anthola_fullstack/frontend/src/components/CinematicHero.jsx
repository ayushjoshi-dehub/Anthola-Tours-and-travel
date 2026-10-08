/**
 * CinematicHero.jsx
 * Premium 2D scroll-driven bus journey across Nepal.
 * Technology: React, GSAP, GSAP ScrollTrigger, CSS — NO Three.js / WebGL.
 */
import React, { useEffect, useLayoutEffect, useRef, useState, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import busImageSrc from '../assets/anthola/bus.png';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   SCENE DATA
   Each scene owns: sky gradient, overlay mood colour,
   mountain hue, mist opacity, label, and an atmosphere note.
───────────────────────────────────────────── */
const SCENES = [
  {
    id: 'ktm',
    label: 'KATHMANDU',
    sub: 'Valley of temples & morning mist',
    sky: 'linear-gradient(175deg, #f9a04b 0%, #e8702a 22%, #c0454a 55%, #6b2d6e 100%)',
    mood: 'rgba(139,62,20,0.22)',
    mtnHue: '#3d2040',
    hilHue: '#2e5539',
    fogOp: 0.38,
    light: '#ffb86c',
  },
  {
    id: 'mgl',
    label: 'MUGLIN',
    sub: 'Winding highway through the gorge',
    sky: 'linear-gradient(175deg, #cde8f7 0%, #8ec9e8 28%, #4b9abf 62%, #1e5b7e 100%)',
    mood: 'rgba(20,60,100,0.18)',
    mtnHue: '#1b3a52',
    hilHue: '#1f5c35',
    fogOp: 0.52,
    light: '#a8d8f0',
  },
  {
    id: 'pkr',
    label: 'POKHARA',
    sub: 'Open skies above Phewa Lake',
    sky: 'linear-gradient(175deg, #e8f4fb 0%, #b8ddf5 28%, #74b8e8 65%, #3a82bc 100%)',
    mood: 'rgba(10,40,80,0.10)',
    mtnHue: '#3a6285',
    hilHue: '#2b7042',
    fogOp: 0.15,
    light: '#fffbe0',
  },
  {
    id: 'ddh',
    label: 'DADELDHURA',
    sub: 'Golden ridges of the far west',
    sky: 'linear-gradient(175deg, #ffd180 0%, #f0a030 30%, #c26020 65%, #4a2015 100%)',
    mood: 'rgba(100,50,10,0.22)',
    mtnHue: '#5c3018',
    hilHue: '#3d6820',
    fogOp: 0.30,
    light: '#ffc060',
  },
  {
    id: 'mhn',
    label: 'MAHENDRANAGAR',
    sub: 'Arrive. Explore. Belong.',
    sky: 'linear-gradient(175deg, #ffb347 0%, #e06030 28%, #8b2020 60%, #2a0a10 100%)',
    mood: 'rgba(80,20,10,0.28)',
    mtnHue: '#2a1010',
    hilHue: '#4a3010',
    fogOp: 0.20,
    light: '#ff9040',
  },
];

/* ─────────────────────────────────────────────
   JOURNEY FINDER (booking widget — functional, uses real API data)
───────────────────────────────────────────── */
function queryLink(route, search) {
  if (!route) return '/booking';
  const params = new URLSearchParams({
    routeId: route.routeId,
    date: search.date,
    passengers: String(search.passengers),
  });
  return `/booking?${params.toString()}`;
}

const JourneyFinder = memo(function JourneyFinder({ routes }) {
  const [search, setSearch] = useState({
    from: 'Kathmandu',
    to: 'Mahendranagar',
    date: new Date().toISOString().slice(0, 10),
    passengers: 2,
  });

  const matches = useMemo(
    () =>
      routes.filter((r) => {
        const o = search.from.trim().toLowerCase();
        const d = search.to.trim().toLowerCase();
        return (
          (!o || r.from?.toLowerCase().includes(o)) &&
          (!d || r.to?.toLowerCase().includes(d))
        );
      }),
    [routes, search.from, search.to],
  );

  const selectedRoute = matches[0] || routes[0];

  function update(name, value) {
    setSearch((c) => ({ ...c, [name]: value }));
  }

  return (
    <div className="ch-finder" id="journey-finder">
      <div className="ch-finder-header">
        <span className="ch-finder-title">Find Your Journey</span>
        <small className="ch-finder-sub">Real departures · Anthola operators</small>
      </div>
      <div className="ch-finder-fields">
        <label className="ch-finder-field">
          <span className="ch-finder-label">FROM</span>
          <input
            list="ch-origins"
            value={search.from}
            onChange={(e) => update('from', e.target.value)}
            aria-label="From"
            className="ch-finder-input"
            placeholder="Departure city"
          />
        </label>
        <div className="ch-finder-swap" aria-hidden="true">⇄</div>
        <label className="ch-finder-field">
          <span className="ch-finder-label">TO</span>
          <input
            list="ch-destinations"
            value={search.to}
            onChange={(e) => update('to', e.target.value)}
            aria-label="To"
            className="ch-finder-input"
            placeholder="Destination city"
          />
        </label>
        <label className="ch-finder-field ch-finder-field--date">
          <span className="ch-finder-label">DATE</span>
          <input
            type="date"
            value={search.date}
            onChange={(e) => update('date', e.target.value)}
            aria-label="Travel date"
            className="ch-finder-input"
          />
        </label>
        <label className="ch-finder-field ch-finder-field--pax">
          <span className="ch-finder-label">SEATS</span>
          <select
            value={search.passengers}
            onChange={(e) => update('passengers', Number(e.target.value))}
            aria-label="Passengers"
            className="ch-finder-input"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <Link to={queryLink(selectedRoute, search)} className="ch-finder-submit">
          <span>FIND JOURNEY</span>
          <span className="ch-finder-arrow">↗</span>
        </Link>
      </div>
      <datalist id="ch-origins">
        {[...new Set(routes.map((r) => r.from))].map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="ch-destinations">
        {[...new Set(routes.map((r) => r.to))].map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      {(search.from || search.to) && (
        <div className="ch-finder-match">
          {matches.length
            ? `${matches.length} route${matches.length === 1 ? '' : 's'} available`
            : 'No exact match — browse all journeys in booking'}
        </div>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────
   MOUNTAIN LAYER — inline SVG silhouettes, 3 depth passes
───────────────────────────────────────────── */
function MountainLayer({ colorFar, colorMid }) {
  return (
    <div className="ch-mountains" aria-hidden="true">
      {/* Far peaks */}
      <svg className="ch-mtn ch-mtn--far" viewBox="0 0 1440 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,280 L0,180 L60,130 L130,160 L200,90 L280,50 L360,110 L420,70 L500,30 L580,80 L650,20 L720,60 L800,15 L880,55 L940,25 L1020,70 L1100,40 L1180,90 L1260,55 L1340,100 L1440,60 L1440,280 Z"
          fill={colorFar || '#2a1040'}
          opacity="0.9"
        />
      </svg>
      {/* Mid peaks */}
      <svg className="ch-mtn ch-mtn--mid" viewBox="0 0 1440 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,220 L0,170 L80,120 L160,150 L240,90 L320,130 L400,70 L480,110 L560,50 L640,90 L720,40 L800,80 L880,110 L960,60 L1040,100 L1120,70 L1200,110 L1280,80 L1360,130 L1440,100 L1440,220 Z"
          fill={colorMid || '#1a2040'}
          opacity="0.85"
        />
      </svg>
      {/* Snow caps — small white triangles on highest peaks */}
      <svg className="ch-mtn ch-mtn--snow" viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="500,0 480,30 520,30" fill="rgba(255,255,255,0.75)" />
        <polygon points="720,10 700,36 740,36" fill="rgba(255,255,255,0.70)" />
        <polygon points="940,5 920,32 960,32" fill="rgba(255,255,255,0.68)" />
        <polygon points="280,20 262,44 298,44" fill="rgba(255,255,255,0.55)" />
        <polygon points="1100,15 1082,40 1118,40" fill="rgba(255,255,255,0.52)" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HILLS LAYER — rolling green hills, 2 depth passes
───────────────────────────────────────────── */
function HillsLayer({ color }) {
  return (
    <div className="ch-hills" aria-hidden="true">
      <svg className="ch-hill ch-hill--back" viewBox="0 0 1440 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,180 C120,140 240,100 360,120 C480,140 600,90 720,110 C840,130 960,80 1080,100 C1200,120 1320,90 1440,110 L1440,180 Z"
          fill={color || '#1e5c30'}
          opacity="0.82"
        />
      </svg>
      <svg className="ch-hill ch-hill--front" viewBox="0 0 1440 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,160 C100,120 200,100 320,118 C440,136 540,90 660,108 C780,126 880,95 1000,112 C1120,129 1280,100 1440,115 L1440,160 Z"
          fill={color ? shadeColor(color, -20) : '#155224'}
          opacity="0.90"
        />
      </svg>
    </div>
  );
}

function shadeColor(hex, pct) {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + pct));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + pct));
    const b = Math.min(255, Math.max(0, (num & 0xff) + pct));
    return `rgb(${r},${g},${b})`;
  } catch {
    return hex;
  }
}

/* ─────────────────────────────────────────────
   TREES LAYER — silhouette pines, fastest parallax
───────────────────────────────────────────── */
function TreesLayer() {
  const trees = [
    { x: 2, h: 120, delay: 0 },
    { x: 6, h: 140, delay: 0.3 },
    { x: 10, h: 100, delay: 0.6 },
    { x: 14, h: 130, delay: 0.1 },
    { x: 18, h: 115, delay: 0.5 },
    { x: 78, h: 108, delay: 0.2 },
    { x: 82, h: 135, delay: 0.4 },
    { x: 86, h: 118, delay: 0.7 },
    { x: 90, h: 125, delay: 0.1 },
    { x: 94, h: 112, delay: 0.6 },
  ];
  return (
    <div className="ch-trees" aria-hidden="true">
      <svg className="ch-trees-svg" viewBox="0 0 100 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {trees.map(({ x, h }, i) => (
          <g key={i} transform={`translate(${x}, ${160 - h})`}>
            <rect x="-0.3" y={h * 0.6} width="0.6" height={h * 0.4} fill="#1a2a18" />
            <polygon
              points={`0,0 -3,${h * 0.45} 3,${h * 0.45}`}
              fill="#162418"
              opacity="0.9"
            />
            <polygon
              points={`0,${h * 0.2} -3.5,${h * 0.7} 3.5,${h * 0.7}`}
              fill="#0f1c10"
              opacity="0.85"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROAD LAYER — asphalt + looping lane markings
───────────────────────────────────────────── */
function RoadLayer() {
  return (
    <div className="ch-road" aria-hidden="true">
      <div className="ch-road-asphalt" />
      <div className="ch-road-marks-track">
        <div className="ch-road-marks">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="ch-road-dash" />
          ))}
        </div>
        <div className="ch-road-marks" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="ch-road-dash" />
          ))}
        </div>
      </div>
      <div className="ch-road-edge ch-road-edge--left" />
      <div className="ch-road-edge ch-road-edge--right" />
      <div className="ch-road-shoulder ch-road-shoulder--left" />
      <div className="ch-road-shoulder ch-road-shoulder--right" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   CLOUD LAYER — drifting atmospheric shapes
───────────────────────────────────────────── */
function CloudLayer() {
  return (
    <div className="ch-clouds" aria-hidden="true">
      <div className="ch-cloud ch-cloud--1" />
      <div className="ch-cloud ch-cloud--2" />
      <div className="ch-cloud ch-cloud--3" />
      <div className="ch-cloud ch-cloud--4" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   JOURNEY PROGRESS — minimal route indicator
───────────────────────────────────────────── */
const JourneyProgress = memo(function JourneyProgress({ activeIndex }) {
  return (
    <div className="ch-progress" role="navigation" aria-label="Journey progress">
      {SCENES.map((scene, i) => (
        <React.Fragment key={scene.id}>
          <div className={`ch-progress-stop ${i === activeIndex ? 'is-active' : i < activeIndex ? 'is-done' : ''}`}>
            <div className="ch-progress-dot" />
            <span className="ch-progress-name">{scene.label}</span>
          </div>
          {i < SCENES.length - 1 && (
            <div className={`ch-progress-line ${i < activeIndex ? 'is-done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

/* ─────────────────────────────────────────────
   FILM GRAIN OVERLAY
───────────────────────────────────────────── */
function FilmGrain() {
  return (
    <svg className="ch-grain" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <filter id="ch-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feBlend in="SourceGraphic" mode="overlay" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ch-noise)" opacity="0.042" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   LANDING NAV — preserved from LandingMvp
───────────────────────────────────────────── */
function LandingNav() {
  const auth = useAuth();
  const navRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () =>
      gsap.to(navRef.current, {
        backgroundColor:
          window.scrollY > 24
            ? 'rgba(13,31,35,0.96)'
            : 'rgba(13,31,35,0.12)',
        duration: 0.25,
        overwrite: true,
      });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header ref={navRef} className="landing-nav">
      <Link to="/" className="landing-brand">
        <span className="landing-brand-mark">A</span>
        <span>Anthola Travels</span>
      </Link>
      <nav className={menuOpen ? 'landing-links is-open' : 'landing-links'}>
        <a href="#journey-finder">Journey</a>
        <Link to="/booking">Book</Link>
        <Link to="/tours">Tours</Link>
        <a href="#route-story">About</a>
      </nav>
      <div className="landing-nav-actions">
        <Link
          to={auth.user?.role === 'BUS_OWNER' ? '/dashboard' : '/auth'}
          className="landing-login"
        >
          {auth.user ? 'Account' : 'Login'}
        </Link>
        <button
          type="button"
          className="landing-menu-button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Open navigation"
        >
          Menu
        </button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
   CINEMATIC HERO — main component
───────────────────────────────────────────── */
export default function CinematicHero({ routes }) {
  const wrapRef = useRef(null);    // outer scroll-pin wrapper
  const stageRef = useRef(null);   // visible full-screen stage
  const busRef = useRef(null);     // the bus image
  const skyRef = useRef(null);     // sky gradient layer
  const moodRef = useRef(null);    // colour mood overlay
  const mtnRef = useRef(null);     // mountain group
  const hillRef = useRef(null);    // hill group
  const treeRef = useRef(null);    // tree group
  const cloudRef = useRef(null);   // cloud group
  const labelRef = useRef(null);   // scene label text
  const subRef = useRef(null);     // scene sub-label
  const progressRef = useRef(null);// progress bar track
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current;

  const [activeScene, setActiveScene] = useState(0);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768,
  );

  /* ── Resize listener ── */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mq.matches);
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  /* ── GSAP animation system ── */
  useLayoutEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const sceneCount = SCENES.length;

      /* ─ continuous bus suspension ─ */
      const suspensionTl = gsap.timeline({ repeat: -1, yoyo: true });
      suspensionTl
        .to(busRef.current, {
          y: '+=4',
          rotation: 0.35,
          duration: 1.7,
          ease: 'sine.inOut',
        })
        .to(busRef.current, {
          y: '-=2',
          rotation: -0.2,
          duration: 1.1,
          ease: 'sine.inOut',
        });

      /* ─ cloud drift ─ */
      const clouds = cloudRef.current?.querySelectorAll('.ch-cloud');
      if (clouds) {
        clouds.forEach((cloud, i) => {
          gsap.to(cloud, {
            x: `+=${40 + i * 18}`,
            duration: 22 + i * 8,
            repeat: -1,
            yoyo: true,
            ease: 'none',
            delay: i * 3,
          });
        });
      }

      /* ─ scroll-driven main timeline ─ */
      const pinEnd = isMobile ? '+=2000' : '+=4800';

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top top',
          end: pinEnd,
          pin: stageRef.current,
          scrub: 1.8,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(
              sceneCount - 1,
              Math.floor(self.progress * sceneCount),
            );
            setActiveScene(idx);
          },
        },
      });

      /* helper: crossfade sky + mood colour */
      function toScene(scene, duration = 1) {
        return [
          gsap.to(skyRef.current, {
            background: scene.sky,
            duration,
            ease: 'power2.inOut',
          }),
          gsap.to(moodRef.current, {
            backgroundColor: scene.mood,
            duration,
            ease: 'power2.inOut',
          }),
        ];
      }

      /* helper: reveal scene label */
      function labelReveal(scene, duration = 0.6) {
        return gsap.timeline()
          .set(labelRef.current, { textContent: scene.label })
          .set(subRef.current, { textContent: scene.sub })
          .fromTo(
            [labelRef.current, subRef.current],
            { opacity: 0, y: 18, letterSpacing: '0.5em' },
            { opacity: 1, y: 0, letterSpacing: '0.25em', duration, ease: 'power3.out', stagger: 0.12 },
          );
      }

      /* helper: parallax layers */
      function parallaxTo(factor, totalProgress) {
        return {
          mountains: { x: -factor * 0.08 * totalProgress },
          hills: { x: -factor * 0.18 * totalProgress },
          trees: { x: -factor * 0.38 * totalProgress },
        };
      }

      /* ── SCENE 0: Kathmandu (initial state) ── */
      gsap.set(skyRef.current, { background: SCENES[0].sky });
      gsap.set(moodRef.current, { backgroundColor: SCENES[0].mood });
      gsap.set(labelRef.current, { textContent: SCENES[0].label, opacity: 0 });
      gsap.set(subRef.current, { textContent: SCENES[0].sub, opacity: 0 });

      /* Reveal on load */
      gsap.timeline({ delay: 0.4 })
        .fromTo(busRef.current, { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: 1.4, ease: 'power3.out' })
        .add(labelReveal(SCENES[0], 0.8), '-=0.6');

      /* ── SCROLL SECTIONS ── */
      const sectionDuration = 1 / (sceneCount - 1);

      SCENES.forEach((scene, i) => {
        if (i === 0) return; // initial is set above

        const start = (i - 1) * sectionDuration;
        const mid = start + sectionDuration * 0.35;
        const end = start + sectionDuration;

        master
          .addLabel(`scene-${i}`, start)
          /* sky/mood transition */
          .to(
            skyRef.current,
            { background: scene.sky, duration: sectionDuration * 0.7, ease: 'power2.inOut' },
            start,
          )
          .to(
            moodRef.current,
            { backgroundColor: scene.mood, duration: sectionDuration * 0.7, ease: 'power2.inOut' },
            start,
          )
          /* mountains shift */
          .to(
            mtnRef.current,
            { x: `-=${i * 6}vw`, duration: sectionDuration, ease: 'none' },
            start,
          )
          /* hills shift faster */
          .to(
            hillRef.current,
            { x: `-=${i * 14}vw`, duration: sectionDuration, ease: 'none' },
            start,
          )
          /* trees shift fastest */
          .to(
            treeRef.current,
            { x: `-=${i * 28}vw`, duration: sectionDuration, ease: 'none' },
            start,
          )
          /* bus tilt on scene change */
          .to(
            busRef.current,
            { rotation: 1.2, duration: sectionDuration * 0.2, ease: 'power2.in' },
            start,
          )
          .to(
            busRef.current,
            { rotation: 0, duration: sectionDuration * 0.3, ease: 'power2.out' },
            start + sectionDuration * 0.2,
          )
          /* label reveal at mid-scene */
          .fromTo(
            labelRef.current,
            { opacity: 0, y: 14 },
            {
              textContent: scene.label,
              opacity: 1,
              y: 0,
              duration: sectionDuration * 0.28,
              ease: 'power3.out',
              onStart: () => {
                if (labelRef.current) labelRef.current.textContent = scene.label;
                if (subRef.current) subRef.current.textContent = scene.sub;
              },
            },
            mid,
          )
          .fromTo(
            subRef.current,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: sectionDuration * 0.25, ease: 'power3.out' },
            mid + sectionDuration * 0.06,
          )
          /* label fade before next scene */
          .to(
            [labelRef.current, subRef.current],
            { opacity: 0, duration: sectionDuration * 0.18, ease: 'power2.in' },
            end - sectionDuration * 0.18,
          );
      });

    }, wrapRef);

    return () => ctx.revert();
  }, [isMobile, reducedMotion]);

  /* ─────────────────── REDUCED MOTION — static ─────────────────── */
  if (reducedMotion) {
    return (
      <section className="ch-wrap ch-wrap--static" role="img" aria-label="Anthola Travels bus on a Himalayan highway">
        <div className="ch-stage ch-stage--static">
          <div className="ch-sky" style={{ background: SCENES[2].sky }} />
          <MountainLayer colorFar={SCENES[2].mtnHue} colorMid={shadeColor(SCENES[2].mtnHue, 20)} />
          <HillsLayer color={SCENES[2].hilHue} />
          <RoadLayer />
          <img src={busImageSrc} alt="Anthola Travels luxury bus" className="ch-bus ch-bus--static" />
          <div className="ch-copy ch-copy--static">
            <span className="ch-eyebrow">Anthola Travels · Nepal</span>
            <h1 className="ch-headline">Your Road.<br /><em>Your Story.</em></h1>
          </div>
          <JourneyFinder routes={routes} />
        </div>
      </section>
    );
  }

  /* ─────────────────── FULL CINEMATIC ─────────────────── */
  return (
    <div ref={wrapRef} className="ch-wrap">
      {/* ── Pinned full-screen stage ── */}
      <div ref={stageRef} className="ch-stage" role="region" aria-label="Cinematic Nepal bus journey">

        {/* ── Sky gradient ── */}
        <div ref={skyRef} className="ch-sky" style={{ background: SCENES[0].sky }} />

        {/* ── Mood overlay ── */}
        <div ref={moodRef} className="ch-mood" style={{ backgroundColor: SCENES[0].mood }} />

        {/* ── Atmosphere / fog ── */}
        <div className="ch-atmosphere" />

        {/* ── Clouds ── */}
        <div ref={cloudRef}>
          <CloudLayer />
        </div>

        {/* ── Mountains ── */}
        <div ref={mtnRef} className="ch-parallax-group ch-parallax-group--mtn">
          <MountainLayer colorFar="#2a1040" colorMid="#1a2040" />
        </div>

        {/* ── Hills ── */}
        <div ref={hillRef} className="ch-parallax-group ch-parallax-group--hill">
          <HillsLayer color="#1e5c30" />
        </div>

        {/* ── Trees ── */}
        <div ref={treeRef} className="ch-parallax-group ch-parallax-group--tree">
          <TreesLayer />
        </div>

        {/* ── Road ── */}
        <RoadLayer />

        {/* ── Ground / road base shadow ── */}
        <div className="ch-ground-shadow" />

        {/* ── Bus ── */}
        <div className="ch-bus-wrapper">
          <img
            ref={busRef}
            src={busImageSrc}
            alt="Anthola Travels luxury bus travelling through Nepal"
            className="ch-bus"
            draggable={false}
          />
          {/* Bus shadow */}
          <div className="ch-bus-shadow" />
        </div>

        {/* ── Foreground dust strip ── */}
        <div className="ch-foreground-dust" />

        {/* ── Film grain ── */}
        <FilmGrain />

        {/* ── Hero headline ── */}
        <div className="ch-copy">
          <span className="ch-eyebrow">Anthola Travels · Nepal</span>
          <h1 className="ch-headline">
            Your Road.
            <br />
            <em>Your Story.</em>
          </h1>
          <div className="ch-cta-group">
            <a href="#journey-finder" className="ch-cta ch-cta--primary">
              Explore Journeys <span>↓</span>
            </a>
            <Link to="/booking" className="ch-cta ch-cta--outline">
              Book a Bus <span>↗</span>
            </Link>
          </div>
        </div>

        {/* ── Scene label ── */}
        <div className="ch-scene-label" aria-live="polite">
          <div ref={labelRef} className="ch-scene-name" />
          <div ref={subRef} className="ch-scene-sub" />
        </div>

        {/* ── Journey progress ── */}
        <JourneyProgress activeIndex={activeScene} />

        {/* ── Journey finder (booking widget) ── */}
        <JourneyFinder routes={routes} />

        {/* ── Scroll indicator ── */}
        <div className="ch-scroll-hint" aria-hidden="true">
          <span className="ch-scroll-line" />
          <span className="ch-scroll-text">Scroll to travel</span>
          <span className="ch-scroll-line" />
        </div>

      </div>
    </div>
  );
}
