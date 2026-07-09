require('dotenv').config();

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const RefreshToken = require('../models/RefreshToken');
const SeatLock = require('../models/SeatLock');
const Route = require('../models/Route');
const TourPackage = require('../models/TourPackage');
const Coupon = require('../models/Coupon');
const Contact = require('../models/Contact');
const ActivityLog = require('../models/ActivityLog');
const { exportDir } = require('../utils/sheets');

function askConfirmation() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('This will delete all application data. Type DELETE to continue: ', (answer) => {
      rl.close();
      resolve(String(answer || '').trim().toUpperCase() === 'DELETE');
    });
  });
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  const confirmed = await askConfirmation();
  if (!confirmed) {
    console.log('Reset cancelled.');
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  const results = await Promise.all([
    User.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
    RefreshToken.deleteMany({}),
    SeatLock.deleteMany({}),
    Route.deleteMany({}),
    TourPackage.deleteMany({}),
    Coupon.deleteMany({}),
    Contact.deleteMany({}),
    ActivityLog.deleteMany({})
  ]);

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (fs.existsSync(uploadsDir)) fs.rmSync(uploadsDir, { recursive: true, force: true });
  if (fs.existsSync(exportDir)) fs.rmSync(exportDir, { recursive: true, force: true });

  console.log(JSON.stringify({
    users: results[0].deletedCount,
    bookings: results[1].deletedCount,
    payments: results[2].deletedCount,
    notifications: results[3].deletedCount,
    refreshTokens: results[4].deletedCount,
    seatLocks: results[5].deletedCount,
    routes: results[6].deletedCount,
    tourPackages: results[7].deletedCount,
    coupons: results[8].deletedCount,
    contacts: results[9].deletedCount,
    activityLogs: results[10].deletedCount
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
