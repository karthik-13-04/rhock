import mongoose from 'mongoose';

/**
 * Vendor Transaction Model
 * Tracks transaction ledger for vendor wallet deposits and payouts
 */
const vendorTransactionSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    redemptionRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RedemptionRequest',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

vendorTransactionSchema.index({ vendor: 1, createdAt: -1 });

const VendorTransaction = mongoose.models.VendorTransaction || mongoose.model('VendorTransaction', vendorTransactionSchema);

export default VendorTransaction;
