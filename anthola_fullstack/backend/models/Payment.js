const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingType: { type: String, enum: ['BUS', 'TOUR'], default: 'BUS', index: true },
    routeId: { type: String, default: '', index: true },
    travelDate: { type: String, default: '' },
    provider: { type: String, trim: true, required: true },
    amount: { type: Number, required: true },
    proofUrl: { type: String, required: true },
    proofMimeType: { type: String, required: true },
    proofOriginalName: { type: String, required: true },
    paymentRef: { type: String, default: '' },
    status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
