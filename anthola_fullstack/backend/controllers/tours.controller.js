const TourPackage = require('../models/TourPackage');
const Booking = require('../models/Booking');
const { writeBookingsSheet } = require('../utils/sheets');
const { createNotification, logActivity } = require('../utils/notifications');

function makePackageId() {
  return `TP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function listPackages(req, res) {
  const includeInactive = String(req.query.includeInactive || '') === '1';
  const q = includeInactive ? {} : { isActive: true };
  const packages = await TourPackage.find(q).sort({ createdAt: -1 }).lean();
  return res.json({ packages });
}

async function getPackage(req, res) {
  const slug = String(req.params.slug || '').trim();
  const pack = await TourPackage.findOne({ slug }).lean();
  if (!pack || (!pack.isActive && String(req.query.includeInactive || '') !== '1')) {
    return res.status(404).json({ message: 'Tour package not found' });
  }
  return res.json({ package: pack });
}

async function upsertPackage(req, res) {
  const {
    packageId,
    title,
    subtitle,
    destination,
    durationDays,
    durationNights,
    price,
    currency,
    availability,
    itinerary,
    inclusions,
    exclusions,
    images,
    highlights,
    isActive
  } = req.body || {};

  if (!title || !destination || price === undefined || price === null) {
    return res.status(400).json({ message: 'title, destination, and price are required' });
  }

  const slug = slugify(req.body?.slug || title);
  const doc = await TourPackage.findOneAndUpdate(
    { packageId: packageId || makePackageId() },
    {
      $set: {
        slug,
        title: String(title).trim(),
        subtitle: String(subtitle || '').trim(),
        destination: String(destination).trim(),
        durationDays: Number(durationDays || 1),
        durationNights: Number(durationNights || 0),
        price: Number(price || 0),
        currency: String(currency || 'NPR'),
        availability: Math.max(0, Number(availability || 20)),
        itinerary: Array.isArray(itinerary) ? itinerary : String(itinerary || '').split('\n').map((s) => s.trim()).filter(Boolean),
        inclusions: Array.isArray(inclusions) ? inclusions : String(inclusions || '').split(',').map((s) => s.trim()).filter(Boolean),
        exclusions: Array.isArray(exclusions) ? exclusions : String(exclusions || '').split(',').map((s) => s.trim()).filter(Boolean),
        images: Array.isArray(images) ? images : String(images || '').split(',').map((s) => s.trim()).filter(Boolean),
        highlights: Array.isArray(highlights) ? highlights : String(highlights || '').split(',').map((s) => s.trim()).filter(Boolean),
        isActive: typeof isActive === 'boolean' ? isActive : true
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res.json({ package: doc.toObject() });
}

async function setPackageActive(req, res) {
  const pack = await TourPackage.findOneAndUpdate(
    { packageId: req.params.packageId },
    { $set: { isActive: !!req.body?.isActive } },
    { new: true }
  );
  if (!pack) return res.status(404).json({ message: 'Tour package not found' });
  return res.json({ package: pack.toObject() });
}

async function bookTour(req, res) {
  const { packageId, travelDate, travelers, name, phone, email } = req.body || {};
  if (!packageId || !travelDate || !travelers) {
    return res.status(400).json({ message: 'packageId, travelDate, travelers are required' });
  }

  const pack = await TourPackage.findOne({ packageId, isActive: true }).lean();
  if (!pack) return res.status(404).json({ message: 'Tour package not found or inactive' });

  const travelerCount = Math.max(1, Number(travelers || 1));
  const sold = await Booking.aggregate([
    {
      $match: {
        bookingType: 'TOUR',
        packageId: String(packageId),
        travelDate: String(travelDate),
        bookingStatus: { $in: ['PENDING_PAYMENT', 'PAYMENT_UPLOADED', 'VERIFIED', 'COMPLETED'] }
      }
    },
    { $group: { _id: null, total: { $sum: '$travelerCount' } } }
  ]);
  const taken = sold?.[0]?.total || 0;
  if (taken + travelerCount > Number(pack.availability || 0)) {
    return res.status(409).json({ message: 'Not enough availability for this date' });
  }

  const bookingKey = `TOUR|${packageId}|${travelDate}|${req.user.id}`;
  const existing = await Booking.findOne({ bookingKey }).lean();
  if (existing) {
    return res.status(409).json({ message: 'Duplicate tour booking detected' });
  }

  const booking = await Booking.create({
    bookingId: `BKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingKey,
    bookingType: 'TOUR',
    userId: req.user.id,
    passenger: name || req.user.username,
    routeId: `tour-${packageId}`,
    from: 'Kathmandu',
    to: pack.destination,
    date: String(travelDate),
    seats: [],
    packageId: String(packageId),
    packageTitle: pack.title,
    travelDate: String(travelDate),
    travelerCount,
    pricePerSeat: Number(pack.price || 0),
    total: Number(pack.price || 0) * travelerCount,
    currency: pack.currency || 'NPR',
    paymentStatus: 'PENDING',
    bookingStatus: 'PENDING_PAYMENT'
  });

  const io = req.app.get('io');
  await createNotification({
    userId: req.user.id,
    role: 'PASSENGER',
    type: 'tour.created',
    title: 'Tour booking created',
    message: `Your tour booking for ${pack.title} is awaiting payment verification.`,
    payload: { bookingId: booking.bookingId, packageId },
    io
  });
  await logActivity({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'tour.booking_created',
    entityType: 'Booking',
    entityId: booking.bookingId,
    summary: `Created tour booking ${booking.bookingId}`,
    metadata: { packageId, travelDate, travelerCount }
  });

  await writeBookingsSheet();
  return res.status(201).json({ booking: booking.toObject() });
}

async function seedTourPackagesIfEmpty() {
  const count = await TourPackage.countDocuments();
  if (count > 0) return;

  await TourPackage.insertMany([
    {
      packageId: 'tour-pkr-3d2n',
      slug: 'pokhara-3d2n',
      title: 'Pokhara Escape',
      subtitle: 'Lakeside stay with Sarangkot sunrise',
      destination: 'Pokhara',
      durationDays: 3,
      durationNights: 2,
      price: 12500,
      currency: 'NPR',
      availability: 20,
      itinerary: ['Day 1: Kathmandu to Pokhara', 'Day 2: Sarangkot, Lakeside, Peace Pagoda', 'Day 3: Return to Kathmandu'],
      inclusions: ['AC transport', 'Hotel stay', 'Breakfast'],
      exclusions: ['Lunch and dinner', 'Personal expenses'],
      highlights: ['Lake view', 'Family friendly', 'Popular'],
      isActive: true
    },
    {
      packageId: 'tour-mustang-5d4n',
      slug: 'mustang-5d4n',
      title: 'Upper Mustang Journey',
      subtitle: 'Adventure for scenic mountain lovers',
      destination: 'Mustang',
      durationDays: 5,
      durationNights: 4,
      price: 38500,
      currency: 'NPR',
      availability: 12,
      itinerary: ['Day 1: Kathmandu to Pokhara', 'Day 2: Pokhara to Jomsom', 'Day 3: Explore Kagbeni', 'Day 4: Mustang sightseeing', 'Day 5: Return'],
      inclusions: ['Guide', 'Transport', 'Permits'],
      exclusions: ['Meals not stated', 'Insurance'],
      highlights: ['Adventure', 'Scenic', 'Premium'],
      isActive: true
    },
    {
      packageId: 'tour-chitwan-2d1n',
      slug: 'chitwan-2d1n',
      title: 'Chitwan Safari',
      subtitle: 'Jungle safari and cultural experience',
      destination: 'Chitwan',
      durationDays: 2,
      durationNights: 1,
      price: 9800,
      currency: 'NPR',
      availability: 24,
      itinerary: ['Day 1: Kathmandu to Chitwan', 'Day 2: Safari and cultural program'],
      inclusions: ['Hotel', 'Jeep safari', 'Breakfast'],
      exclusions: ['Lunch/dinner', 'Tips'],
      highlights: ['Wildlife', 'Family', 'Weekend'],
      isActive: true
    }
  ]);
  console.log('[seed] Tour packages inserted');
}

module.exports = {
  listPackages,
  getPackage,
  upsertPackage,
  setPackageActive,
  bookTour,
  seedTourPackagesIfEmpty
};
