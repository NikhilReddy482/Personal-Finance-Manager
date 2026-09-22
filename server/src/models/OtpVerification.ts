import mongoose, { Document, Schema } from 'mongoose';

export interface IOtpVerification extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'LOGIN' | 'DELETE_ACCOUNT';
  attempts: number;
  cooldownUntil: Date;
  expiresAt: Date;
  createdAt: Date;
}

const OtpVerificationSchema = new Schema<IOtpVerification>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    purpose: { type: String, enum: ['REGISTRATION', 'PASSWORD_RESET', 'LOGIN', 'DELETE_ACCOUNT'], required: true },

    attempts: { type: Number, default: 0 },
    cooldownUntil: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const OtpVerification = mongoose.model<IOtpVerification>('OtpVerification', OtpVerificationSchema);
