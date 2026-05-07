import Vendor from '../models/vendor.model.js';
import User from '../models/user.model.js';
import { uploadToS3 } from '../services/s3.service.js';

/**
 * Vendor Registration Service
 * Handles 3-step draft system: basic info → business details → final submission
 */

// ==========================================
// STEP 1: Basic Information
// ==========================================

/**
 * Create or update vendor basic info (Step 1)
 * @param {string} userId - User ID from JWT
 * @param {object} data - Step 1 data
 * @returns {Promise<object>} Vendor document
 */
export async function saveStep1(userId, data) {
  const { firstName, lastName, email, phone } = data;

  // Validate required fields
  if (!firstName || !email || !phone) {
    throw {
      statusCode: 400,
      message: 'First name, email, and phone are required for step 1',
      errorType: 'VALIDATION_ERROR',
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw {
      statusCode: 400,
      message: 'Invalid email format',
      errorType: 'VALIDATION_ERROR',
    };
  }

  // Validate phone format (Indian 10-digit, starts with 6-9)
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    throw {
      statusCode: 400,
      message: 'Invalid phone number (10 digits, starting with 6-9)',
      errorType: 'VALIDATION_ERROR',
    };
  }

  // Find existing vendor draft or create new
  let vendor = await Vendor.findOne({ userId });

  if (!vendor) {
    // Link vendor to user
    vendor = new Vendor({
      userId,
      step1: { firstName, lastName, email, phone },
      currentStep: 1,
      registrationStatus: 'step1_complete',
    });
  } else {
    // Update step 1 data
    vendor.step1 = { firstName, lastName, email, phone };
    vendor.currentStep = 1;
    vendor.registrationStatus = 'step1_complete';
  }

  await vendor.save();

  // Update associated user's name if exists
  await User.findByIdAndUpdate(userId, {
    firstName,
    lastName: lastName || '',
    email: email,
    phone: phone,
  });

  return vendor;
}

// ==========================================
// STEP 2: Business Details
// ==========================================

/**
 * Update vendor business details (Step 2)
 * @param {string} vendorId - Vendor document ID
 * @param {object} data - Step 2 data
 * @returns {Promise<object>} Vendor document
 */
export async function saveStep2(vendorId, data) {
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    throw {
      statusCode: 404,
      message: 'Vendor registration not found',
      errorType: 'NOT_FOUND_ERROR',
    };
  }

  // Ensure step 1 is completed first
  if (!vendor.step1 || !vendor.step1.firstName) {
    throw {
      statusCode: 400,
      message: 'Please complete Step 1 (Basic Info) first',
      errorType: 'VALIDATION_ERROR',
    };
  }

  const {
    businessName,
    businessType,
    gstNumber,
    panNumber,
    businessAddress,
    businessDescription,
    website,
  } = data;

  // Validate business type if provided
  if (businessType && !['proprietorship', 'partnership', 'private_limited', 'llp', 'other'].includes(businessType)) {
    throw {
      statusCode: 400,
      message: 'Invalid business type',
      errorType: 'VALIDATION_ERROR',
    };
  }

  // Validate GST format if provided
  if (gstNumber) {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber.toUpperCase())) {
      throw {
        statusCode: 400,
        message: 'Invalid GST number format. Expected: 22AAAAA0000A1Z5',
        errorType: 'VALIDATION_ERROR',
      };
    }
  }

  // Validate PAN format if provided
  if (panNumber) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber.toUpperCase())) {
      throw {
        statusCode: 400,
        message: 'Invalid PAN number format. Expected: AAAAA0000A',
        errorType: 'VALIDATION_ERROR',
      };
    }
  }

  // Update step 2 data
  vendor.step2 = {
    businessName: businessName || vendor.step2.businessName,
    businessType: businessType || vendor.step2.businessType,
    gstNumber: gstNumber ? gstNumber.toUpperCase() : vendor.step2.gstNumber,
    panNumber: panNumber ? panNumber.toUpperCase() : vendor.step2.panNumber,
    businessAddress: businessAddress || vendor.step2.businessAddress,
    businessDescription: businessDescription || vendor.step2.businessDescription,
    website: website || vendor.step2.website,
  };

  vendor.currentStep = 2;
  vendor.registrationStatus = 'step2_complete';

  await vendor.save();

  return vendor;
}

// ==========================================
// STEP 3: Documents & Final Submission
// ==========================================

/**
 * Upload vendor document (logo, ID proof, certificate, etc.)
 * @param {Buffer} fileBuffer - File data
 * @param {string} fileName - Original filename
 * @param {string} mimeType - MIME type
 * @param {string} vendorId - Vendor ID for folder organization
 * @returns {Promise<{url: string, key: string}>}
 */
export async function uploadVendorDocument(fileBuffer, fileName, mimeType, vendorId) {
  const folder = `vendors/${vendorId}`;
  return await uploadToS3(fileBuffer, folder, fileName, mimeType);
}

/**
 * Update vendor documents and bank details (Step 3)
 * @param {string} vendorId - Vendor document ID
 * @param {object} data - Step 3 data
 * @returns {Promise<object>} Vendor document
 */
export async function saveStep3(vendorId, data) {
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    throw {
      statusCode: 404,
      message: 'Vendor registration not found',
      errorType: 'NOT_FOUND_ERROR',
    };
  }

  // Ensure step 2 is completed first
  if (!vendor.step2 || !vendor.step2.businessName) {
    throw {
      statusCode: 400,
      message: 'Please complete Step 2 (Business Details) first',
      errorType: 'VALIDATION_ERROR',
    };
  }

  const {
    businessLogo,
    idProof,
    businessCertificate,
    bankAccount,
    termsAccepted,
  } = data;

  // Terms acceptance is mandatory
  if (termsAccepted !== true) {
    throw {
      statusCode: 400,
      message: 'You must accept the terms and conditions to proceed',
      errorType: 'VALIDATION_ERROR',
    };
  }

  // Update step 3 data (merge with existing to preserve uploaded files)
  vendor.step3 = {
    businessLogo: businessLogo || vendor.step3.businessLogo,
    idProof: idProof || vendor.step3.idProof,
    businessCertificate: businessCertificate || vendor.step3.businessCertificate,
    bankAccount: bankAccount || vendor.step3.bankAccount,
    termsAccepted: true,
    termsAcceptedAt: new Date(),
  };

  vendor.currentStep = 3;

  await vendor.save();

  return vendor;
}

/**
 * Submit vendor registration for admin review
 * Final step — locks the registration and marks as submitted
 * @param {string} vendorId - Vendor document ID
 * @returns {Promise<object>} Vendor document
 */
export async function submitRegistration(vendorId) {
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    throw {
      statusCode: 404,
      message: 'Vendor registration not found',
      errorType: 'NOT_FOUND_ERROR',
    };
  }

  // Validate all steps are complete
  if (!vendor.step1 || !vendor.step1.firstName || !vendor.step1.email || !vendor.step1.phone) {
    throw {
      statusCode: 400,
      message: 'Step 1 (Basic Info) is incomplete',
      errorType: 'VALIDATION_ERROR',
    };
  }

  if (!vendor.step2 || !vendor.step2.businessName || !vendor.step2.businessType) {
    throw {
      statusCode: 400,
      message: 'Step 2 (Business Details) is incomplete',
      errorType: 'VALIDATION_ERROR',
    };
  }

  if (!vendor.step3 || !vendor.step3.termsAccepted) {
    throw {
      statusCode: 400,
      message: 'Step 3 (Documents & Terms) is incomplete',
      errorType: 'VALIDATION_ERROR',
    };
  }

  // Mark as submitted
  vendor.registrationStatus = 'submitted';
  vendor.currentStep = 3;
  await vendor.save();

  // Update user role to vendor
  await User.findByIdAndUpdate(vendor.userId, {
    role: 'vendor',
  });

  return vendor;
}

// ==========================================
// Utility: Get vendor registration status
// ==========================================

/**
 * Get vendor registration by ID (for frontend to resume)
 * @param {string} vendorId - Vendor document ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Vendor document
 */
export async function getRegistration(vendorId, userId) {
  const vendor = await Vendor.findOne({ _id: vendorId, userId });

  if (!vendor) {
    throw {
      statusCode: 404,
      message: 'Vendor registration not found',
      errorType: 'NOT_FOUND_ERROR',
    };
  }

  return vendor;
}

/**
 * Get vendor registration by user ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Vendor document
 */
export async function getRegistrationByUser(userId) {
  return await Vendor.findOne({ userId });
}

/**
 * List all vendor registrations (admin use)
 * @param {object} filters - Query filters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<{vendors: array, total: number, page: number}>}
 */
export async function listVendors(filters = {}, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [vendors, total] = await Promise.all([
    Vendor.find(filters)
      .populate('user', 'email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Vendor.countDocuments(filters),
  ]);

  return {
    vendors,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
  };
}
