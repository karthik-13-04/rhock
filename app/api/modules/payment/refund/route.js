/**
 * POST /api/modules/payment/refund
 * 
 * Admin initiate a refund
 */

import { dbConnect } from '../../../../../config/database.js';
import { initiateRefund } from '../../../../../services/razorpay.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const body = await req.json();
  const { paymentId, amount, reason } = body;
  const adminId = body.adminId || req.headers.get('x-admin-id');

  if (!adminId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'Admin authorization required' },
    }, { status: 401 });
  }

  if (!paymentId) {
    return Response.json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Payment ID is required' },
    }, { status: 400 });
  }

  const result = await initiateRefund(paymentId, adminId, amount || null, reason || '');

  return Response.json({
    success: true,
    message: 'Refund initiated successfully',
    data: {
      refundId: result.refundId,
      amount: result.amount,
      payment: result.payment,
    },
  });
});
