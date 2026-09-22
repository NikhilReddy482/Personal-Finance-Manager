import mongoose, { Document, Schema } from 'mongoose';
import { TRANSACTION_TYPES, TransactionType } from '../config/constants';

export interface IMerchantRule extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  pattern: string;
  merchantName: string;
  mainCategory: string;
  subcategory: string;
  leafCategory?: string;
  transactionType: TransactionType;
  priority: number;
}

const MerchantRuleSchema = new Schema<IMerchantRule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    pattern: { type: String, required: true, lowercase: true, trim: true, index: true },
    merchantName: { type: String, required: true, trim: true },
    mainCategory: { type: String, required: true },
    subcategory: { type: String, required: true },
    leafCategory: { type: String },
    transactionType: { type: String, enum: TRANSACTION_TYPES, required: true },
    priority: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export const MerchantRule = mongoose.model<IMerchantRule>('MerchantRule', MerchantRuleSchema);
