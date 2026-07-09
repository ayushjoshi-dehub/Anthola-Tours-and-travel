const express = require('express');
const { listRoutes, getRoute, upsertRoute, setRouteActive } = require('../controllers/routes.controller');
const { requireAuth, requireBusOwner, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, listRoutes);
router.get('/:routeId', optionalAuth, getRoute);
router.post('/', requireAuth, requireBusOwner, upsertRoute);
router.put('/', requireAuth, requireBusOwner, upsertRoute);
router.patch('/:routeId/active', requireAuth, requireBusOwner, setRouteActive);

module.exports = router;
