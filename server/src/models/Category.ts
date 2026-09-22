import mongoose, { Document, Schema } from 'mongoose';
import { TRANSACTION_TYPES, TransactionType } from '../config/constants';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  mainCategory: string;
  subcategory: string;
  leafCategory: string;
  defaultTransactionType: TransactionType;
  icon?: string;
  isSystem: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    mainCategory: { type: String, required: true, index: true },
    subcategory: { type: String, required: true, index: true },
    leafCategory: { type: String, required: true },
    defaultTransactionType: { type: String, enum: TRANSACTION_TYPES, required: true },
    icon: { type: String },
    isSystem: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ mainCategory: 1, subcategory: 1, leafCategory: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
