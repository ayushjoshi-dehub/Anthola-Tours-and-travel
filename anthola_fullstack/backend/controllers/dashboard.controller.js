const Booking = require('../models/Booking');
const Route = require('../models/Route');
const User = require('../models/User');
const Contact = require('../models/Contact');
const TourPackage = require('../models/TourPackage');
const Payment = require('../models/Payment');
const { writeUsersSheet } = require('../utils/sheets');

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function getStats(req, res) {
  const isOwner = req.user && req.user.role === 'BUS_OWNER';
  let routeIdFilter = null;
  if (isOwner) {
    const owned = await Route.find({ ownerId: req.user.id }).select('routeId').lean();
    routeIdFilter = owned.map((r) => r.routeId);
  }

  const bookingQuery = routeIdFilter ? { routeId: { $in: routeIdFilter } } : {};
  const routeQuery = routeIdFilter ? { ownerId: req.user.id } : {};
  const paymentQuery = routeIdFilter ? { routeId: { $in: routeIdFilter } } : {};

  const [bookingCount, pendingCount, confirmedCount, routesCount, activeRoutesCount, userCount, msgCount, packagesCount, paymentCount, pendingPayments] =
    await Promise.all([
      Booking.countDocuments(bookingQuery),
      Booking.countDocuments({ ...bookingQuery, bookingStatus: 'PENDING_PAYMENT' }),
      Booking.countDocuments({ ...bookingQuery, bookingStatus: { $in: ['VERIFIED', 'COMPLETED'] } }),
      Route.countDocuments(routeQuery),
      Route.countDocuments({ ...routeQuery, isActive: true }),
      User.countDocuments(),
      Contact.countDocuments(),
      TourPackage.countDocuments({}),
      Payment.countDocuments(paymentQuery),
      Payment.countDocuments({ ...paymentQuery, status: 'PENDING' })
    ]);

  const today = todayISO();
  const todayBookings = await Booking.find({ ...bookingQuery, date: today, bookingStatus: { $in: ['VERIFIED', 'COMPLETED'] } }).lean();
  const todayRevenue = todayBookings.reduce((sum, b) => sum + Number(b.total || 0), 0);

  return res.json({
    bookingCount,
    pendingCount,
    confirmedCount,
    routesCount,
    activeRoutesCount,
    userCount,
    msgCount,
    packagesCount,
    paymentCount,
    pendingPayments,
    today,
    todayRevenue,
    todayBookingCount: todayBookings.length
  });
}

async function usersSheet(req, res) {
  const sheet = await writeUsersSheet();
  return res.json({ rows: sheet.rows, exportedAt: new Date().toISOString() });
}

module.exports = { getStats, usersSheet };
