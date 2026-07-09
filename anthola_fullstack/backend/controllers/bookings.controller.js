const Booking = require('../models/Booking');
const Coupon = require('../models/Coupon');
const Route = require('../models/Route');
const SeatLock = require('../models/SeatLock');
const { getBookedSeats, roomKey } = require('./seats.controller');
const { writeBookingsSheet } = require('../utils/sheets');
const { createNotification, logActivity } = require('../utils/notifications');

function makeBookingId() {
  return `BKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function makeBookingKey({ bookingType, routeId, packageId, date, travelDate, seats, userId }) {
  if (bookingType === 'TOUR') {
    return `TOUR|${packageId}|${travelDate}|${userId}`;
  }
  return `BUS|${routeId}|${date}|${seats.join(',')}|${userId}`;
}

async function createBooking(req, res) {
  const { routeId, date, seats, couponCode } = req.body || {};
  if (!routeId || !date || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: 'routeId, date, seats[] are required' });
  }

  const route = await Route.findOne({ routeId, isActive: true }).lean();
  if (!route) return res.status(404).json({ message: 'Route not found or inactive' });

  const seatList = [...new Set(seats.map(String))].sort();
  const userId = String(req.user.id);
  const bookingKey = makeBookingKey({ bookingType: 'BUS', routeId: String(routeId), date: String(date), seats: seatList, userId });

  const existingBooking = await Booking.findOne({ bookingKey }).lean();
  if (existingBooking) {
    return res.status(409).json({ message: 'Duplicate booking detected for the same seats/date' });
  }

  const locks = await SeatLock.find({ routeId: String(routeId), date: String(date), seat: { $in: seatList } }).lean();
  if (locks.length !== seatList.length) {
    return res.status(409).json({ message: 'Please select seats again (lock expired)' });
  }
  for (const l of locks) {
    if (String(l.lockedBy) !== userId) {
      return res.status(409).json({ message: 'One or more seats are locked by someone else' });
    }
  }

  const booked = await getBookedSeats(String(routeId), String(date));
  const bookedSet = new Set(booked);
  for (const s of seatList) {
    if (bookedSet.has(s)) return res.status(409).json({ message: `Seat ${s} is already booked` });
  }

  const basePrice = Number(route.price);
  const disc = Math.max(0, Math.min(100, Number(route.discountPercent || 0)));
  const finalPrice = Math.round(basePrice * (1 - disc / 100));
  const baseTotal = finalPrice * seatList.length;

  let appliedCoupon = null;
  let discountAmount = 0;
  const couponText = String(couponCode || '').trim().toUpperCase();
  if (couponText) {
    const coupon = await Coupon.findOne({ code: couponText }).lean();
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    if (!coupon.isActive) {
      return res.status(409).json({ message: 'Coupon is inactive' });
    }
    if (coupon.routeId && String(coupon.routeId) !== String(routeId)) {
      return res.status(409).json({ message: 'Coupon does not apply to this route' });
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return res.status(409).json({ message: 'Coupon has expired' });
    }
    if (coupon.usageLimit && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)) {
      return res.status(409).json({ message: 'Coupon limit reached' });
    }

    const couponDiscount = coupon.discountType === 'FIXED'
      ? Number(coupon.discountValue || 0)
      : Math.round((baseTotal * Number(coupon.discountValue || 0)) / 100);
    discountAmount = Math.max(0, Math.min(baseTotal, couponDiscount));
    appliedCoupon = coupon;
  }

  const total = Math.max(0, baseTotal - discountAmount);

  const booking = await Booking.create({
    bookingId: makeBookingId(),
    bookingKey,
    bookingType: 'BUS',
    userId: req.user.id,
    passenger: req.user.username,
    routeId: route.routeId,
    from: route.from,
    to: route.to,
    date: String(date),
    seats: seatList,
    pricePerSeat: finalPrice,
    total,
    currency: 'NPR',
    couponId: appliedCoupon?._id || null,
    couponCode: appliedCoupon?.code || '',
    baseTotal,
    discountAmount,
    paymentStatus: 'PENDING',
    bookingStatus: 'PENDING_PAYMENT'
  });

  if (appliedCoupon) {
    await Coupon.updateOne({ _id: appliedCoupon._id }, { $inc: { usedCount: 1 } });
  }

  await SeatLock.deleteMany({ routeId: String(routeId), date: String(date), seat: { $in: seatList }, lockedBy: req.user.id });

  const io = req.app.get('io');
  if (io) {
    io.to(roomKey(String(routeId), String(date))).emit('seat:booked', { seats: seatList });
    io.to(`role:BUS_OWNER`).emit('booking:new', booking.toObject());
  }

  await createNotification({
    userId: req.user.id,
    role: 'PASSENGER',
    type: 'booking.created',
    title: 'Booking created',
    message: `Your booking ${booking.bookingId} is awaiting payment upload.`,
    payload: { bookingId: booking.bookingId, routeId: booking.routeId },
    io
  });

  const routeOwner = await Route.findOne({ routeId: booking.routeId }).select('ownerId').lean();
  if (routeOwner?.ownerId) {
    await createNotification({
      userId: routeOwner.ownerId,
      role: 'BUS_OWNER',
      type: 'booking.created',
      title: 'New booking',
      message: `New booking ${booking.bookingId} for ${booking.from} to ${booking.to}.`,
      payload: { bookingId: booking.bookingId, routeId: booking.routeId },
      io
    });
  }

  await logActivity({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'booking.created',
    entityType: 'Booking',
    entityId: booking.bookingId,
    summary: `Created booking ${booking.bookingId}`,
    metadata: { total: booking.total, routeId: booking.routeId }
  });

  await writeBookingsSheet();
  return res.status(201).json({ booking: booking.toObject() });
}

async function listMyBookings(req, res) {
  const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
  return res.json({ bookings });
}

async function listAllBookings(req, res) {
  const { date, routeId, status, type } = req.query || {};
  const q = {};
  if (date) q.date = String(date);
  if (routeId) q.routeId = String(routeId);
  if (status) q.bookingStatus = String(status);
  if (type) q.bookingType = String(type).toUpperCase();

  if (req.user.role === 'BUS_OWNER') {
    const ownerRoutes = await Route.find({ ownerId: req.user.id }).select('routeId').lean();
    const ids = ownerRoutes.map((r) => r.routeId);
    if (q.routeId) {
      q.routeId = ids.includes(String(q.routeId)) ? String(q.routeId) : '__none__';
    } else {
      q.routeId = { $in: ids };
    }
  }

  const bookings = await Booking.find(q).sort({ createdAt: -1 }).limit(300).lean();
  return res.json({ bookings });
}

async function cancelBooking(req, res) {
  const id = req.params.id;
  const booking0 = await Booking.findById(id).lean();
  if (!booking0) return res.status(404).json({ message: 'Booking not found' });

  if (req.user.role === 'BUS_OWNER') {
    const route = await Route.findOne({ routeId: booking0.routeId }).select('ownerId').lean();
    if (!route || String(route.ownerId || '') !== String(req.user.id)) {
      return res.status(403).json({ message: 'Bus owner access only' });
    }
  }

  const booking = await Booking.findByIdAndUpdate(
    id,
    { $set: { bookingStatus: 'CANCELLED', paymentStatus: 'REJECTED', verificationNote: 'Cancelled by operator' } },
    { new: true }
  );
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.couponId) {
    await Coupon.updateOne({ _id: booking.couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
  const io = req.app.get('io');
  await createNotification({
    userId: booking.userId,
    role: 'PASSENGER',
    type: 'booking.cancelled',
    title: 'Booking cancelled',
    message: `Booking ${booking.bookingId} has been cancelled.`,
    payload: { bookingId: booking.bookingId },
    io
  });
  const routeOwner = await Route.findOne({ routeId: booking.routeId }).select('ownerId').lean();
  if (routeOwner?.ownerId) {
    await createNotification({
      userId: routeOwner.ownerId,
      role: 'BUS_OWNER',
      type: 'booking.cancelled',
      title: 'Booking cancelled',
      message: `Booking ${booking.bookingId} was cancelled by the operator.`,
      payload: { bookingId: booking.bookingId },
      io
    });
  }
  await writeBookingsSheet();
  return res.json({ booking: booking.toObject() });
}

async function cancelMyBooking(req, res) {
  const id = req.params.id;
  const booking = await Booking.findOne({ _id: id, userId: req.user.id });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  booking.bookingStatus = 'CANCELLED';
  booking.paymentStatus = 'REJECTED';
  booking.verificationNote = 'Cancelled by user';
  await booking.save();
  if (booking.couponId) {
    await Coupon.updateOne({ _id: booking.couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
  const io = req.app.get('io');
  await createNotification({
    userId: req.user.id,
    role: 'PASSENGER',
    type: 'booking.cancelled',
    title: 'Booking cancelled',
    message: `Your booking ${booking.bookingId} was cancelled.`,
    payload: { bookingId: booking.bookingId },
    io
  });
  const routeOwner = await Route.findOne({ routeId: booking.routeId }).select('ownerId').lean();
  if (routeOwner?.ownerId) {
    await createNotification({
      userId: routeOwner.ownerId,
      role: 'BUS_OWNER',
      type: 'booking.cancelled',
      title: 'Booking cancelled',
      message: `Booking ${booking.bookingId} was cancelled by the passenger.`,
      payload: { bookingId: booking.bookingId },
      io
    });
  }
  await writeBookingsSheet();
  return res.json({ booking: booking.toObject() });
}

async function getBookingById(req, res) {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  return res.json({ booking });
}

module.exports = {
  createBooking,
  listMyBookings,
  listAllBookings,
  cancelBooking,
  cancelMyBooking,
  getBookingById
};
