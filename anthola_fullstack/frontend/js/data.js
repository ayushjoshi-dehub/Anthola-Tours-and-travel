export const ROUTES = [
  {
    id: 'ktm-pok',
    from: 'Kathmandu',
    to: 'Pokhara',
    duration: '6h 30m',
    price: 1500,
    badges: ['Popular', 'AC Deluxe'],
  },
  {
    id: 'ktm-chi',
    from: 'Kathmandu',
    to: 'Chitwan',
    duration: '5h 15m',
    price: 1200,
    badges: ['Family', 'Tourist'],
  },
  {
    id: 'pok-lum',
    from: 'Pokhara',
    to: 'Lumbini',
    duration: '7h 10m',
    price: 1700,
    badges: ['Night Bus'],
  },
  {
    id: 'ktm-ill',
    from: 'Kathmandu',
    to: 'Illam',
    duration: '12h 00m',
    price: 2200,
    badges: ['Scenic'],
  }
];

export const FEATURES = [
  { icon: 'fa-bolt', title: 'Fast Booking', desc: 'Pick route, choose seats, pay — done in minutes.' },
  { icon: 'fa-chair', title: 'Live Seats', desc: 'Real-time seat availability with clear status colors.' },
  { icon: 'fa-shield-halved', title: 'Safe Payments (demo)', desc: 'UI is ready — connect your payment gateway on backend.' },
  { icon: 'fa-headset', title: 'Support', desc: 'Contact form and FAQ section included.' }
];
