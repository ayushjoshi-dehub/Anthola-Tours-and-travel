const SeatLock = require('../models/SeatLock');
const Booking = require('../models/Booking');
const Route = require('../models/Route');

const LOCK_MINUTES = Number(process.env.SEAT_LOCK_MINUTES || 5);

function roomKey(routeId, date) {
  return `${routeId}|${date}`;
}

async function getBookedSeats(routeId, date) {
  const rows = await Booking.find({
    routeId,
    date: String(date),
    bookingType: 'BUS',
    bookingStatus: { $in: ['PENDING_PAYMENT', 'PAYMENT_UPLOADED', 'VERIFIED', 'COMPLETED'] }
  })
    .select('seats')
    .lean();
  const set = new Set();
  for (const b of rows) {
    for (const s of (b.seats || [])) set.add(String(s));
  }
  return [...set];
}

async function state(req, res) {
  const { routeId, date } = req.query || {};
  if (!routeId || !date) return res.status(400).json({ message: 'routeId and date are required' });

  const route = await Route.findOne({ routeId: String(routeId) }).lean();
  if (!route) return res.status(404).json({ message: 'Route not found' });

  const booked = await getBookedSeats(String(routeId), String(date));

  const locks = await SeatLock.find({ routeId: String(routeId), date: String(date) })
    .select('seat lockedBy expiresAt')
    .lean();

  const myId = req.user ? String(req.user.id) : null;
  const locked = locks.map(l => ({
    seat: String(l.seat),
    expiresAt: l.expiresAt,
    mine: myId ? String(l.lockedBy) === myId : false
  }));

  return res.json({
    routeId: String(routeId),
    date: String(date),
    seatCount: Number(route.seatCount || 36),
    booked,
    locked
  });
}

async function lockSeat(req, res) {
  const { routeId, date, seat } = req.body || {};
  if (!routeId || !date || !seat) {
    return res.status(400).json({ message: 'Please choose a route, travel date, and seat first.' });
  }

  const route = await Route.findOne({ routeId: String(routeId), isActive: true }).lean();
  if (!route) return res.status(404).json({ message: 'Route not found or inactive' });

  // Already booked?
  const booked = await Booking.exists({
    routeId: String(routeId),
    date: String(date),
    bookingType: 'BUS',
    bookingStatus: { $in: ['PENDING_PAYMENT', 'PAYMENT_UPLOADED', 'VERIFIED', 'COMPLETED'] },
    seats: String(seat)
  });
  if (booked) return res.status(409).json({ message: 'Seat already booked' });

  const userId = req.user.id;
  const expiresAt = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);

  try {
    const existing = await SeatLock.findOne({ routeId: String(routeId), date: String(date), seat: String(seat) });
    if (existing) {
      if (String(existing.lockedBy) !== String(userId)) {
        return res.status(409).json({ message: 'Seat is locked by another user' });
      }
      existing.expiresAt = expiresAt;
      await existing.save();
    } else {
      await SeatLock.create({ routeId: String(routeId), date: String(date), seat: String(seat), lockedBy: userId, expiresAt });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(roomKey(String(routeId), String(date))).emit('seat:locked', { seat: String(seat), expiresAt });
    }

    return res.json({ ok: true, seat: String(seat), expiresAt });
  } catch (e) {
    // Unique constraint can throw if two lock at same time
    return res.status(409).json({ message: 'Seat is locked by another user' });
  }
}

async function unlockSeat(req, res) {
  const { routeId, date, seat } = req.body || {};
  if (!routeId || !date || !seat) {
    return res.status(400).json({ message: 'Please choose a route, travel date, and seat first.' });
  }

  const userId = req.user.id;
  const deleted = await SeatLock.findOneAndDelete({ routeId: String(routeId), date: String(date), seat: String(seat), lockedBy: userId });

  const io = req.app.get('io');
  if (io) {
    io.to(roomKey(String(routeId), String(date))).emit('seat:unlocked', { seat: String(seat) });
  }

  return res.json({ ok: true, deleted: !!deleted });
}

module.exports = { state, lockSeat, unlockSeat, roomKey, getBookedSeats, LOCK_MINUTES };
