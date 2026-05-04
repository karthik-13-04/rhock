/**
 * POST /api/modules/payment/webhook
 * 
 * Razorpay webhook endpoint — receives payment events automatically
 * No authentication required (signature verified internally)
 */

import { dbConnect } from '../../../../../config/database.js';
import { handleWebhook } from '../../../../../services/razorpay.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

export const POST = asyncHandler(async (req) => {
  await dbConnect();

  // Razorpay sends raw JSON body
  const body = await req.json();
  const signature = req.headers.get('x-razorpay-signature') || '';

  const result = await handleWebhook(body, signature);

  // Always return 200 to stop Razorpay retry attempts
  return Response.json({
    success: true,
    message: 'Webhook processed',
    data: result,
  });
});
