import mongoose from 'mongoose';

/**
 * Audit Log Model
 * Tracks critical system actions for security and debugging
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'vendor', 'admin', 'system'],
      default: 'system',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    entityType: {
      type: String, // 'user', 'vendor', 'ad', 'payment', 'coin_transaction'
      index: true,
    },
    actionType: {
      type: String, // 'create', 'update', 'delete', 'authorize', 'fraud_flag'
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
