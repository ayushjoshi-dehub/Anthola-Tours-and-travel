const mongoose = require('mongoose');

const TourPackageSchema = new mongoose.Schema(
  {
    packageId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    destination: { type: String, required: true },
    durationDays: { type: Number, default: 1 },
    durationNights: { type: Number, default: 0 },
    price: { type: Number, required: true },
    currency: { type: String, default: 'NPR' },
    availability: { type: Number, default: 20 },
    itinerary: { type: [String], default: [] },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    images: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TourPackage', TourPackageSchema);
