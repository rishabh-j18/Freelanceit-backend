const express = require('express');
const router = express.Router();
const { createPayment, updatePaymentStatus, getPaymentStatus } = require('../controller/paymentcontroller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createPayment); // New endpoint
router.put('/:paymentId/status', authMiddleware, updatePaymentStatus);
router.get('/:paymentId', authMiddleware, getPaymentStatus);

module.exports = router;