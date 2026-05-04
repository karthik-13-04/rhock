import mongoose from 'mongoose';

/**
 * OTP Schema
 * Stores OTP codes for email/phone verification with expiry
 */
const otpSchema = new mongoose.Schema(
  {
    // Target identifier (email or phone)
    target: {
      type: String,
      required: true,
      index: true,
    },
    
    // The OTP code
    code: {
      type: String,
      required: true,
      length: 4,
    },
    
    // OTP type
    type: {
      type: String,
      enum: ['email', 'phone', 'both'],
      default: 'email',
    },
    
    // Expiry timestamp
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index - auto-deletes when expiresAt is past
    },
    
    // Verification status
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    // Attempt tracking (prevent brute force)
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    
    // Associated user (if exists)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // IP address for security tracking
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate active OTPs for same target
otpSchema.index({ target: 1, isVerified: 1, expiresAt: 1 });

/**
 * Check if OTP is expired
 */
otpSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

/**
 * Check if max attempts exceeded
 */
otpSchema.methods.isMaxAttemptsReached = function () {
  return this.attempts >= 5;
};

/**
 * Increment attempt counter
 */
otpSchema.methods.incrementAttempts = async function () {
  this.attempts += 1;
  await this.save();
};

/**
 * Mark as verified
 */
otpSchema.methods.markVerified = async function () {
  this.isVerified = true;
  await this.save();
};

/**
 * Static method: Clean up old OTPs for a target
 */
otpSchema.statics.cleanOldOtps = async function (target) {
  await this.deleteMany({
    target,
    isVerified: false,
    expiresAt: { $lt: new Date() },
  });
};

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

export default Otp;
