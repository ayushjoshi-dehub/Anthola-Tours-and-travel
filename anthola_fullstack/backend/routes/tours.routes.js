const express = require('express');
const {
  listPackages,
  getPackage,
  upsertPackage,
  setPackageActive,
  bookTour
} = require('../controllers/tours.controller');
const { requireAuth, requireBusOwner, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, listPackages);
router.get('/:slug', optionalAuth, getPackage);
router.post('/book', requireAuth, bookTour);
router.post('/', requireAuth, requireBusOwner, upsertPackage);
router.put('/', requireAuth, requireBusOwner, upsertPackage);
router.patch('/:packageId/active', requireAuth, requireBusOwner, setPackageActive);

module.exports = router;
