import mongoose, { Document, Schema } from 'mongoose';
import { ACCOUNT_TYPES, AccountType } from '../config/constants';

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  institutionName: string;
  accountType: AccountType;
  currency: string;
  maskedIdentifier?: string;
  openingBalanceMinor: number;
  currentBalanceMinor: number;
  creditLimitMinor?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    institutionName: { type: String, required: true, trim: true },
    accountType: { type: String, enum: ACCOUNT_TYPES, required: true },
    currency: { type: String, default: 'INR' },
    maskedIdentifier: { type: String, trim: true },
    openingBalanceMinor: { type: Number, default: 0 },
    currentBalanceMinor: { type: Number, default: 0 },
    creditLimitMinor: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AccountSchema.index({ userId: 1, isActive: 1 });

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
