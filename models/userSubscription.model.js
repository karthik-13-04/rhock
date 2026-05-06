import mongoose from 'mongoose';

/**
 * User Subscription Schema
 * Tracks each subscription purchase/activation for a user/vendor.
 */
const userSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },

    // ==========================================
    // Plan Snapshot (at time of purchase)
    // ==========================================
    planSnapshot: {
      name: String,
      slug: String,
      price: Number,
      currency: String,
      creditsIncluded: Number,
      durationDays: Number,
      billingCycle: String,
      adPriority: Number,
      maxAds: Number,
      maxImagesPerAd: Number,
    },

    // ==========================================
    // Payment
    // ==========================================
    paymentId: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'credits', 'admin_grant', 'trial'],
      default: 'razorpay',
    },
    amount: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      min: 0,
    },

    // ==========================================
    // Subscription Dates
    // ==========================================
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Trial end date (if applicable)
    trialEndDate: {
      type: Date,
    },

    // ==========================================
    // Credit Allocation
    // ==========================================
    creditsAllocated: {
      type: Number,
      default: 0,
    },
    creditsUsed: {
      type: Number,
      default: 0,
    },
    creditsRemaining: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // Status
    // ==========================================
    status: {
      type: String,
      enum: ['trial', 'active', 'expired', 'cancelled', 'overridden'],
      default: 'active',
      index: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    cancelledAt: Date,
    cancelledReason: {
      type: String,
      maxlength: 500,
    },

    // ==========================================
    // Usage Tracking
    // ==========================================
    adsPosted: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // Metadata
    // ==========================================
    notes: {
      type: String,
      maxlength: 500,
    },
    // If granted by admin
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Razorpay order/payment references
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSubscriptionSchema.index({ user: 1, status: 1 });
userSubscriptionSchema.index({ endDate: 1 });
userSubscriptionSchema.index({ paymentId: 1 }, { sparse: true });

// ==========================================
// Virtual: Is currently active
// ==========================================
userSubscriptionSchema.virtual('isCurrentlyActive').get(function () {
  if (this.status === 'trial' && this.trialEndDate) {
    return new Date() <= this.trialEndDate;
  }
  if (this.status === 'active') {
    return new Date() <= this.endDate;
  }
  return false;
});

// ==========================================
// Virtual: Days remaining
// ==========================================
userSubscriptionSchema.virtual('daysRemaining').get(function () {
  const end = this.trialEndDate || this.endDate;
  if (!end) return null;
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// ==========================================
// Virtual: Usage percentage (credits)
// ==========================================
userSubscriptionSchema.virtual('creditUsagePercentage').get(function () {
  if (!this.planSnapshot?.creditsIncluded) return 0;
  return Math.round((this.creditsUsed / this.planSnapshot.creditsIncluded) * 100);
});

// ==========================================
// Pre-save: Set dates and snapshot
// ==========================================
userSubscriptionSchema.pre('save', async function () {
  if (this.isNew) {
    // Set start/end dates
    if (!this.startDate) {
      this.startDate = new Date();
    }
    if (!this.endDate && this.planSnapshot?.durationDays) {
      this.endDate = new Date(
        this.startDate.getTime() + this.planSnapshot.durationDays * 24 * 60 * 60 * 1000
      );
    }
    if (this.planSnapshot?.durationDays === 0) {
      // Lifetime subscription
      this.endDate = new Date('2099-12-31');
    }

    // Initialize credit tracking
    if (this.creditsAllocated > 0 && this.creditsRemaining === 0) {
      this.creditsRemaining = this.creditsAllocated;
    }

    // Set final amount if not set
    if (!this.finalAmount && this.amount) {
      this.finalAmount = this.amount - (this.discount || 0);
    }
  }
});

// ==========================================
// Methods
// ==========================================

/**
 * Use credits from this subscription
 * @param {number} amount - Credits to deduct
 * @returns {Promise<boolean>} Success
 */
userSubscriptionSchema.methods.useCredits = async function (amount) {
  if (this.creditsRemaining < amount) {
    return false;
  }

  this.creditsRemaining -= amount;
  this.creditsUsed += amount;
  await this.save();
  return true;
};

/**
 * Cancel subscription
 */
userSubscriptionSchema.methods.cancel = async function (reason = '') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledReason = reason;
  this.autoRenew = false;
  await this.save();
  return this;
};

/**
 * Expire subscription (called by cron job)
 */
userSubscriptionSchema.methods.expire = async function () {
  this.status = 'expired';
  await this.save();
  return this;
};

// ==========================================
// Statics
// ==========================================

/**
 * Get user's currently active subscription
 */
userSubscriptionSchema.statics.findActive = function (userId) {
  return this.findOne({
    user: userId,
    status: { $in: ['active', 'trial'] },
    endDate: { $gte: new Date() },
  })
    .populate('plan', 'name slug description features badge')
    .sort({ createdAt: -1 });
};

/**
 * Get all subscriptions for a user
 */
userSubscriptionSchema.statics.findByUser = function (userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ user: userId })
    .populate('plan', 'name slug billingCycle')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const UserSubscription =
  mongoose.models.UserSubscription ||
  mongoose.model('UserSubscription', userSubscriptionSchema);

export default UserSubscription;
