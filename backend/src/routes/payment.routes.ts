import { Router } from 'express';
import { createPaymentOrder, verifyPayment, paymentWebhook, getStudentPayments } from '../controllers/payment.controller.js';
import { authenticateToken, requireStudent } from '../middleware/auth.js';

const router = Router();

// Webhook does not require Bearer token (uses HMAC signature header)
router.post('/webhook', paymentWebhook);

// Student authenticated endpoints
router.post('/create-order', authenticateToken, requireStudent, createPaymentOrder);
router.post('/verify', authenticateToken, requireStudent, verifyPayment);
router.get('/history', authenticateToken, requireStudent, getStudentPayments);

export default router;
