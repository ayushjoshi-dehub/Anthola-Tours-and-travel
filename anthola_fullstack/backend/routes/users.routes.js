const express = require('express');
const { listUsers, setBlocked } = require('../controllers/users.controller');
const { requireAuth, requireBusOwner } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireBusOwner, listUsers);
router.patch('/:id/block', requireAuth, requireBusOwner, setBlocked);

module.exports = router;
