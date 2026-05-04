import { AdminService } from '@/modules/admin/admin.service.js';
import { authenticate, authorize } from '@/middleware/auth.middleware.js';
import { dbConnect } from '@/config/database.js';

/**
 * Admin Controller
 */
export class AdminController {
  /**
   * PUT /api/admin/ads/review/[adId]
   * Review an advertisement listing
   */
  static async reviewAd(req, { params }) {
    try {
      // 1. Ensure DB connection
      await dbConnect();

      // 2. Validate JWT and Admin Role
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['admin']);
      if (roleError) return roleError;

      // 3. Extract Inputs
      const { adId } = params;
      const body = await req.json();
      const { action, reason } = body;

      // 4. Basic Validation
      if (!action || !['approve', 'reject'].includes(action)) {
        return Response.json({ success: false, message: 'Invalid action. Must be "approve" or "reject".' }, { status: 400 });
      }

      // 5. Execute Review via Service
      const ad = await AdminService.reviewAd(user.id, adId, action, reason);

      // 6. Response
      return Response.json({
        success: true,
        message: `Ad ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        status: ad.status
      }, { status: 200 });

    } catch (error) {
      console.error('[AdminController Review Error]', error);
      
      const errorMessage = error?.message || '';
      const status = errorMessage.includes('not found') ? 404 : 400;
      
      return Response.json({
        success: false,
        message: errorMessage || 'Internal server error'
      }, { status });
    }
  }

  /**
   * GET /api/admin/vendors
   * Dynamic vendor listing with filters and search
   */
  static async getVendors(req) {
    try {
      await dbConnect();

      // 1. Security Check
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['admin']);
      if (roleError) return roleError;

      // 2. Parse Query Params
      const { searchParams } = new URL(req.url);
      const options = {
        status: searchParams.get('status') || 'all',
        search: searchParams.get('search') || '',
        page: parseInt(searchParams.get('page')) || 1,
        limit: parseInt(searchParams.get('limit')) || 10
      };

      // 3. Service Call
      const result = await AdminService.getVendors(options);

      return Response.json({
        success: true,
        vendors: result.vendors,
        pagination: result.pagination
      }, { status: 200 });

    } catch (error) {
      return Response.json({
        success: false,
        message: 'Failed to fetch vendors'
      }, { status: 500 });
    }
  }

  /**
   * PATCH /api/admin/vendors/[id]
   * Approve or Reject a vendor
   */
  static async updateVendorStatus(req, { params }) {
    try {
      await dbConnect();

      // 1. Security Check
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['admin']);
      if (roleError) return roleError;

      // 2. Extract Data
      const { id } = params;
      const body = await req.json();
      const { status } = body; // 'active' or 'rejected'

      // 3. Update Status via Service
      const vendor = await AdminService.updateVendorStatus(id, status);

      return Response.json({
        success: true,
        message: `Vendor status updated to ${status}`,
        vendor
      }, { status: 200 });

    } catch (error) {
      return Response.json({
        success: false,
        message: error.message || 'Failed to update vendor status'
      }, { status: 400 });
    }
  }

  /**
   * GET /api/admin/dashboard/stats
   * Fetch aggregated system metrics
   */
  static async getDashboardStats(req) {
    try {
      await dbConnect();

      // 1. Security Check
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['admin']);
      if (roleError) return roleError;

      // 2. Service Call
      const stats = await AdminService.getDashboardStats();

      return Response.json({
        success: true,
        ...stats
      }, { status: 200 });

    } catch (error) {
      console.error('[AdminController Stats Error]', error);
      return Response.json({
        success: false,
        message: 'Failed to fetch dashboard statistics'
      }, { status: 500 });
    }
  }

  /**
   * GET /api/admin/users
   */
  static async getUsers(req) {
    try {
      await dbConnect();

      // 1. Security Check
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['admin']);
      if (roleError) return roleError;

      // 2. Parse Query Params
      const { searchParams } = new URL(req.url);
      const options = {
        search: searchParams.get('search') || '',
        page: parseInt(searchParams.get('page')) || 1,
        limit: parseInt(searchParams.get('limit')) || 10
      };

      // 3. Service Call
      const result = await AdminService.getUsers(options);

      return Response.json({
        success: true,
        users: result.users,
        pagination: result.pagination
      }, { status: 200 });

    } catch (error) {
      return Response.json({
        success: false,
        message: 'Failed to fetch users'
      }, { status: 500 });
    }
  }

  /**
   * GET /api/admin/ads
   */
  static async getAds(req) {
    try {
      await dbConnect();

      // 1. Security Check
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['admin']);
      if (roleError) return roleError;

      // 2. Parse Query Params
      const { searchParams } = new URL(req.url);
      const options = {
        status: searchParams.get('status') || 'all',
        page: parseInt(searchParams.get('page')) || 1,
        limit: parseInt(searchParams.get('limit')) || 20
      };

      // 3. Service Call
      const result = await AdminService.getAds(options);

      return Response.json({
        success: true,
        ads: result.ads,
        pagination: result.pagination
      }, { status: 200 });

    } catch (error) {
      return Response.json({
        success: false,
        message: 'Failed to fetch ads'
      }, { status: 500 });
    }
  }

  /**
   * GET /api/admin/payments
   */
  static async getPayments(req) {
    try {
      await dbConnect();
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;
      if (authorize(user, ['admin'])) return authorize(user, ['admin']);

      const { searchParams } = new URL(req.url);
      const result = await AdminService.getPayments({
        page: parseInt(searchParams.get('page')) || 1,
        limit: parseInt(searchParams.get('limit')) || 20
      });

      return Response.json({ success: true, ...result }, { status: 200 });
    } catch (error) {
      return Response.json({ success: false, message: 'Failed to fetch payments' }, { status: 500 });
    }
  }

  /**
   * GET /api/admin/coins
   */
  static async getCoinTransactions(req) {
    try {
      await dbConnect();
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;
      if (authorize(user, ['admin'])) return authorize(user, ['admin']);

      const { searchParams } = new URL(req.url);
      const result = await AdminService.getCoinTransactions({
        page: parseInt(searchParams.get('page')) || 1,
        limit: parseInt(searchParams.get('limit')) || 20
      });

      return Response.json({ success: true, ...result }, { status: 200 });
    } catch (error) {
      return Response.json({ success: false, message: 'Failed to fetch coin transactions' }, { status: 500 });
    }
  }

  /**
   * POST /api/admin/login
   * Admin Login via Email and Password
   */
  static async login(req) {
    try {
      await dbConnect();
      
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return Response.json({ success: false, message: 'Email and password are required' }, { status: 400 });
      }

      const result = await AdminService.loginAdmin(email, password);
      return Response.json(result, { status: 200 });

    } catch (error) {
      console.error('[AdminController.login Error]', error);
      return Response.json({ success: false, message: error.message }, { status: 401 });
    }
  }

  /**
   * GET /api/admin/stores
   * Fetch all vendor stores with filtering
   */
  static async getStores(req) {
    try {
      await dbConnect();

      // 1. Security Check
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['admin']);
      if (roleError) return roleError;

      // 2. Parse Query Params
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status') || 'all';
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 20;

      // 3. Service Call
      const result = await AdminService.getStores({ status, page, limit });

      return Response.json({
        success: true,
        ...result
      }, { status: 200 });

    } catch (error) {
      console.error('[AdminController.getStores Error]', error);
      return Response.json({
        success: false,
        message: 'Failed to fetch stores'
      }, { status: 500 });
    }
  }

  /**
   * PUT /api/admin/store/review/:storeId
   * Admin: Approve or Reject a store
   */
  static async reviewStore(req, { params }) {
    try {
      await dbConnect();

      // 1. Security Check
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['admin']);
      if (roleError) return roleError;

      // 2. Extract Data
      const { storeId } = params;
      const body = await req.json();
      const { action } = body;

      if (!action || !['approve', 'reject'].includes(action)) {
        return Response.json({ success: false, message: 'Invalid action. Must be "approve" or "reject".' }, { status: 400 });
      }

      // 3. Service Call
      const store = await AdminService.reviewStore(storeId, action);

      return Response.json({
        success: true,
        message: `Store ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        status: store.status
      }, { status: 200 });

    } catch (error) {
      console.error('[AdminController.reviewStore Error]', error);
      
      const status = error.message.includes('not found') ? 404 : 400;
      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status });
    }
  }

  /**
   * PUT /api/admin/offers/review/:offerId
   * Admin: Approve or Reject an offer
   */
  static async reviewOffer(req, { params }) {
    try {
      await dbConnect();

      // 1. Security Check
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['admin']);
      if (roleError) return roleError;

      // 2. Extract Data
      const { offerId } = params;
      const body = await req.json();
      const { action } = body;

      if (!action || !['approve', 'reject'].includes(action)) {
        return Response.json({ success: false, message: 'Invalid action. Must be "approve" or "reject".' }, { status: 400 });
      }

      // 3. Service Call
      const offer = await AdminService.reviewOffer(offerId, action);

      return Response.json({
        success: true,
        message: `Offer ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        status: offer.status
      }, { status: 200 });

    } catch (error) {
      console.error('[AdminController.reviewOffer Error]', error);
      
      const status = error.message.includes('not found') ? 404 : 400;
      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status });
    }
  }
}
