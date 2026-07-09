const express = require('express');
const { listMine, markRead } = require('../controllers/notifications.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listMine);
router.patch('/:id/read', requireAuth, markRead);

module.exports = router;
