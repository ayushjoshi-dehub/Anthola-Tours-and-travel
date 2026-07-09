const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema(
  {
    routeId: { type: String, trim: true, required: true, unique: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    // Bus owner provided information (what customers see and choose from)
    busName: { type: String, trim: true, default: 'Bus' },
    busNumber: { type: String, trim: true, default: '' },
    busPhotoUrl: { type: String, trim: true, default: '' },
    busGalleryUrls: { type: [String], default: [] },
    busDescription: { type: String, trim: true, default: '' },
    services: { type: [String], default: [] },
    driverName: { type: String, trim: true, default: '' },
    driverPhone: { type: String, trim: true, default: '' },
    driverLicense: { type: String, trim: true, default: '' },

    // Payment details (shown to customer on booking page)
    paymentProvider: { type: String, trim: true, default: 'eSewa' },
    paymentAccountName: { type: String, trim: true, default: '' },
    paymentPhone: { type: String, trim: true, default: '' },
    paymentQrUrl: { type: String, trim: true, default: '' },
    paymentNote: { type: String, trim: true, default: '' },
    seatCount: { type: Number, default: 36, min: 1, max: 80 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    from: { type: String, trim: true, required: true },
    to: { type: String, trim: true, required: true },
    duration: { type: String, trim: true, required: true },
    price: { type: Number, required: true, min: 0 },
    badges: { type: [String], default: [] },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', RouteSchema);
