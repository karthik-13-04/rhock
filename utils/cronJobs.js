import cron from 'node-cron';
import CoinTransaction from '../models/coinTransaction.model.js';
import Ad from '../models/ad.model.js';
import AuditLog from '../models/auditLog.model.js';
import { dbConnect } from '../config/database.js';

/**
 * Background Maintenance Jobs
 * Ensures system consistency and data lifecycle management
 */
export function initCronJobs() {
  console.log('🕒 [Cron] Initializing background maintenance system...');

  // 1. Expire stale OTP transactions (Every 10 minutes)
  // Logic: Mark 'initiated' or 'otp_sent' transactions as 'failed' if they are past expiry
  cron.schedule('*/10 * * * *', async () => {
    try {
      await dbConnect();
      const now = new Date();
      
      const result = await CoinTransaction.updateMany(
        {
          status: { $in: ['initiated', 'otp_sent'] },
          otpExpiry: { $lt: now }
        },
        { 
          $set: { 
            status: 'failed', 
            metadata: { failureReason: 'OTP_EXPIRED_BY_SYSTEM' } 
          } 
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[Cron] ❌ Expired ${result.modifiedCount} stale coin transactions.`);
      }
    } catch (error) {
      console.error('[Cron] 🚨 Error in OTP expiration job:', error.message);
    }
  });

  // 2. Auto-Expire Ads (Every Hour)
  // Logic: Find approved ads past their expiresAt date and set status to 'expired'
  cron.schedule('0 * * * *', async () => {
    try {
      await dbConnect();
      const now = new Date();

      const result = await Ad.updateMany(
        {
          status: 'approved',
          expiresAt: { $lt: now }
        },
        { 
          $set: { status: 'expired' } 
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[Cron] 📉 Expired ${result.modifiedCount} advertisements.`);
      }
    } catch (error) {
      console.error('[Cron] 🚨 Error in Ad expiration job:', error.message);
    }
  });

  // 3. Audit Log Maintenance (Daily at Midnight)
  // Logic: Prune non-critical logs older than 90 days to maintain DB performance
  cron.schedule('0 0 * * *', async () => {
    try {
      await dbConnect();
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await AuditLog.deleteMany({
        createdAt: { $lt: ninetyDaysAgo },
        severity: { $nin: ['critical', 'high'] } // Preserve high-severity logs for compliance
      });

      if (result.deletedCount > 0) {
        console.log(`[Cron] 🧹 Pruned ${result.deletedCount} old audit logs.`);
      }
    } catch (error) {
      console.error('[Cron] 🚨 Error in Audit Log pruning job:', error.message);
    }
  });

  console.log('✅ [Cron] All scheduled tasks registered successfully.');
}
