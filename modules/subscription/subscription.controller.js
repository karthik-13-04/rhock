import { SubscriptionService } from './subscription.service.js';
import { dbConnect } from '../../config/database.js';

/**
 * Subscription Controller
 */
export class SubscriptionController {
  /**
   * GET /api/subscription/plans
   * Fetches all active plans (Public API)
   */
  static async getPlans(req) {
    try {
      // 1. Ensure DB connection
      await dbConnect();

      // 2. Fetch Plans via Service
      const plans = await SubscriptionService.getSubscriptionPlans();

      // 3. Response
      return Response.json({
        success: true,
        plans
      }, { status: 200 });

    } catch (error) {
      console.error('[SubscriptionController GetPlans Error]', error);
      return Response.json({
        success: false,
        message: 'Failed to fetch plans'
      }, { status: 500 });
    }
  }

  /**
   * GET /api/subscription/current
   * Fetches the active subscription for the authenticated vendor
   */
  static async getCurrentSubscription(req) {
    try {
      // 1. Ensure DB connection
      await dbConnect();

      // 2. Validate JWT and Role
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['vendor']);
      if (roleError) return roleError;

      // 3. Find Vendor (to ensure status check if needed)
      // Note: We check the sub directly by vendorId linked to user.id
      // In our system, vendor._id is what's stored in Subscription.
      const Vendor = (await import('../../models/vendor.model.js')).default;
      const vendor = await Vendor.findOne({ userId: user.id });
      if (!vendor) {
        return Response.json({ success: false, message: 'Vendor profile not found' }, { status: 404 });
      }

      // 4. Fetch via Service
      const subscription = await SubscriptionService.getCurrentVendorSubscription(vendor._id);

      if (!subscription) {
        return Response.json({ 
          success: true, 
          subscription: null, 
          message: 'No active subscription' 
        }, { status: 200 });
      }

      // 5. Response
      return Response.json({
        success: true,
        subscription
      }, { status: 200 });

    } catch (error) {
      console.error('[SubscriptionController GetCurrent Error]', error);
      return Response.json({
        success: false,
        message: 'Internal server error'
      }, { status: 500 });
    }
  }
}
