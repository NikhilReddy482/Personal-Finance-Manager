import mongoose, { Document, Schema } from 'mongoose';

export interface IGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  targetDate?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  linkedAccountId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmountMinor: { type: Number, required: true },
    currentAmountMinor: { type: Number, default: 0 },
    targetDate: { type: Date },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    linkedAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
  },
  { timestamps: true }
);

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);
