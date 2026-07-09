const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    bookingKey: { type: String, required: true, unique: true, index: true },
    bookingType: { type: String, enum: ['BUS', 'TOUR'], default: 'BUS', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    passenger: { type: String, trim: true, default: 'Guest' },
    routeId: { type: String, required: true, index: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    date: { type: String, required: true },
    seats: { type: [String], required: true },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    couponCode: { type: String, default: '' },
    baseTotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    packageId: { type: String, default: '' },
    packageTitle: { type: String, default: '' },
    travelDate: { type: String, default: '' },
    travelerCount: { type: Number, default: 0 },
    pricePerSeat: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: 'NPR' },
    paymentStatus: { type: String, enum: ['PENDING', 'PAYMENT_UPLOADED', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    bookingStatus: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PAYMENT_UPLOADED', 'VERIFIED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING_PAYMENT'
    },
    paymentRef: { type: String, default: '' },
    paymentProofUrl: { type: String, default: '' },
    verificationNote: { type: String, default: '' },
    confirmedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
