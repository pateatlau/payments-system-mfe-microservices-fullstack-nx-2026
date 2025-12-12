/**
 * Payment Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth';
import * as paymentController from '../controllers/payment.controller';

const router = express.Router();

// All payment routes require authentication
router.use(authenticate);

// Payment CRUD
router.get('/payments', paymentController.listPayments);
router.get('/payments/reports', paymentController.getPaymentReports);
router.get('/payments/:id', paymentController.getPaymentById);
router.post('/payments', paymentController.createPayment);
router.patch('/payments/:id/status', paymentController.updatePaymentStatus);

// Webhook (public endpoint - no auth required)
const webhookRouter = express.Router();
webhookRouter.post('/webhooks/payments', paymentController.handleWebhook);

export { router as paymentRoutes, webhookRouter };
