const express = require('express');
const {
  downloadUsersXlsx,
  downloadBookingsXlsx,
  downloadPaymentsXlsx
} = require('../controllers/export.controller');
const { requireAuth, requireBusOwner } = require('../middleware/auth');

const router = express.Router();

router.get('/users.xlsx', requireAuth, requireBusOwner, downloadUsersXlsx);
router.get('/bookings.xlsx', requireAuth, requireBusOwner, downloadBookingsXlsx);
router.get('/payments.xlsx', requireAuth, requireBusOwner, downloadPaymentsXlsx);

module.exports = router;
