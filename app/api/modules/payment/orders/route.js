/**
 * GET /api/modules/payment/orders
 * 
 * Get user's payment history
 */

import { dbConnect } from '../../../../../config/database.js';
import { getPaymentHistory } from '../../../../../services/razorpay.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

export const GET = asyncHandler(async (req) => {
  await dbConnect();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 20;
  const status = url.searchParams.get('status') || null;

  const userId = req.headers.get('x-user-id');

  if (!userId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'User ID is required' },
    }, { status: 401 });
  }

  const result = await getPaymentHistory(userId, page, limit, status);

  return Response.json({
    success: true,
    message: 'Payment history fetched',
    data: result,
  });
});
