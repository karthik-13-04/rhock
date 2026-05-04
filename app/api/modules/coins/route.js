/**
 * GET  /api/modules/coins/wallet   — Get current user coin balance
 * POST /api/modules/coins/redeem   — Redeem coins (placeholder for complex logic)
 */

import { dbConnect } from '../../../../config/database.js';
import User from '../../../../models/user.model.js';
import { asyncHandler } from '../../../../utils/errorHandler.js';

// ==========================================
// GET — User Wallet Balance
// ==========================================
export const GET = asyncHandler(async (req) => {
  await dbConnect();

  const userId = req.headers.get('x-user-id');

  if (!userId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'User ID is required' },
    }, { status: 401 });
  }

  const user = await User.findById(userId).select('coinBalance firstName lastName email');

  if (!user) {
    return Response.json({
      success: false,
      error: { type: 'NOT_FOUND_ERROR', message: 'User not found' },
    }, { status: 404 });
  }

  return Response.json({
    success: true,
    message: 'Wallet balance fetched successfully',
    data: {
      userId: user._id,
      coinBalance: user.coinBalance || 0,
      currency: 'COINS',
    },
  });
});

// ==========================================
// POST — Redeem Coins
// ==========================================
export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const body = await req.json();
  const userId = body.userId || req.headers.get('x-user-id');
  const { amount, purpose } = body;

  if (!userId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'User ID is required' },
    }, { status: 401 });
  }

  if (!amount || amount <= 0) {
    return Response.json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Invalid redemption amount' },
    }, { status: 400 });
  }

  const user = await User.findById(userId);

  if (!user) {
    return Response.json({
      success: false,
      error: { type: 'NOT_FOUND_ERROR', message: 'User not found' },
    }, { status: 404 });
  }

  if (user.coinBalance < amount) {
    return Response.json({
      success: false,
      error: { type: 'INSUFFICIENT_FUNDS', message: 'Insufficient coin balance' },
    }, { status: 400 });
  }

  // Deduct coins
  user.coinBalance -= amount;
  await user.save();

  return Response.json({
    success: true,
    message: `Successfully redeemed ${amount} coins for ${purpose || 'specified purpose'}`,
    data: {
      newBalance: user.coinBalance,
      redeemedAmount: amount,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
  });
});
