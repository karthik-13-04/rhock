import mongoose from 'mongoose';

/**
 * Subscription Model (Simplified for Vendor Credit Tracking)
 */
const subscriptionSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    creditsTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    creditsUsed: {
      type: Number,
      required: true,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for remaining credits
subscriptionSchema.virtual('creditsRemaining').get(function () {
  return this.creditsTotal - this.creditsUsed;
});

// Middleware to ensure virtuals are included
subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
