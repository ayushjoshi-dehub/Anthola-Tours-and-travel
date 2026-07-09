const mongoose = require('mongoose');

const BlockedSeatSchema = new mongoose.Schema(
  {
    routeId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    seat: { type: String, required: true },
    reason: {
      type: String,
      enum: ['EXTERNAL_TICKETING', 'AGENCY', 'MAINTENANCE', 'OTHER'],
      default: 'EXTERNAL_TICKETING'
    },
    note: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// One block per seat/route/date.
BlockedSeatSchema.index({ routeId: 1, date: 1, seat: 1 }, { unique: true });

module.exports = mongoose.model('BlockedSeat', BlockedSeatSchema);
