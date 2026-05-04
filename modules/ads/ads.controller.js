import { AdsService } from './ads.service.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { dbConnect } from '../../config/database.js';
import { S3Service } from '../../services/s3.service.js';
import { FileValidator } from '../../utils/fileValidator.js';
import Vendor from '../../models/vendor.model.js';

/**
 * Ads Controller
 */
export class AdsController {
  /**
   * POST /api/ads/create
   * Creates a new advertisement listing
   */
  static async createAd(req) {
    try {
      // 1. Ensure DB connection
      await dbConnect();

      // 2. Validate JWT and Role
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['vendor']);
      if (roleError) return roleError;

      // 3. Find Vendor and check status
      const vendor = await Vendor.findOne({ userId: user.id });
      if (!vendor) {
        return Response.json({ success: false, message: 'Vendor profile not found' }, { status: 404 });
      }

      if (vendor.status === 'suspended') {
        return Response.json({ 
          success: false, 
          message: 'Access Denied. Your vendor account is currently suspended. Please contact support.' 
        }, { status: 403 });
      }

      if (vendor.status !== 'active') {
        return Response.json({ 
          success: false, 
          message: vendor.status === 'pending_approval' 
            ? 'Your vendor profile is currently under administrative audit. Ad creation will be enabled once verified.' 
            : 'Access denied. Your vendor account must be in active status to create ads.'
        }, { status: 403 });
      }

      // 4. Parse FormData
      const formData = await req.formData();
      const title = formData.get('title');
      const description = formData.get('description');
      const targetUrl = formData.get('targetUrl');
      const adImage = formData.get('adImage');

      // 5. Basic Validation
      if (!title || !description || !adImage) {
        return Response.json({ success: false, message: 'Title, description, and ad image are required' }, { status: 400 });
      }

      // 6. Image Validation
      try {
        FileValidator.validateImage(adImage);
      } catch (err) {
        return Response.json({ success: false, message: err.message }, { status: 400 });
      }

      // 7. Media Upload
      let uploadResult;
      try {
        uploadResult = await S3Service.upload(adImage, 'ads');
      } catch (err) {
        return Response.json({ success: false, message: 'Image upload failed: ' + err.message }, { status: 500 });
      }

      // 8. Create Ad via Service (with Transaction)
      const result = await AdsService.createAdWithCredit(vendor._id, {
        title,
        description,
        targetUrl,
        imageUrl: uploadResult.url,
        imageKey: uploadResult.key,
      });

      // 9. Success Response
      return Response.json({
        success: true,
        message: 'Ad created successfully. Awaiting approval',
        adId: result.ad._id,
        remainingCredits: result.remainingCredits
      }, { status: 201 });

    } catch (error) {
      console.error('[AdsController Create Error]', error);
      
      // Handle known service errors
      if (error.message === 'Insufficient credits' || error.message === 'No active subscription found') {
        return Response.json({ success: false, message: error.message }, { status: 400 });
      }

      return Response.json({
        success: false,
        message: 'Internal server error: ' + error.message
      }, { status: 500 });
    }
  }

  /**
   * GET /api/ads/vendor
   * Fetches all ads for the authenticated vendor
   */
  static async getVendorAdsByToken(req) {
    try {
      // 1. Ensure DB connection
      await dbConnect();

      // 2. Validate JWT and Role
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['vendor']);
      if (roleError) return roleError;

      // 3. Find Vendor
      const vendor = await Vendor.findOne({ userId: user.id });
      if (!vendor) {
        return Response.json({ success: false, message: 'Vendor profile not found' }, { status: 404 });
      }

      // 4. Extract Query Parameters
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');
      const page = searchParams.get('page') || 1;
      const limit = searchParams.get('limit') || 10;

      // 5. Fetch Ads
      const { ads, total, page: curPage, limit: curLimit } = await AdsService.getVendorAds(vendor._id, {
        status,
        page,
        limit
      });

      // 6. Response
      return Response.json({
        success: true,
        total,
        page: curPage,
        limit: curLimit,
        ads
      }, { status: 200 });

    } catch (error) {
      console.error('[AdsController GetVendorAds Error]', error);
      return Response.json({
        success: false,
        message: 'Internal server error'
      }, { status: 500 });
    }
  }

  /**
   * PUT /api/ads/edit/:adId
   * Updates an existing ad and resets its status to pending
   */
  static async editAd(req, { params }) {
    try {
      // 1. Ensure DB connection
      await dbConnect();

      // 2. Validate JWT and Role
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['vendor']);
      if (roleError) return roleError;

      // 3. Find Vendor
      const vendor = await Vendor.findOne({ userId: user.id });
      if (!vendor) {
        return Response.json({ success: false, message: 'Vendor profile not found' }, { status: 404 });
      }

      // 4. Extract Params and Body
      const { adId } = params;
      const formData = await req.formData();
      
      const title = formData.get('title');
      const description = formData.get('description');
      const targetUrl = formData.get('targetUrl');
      const adImage = formData.get('adImage');

      // 5. Validation (at least one field required)
      if (!title && !description && !targetUrl && !adImage) {
        return Response.json({ success: false, message: 'At least one field is required for update' }, { status: 400 });
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (targetUrl) updateData.targetUrl = targetUrl;

      // 6. Handle New Image Upload
      if (adImage && adImage.size > 0) {
        try {
          FileValidator.validateImage(adImage);
          const uploadResult = await S3Service.upload(adImage, 'ads');
          updateData.imageUrl = uploadResult.url;
          updateData.imageKey = uploadResult.key;
        } catch (err) {
          return Response.json({ success: false, message: 'Image upload failed: ' + err.message }, { status: 400 });
        }
      }

      // 7. Update via Service
      const updatedAd = await AdsService.updateVendorAd(vendor._id, adId, updateData);

      return Response.json({
        success: true,
        message: 'Ad updated successfully. Awaiting re-approval',
        adId: updatedAd._id,
        status: updatedAd.status
      }, { status: 200 });

    } catch (error) {
      console.error('[AdsController Edit Error]', error);
      
      if (error.message === 'Ad not found or unauthorized') {
        return Response.json({ success: false, message: error.message }, { status: 403 });
      }

      return Response.json({
        success: false,
        message: 'Internal server error'
      }, { status: 500 });
    }
  }
}
