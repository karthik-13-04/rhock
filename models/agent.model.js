import mongoose from 'mongoose';

/**
 * Agent Model
 * Manages referral codes and links vendors to agents
 */
const agentSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Agent code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedVendors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
agentSchema.index({ isActive: 1 });

const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);

export default Agent;
