import mongoose from 'mongoose';

/**
 * Ads Model (Simplified for Vendor Listing)
 */
const adsSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Ad title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Ad description is required'],
      trim: true,
      maxlength: 1000,
    },
    targetUrl: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Ad image is required'],
    },
    imageKey: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Audit Fields
    rejectionReason: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
adsSchema.index({ status: 1, createdAt: -1 });

const Ads = mongoose.models.Ads || mongoose.model('Ads', adsSchema);

export default Ads;
