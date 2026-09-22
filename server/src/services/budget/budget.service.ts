import mongoose from 'mongoose';
import { Budget, IBudget } from '../../models/Budget';
import { Transaction } from '../../models/Transaction';
import { toMinorUnits, toMajorUnits } from '../../utils/money';

export class BudgetService {
  static async listBudgets(userId: mongoose.Types.ObjectId, period: string) {
    const budgets = await Budget.find({ userId, period });
    const now = new Date();
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // Calculate days
    const totalDaysInMonth = endDate.getUTCDate();
    const isCurrentMonth = now.getUTCFullYear() === year && now.getUTCMonth() === month - 1;
    const daysElapsed = isCurrentMonth ? Math.min(now.getUTCDate(), totalDaysInMonth) : totalDaysInMonth;
    const daysRemaining = totalDaysInMonth - daysElapsed;

    const results = [];

    for (const b of budgets) {
      const match: any = {
        userId,
        date: { $gte: startDate, $lte: endDate },
        transactionType: { $in: ['EXPENSE', 'FEE'] },
        reviewStatus: { $in: ['VALID', 'CONFIRMED'] },
      };
      if (b.category) match.category = b.category;
      if (b.subcategory) match.subcategory = b.subcategory;

      const txs = await Transaction.find(match);
      const spentMinor = txs.reduce((acc, t) => acc + t.amountMinor, 0);
      const remainingMinor = b.amountLimitMinor - spentMinor;
      const percentage = (spentMinor / b.amountLimitMinor) * 100;

      // Calculate spending pace & projection
      const dailySpendVelocityMinor = daysElapsed > 0 ? spentMinor / daysElapsed : 0;
      const projectedMonthEndSpendMinor = Math.round(dailySpendVelocityMinor * totalDaysInMonth);

      let status: 'HEALTHY' | 'WATCH' | 'NEAR_LIMIT' | 'EXCEEDED' = 'HEALTHY';
      if (percentage >= 100) status = 'EXCEEDED';
      else if (percentage >= b.alertThresholdPercent) status = 'NEAR_LIMIT';
      else if (percentage >= 60) status = 'WATCH';

      results.push({
        id: b._id,
        period: b.period,
        category: b.category || 'Overall Budget',
        subcategory: b.subcategory,
        budgetLimitMinor: b.amountLimitMinor,
        budgetLimit: toMajorUnits(b.amountLimitMinor),
        spentMinor,
        spent: toMajorUnits(spentMinor),
        remainingMinor,
        remaining: toMajorUnits(remainingMinor),
        percentage: Number(percentage.toFixed(1)),
        daysElapsed,
        daysRemaining,
        dailySpendVelocity: toMajorUnits(Math.round(dailySpendVelocityMinor)),
        projectedMonthEndSpend: toMajorUnits(projectedMonthEndSpendMinor),
        status,
      });
    }

    return results;
  }

  static async setBudget(userId: mongoose.Types.ObjectId, data: any) {
    const amountLimitMinor = toMinorUnits(data.amountLimit);
    return Budget.findOneAndUpdate(
      {
        userId,
        period: data.period,
        category: data.category || undefined,
        subcategory: data.subcategory || undefined,
      },
      {
        amountLimitMinor,
        alertThresholdPercent: data.alertThresholdPercent || 80,
      },
      { upsert: true, new: true }
    );
  }

  static async deleteBudget(userId: mongoose.Types.ObjectId, budgetId: string) {
    await Budget.findOneAndDelete({ _id: budgetId, userId });
    return { message: 'Budget deleted successfully' };
  }
}
