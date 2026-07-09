const express = require('express');
const { createBooking, listMyBookings, listAllBookings, cancelBooking, cancelMyBooking, getBookingById } = require('../controllers/bookings.controller');
const { requireAuth, requireBusOwner } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createBooking);
router.get('/me', requireAuth, listMyBookings);
router.get('/:id', requireAuth, getBookingById);
router.patch('/:id/cancel-me', requireAuth, cancelMyBooking);
router.get('/', requireAuth, requireBusOwner, listAllBookings);
router.patch('/:id/cancel', requireAuth, requireBusOwner, cancelBooking);

module.exports = router;
