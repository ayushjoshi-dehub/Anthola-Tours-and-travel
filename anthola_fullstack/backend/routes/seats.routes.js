const express = require('express');
const { state, lockSeat, unlockSeat } = require('../controllers/seats.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public seat state; includes "mine" flags if Authorization header is present.
router.get('/state', optionalAuth, state);

// Locking requires auth
router.post('/lock', requireAuth, lockSeat);
router.post('/unlock', requireAuth, unlockSeat);

module.exports = router;
