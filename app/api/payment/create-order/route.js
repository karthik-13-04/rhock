import { PaymentController } from '../../../../modules/payment/payment.controller.js';

/**
 * POST /api/payment/create-order
 * Entry point for vendors to initiate a subscription purchase
 */
export async function POST(req) {
  return await PaymentController.createOrder(req);
}
