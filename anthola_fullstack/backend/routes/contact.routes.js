const express = require('express');
const { createMessage, listMessages, resolveMessage } = require('../controllers/contact.controller');
const { requireAuth, requireBusOwner } = require('../middleware/auth');

const router = express.Router();

router.post('/', createMessage);
router.get('/', requireAuth, requireBusOwner, listMessages);
router.patch('/:id/resolve', requireAuth, requireBusOwner, resolveMessage);

module.exports = router;
