import User from '../../../models/user.model.js';
import Notification from '../../../models/notification.model.js';

/**
 * Admin Notification Service
 * Handles bulk broadcasting of notifications to user segments
 */
export class AdminNotificationService {
  /**
   * Send a broadcast notification to a specific segment of users
   * @param {Object} broadcastData 
   * @returns {Object} { totalNotified, targetType }
   */
  static async sendBroadcast({ title, body, type, imageUrl, action, targetType }) {
    // 1. Determine Target Users
    let userQuery = {};
    
    if (targetType === 'login_only') {
      // interpreted as users who are active and have logged in at least once
      userQuery = { 
        status: 'active',
        lastLoginAt: { $ne: null }
      };
    } else {
      // 'all' or default: Any user record in the DB
      userQuery = { status: { $ne: 'deleted' } };
    }

    // Fetch only user IDs to minimize memory footprint
    const users = await User.find(userQuery).select('_id').lean();
    
    if (users.length === 0) {
      return { totalNotified: 0, targetType };
    }

    // 2. Prepare Bulk Notifications
    const notificationsToInsert = users.map(user => ({
      userId: user._id,
      type: type || 'welcome',
      title,
      body,
      imageUrl: imageUrl || null,
      isUnread: true,
      action: action || { type: 'none' }
    }));

    // 3. Execute Bulk Insert
    // We use ordered: false to continue even if some inserts fail (though unlikely here)
    const result = await Notification.insertMany(notificationsToInsert, { ordered: false });

    return {
      totalNotified: result.length,
      targetType
    };
  }
}
