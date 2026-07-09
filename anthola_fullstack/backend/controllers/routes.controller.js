const Route = require('../models/Route');
const { logActivity } = require('../utils/notifications');

async function listRoutes(req, res) {
  const includeInactive = String(req.query.includeInactive || '') === '1';
  const mine = String(req.query.mine || '') === '1';

  let q = includeInactive ? {} : { isActive: true };
  if (mine) {
    if (!req.user) return res.status(401).json({ message: 'Missing token' });
    if (req.user.role === 'BUS_OWNER') q = { ...q, ownerId: req.user.id };
  }
  const routes = await Route.find(q).sort({ createdAt: -1 }).lean();
  return res.json({ routes });
}

async function getRoute(req, res) {
  const routeId = String(req.params.routeId || '').trim();
  if (!routeId) return res.status(400).json({ message: 'routeId is required' });
  const route = await Route.findOne({ routeId }).lean();
  if (!route || (!route.isActive && String(req.query.includeInactive || '') !== '1')) {
    return res.status(404).json({ message: 'Route not found' });
  }
  return res.json({ route });
}

async function upsertRoute(req, res) {
  const {
    routeId,
    from,
    to,
    duration,
    price,
    badges,
    isActive,
    busName,
    busNumber,
    busPhotoUrl,
    busGalleryUrls,
    busDescription,
    services,
    driverName,
    driverPhone,
    driverLicense,
    seatCount,
    discountPercent,
    paymentProvider,
    paymentAccountName,
    paymentPhone,
    paymentQrUrl,
    paymentNote
  } = req.body || {};
  if (!routeId || !from || !to || !duration) {
    return res.status(400).json({ message: 'routeId, from, to, duration are required' });
  }

  const normalized = {
    routeId: String(routeId).trim(),
    busName: String(busName || 'Bus').trim(),
    busNumber: String(busNumber || '').trim(),
    busPhotoUrl: String(busPhotoUrl || '').trim(),
    busGalleryUrls: Array.isArray(busGalleryUrls)
      ? busGalleryUrls.map(String).map(s => s.trim()).filter(Boolean)
      : String(busGalleryUrls || '').split(',').map(s => s.trim()).filter(Boolean),
    busDescription: String(busDescription || '').trim(),
    services: Array.isArray(services)
      ? services.map(String).map(s => s.trim()).filter(Boolean)
      : String(services || '').split(',').map(s => s.trim()).filter(Boolean),
    driverName: String(driverName || '').trim(),
    driverPhone: String(driverPhone || '').trim(),
    driverLicense: String(driverLicense || '').trim(),
    seatCount: Math.max(1, Math.min(80, Number(seatCount || 36))),
    discountPercent: Math.max(0, Math.min(100, Number(discountPercent || 0))),
    from: String(from).trim(),
    to: String(to).trim(),
    duration: String(duration).trim(),
    price: Number(price || 0),
    badges: Array.isArray(badges) ? badges.map(String) : String(badges || '').split(',').map(s => s.trim()).filter(Boolean),
    isActive: typeof isActive === 'boolean' ? isActive : true,

    paymentProvider: String(paymentProvider || 'eSewa').trim(),
    paymentAccountName: String(paymentAccountName || '').trim(),
    paymentPhone: String(paymentPhone || '').trim(),
    paymentQrUrl: String(paymentQrUrl || '').trim(),
    paymentNote: String(paymentNote || '').trim()
  };

  const existing = await Route.findOne({ routeId: normalized.routeId }).lean();
  if (existing && req.user.role === 'BUS_OWNER') {
    if (existing.ownerId && String(existing.ownerId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Bus owner access only' });
    }
  }

  const ownerId = (req.user.role === 'BUS_OWNER') ? req.user.id : (existing ? existing.ownerId : undefined);

  const doc = await Route.findOneAndUpdate(
    { routeId: normalized.routeId },
    { $set: { ...normalized, ownerId: ownerId || existing?.ownerId || null } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await logActivity({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: existing ? 'route.updated' : 'route.created',
    entityType: 'Route',
    entityId: doc.routeId,
    summary: `${req.user.role === 'BUS_OWNER' ? 'Bus owner' : 'Operator'} saved route ${doc.routeId}`
  });

  return res.json({ route: doc.toObject() });
}

async function setRouteActive(req, res) {
  const routeId = req.params.routeId;
  const { isActive } = req.body || {};
  const existing = await Route.findOne({ routeId }).select('ownerId').lean();
  if (!existing) return res.status(404).json({ message: 'Route not found' });
  if (req.user.role === 'BUS_OWNER' && existing.ownerId && String(existing.ownerId) !== String(req.user.id)) {
    return res.status(403).json({ message: 'Bus owner access only' });
  }

  const doc = await Route.findOneAndUpdate(
    { routeId },
    { $set: { isActive: !!isActive } },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: 'Route not found' });
  await logActivity({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'route.status_changed',
    entityType: 'Route',
    entityId: String(routeId),
    summary: `Route ${routeId} marked ${doc.isActive ? 'active' : 'inactive'}`
  });
  return res.json({ route: doc.toObject() });
}

async function seedRoutesIfEmpty() {
  const count = await Route.countDocuments();
  if (count > 0) return;
  await Route.insertMany([
    {
      routeId: 'ktm-pok',
      from: 'Kathmandu',
      to: 'Pokhara',
      duration: '6h 30m',
      price: 1500,
      badges: ['Popular', 'AC Deluxe'],
      isActive: true,
      busName: 'Anthola Express',
      busNumber: 'BA 2 KHA 1234',
      busPhotoUrl: '',
      busGalleryUrls: [],
      busDescription: 'Comfortable deluxe bus for Kathmandu to Pokhara travel.',
      services: ['Wi-Fi', 'USB charging', 'AC'],
      driverName: 'TBA',
      driverPhone: '98XXXXXXXX',
      driverLicense: 'N/A',
      seatCount: 36,
      discountPercent: 0,
      paymentProvider: 'eSewa',
      paymentAccountName: 'Anthola Tickets',
      paymentPhone: '98XXXXXXXX',
      paymentQrUrl: '',
      paymentNote: 'Pay via eSewa/Khalti/Fonepay and upload the screenshot for owner verification.'
    },
    {
      routeId: 'ktm-chi',
      from: 'Kathmandu',
      to: 'Chitwan',
      duration: '5h 15m',
      price: 1200,
      badges: ['Family', 'Tourist'],
      isActive: true,
      busName: 'Tourist Deluxe',
      busNumber: 'BA 3 CHA 8890',
      busPhotoUrl: '',
      busGalleryUrls: [],
      busDescription: 'Family-friendly tourist bus with smooth road handling.',
      services: ['AC Deluxe', 'Snacks'],
      driverName: 'TBA',
      driverPhone: '98XXXXXXXX',
      driverLicense: 'N/A',
      seatCount: 36,
      discountPercent: 10,
      paymentProvider: 'eSewa',
      paymentAccountName: 'Tourist Deluxe',
      paymentPhone: '98XXXXXXXX',
      paymentQrUrl: '',
      paymentNote: 'Screenshot upload is required after booking.'
    },
    {
      routeId: 'pok-lum',
      from: 'Pokhara',
      to: 'Lumbini',
      duration: '7h 10m',
      price: 1700,
      badges: ['Night Bus'],
      isActive: true,
      busName: 'Night Rider',
      busNumber: 'GA 1 KHA 4321',
      busPhotoUrl: '',
      busGalleryUrls: [],
      busDescription: 'Overnight service with flexible boarding support.',
      services: ['Night Bus', 'Blanket'],
      driverName: 'TBA',
      driverPhone: '98XXXXXXXX',
      driverLicense: 'N/A',
      seatCount: 36,
      discountPercent: 0,
      paymentProvider: 'eSewa',
      paymentAccountName: 'Night Rider',
      paymentPhone: '98XXXXXXXX',
      paymentQrUrl: '',
      paymentNote: 'Arrive 20 minutes early for boarding.'
    },
    {
      routeId: 'ktm-dhr',
      from: 'Kathmandu',
      to: 'Dharan',
      duration: '9h 30m',
      price: 2000,
      badges: ['Overnight'],
      isActive: true,
      busName: 'Eastern Express',
      busNumber: 'BA 5 KHA 5555',
      busPhotoUrl: '',
      busGalleryUrls: [],
      busDescription: 'Long-haul bus with reliable overnight schedule.',
      services: ['Overnight', 'AC'],
      driverName: 'TBA',
      driverPhone: '98XXXXXXXX',
      driverLicense: 'N/A',
      seatCount: 36,
      discountPercent: 5,
      paymentProvider: 'Khalti',
      paymentAccountName: 'Eastern Express',
      paymentPhone: '98XXXXXXXX',
      paymentQrUrl: '',
      paymentNote: 'Upload the payment screenshot after booking.'
    },
    {
      routeId: 'ktm-btw',
      from: 'Kathmandu',
      to: 'Butwal',
      duration: '9h 00m',
      price: 1900,
      badges: ['AC Deluxe'],
      isActive: true,
      busName: 'Western Link',
      busNumber: 'BA 6 KHA 2222',
      busPhotoUrl: '',
      busGalleryUrls: [],
      busDescription: 'Popular western corridor service for Butwal travelers.',
      services: ['AC', 'Charging'],
      driverName: 'TBA',
      driverPhone: '98XXXXXXXX',
      driverLicense: 'N/A',
      seatCount: 36,
      discountPercent: 0,
      paymentProvider: 'Bank Transfer',
      paymentAccountName: 'Western Link',
      paymentPhone: '98XXXXXXXX',
      paymentQrUrl: '',
      paymentNote: 'Manual verification by bus owner is supported.'
    }
  ]);
  console.log('[seed] Routes inserted');
}

module.exports = { listRoutes, getRoute, upsertRoute, setRouteActive, seedRoutesIfEmpty };
