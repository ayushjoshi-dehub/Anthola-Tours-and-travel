const fs = require('fs');
const path = require('path');
const Route = require('../models/Route');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
const { reviewPayment: reviewPaymentCore } = require('./payments.controller');

const photoDir = path.join(__dirname, '..', 'uploads', 'bus-photos');

function ensurePhotoDir() {
  fs.mkdirSync(photoDir, { recursive: true });
}

function parseBase64Image(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) return null;
  const mimeType = match[1].toLowerCase().replace('jpg', 'jpeg');
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) return null;
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  return { buffer, mimeType, ext };
}

async function listMyRoutes(req, res) {
  const includeInactive = String(req.query.includeInactive || '') === '1';
  const q = { ownerId: req.user.id };
  if (!includeInactive) q.isActive = true;
  const routes = await Route.find(q).sort({ createdAt: -1 }).lean();
  return res.json({ routes });
}

async function uploadBusPhoto(req, res) {
  const { routeId, imageBase64 } = req.body || {};
  if (!routeId || !imageBase64) {
    return res.status(400).json({ message: 'routeId and imageBase64 are required' });
  }

  const route = await Route.findOne({ routeId }).lean();
  if (!route) return res.status(404).json({ message: 'Route not found' });
  if (req.user.role === 'BUS_OWNER' && route.ownerId && String(route.ownerId) !== String(req.user.id)) {
    return res.status(403).json({ message: 'Bus owner access only' });
  }

  const parsed = parseBase64Image(imageBase64);
  if (!parsed) {
    return res.status(400).json({ message: 'Invalid image upload. Use png, jpeg, or webp and keep it under 5 MB.' });
  }

  ensurePhotoDir();
  const safeRouteId = String(route.routeId || routeId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeRouteId}-${Date.now()}.${parsed.ext}`;
  fs.writeFileSync(path.join(photoDir, fileName), parsed.buffer);
  const busPhotoUrl = `/uploads/bus-photos/${fileName}`;

  const updated = await Route.findOneAndUpdate(
    { routeId },
    { $set: { busPhotoUrl } },
    { new: true }
  );
  return res.json({ route: updated.toObject(), busPhotoUrl });
}

async function listMyPayments(req, res) {
  const { status } = req.query || {};
  const ownedRoutes = await Route.find({ ownerId: req.user.id }).select('routeId').lean();
  const routeIds = ownedRoutes.map((r) => r.routeId);
  const q = { routeId: { $in: routeIds } };
  if (status) q.status = String(status).toUpperCase();
  const payments = await Payment.find(q).sort({ createdAt: -1 }).limit(200).lean();
  return res.json({ payments });
}

async function reviewOwnerPayment(req, res) {
  return reviewPaymentCore(req, res);
}

async function listMyBookings(req, res) {
  const ownedRoutes = await Route.find({ ownerId: req.user.id }).select('routeId').lean();
  const routeIds = ownedRoutes.map((r) => r.routeId);
  const bookings = await Booking.find({ routeId: { $in: routeIds } }).sort({ createdAt: -1 }).limit(300).lean();
  return res.json({ bookings });
}

async function listMyCoupons(req, res) {
  const ownedRoutes = await Route.find({ ownerId: req.user.id }).select('routeId').lean();
  const routeIds = ownedRoutes.map((r) => r.routeId);
  const coupons = await Coupon.find({
    $or: [
      { createdBy: req.user.id },
      { routeId: { $in: routeIds } },
      { routeId: '' }
    ]
  }).sort({ createdAt: -1 }).lean();
  return res.json({ coupons });
}

async function createCoupon(req, res) {
  const {
    code,
    title,
    description,
    routeId,
    discountType,
    discountValue,
    usageLimit,
    expiresAt,
    isActive
  } = req.body || {};

  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode || !discountValue) {
    return res.status(400).json({ message: 'code and discountValue are required' });
  }

  if (routeId) {
    const route = await Route.findOne({ routeId }).select('ownerId').lean();
    if (!route) return res.status(404).json({ message: 'Route not found' });
    if (String(route.ownerId || '') !== String(req.user.id)) {
      return res.status(403).json({ message: 'Bus owner access only' });
    }
  }

  const existing = await Coupon.findOne({ code: normalizedCode }).lean();
  if (existing) {
    return res.status(409).json({ message: 'Coupon code already exists' });
  }

  const coupon = await Coupon.create({
    code: normalizedCode,
    title: String(title || '').trim(),
    description: String(description || '').trim(),
    routeId: String(routeId || '').trim(),
    discountType: String(discountType || 'PERCENTAGE').toUpperCase() === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
    discountValue: Number(discountValue || 0),
    usageLimit: Math.max(0, Number(usageLimit || 0)),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    isActive: typeof isActive === 'boolean' ? isActive : true,
    createdBy: req.user.id
  });

  return res.status(201).json({ coupon: coupon.toObject() });
}

async function toggleCoupon(req, res) {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  if (coupon.createdBy && String(coupon.createdBy) !== String(req.user.id)) {
    return res.status(403).json({ message: 'Bus owner access only' });
  }
  coupon.isActive = typeof req.body?.isActive === 'boolean' ? req.body.isActive : !coupon.isActive;
  await coupon.save();
  return res.json({ coupon: coupon.toObject() });
}

module.exports = {
  listMyRoutes,
  uploadBusPhoto,
  listMyPayments,
  reviewOwnerPayment,
  listMyBookings,
  listMyCoupons,
  createCoupon,
  toggleCoupon
};
