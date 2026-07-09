const express = require('express');
const { getStats } = require('../controllers/dashboard.controller');
const {
  listMyRoutes,
  uploadBusPhoto,
  listMyPayments,
  reviewOwnerPayment,
  listMyBookings,
  listMyCoupons,
  createCoupon,
  toggleCoupon
} = require('../controllers/owner.controller');
const { listBlocked, blockSeats, unblockSeats } = require('../controllers/blocked-seats.controller');
const { requireAuth, requireBusOwner } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', requireAuth, requireBusOwner, getStats);
router.get('/routes', requireAuth, requireBusOwner, listMyRoutes);
router.post('/routes/photo', requireAuth, requireBusOwner, uploadBusPhoto);
router.get('/payments', requireAuth, requireBusOwner, listMyPayments);
router.post('/payments/:id/review', requireAuth, requireBusOwner, reviewOwnerPayment);
router.get('/bookings', requireAuth, requireBusOwner, listMyBookings);
router.get('/coupons', requireAuth, requireBusOwner, listMyCoupons);
router.post('/coupons', requireAuth, requireBusOwner, createCoupon);
router.patch('/coupons/:id/toggle', requireAuth, requireBusOwner, toggleCoupon);
router.get('/routes/seats', requireAuth, requireBusOwner, listBlocked);
router.post('/routes/seats/block', requireAuth, requireBusOwner, blockSeats);
router.post('/routes/seats/unblock', requireAuth, requireBusOwner, unblockSeats);

module.exports = router;
