import mongoose from 'mongoose';

/**
 * Coin Transaction Model
 * Tracks redemption attempts and final wallet transfers
 */
const coinTransactionSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    coins: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['initiated', 'otp_sent', 'completed', 'failed'],
      default: 'initiated',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiry: {
      type: Date,
      required: true,
    },
    otpLastSentAt: {
      type: Date,
    },
    otpResendCount: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
coinTransactionSchema.index({ userId: 1, status: 1 });
coinTransactionSchema.index({ vendorId: 1, status: 1 });
coinTransactionSchema.index({ createdAt: -1 });

const CoinTransaction = mongoose.models.CoinTransaction || mongoose.model('CoinTransaction', coinTransactionSchema);

export default CoinTransaction;
