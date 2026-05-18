import mongoose from 'mongoose';

/**
 * Referral Setting Model
 * Stores global referral rewards settings configured by admins
 */
const referralSettingSchema = new mongoose.Schema(
  {
    coinsPerReferral: {
      type: Number,
      default: 50,
      min: 0,
    },
    dailyReferralLimit: {
      type: Number,
      default: 20,
      min: 0,
    },
    maxReferralLimit: {
      type: Number,
      default: 100,
      min: 0,
    },
    activationCondition: {
      type: String,
      enum: ['signup', 'first_deal'],
      default: 'signup',
    },
    expiryDays: {
      type: Number,
      default: 365,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ReferralSetting = mongoose.models.ReferralSetting || mongoose.model('ReferralSetting', referralSettingSchema);

export default ReferralSetting;
