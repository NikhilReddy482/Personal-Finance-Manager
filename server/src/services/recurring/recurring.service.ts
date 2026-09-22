import mongoose from 'mongoose';
import { Transaction } from '../../models/Transaction';
import { RecurringGroup, IRecurringGroup } from '../../models/RecurringGroup';
import { toMajorUnits } from '../../utils/money';

export class RecurringService {
  static async detectAndSyncRecurring(userId: mongoose.Types.ObjectId) {
    // Group transactions by merchant
    const merchantGroups = await Transaction.aggregate([
      {
        $match: {
          userId,
          merchant: { $exists: true, $ne: '' },
          transactionType: { $in: ['EXPENSE', 'DEBT_PAYMENT'] },
          reviewStatus: { $in: ['VALID', 'CONFIRMED'] },
        },
      },
      {
        $group: {
          _id: '$merchant',
          category: { $first: '$category' },
          count: { $sum: 1 },
          transactions: {
            $push: {
              date: '$date',
              amountMinor: '$amountMinor',
              id: '$_id',
            },
          },
        },
      },
      { $match: { count: { $gte: 2 } } },
    ]);

    for (const group of merchantGroups) {
      const sorted = group.transactions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate intervals in days
      const intervals: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const diffDays = Math.round((new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / (1000 * 60 * 60 * 24));
        intervals.push(diffDays);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      let frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' = 'MONTHLY';

      if (avgInterval >= 5 && avgInterval <= 9) frequency = 'WEEKLY';
      else if (avgInterval >= 12 && avgInterval <= 18) frequency = 'BIWEEKLY';
      else if (avgInterval >= 25 && avgInterval <= 35) frequency = 'MONTHLY';
      else if (avgInterval >= 80 && avgInterval <= 100) frequency = 'QUARTERLY';
      else if (avgInterval >= 340 && avgInterval <= 380) frequency = 'YEARLY';
      else continue; // Not a regular pattern

      const lastTx = sorted[sorted.length - 1];
      const typicalAmountMinor = Math.round(sorted.reduce((acc: number, t: any) => acc + t.amountMinor, 0) / sorted.length);

      const nextExpectedDate = new Date(lastTx.date);
      if (frequency === 'MONTHLY') nextExpectedDate.setMonth(nextExpectedDate.getMonth() + 1);
      else if (frequency === 'WEEKLY') nextExpectedDate.setDate(nextExpectedDate.getDate() + 7);
      else if (frequency === 'BIWEEKLY') nextExpectedDate.setDate(nextExpectedDate.getDate() + 14);
      else if (frequency === 'QUARTERLY') nextExpectedDate.setMonth(nextExpectedDate.getMonth() + 3);
      else if (frequency === 'YEARLY') nextExpectedDate.setFullYear(nextExpectedDate.getFullYear() + 1);

      const isSub = group.category === 'Digital & Subscriptions' || group._id.toLowerCase().includes('netflix') || group._id.toLowerCase().includes('spotify');

      const recurringDoc = await RecurringGroup.findOneAndUpdate(
        { userId, merchant: group._id },
        {
          category: group.category,
          typicalAmountMinor,
          frequency,
          lastDate: lastTx.date,
          nextExpectedDate,
          confidence: 0.9,
          isSubscription: isSub,
          $addToSet: {
            priceHistory: { date: lastTx.date, amountMinor: lastTx.amountMinor },
          },
        },
        { upsert: true, new: true }
      );

      // Link transactions to recurring group
      const txIds = sorted.map((s: any) => s.id);
      await Transaction.updateMany(
        { _id: { $in: txIds } },
        { isRecurring: true, recurringGroupId: recurringDoc._id }
      );
    }
  }

  static async getRecurringSummary(userId: mongoose.Types.ObjectId) {
    await this.detectAndSyncRecurring(userId);
    const groups = await RecurringGroup.find({ userId, status: 'ACTIVE' }).sort({ typicalAmountMinor: -1 });

    let totalMonthlyCommitmentMinor = 0;
    const items = groups.map((g) => {
      let monthlyMinor = g.typicalAmountMinor;
      if (g.frequency === 'WEEKLY') monthlyMinor = Math.round(g.typicalAmountMinor * 4.33);
      else if (g.frequency === 'BIWEEKLY') monthlyMinor = Math.round(g.typicalAmountMinor * 2.16);
      else if (g.frequency === 'QUARTERLY') monthlyMinor = Math.round(g.typicalAmountMinor / 3);
      else if (g.frequency === 'YEARLY') monthlyMinor = Math.round(g.typicalAmountMinor / 12);

      totalMonthlyCommitmentMinor += monthlyMinor;

      return {
        id: g._id,
        merchant: g.merchant,
        category: g.category,
        typicalAmountMinor: g.typicalAmountMinor,
        typicalAmount: toMajorUnits(g.typicalAmountMinor),
        monthlyEquivalent: toMajorUnits(monthlyMinor),
        annualizedCost: toMajorUnits(monthlyMinor * 12),
        frequency: g.frequency,
        lastDate: g.lastDate,
        nextExpectedDate: g.nextExpectedDate,
        isSubscription: g.isSubscription,
        confidence: g.confidence,
      };
    });

    return {
      totalMonthlyCommitmentMinor,
      totalMonthlyCommitment: toMajorUnits(totalMonthlyCommitmentMinor),
      totalAnnualCommitment: toMajorUnits(totalMonthlyCommitmentMinor * 12),
      recurringItems: items,
    };
  }
}
