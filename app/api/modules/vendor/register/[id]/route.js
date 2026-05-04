/**
 * PATCH /api/modules/vendor/register/[id]
 * PATCH /api/modules/vendor/register/[id]/submit
 * GET  /api/modules/vendor/register/[id]
 * 
 * PATCH → Step 2: Update business details
 * PATCH /submit → Step 3: Final submission
 * GET → Get registration by ID
 */

import { dbConnect } from '../../../../../../config/database.js';
import {
  saveStep2,
  saveStep3,
  submitRegistration,
  getRegistration,
} from '../../../../../../services/vendor.service.js';
import { asyncHandler } from '../../../../../../utils/errorHandler.js';

// ==========================================
// GET — Fetch vendor registration by ID
// ==========================================
export const GET = asyncHandler(async (req) => {
  await dbConnect();

  const url = new URL(req.url);
  const pathname = url.pathname;

  // Extract vendor ID from URL: /api/modules/vendor/register/[id]
  const segments = pathname.split('/').filter(Boolean);
  const vendorId = segments[segments.length - 1];
  const userId = req.headers.get('x-user-id');

  if (!vendorId) {
    return Response.json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Vendor ID is required' },
    }, { status: 400 });
  }

  const vendor = await getRegistration(vendorId, userId);

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
// PATCH — Step 2 or Step 3 (submit)
// ==========================================
export const PATCH = asyncHandler(async (req) => {
  await dbConnect();

  const url = new URL(req.url);
  const pathname = url.pathname;
  const body = await req.json();

  // Extract vendor ID from URL
  const segments = pathname.split('/').filter(Boolean);
  const vendorId = segments[segments.length - 1] === 'submit'
    ? segments[segments.length - 2]
    : segments[segments.length - 1];

  const isSubmit = pathname.endsWith('/submit');

  if (!vendorId) {
    return Response.json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Vendor ID is required' },
    }, { status: 400 });
  }

  // Handle Step 3 submission (Finalizing)
  if (isSubmit) {
    const vendor = await submitRegistration(vendorId);

    return Response.json({
      success: true,
      message: 'Vendor registration submitted for admin review',
      data: {
        vendorId: vendor._id,
        registrationStatus: vendor.registrationStatus,
        currentStep: vendor.currentStep,
      },
    });
  }

  // Handle Step 3: Documents and Bank Details
  // If the body contains bankAccount or termsAccepted, it's likely Step 3
  if (body.bankAccount || body.termsAccepted !== undefined || body.businessLogo || body.idProof) {
    const vendor = await saveStep3(vendorId, body);

    return Response.json({
      success: true,
      message: 'Step 3 (Documents & Bank Details) saved successfully',
      data: {
        vendorId: vendor._id,
        currentStep: vendor.currentStep,
        registrationStatus: vendor.registrationStatus,
        completionPercentage: vendor.completionPercentage,
        step3: vendor.step3,
      },
    });
  }

  // Handle Step 2: Business details
  const vendor = await saveStep2(vendorId, body);

  return Response.json({
    success: true,
    message: 'Step 2 (Business Details) saved successfully',
    data: {
      vendorId: vendor._id,
      currentStep: vendor.currentStep,
      registrationStatus: vendor.registrationStatus,
      completionPercentage: vendor.completionPercentage,
      step2: vendor.step2,
    },
  });
});
