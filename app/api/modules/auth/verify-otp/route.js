/**
 * POST /api/modules/auth/verify-otp
 * Verify OTP and receive JWT token
 * 
 * Body: { identifier: "email@example.com", code: "1234" }
 */

import { dbConnect } from '../../../../../config/database.js';
import { verifyOtp } from '../../../../../services/auth.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const body = await req.json();
  const { identifier, code } = body;

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

  if (!code) {
    return Response.json({
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'OTP code is required',
      },
    }, { status: 400 });
  }

  // Verify OTP (throws on failure)
  const result = await verifyOtp(identifier, code);

  return Response.json({
    success: true,
    message: 'Authentication successful',
    data: {
      token: result.token,
      user: result.user,
    },
  });
});
