import { AdminNotificationController } from '@/modules/admin/notifications/admin-notification.controller.js';

/**
 * POST /api/admin/notifications/send
 * Admin-only broadcast endpoint
 */
export async function POST(req) {
  return await AdminNotificationController.sendBroadcast(req);
}
