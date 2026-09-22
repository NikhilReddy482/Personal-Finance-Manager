import mongoose, { Document, Schema } from 'mongoose';
import { IMPORT_STATUSES, ImportStatus } from '../config/constants';

export interface IImportBatch extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  originalFilenameSanitized: string;
  fileHash?: string;
  fileType: 'CSV' | 'XLSX' | 'PDF' | 'OCR';
  status: ImportStatus;
  detectedCount: number;
  validCount: number;
  warningCount: number;
  duplicateCount: number;
  importedCount: number;
  previewData?: any[];
  reconciliationInfo?: {
    openingBalanceMinor?: number;
    closingBalanceMinor?: number;
    calculatedClosingMinor?: number;
    isReconciled: boolean;
  };
  errorMessage?: string;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ImportBatchSchema = new Schema<IImportBatch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    originalFilenameSanitized: { type: String, required: true },
    fileHash: { type: String, index: true },
    fileType: { type: String, enum: ['CSV', 'XLSX', 'PDF', 'OCR'], required: true },
    status: { type: String, enum: IMPORT_STATUSES, default: 'UPLOADED', index: true },
    detectedCount: { type: Number, default: 0 },
    validCount: { type: Number, default: 0 },
    warningCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    importedCount: { type: Number, default: 0 },
    previewData: { type: [Schema.Types.Mixed], default: [] },
    reconciliationInfo: {
      openingBalanceMinor: { type: Number },
      closingBalanceMinor: { type: Number },
      calculatedClosingMinor: { type: Number },
      isReconciled: { type: Boolean, default: false },
    },
    errorMessage: { type: String },
    confirmedAt: { type: Date },
  },
  { timestamps: true }
);

ImportBatchSchema.index({ userId: 1, accountId: 1, fileHash: 1, status: 1 });

export const ImportBatch = mongoose.model<IImportBatch>('ImportBatch', ImportBatchSchema);
