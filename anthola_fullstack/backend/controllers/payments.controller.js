const fs = require('fs');
const path = require('path');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Route = require('../models/Route');
const { writeBookingsSheet, writePaymentsSheet } = require('../utils/sheets');
const { createNotification, logActivity } = require('../utils/notifications');

const uploadDir = path.join(__dirname, '..', 'uploads', 'payment-proofs');

function ensureUploadDir() {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function makePaymentId() {
  return `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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

async function uploadPaymentProof(req, res) {
  const { bookingId, provider, paymentRef, proofImageBase64 } = req.body || {};
  if (!bookingId || !provider || !proofImageBase64) {
    return res.status(400).json({ message: 'bookingId, provider, proofImageBase64 are required' });
  }

  const booking = await Booking.findOne({ _id: bookingId, userId: req.user.id });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.bookingStatus === 'VERIFIED' || booking.bookingStatus === 'COMPLETED') {
    return res.status(409).json({ message: 'Booking is already verified' });
  }

  const parsed = parseBase64Image(proofImageBase64);
  if (!parsed) {
    return res.status(400).json({ message: 'Invalid image upload. Use png, jpeg, or webp and keep it under 5 MB.' });
  }

  ensureUploadDir();
  const safeBookingId = String(booking.bookingId || booking._id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeBookingId}-${Date.now()}.${parsed.ext}`;
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, parsed.buffer);

  const proofUrl = `/uploads/payment-proofs/${fileName}`;
  const paymentData = {
    paymentId: makePaymentId(),
    bookingId: booking._id,
    userId: req.user.id,
    bookingType: booking.bookingType || 'BUS',
    routeId: String(booking.routeId || ''),
    travelDate: String(booking.travelDate || booking.date || ''),
    provider: String(provider).trim(),
    amount: Number(booking.total || 0),
    proofUrl,
    proofMimeType: parsed.mimeType,
    proofOriginalName: 'payment-proof',
    paymentRef: String(paymentRef || '').trim(),
    status: 'PENDING',
    reviewNote: ''
  };

  const payment = await Payment.findOneAndUpdate(
    { bookingId: booking._id },
    { $set: paymentData },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  booking.paymentStatus = 'PAYMENT_UPLOADED';
  booking.bookingStatus = 'PAYMENT_UPLOADED';
  booking.paymentRef = String(paymentRef || '').trim();
  booking.paymentProofUrl = proofUrl;
  await booking.save();

  const routeOwner = await Route.findOne({ routeId: booking.routeId }).select('ownerId').lean();
  if (routeOwner?.ownerId) {
    const io = req.app.get('io');
    await createNotification({
      userId: routeOwner.ownerId,
      role: 'BUS_OWNER',
      type: 'payment.uploaded',
      title: 'New payment screenshot',
      message: `A passenger uploaded a payment screenshot for ${booking.bookingId}.`,
      payload: { bookingId: booking.bookingId, paymentId: payment.paymentId },
      io
    });
  }

  await writeBookingsSheet();
  await writePaymentsSheet();

  return res.status(201).json({
    payment: payment.toObject(),
    booking: booking.toObject(),
    proofUrl
  });
}

async function listMyPayments(req, res) {
  const payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  return res.json({ payments });
}

async function listPendingPayments(req, res) {
  const { status = 'PENDING' } = req.query || {};
  const q = {};
  if (status) q.status = String(status).toUpperCase();
  if (req.user?.role === 'BUS_OWNER') {
    const ownedRoutes = await Route.find({ ownerId: req.user.id }).select('routeId').lean();
    q.routeId = { $in: ownedRoutes.map((r) => r.routeId) };
  }
  const payments = await Payment.find(q).sort({ createdAt: -1 }).limit(200).lean();
  return res.json({ payments });
}

async function reviewPayment(req, res) {
  const { action } = req.body || {};
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });

  const booking = await Booking.findById(payment.bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (req.user?.role === 'BUS_OWNER') {
    const route = await Route.findOne({ routeId: booking.routeId }).select('ownerId').lean();
    if (!route || String(route.ownerId || '') !== String(req.user.id)) {
      return res.status(403).json({ message: 'Bus owner access only' });
    }
  }

  if (String(action || '').toLowerCase() === 'approve') {
    payment.status = 'VERIFIED';
    payment.reviewedBy = req.user.id;
    payment.reviewedAt = new Date();
    payment.reviewNote = String(req.body?.note || '').trim();
    await payment.save();

    booking.paymentStatus = 'VERIFIED';
    booking.bookingStatus = 'VERIFIED';
    booking.confirmedAt = new Date();
    booking.verificationNote = String(req.body?.note || '').trim();
    await booking.save();

    const io = req.app.get('io');
    await createNotification({
      userId: booking.userId,
      role: 'PASSENGER',
      type: 'payment.approved',
      title: 'Payment approved',
      message: `Payment for booking ${booking.bookingId} has been approved.`,
      payload: { bookingId: booking.bookingId, paymentId: payment.paymentId },
      io
    });
    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'payment.approved',
      entityType: 'Payment',
      entityId: payment.paymentId,
      summary: `Approved payment ${payment.paymentId}`,
      metadata: { bookingId: booking.bookingId, amount: booking.total }
    });
  } else if (String(action || '').toLowerCase() === 'reject') {
    payment.status = 'REJECTED';
    payment.reviewedBy = req.user.id;
    payment.reviewedAt = new Date();
    payment.reviewNote = String(req.body?.note || '').trim();
    await payment.save();

    booking.paymentStatus = 'REJECTED';
    booking.bookingStatus = 'REJECTED';
    booking.verificationNote = String(req.body?.note || 'Payment rejected').trim();
    await booking.save();
    if (booking.couponId) {
      const Coupon = require('../models/Coupon');
      await Coupon.updateOne({ _id: booking.couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    }

    const io = req.app.get('io');
    await createNotification({
      userId: booking.userId,
      role: 'PASSENGER',
      type: 'payment.rejected',
      title: 'Payment rejected',
      message: `Payment for booking ${booking.bookingId} was rejected.`,
      payload: { bookingId: booking.bookingId, paymentId: payment.paymentId },
      io
    });
    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'payment.rejected',
      entityType: 'Payment',
      entityId: payment.paymentId,
      summary: `Rejected payment ${payment.paymentId}`,
      metadata: { bookingId: booking.bookingId, amount: booking.total }
    });
  } else {
    return res.status(400).json({ message: 'action must be approve or reject' });
  }

  await writeBookingsSheet();
  await writePaymentsSheet();

  const io = req.app.get('io');
  if (io) {
    const route = booking.routeId ? await Route.findOne({ routeId: booking.routeId }).lean() : null;
    if (route) {
      io.to(`${booking.routeId}|${booking.date || booking.travelDate || ''}`).emit('payment:updated', {
        bookingId: String(booking._id),
        status: booking.bookingStatus
      });
      io.to(`role:BUS_OWNER`).emit('payment:updated', {
        bookingId: String(booking._id),
        status: booking.bookingStatus
      });
    }
  }

  return res.json({ payment: payment.toObject(), booking: booking.toObject() });
}

module.exports = {
  uploadPaymentProof,
  listMyPayments,
  listPendingPayments,
  reviewPayment
};
