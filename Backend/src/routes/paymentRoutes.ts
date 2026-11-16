import { Router } from 'express';
import { handleSepayPaymentWebhook } from '../controllers/paymentController.js';

const router = Router();

// Endpoint for SePay banking webhook
// Matches /sepay-payment and /hooks/sepay-payment
router.post('/sepay-payment', handleSepayPaymentWebhook);
router.post('/hooks/sepay-payment', handleSepayPaymentWebhook);

export default router;
