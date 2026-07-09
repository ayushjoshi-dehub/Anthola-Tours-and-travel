require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const RefreshToken = require('../models/RefreshToken');
const SeatLock = require('../models/SeatLock');
const Route = require('../models/Route');
const TourPackage = require('../models/TourPackage');

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({ role: { $nin: ['PASSENGER', 'BUS_OWNER'] } }).select('_id').lean();
  const unsupportedUserIds = users.map((u) => u._id);

  const routeIds = new Set((await Route.find({}).select('routeId ownerId').lean()).map((route) => String(route.routeId)));
  const validPackageIds = new Set((await TourPackage.find({}).select('packageId').lean()).map((pkg) => String(pkg.packageId)));
  const validUserIds = new Set((await User.find({}).select('_id').lean()).map((user) => String(user._id)));

  const orphanBookings = await Booking.find({
    $or: [
      { routeId: { $nin: [...routeIds] }, bookingType: 'BUS' },
      { userId: { $nin: [...validUserIds] } },
      { bookingType: 'TOUR', packageId: { $nin: [...validPackageIds] } }
    ]
  }).select('_id').lean();

  const orphanBookingIds = orphanBookings.map((booking) => booking._id);
  const orphanPayments = await Payment.find({
    $or: [
      { bookingId: { $nin: orphanBookingIds } },
      { userId: { $nin: [...validUserIds] } }
    ]
  }).select('_id').lean();

  const deletedUnsupportedUsers = unsupportedUserIds.length ? await User.deleteMany({ _id: { $in: unsupportedUserIds } }) : { deletedCount: 0 };
  const deletedOrphanBookings = orphanBookingIds.length ? await Booking.deleteMany({ _id: { $in: orphanBookingIds } }) : { deletedCount: 0 };
  const deletedOrphanPayments = orphanPayments.length ? await Payment.deleteMany({ _id: { $in: orphanPayments.map((p) => p._id) } }) : { deletedCount: 0 };
  const deletedNotifications = await Notification.deleteMany({
    $or: [
      { userId: { $nin: [...validUserIds] } },
      { role: { $nin: ['PASSENGER', 'BUS_OWNER'] } }
    ]
  });
  const deletedRefreshTokens = await RefreshToken.deleteMany({ userId: { $nin: [...validUserIds] } });
  const deletedSeatLocks = await SeatLock.deleteMany({
    $or: [
      { lockedBy: { $nin: [...validUserIds] } },
      { expiresAt: { $lt: new Date() } }
    ]
  });

  console.log(JSON.stringify({
    deletedUnsupportedUsers: deletedUnsupportedUsers.deletedCount || 0,
    deletedOrphanBookings: deletedOrphanBookings.deletedCount || 0,
    deletedOrphanPayments: deletedOrphanPayments.deletedCount || 0,
    deletedNotifications: deletedNotifications.deletedCount || 0,
    deletedRefreshTokens: deletedRefreshTokens.deletedCount || 0,
    deletedSeatLocks: deletedSeatLocks.deletedCount || 0
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
