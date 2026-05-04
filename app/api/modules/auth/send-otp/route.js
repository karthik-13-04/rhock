/**
 * POST /api/modules/auth/send-otp
 * Send OTP to email or phone
 * 
 * Body: { identifier: "email@example.com", type: "email" }
 */

import { dbConnect } from '../../../../../config/database.js';
import { sendOtp } from '../../../../../services/auth.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const body = await req.json();
  const { identifier, type } = body;

  // Validate required fields
  if (!identifier) {
    return Response.json({
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Email or phone is required',
      },
    }, { status: 400 });
  }

  if (!type || !['email', 'phone'].includes(type)) {
    return Response.json({
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Type must be "email" or "phone"',
      },
    }, { status: 400 });
  }

  // Extract IP address
  const ipAddress = req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown';

  // Send OTP
  const result = await sendOtp(identifier, type, ipAddress);

  return Response.json({
    success: true,
    message: result.message,
    data: {
      targetMasked: result.targetMasked,
      expiresAt: result.expiresAt,
    },
  });
});
