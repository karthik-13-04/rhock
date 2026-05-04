/**
 * GET    /api/modules/subscription/plans        — List all active plans
 * POST   /api/modules/subscription/plans        — Admin: create a new plan
 */

import { dbConnect } from '../../../../../config/database.js';
import { getPlans, createPlan } from '../../../../../services/subscription.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

// ==========================================
// GET — List all active public plans
// ==========================================
export const GET = asyncHandler(async () => {
  await dbConnect();

  const plans = await getPlans();

  return Response.json({
    success: true,
    message: 'Subscription plans fetched',
    data: { plans, count: plans.length },
  });
});

// ==========================================
// POST — Create plan (admin)
// ==========================================
export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const body = await req.json();
  const adminId = body.adminId || req.headers.get('x-admin-id');

  if (!adminId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'Admin authorization required' },
    }, { status: 401 });
  }

  const plan = await createPlan(body);

  return Response.json({
    success: true,
    message: 'Subscription plan created',
    data: { plan },
  });
});
