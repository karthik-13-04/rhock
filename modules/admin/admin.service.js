import Vendor from '../../models/vendor.model.js';
import User from '../../models/user.model.js';
import { dbConnect } from '../../config/database.js';

export class AdminService {
  /**
   * List all vendors with a specific status
   * @param {string} status 'pending_approval', 'active', etc.
   */
  static async listVendors(status = 'pending_approval') {
    await dbConnect();
    return await Vendor.find({ status })
      .populate('userId', 'fullName email phone')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
  }

  /**
   * Update Vendor Status (Approve/Reject)
   * @param {string} vendorId 
   * @param {string} status 'active' or 'rejected'
   */
  static async updateVendorStatus(vendorId, status) {
    await dbConnect();
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new Error('Vendor not found');

    vendor.status = status;
    await vendor.save();

    // If approved, update the associated user's role to 'vendor'
    if (status === 'active') {
      await User.findByIdAndUpdate(vendor.userId, { 
        role: 'vendor',
        status: 'active' 
      });
    }

    return vendor;
  }

  /**
   * Get Vendor Detail for Review
   * @param {string} vendorId 
   */
  static async getVendorDetail(vendorId) {
    await dbConnect();
    return await Vendor.findById(vendorId)
      .populate('userId', 'fullName email phone')
      .populate('categoryId', 'name');
  }
}
