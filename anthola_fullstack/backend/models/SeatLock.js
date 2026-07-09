const mongoose = require('mongoose');

const SeatLockSchema = new mongoose.Schema(
  {
    routeId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    seat: { type: String, required: true },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// Prevent double-locking the same seat for the same route/date.
SeatLockSchema.index({ routeId: 1, date: 1, seat: 1 }, { unique: true });

// TTL: document will be deleted automatically after expiresAt.
SeatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SeatLock', SeatLockSchema);
