import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UniversalParser } from '../services/parser/universalParser';
import { HybridClassifier } from '../services/classification/hybridClassifier';
import { ImportBatch } from '../models/ImportBatch';
import { Transaction } from '../models/Transaction';
import { AccountService } from '../services/account/account.service';

export class ImportController {
  static async uploadStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const file = req.file;
      const { accountId } = req.body;

      if (!file) {
        res.status(400).json({ success: false, error: { code: 'FILE_MISSING', message: 'No file uploaded.' } });
        return;
      }
      if (!accountId) {
        res.status(400).json({ success: false, error: { code: 'ACCOUNT_REQUIRED', message: 'Account ID is required.' } });
        return;
      }

      // Verify account ownership
      const targetAccount = await AccountService.getAccountById(authReq.userId, accountId);
      const accountName = targetAccount ? `${targetAccount.name} (${targetAccount.institutionName})` : 'this account';

      // Compute SHA-256 Hash of uploaded statement file
      const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

      // 1. Strict Duplicate File Check: Has this exact file been imported and confirmed for this account before?
      const existingBatch = await ImportBatch.findOne({
        userId: authReq.userId,
        accountId: new mongoose.Types.ObjectId(accountId),
        fileHash,
        status: 'COMPLETED',
      });

      if (existingBatch) {
        const importDate = existingBatch.confirmedAt
          ? new Date(existingBatch.confirmedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'earlier';
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_FILE',
            message: `This statement file ("${file.originalname}") has already been imported and categorized for ${accountName} on ${importDate}. Duplicate import blocked to prevent double-counting.`,
            existingBatchId: existingBatch._id,
            importedCount: existingBatch.importedCount,
          },
        });
        return;
      }

      const parsed = await UniversalParser.parseStatement(
        file.buffer,
        file.originalname,
        authReq.userId,
        new mongoose.Types.ObjectId(accountId)
      );

      // 2. Strict All-Duplicates Check: Are all transactions already present in this bank account?
      if (parsed.detectedCount > 0 && parsed.duplicateCount === parsed.detectedCount) {
        res.status(409).json({
          success: false,
          error: {
            code: 'ALL_TRANSACTIONS_EXIST',
            message: `All ${parsed.detectedCount} transactions in this statement file already exist and are categorized for ${accountName}. No new transactions were found.`,
            detectedCount: parsed.detectedCount,
            duplicateCount: parsed.duplicateCount,
          },
        });
        return;
      }

      const classifications = await HybridClassifier.classifyBatch(
        parsed.transactions.map((t) => ({ description: t.description, amountMinor: t.amountMinor })),
        authReq.userId
      );

      const previewWithClassification = parsed.transactions.map((t, idx) => {
        const classification = classifications[idx] || {
          category: 'Other / Unclassified',
          subcategory: 'General Expense',
          leafCategory: 'General Expense',
          categoryPath: 'Other / Unclassified > General Expense',
          confidence: 0.7,
          method: 'UNKNOWN',
        };

        return {
          ...t,
          category: classification.category,
          subcategory: classification.subcategory,
          leafCategory: classification.leafCategory,
          categoryPath: classification.categoryPath,
          merchant: classification.merchant || '',
          classificationConfidence: classification.confidence,
          classificationMethod: classification.method,
          reviewStatus: t.isDuplicate ? 'WARNING' : classification.confidence < 0.7 ? 'REQUIRES_REVIEW' : 'VALID',
        };
      });

      const importBatch = await ImportBatch.create({
        userId: authReq.userId,
        accountId: new mongoose.Types.ObjectId(accountId),
        originalFilenameSanitized: file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'),
        fileHash,
        fileType: parsed.fileType,
        status: 'REVIEW_REQUIRED',
        detectedCount: parsed.detectedCount,
        validCount: parsed.validCount,
        warningCount: parsed.warningCount,
        duplicateCount: parsed.duplicateCount,
        previewData: previewWithClassification,
      });

      res.status(200).json({
        success: true,
        data: {
          batchId: importBatch._id,
          detectedCount: parsed.detectedCount,
          validCount: parsed.validCount,
          warningCount: parsed.warningCount,
          duplicateCount: parsed.duplicateCount,
          preview: previewWithClassification,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const batch = await ImportBatch.findOne({ _id: req.params.batchId, userId: authReq.userId });
      if (!batch) {
        res.status(404).json({ success: false, error: { code: 'BATCH_NOT_FOUND', message: 'Import batch not found.' } });
        return;
      }
      res.status(200).json({ success: true, data: batch });
    } catch (err) {
      next(err);
    }
  }

  static async confirmImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { autoCategorizeAll, updatedRows } = req.body || {};
      const batch = await ImportBatch.findOne({ _id: req.params.batchId, userId: authReq.userId });
      if (!batch || batch.status === 'COMPLETED') {
        res.status(400).json({ success: false, error: { code: 'INVALID_BATCH', message: 'Batch cannot be confirmed.' } });
        return;
      }

      const sourceRows = Array.isArray(updatedRows) && updatedRows.length > 0 ? updatedRows : batch.previewData || [];

      // Filter out duplicate records so duplicates are never inserted into the database
      const nonDuplicateRows = sourceRows.filter((p: any) => !p.isDuplicate);

      if (nonDuplicateRows.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_NEW_TRANSACTIONS',
            message: 'All transactions in this batch are already categorized and recorded in this account. Duplicate import prevented.',
          },
        });
        return;
      }

      // Check existing fingerprints in DB to guarantee strict uniqueness
      const fingerprints = nonDuplicateRows.map((p: any) => p.fingerprint);
      const existingTxs = await Transaction.find({
        userId: authReq.userId,
        accountId: batch.accountId,
        fingerprint: { $in: fingerprints },
      }).select('fingerprint');
      const existingFpSet = new Set(existingTxs.map((t) => t.fingerprint));

      const rowsToInsert = nonDuplicateRows
        .filter((p: any) => !existingFpSet.has(p.fingerprint))
        .map((p: any) => ({
          userId: authReq.userId,
          accountId: batch.accountId,
          importBatchId: batch._id,
          date: new Date(p.date),
          description: p.description,
          normalizedDescription: p.normalizedDescription,
          amountMinor: p.amountMinor,
          currency: 'INR',
          transactionType: p.transactionType,
          merchant: p.merchant,
          category: p.category && p.category !== 'Other / Unclassified' ? p.category : autoCategorizeAll ? 'General Expenses' : (p.category || 'Other / Unclassified'),
          subcategory: p.subcategory || 'General',
          leafCategory: p.leafCategory || 'General',
          categoryPath: p.categoryPath || `${p.category || 'Other'} > General`,
          classificationConfidence: autoCategorizeAll ? 1.0 : (p.classificationConfidence || 0.8),
          classificationMethod: p.classificationMethod || 'USER',
          fingerprint: p.fingerprint,
          source: batch.fileType,
          reviewStatus: 'CONFIRMED',
        }));

      if (rowsToInsert.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'ALL_DUPLICATE_ENTRIES',
            message: 'All transactions in this statement already exist in your account records.',
          },
        });
        return;
      }

      // High-speed chunked insert (1,000 rows per batch)
      const chunkSize = 1000;
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        await Transaction.insertMany(chunk, { ordered: false });
      }

      batch.status = 'COMPLETED';
      batch.importedCount = rowsToInsert.length;
      batch.confirmedAt = new Date();
      await batch.save();

      // Recalculate account balance
      await AccountService.recalculateBalance(authReq.userId, batch.accountId);

      res.status(200).json({
        success: true,
        data: {
          importedCount: rowsToInsert.length,
          skippedDuplicates: sourceRows.length - rowsToInsert.length,
          message: `Successfully imported ${rowsToInsert.length} new transactions into Financial Flow.${sourceRows.length - rowsToInsert.length > 0 ? ` (${sourceRows.length - rowsToInsert.length} duplicate transactions safely skipped).` : ''}`,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
