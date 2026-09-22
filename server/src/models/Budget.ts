import mongoose, { Document, Schema } from 'mongoose';

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  period: string; // YYYY-MM
  category?: string; // null or undefined means Overall Budget
  subcategory?: string;
  amountLimitMinor: number;
  alertThresholdPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    period: { type: String, required: true, index: true },
    category: { type: String, index: true },
    subcategory: { type: String },
    amountLimitMinor: { type: Number, required: true },
    alertThresholdPercent: { type: Number, default: 80 },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, period: 1, category: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
