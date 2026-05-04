import mongoose from 'mongoose';

/**
 * Plan Model (Subscription Schemes for Vendors)
 */
const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    validityDays: {
      type: Number,
      required: [true, 'Validity (in days) is required'],
      min: 1,
    },
    credits: {
      type: Number,
      required: [true, 'Included credits is required'],
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Sorting logic (primary by price)
planSchema.index({ isActive: 1, price: 1 });

const Plan = mongoose.models.Plan || mongoose.model('Plan', planSchema);

export default Plan;
