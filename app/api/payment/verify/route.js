import { PaymentController } from '../../../../modules/payment/payment.controller.js';

/**
 * POST /api/payment/verify
 * Entry point for vendors to verify their subscription payment and activate benefits
 */
export async function POST(req) {
  return await PaymentController.verifyPayment(req);
}
