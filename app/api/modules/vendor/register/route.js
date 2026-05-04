/**
 * POST /api/modules/vendor/register
 * GET  /api/modules/vendor/register
 * 
 * POST → Step 1: Create/update vendor basic info
 * GET  → Get current vendor registration status
 */

import { dbConnect } from '../../../../../config/database.js';
import { saveStep1, getRegistrationByUser } from '../../../../../services/vendor.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

// ==========================================
// GET — Fetch vendor registration status
// ==========================================
export const GET = asyncHandler(async (req) => {
  await dbConnect();

  // Get user ID from JWT (set by auth middleware — optional for now)
  const userId = req.headers.get('x-user-id');

  if (!userId) {
    return Response.json({
      success: false,
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: 'User ID required. Include x-user-id header.',
      },
    }, { status: 401 });
  }

  const vendor = await getRegistrationByUser(userId);

  if (!vendor) {
    return Response.json({
      success: true,
      message: 'No vendor registration found',
      data: null,
    });
  }

  return Response.json({
    success: true,
    message: 'Vendor registration fetched',
    data: {
      vendor,
      completionPercentage: vendor.completionPercentage,
    },
  });
});

// ==========================================
// POST — Step 1: Save basic information
// ==========================================
export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const body = await req.json();
  const { userId, firstName, lastName, email, phone } = body;

  if (!userId) {
    return Response.json({
      success: false,
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: 'User ID is required',
      },
    }, { status: 401 });
  }

  const vendor = await saveStep1(userId, { firstName, lastName, email, phone });

  return Response.json({
    success: true,
    message: 'Step 1 (Basic Info) saved successfully',
    data: {
      vendorId: vendor._id,
      currentStep: vendor.currentStep,
      registrationStatus: vendor.registrationStatus,
      completionPercentage: vendor.completionPercentage,
      step1: vendor.step1,
    },
  });
});
