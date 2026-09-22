import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Transaction } from '../models/Transaction';
import { ClassificationFeedback } from '../models/ClassificationFeedback';
import { toMinorUnits, toMajorUnits } from '../utils/money';
import { RuleEngine } from '../services/classification/ruleEngine';
import { generateFingerprint } from '../security/crypto';

export class TransactionController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        accountId,
        category,
        transactionType,
        search,
        isAnomaly,
        isRecurring,
        reviewStatus,
        sortBy = 'date',
        sortOrder = 'desc',
      } = req.query as any;

      const match: any = { userId: authReq.userId };

      if (startDate || endDate) {
        match.date = {};
        if (startDate) match.date.$gte = new Date(startDate);
        if (endDate) match.date.$lte = new Date(endDate);
      }
      if (accountId && accountId !== 'all') match.accountId = new mongoose.Types.ObjectId(accountId);
      if (category) match.category = category;
      if (transactionType) match.transactionType = transactionType;
      if (isAnomaly !== undefined) match.isAnomaly = isAnomaly === 'true' || isAnomaly === true;
      if (isRecurring !== undefined) match.isRecurring = isRecurring === 'true' || isRecurring === true;
      if (reviewStatus) match.reviewStatus = reviewStatus;

      if (search) {
        match.$or = [
          { description: { $regex: search, $options: 'i' } },
          { merchant: { $regex: search, $options: 'i' } },
          { referenceNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [total, transactions] = await Promise.all([
        Transaction.countDocuments(match),
        Transaction.find(match).populate('accountId', 'name institutionName maskedIdentifier').sort(sort).skip(skip).limit(Number(limit)),
      ]);

      const formatted = transactions.map((t) => ({
        id: t._id,
        accountId: t.accountId && typeof t.accountId === 'object' && '_id' in t.accountId ? (t.accountId as any)._id : t.accountId,
        account: t.accountId && typeof t.accountId === 'object' && 'name' in t.accountId
          ? {
              id: (t.accountId as any)._id,
              name: (t.accountId as any).name,
              institutionName: (t.accountId as any).institutionName,
              maskedIdentifier: (t.accountId as any).maskedIdentifier,
            }
          : null,
        date: t.date,
        description: t.description,
        normalizedDescription: t.normalizedDescription,
        amountMinor: t.amountMinor,
        amount: toMajorUnits(t.amountMinor),
        currency: t.currency,
        transactionType: t.transactionType,
        merchant: t.merchant,
        category: t.category,
        subcategory: t.subcategory,
        leafCategory: t.leafCategory,
        categoryPath: t.categoryPath,
        classificationConfidence: t.classificationConfidence,
        classificationMethod: t.classificationMethod,
        isRecurring: t.isRecurring,
        isAnomaly: t.isAnomaly,
        anomalyScore: t.anomalyScore,
        anomalyReason: t.anomalyReason,
        reviewStatus: t.reviewStatus,
        source: t.source,
      }));

      res.status(200).json({
        success: true,
        data: {
          transactions: formatted,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getReviewQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const reviewItems = await Transaction.find({
        userId: authReq.userId,
        reviewStatus: { $in: ['REQUIRES_REVIEW', 'WARNING'] },
      }).sort({ date: -1 });

      res.status(200).json({ success: true, data: reviewItems });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { category, subcategory, leafCategory, transactionType, reviewStatus, notes } = req.body;

      const tx = await Transaction.findOne({ _id: id, userId: authReq.userId });
      if (!tx) {
        res.status(404).json({ success: false, error: { code: 'TX_NOT_FOUND', message: 'Transaction not found.' } });
        return;
      }

      // Record classification feedback if category changed
      if (category && category !== tx.category) {
        await ClassificationFeedback.create({
          userId: authReq.userId,
          transactionId: tx._id,
          originalPrediction: tx.category,
          correctedCategory: category,
          originalConfidence: tx.classificationConfidence,
          normalizedDescription: tx.normalizedDescription,
        });

        tx.category = category;
        tx.classificationMethod = 'USER';
        tx.classificationConfidence = 1.0;
      }

      if (subcategory !== undefined) tx.subcategory = subcategory;
      if (leafCategory !== undefined) tx.leafCategory = leafCategory;
      if (transactionType !== undefined) tx.transactionType = transactionType;
      if (reviewStatus !== undefined) tx.reviewStatus = reviewStatus;
      if (notes !== undefined) tx.notes = notes;

      await tx.save();
      res.status(200).json({ success: true, data: tx });
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      await Transaction.findOneAndDelete({ _id: req.params.id, userId: authReq.userId });
      res.status(200).json({ success: true, data: { message: 'Transaction deleted.' } });
    } catch (err) {
      next(err);
    }
  }
}
