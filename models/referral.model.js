import mongoose from 'mongoose';

/**
 * Referral Model
 * Tracks referral relationships between users
 */
const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One referred user can only belong to one referrer
      index: true,
    },
    rewardCoins: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'completed',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

referralSchema.index({ referrer: 1, createdAt: -1 });

const Referral = mongoose.models.Referral || mongoose.model('Referral', referralSchema);

export default Referral;
