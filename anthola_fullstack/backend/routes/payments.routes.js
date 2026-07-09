const express = require('express');
const { uploadPaymentProof, listMyPayments } = require('../controllers/payments.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/upload', requireAuth, uploadPaymentProof);
router.get('/me', requireAuth, listMyPayments);

module.exports = router;
