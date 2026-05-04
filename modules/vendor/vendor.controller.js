import { VendorService } from './vendor.service.js';
import { apiError, apiSuccess } from '../../utils/errorHandler.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { dbConnect } from '../../config/database.js';
import { S3Service } from '../../services/s3.service.js';
import { FileValidator } from '../../utils/fileValidator.js';
import { generateToken } from '../../utils/jwt.js';

/**
 * Vendor Controller
 * Orchestrates registration and vendor-related operations
 */
export class VendorController {
  /**
   * POST /api/vendor/register/step-1
   * Vendor Signup (Basic Info) - Step 1
   * AUTH: Not Required
   */
  static async registerStep1(req) {
    try {
      // 1. Ensure DB connection
      await dbConnect();

      // 2. Extract and Validate Input
      let body;
      try {
        body = await req.json();
      } catch (err) {
        return Response.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const { mobileNumber, businessName } = body;

      if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
        return Response.json({ 
          success: false, 
          message: 'Validation failed: Valid 10-digit mobile number is required' 
        }, { status: 400 });
      }

      if (!businessName || businessName.trim().length < 2) {
        return Response.json({ 
          success: false, 
          message: 'Validation failed: Business name must be at least 2 characters' 
        }, { status: 400 });
      }

      // 3. Process Signup Step 1
      const { vendor } = await VendorService.registerVendorStep1({
        ownerName,
        mobileNumber,
        email,
      });

      // 4. Successful Response
      return Response.json({
        success: true,
        vendorId: vendor._id,
        status: vendor.status
      }, { status: 200 });

    } catch (error) {
      console.error('[VendorController Step 1 Error]', error);
      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status: 500 });
    }
  }

  /**
   * POST /api/vendor/register/step-2
   * Vendor Registration Step 2: Business Details
   * AUTH: Not Required
   */
  static async registerStep2(req) {
    try {
      await dbConnect();

      const body = await req.json();
      const { vendorId, businessName, category, businessHours, images } = body;

      if (!vendorId || !businessName || !category) {
        return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 });
      }

      const vendor = await VendorService.registerVendorStep2(body);

      return Response.json({
        success: true,
        status: vendor.status,
        stepCompleted: 2
      }, { status: 200 });

    } catch (error) {
      console.error('[VendorController Step 2 Error]', error);
      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status: 500 });
    }
  }

  /**
   * POST /api/vendor/register/step-3
   * Vendor Registration Step 3: Location + Final Submit
   * AUTH: Not Required
   */
  static async registerStep3(req) {
    try {
      await dbConnect();

      const body = await req.json();
      const { vendorId, state, district, mandal, address, location } = body;

      if (!vendorId || !state || !district || !mandal || !address || !location) {
        return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 });
      }

      const vendor = await VendorService.registerVendorStep3(body);

      return Response.json({
        success: true,
        status: vendor.status
      }, { status: 200 });

    } catch (error) {
      console.error('[VendorController Step 3 Error]', error);
      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status: 500 });
    }
  }

  /**
   * POST /api/vendor/store/create
   * Vendor Creates Store
   * AUTH: Vendor Token Required
   */
  static async createStore(req) {
    try {
      await dbConnect();

      // 1. Authenticate Vendor
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['vendor']);
      if (roleError) return roleError;

      // 2. Parse and Validate Body
      let body;
      try {
        body = await req.json();
      } catch (e) {
        return Response.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      const { businessName, category, phone, email, address, state, district, mandal, location } = body;

      if (!businessName || !category || !phone || !address || !location) {
        return Response.json({ 
          success: false, 
          message: 'Missing required fields: businessName, category, phone, address, and location are mandatory' 
        }, { status: 400 });
      }

      // 3. Create Store
      const vendor = await VendorService.createStore(user.id, body);

      return Response.json({
        success: true,
        message: 'Store created successfully',
        storeId: vendor._id,
        status: vendor.status
      }, { status: 200 });

    } catch (error) {
      console.error('[VendorController.createStore Error]', error);
      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status: 500 });
    }
  }

  /**
   * POST /api/vendor/check-vendor
   * Checks if a vendor exists
   */
  static async checkVendor(req) {
    try {
      const body = await req.json();
      const { mobileNumber } = body;

      if (!mobileNumber) {
        return Response.json({ success: false, message: 'Mobile number is required' }, { status: 400 });
      }

      const result = await VendorService.checkVendorExists(mobileNumber);
      return Response.json(result, { status: result.exists ? 200 : 404 });

    } catch (error) {
      return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
  }

  /**
   * POST /api/vendor/send-otp
   * Sends OTP to vendor mobile
   */
  static async sendOtp(req) {
    try {
      const body = await req.json();
      const { mobileNumber } = body;

      if (!mobileNumber) {
        return Response.json({ success: false, message: 'Mobile number is required' }, { status: 400 });
      }

      const result = await VendorService.sendVendorOtp(mobileNumber);
      return Response.json(result, { status: 200 });

    } catch (error) {
      return Response.json({ success: false, message: error.message }, { status: 400 });
    }
  }

  /**
   * POST /api/vendor/verify-otp
   * Verifies OTP and returns token
   */
  static async verifyOtp(req) {
    try {
      const body = await req.json();
      const { mobileNumber, otp } = body;

      if (!mobileNumber || !otp) {
        return Response.json({ success: false, message: 'Mobile number and OTP are required' }, { status: 400 });
      }

      const result = await VendorService.verifyVendorOtp(mobileNumber, otp);
      return Response.json(result, { status: 200 });

    } catch (error) {
      return Response.json({ success: false, message: error.message }, { status: 401 });
    }
  }

  /**
   * POST /api/vendor/store/create
   * Protected: Vendor Creates Store
   * AUTH: Required (Vendor Token)
   */
  static async createStore(req) {
    try {
      await dbConnect();

      // 1. Authenticate Vendor
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      // 2. Authorize Vendor Role
      const roleError = authorize(user, ['vendor']);
      if (roleError) return roleError;

      // 3. Extract and Validate Body
      let body;
      try {
        body = await req.json();
      } catch (e) {
        return Response.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
      }

      // 4. Create Store via Service
      // Service handles "Vendor Active" check
      const store = await VendorService.createStore(user.vendorId, body);

      return Response.json({
        success: true,
        message: 'Store created successfully',
        storeId: store._id,
        status: store.status
      }, { status: 200 });

    } catch (error) {
      console.error('[VendorController.createStore Error]', error);
      
      const statusCode = error.statusCode || 500;
      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status: statusCode });
    }
  }
}
