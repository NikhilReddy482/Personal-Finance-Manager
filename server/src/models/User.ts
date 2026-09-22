import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreferences {
  currency: string;
  locale: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  aiPrivacyMode: boolean;
}

export interface IPasskey {
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName: string;
  transports?: string[];
  createdAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecretEncrypted?: string;
  mfaRecoveryCodeHashes: string[];
  passkeys: IPasskey[];
  currentChallenge?: string;
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const PasskeySchema = new Schema<IPasskey>({
  credentialId: { type: String, required: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, default: 0 },
  deviceName: { type: String, default: 'Biometric Authenticator' },
  transports: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecretEncrypted: { type: String },
    mfaRecoveryCodeHashes: { type: [String], default: [] },
    passkeys: { type: [PasskeySchema], default: [] },
    currentChallenge: { type: String },
    preferences: {
      currency: { type: String, default: 'INR' },
      locale: { type: String, default: 'en-IN' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
      aiPrivacyMode: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
