import mongoose, { Document, Schema } from 'mongoose';
import {
  TRANSACTION_TYPES,
  TransactionType,
  CLASSIFICATION_METHODS,
  ClassificationMethod,
  REVIEW_STATUSES,
  ReviewStatus,
} from '../config/constants';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  importBatchId?: mongoose.Types.ObjectId;
  date: Date;
  postedDate?: Date;
  description: string;
  normalizedDescription: string;
  amountMinor: number;
  currency: string;
  transactionType: TransactionType;
  debitMinor?: number;
  creditMinor?: number;
  balanceAfterTransactionMinor?: number;
  referenceNumber?: string;
  merchant?: string;
  category: string;
  subcategory?: string;
  leafCategory?: string;
  categoryPath?: string;
  classificationConfidence: number;
  classificationMethod: ClassificationMethod;
  fingerprint: string;
  source: 'CSV' | 'XLSX' | 'PDF' | 'OCR' | 'MANUAL';
  isRecurring: boolean;
  recurringGroupId?: mongoose.Types.ObjectId;
  isAnomaly: boolean;
  anomalyScore?: number;
  anomalyReason?: string;
  reviewStatus: ReviewStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    importBatchId: { type: Schema.Types.ObjectId, ref: 'ImportBatch', index: true },
    date: { type: Date, required: true, index: true },
    postedDate: { type: Date },
    description: { type: String, required: true, trim: true },
    normalizedDescription: { type: String, required: true, trim: true },
    amountMinor: { type: Number, required: true }, // Always positive minor integer
    currency: { type: String, default: 'INR' },
    transactionType: { type: String, enum: TRANSACTION_TYPES, required: true },
    debitMinor: { type: Number },
    creditMinor: { type: Number },
    balanceAfterTransactionMinor: { type: Number },
    referenceNumber: { type: String, trim: true },
    merchant: { type: String, trim: true, index: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, index: true },
    leafCategory: { type: String },
    categoryPath: { type: String },
    classificationConfidence: { type: Number, default: 0.5 },
    classificationMethod: { type: String, enum: CLASSIFICATION_METHODS, default: 'UNKNOWN' },
    fingerprint: { type: String, required: true, index: true },
    source: { type: String, enum: ['CSV', 'XLSX', 'PDF', 'OCR', 'MANUAL'], default: 'CSV' },
    isRecurring: { type: Boolean, default: false },
    recurringGroupId: { type: Schema.Types.ObjectId, ref: 'RecurringGroup' },
    isAnomaly: { type: Boolean, default: false },
    anomalyScore: { type: Number },
    anomalyReason: { type: String },
    reviewStatus: { type: String, enum: REVIEW_STATUSES, default: 'CONFIRMED', index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, accountId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1, date: -1 });
TransactionSchema.index({ userId: 1, merchant: 1, date: -1 });
TransactionSchema.index({ userId: 1, fingerprint: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
