const Route = require('../models/Route');
const BlockedSeat = require('../models/BlockedSeat');

function normalizeSeats(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((s) => String(s).trim().toUpperCase()).filter(Boolean))];
  }
  return String(value || '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

async function assertOwnerRoute(routeId, userId) {
  const route = await Route.findOne({ routeId: String(routeId) }).lean();
  if (!route) {
    const err = new Error('Route not found');
    err.status = 404;
    throw err;
  }
  if (route.ownerId && String(route.ownerId) !== String(userId)) {
    const err = new Error('Bus owner access only');
    err.status = 403;
    throw err;
  }
  return route;
}

async function listBlocked(req, res) {
  const { routeId, date } = req.query || {};
  const owned = await Route.find({ ownerId: req.user.id }).select('routeId').lean();
  const ownedIds = owned.map((r) => r.routeId);
  const q = { routeId: { $in: ownedIds } };
  if (routeId) {
    if (!ownedIds.includes(String(routeId))) {
      return res.status(403).json({ message: 'Bus owner access only' });
    }
    q.routeId = String(routeId);
  }
  if (date) q.date = String(date);

  const rows = await BlockedSeat.find(q).sort({ createdAt: -1 }).lean();
  return res.json({
    blocked: rows.map((r) => ({
      routeId: r.routeId,
      date: r.date,
      seat: r.seat,
      reason: r.reason,
      note: r.note
    }))
  });
}

async function blockSeats(req, res) {
  try {
    const { routeId, date, seats, reason, note } = req.body || {};
    if (!routeId || !date || !seats) {
      return res.status(400).json({ message: 'routeId, date, and seats are required' });
    }

    const seatList = normalizeSeats(seats);
    if (!seatList.length) {
      return res.status(400).json({ message: 'Provide at least one seat to block' });
    }

    await assertOwnerRoute(routeId, req.user.id);

    const reasonValue = ['EXTERNAL_TICKETING', 'AGENCY', 'MAINTENANCE', 'OTHER'].includes(reason)
      ? reason
      : 'EXTERNAL_TICKETING';

    const ops = seatList.map((seat) => ({
      updateOne: {
        filter: { routeId: String(routeId), date: String(date), seat },
        update: {
          $set: { routeId: String(routeId), date: String(date), seat, reason: reasonValue, note: String(note || '').trim(), createdBy: req.user.id }
        },
        upsert: true
      }
    }));

    await BlockedSeat.bulkWrite(ops);

    const io = req.app.get('io');
    if (io) {
      io.to(`${String(routeId)}|${String(date)}`).emit('seat:blocked', { routeId: String(routeId), date: String(date), seats: seatList });
    }

    return res.status(200).json({ ok: true, blocked: seatList, routeId: String(routeId), date: String(date) });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Failed to block seats' });
  }
}

async function unblockSeats(req, res) {
  try {
    const { routeId, date, seats } = req.body || {};
    if (!routeId || !date || !seats) {
      return res.status(400).json({ message: 'routeId, date, and seats are required' });
    }

    const seatList = normalizeSeats(seats);
    if (!seatList.length) {
      return res.status(400).json({ message: 'Provide at least one seat to unblock' });
    }

    await assertOwnerRoute(routeId, req.user.id);

    const result = await BlockedSeat.deleteMany({
      routeId: String(routeId),
      date: String(date),
      seat: { $in: seatList }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`${String(routeId)}|${String(date)}`).emit('seat:unblocked', { routeId: String(routeId), date: String(date), seats: seatList });
    }

    return res.status(200).json({ ok: true, removed: result.deletedCount, routeId: String(routeId), date: String(date) });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Failed to unblock seats' });
  }
}

module.exports = { listBlocked, blockSeats, unblockSeats };
