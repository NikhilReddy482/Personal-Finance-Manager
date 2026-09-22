import mongoose, { Document, Schema } from 'mongoose';

export interface IClassificationFeedback extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  transactionId: mongoose.Types.ObjectId;
  originalPrediction: string;
  correctedCategory: string;
  originalConfidence: number;
  normalizedDescription: string;
  modelVersion?: string;
  createdAt: Date;
}

const ClassificationFeedbackSchema = new Schema<IClassificationFeedback>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    originalPrediction: { type: String, required: true },
    correctedCategory: { type: String, required: true },
    originalConfidence: { type: Number, required: true },
    normalizedDescription: { type: String, required: true },
    modelVersion: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ClassificationFeedback = mongoose.model<IClassificationFeedback>('ClassificationFeedback', ClassificationFeedbackSchema);
