import mongoose, { Document, Schema } from 'mongoose';
import { RECURRING_FREQUENCIES, RecurringFrequency } from '../config/constants';

export interface IRecurringGroup extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  merchant: string;
  category: string;
  typicalAmountMinor: number;
  frequency: RecurringFrequency;
  lastDate: Date;
  nextExpectedDate?: Date;
  confidence: number;
  isSubscription: boolean;
  priceHistory: { date: Date; amountMinor: number }[];
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const RecurringGroupSchema = new Schema<IRecurringGroup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    merchant: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    typicalAmountMinor: { type: Number, required: true },
    frequency: { type: String, enum: RECURRING_FREQUENCIES, default: 'MONTHLY' },
    lastDate: { type: Date, required: true },
    nextExpectedDate: { type: Date },
    confidence: { type: Number, default: 0.8 },
    isSubscription: { type: Boolean, default: false },
    priceHistory: [
      {
        date: { type: Date, required: true },
        amountMinor: { type: Number, required: true },
      },
    ],
    status: { type: String, enum: ['ACTIVE', 'PAUSED', 'CANCELLED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const RecurringGroup = mongoose.model<IRecurringGroup>('RecurringGroup', RecurringGroupSchema);
