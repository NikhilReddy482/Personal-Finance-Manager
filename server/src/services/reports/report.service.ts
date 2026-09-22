import mongoose from 'mongoose';
import { Transaction } from '../../models/Transaction';
import { AnalyticsService } from '../analytics/analytics.service';
import { InsightEngine } from '../insights/insightEngine';

export class ReportService {
  static async getMonthlyReport(userId: mongoose.Types.ObjectId, yearMonth: string) {
    return InsightEngine.explainMyFinances(userId, yearMonth);
  }

  static async exportTransactionsCsv(userId: mongoose.Types.ObjectId, startDate?: Date, endDate?: Date) {
    const match: any = { userId };
    if (startDate && endDate) {
      match.date = { $gte: startDate, $lte: endDate };
    }

    const txs = await Transaction.find(match).sort({ date: -1 });

    const headers = ['Transaction ID', 'Date', 'Description', 'Merchant', 'Category', 'Subcategory', 'Type', 'Amount', 'Currency', 'Review Status'];
    const rows = txs.map((t) => [
      t._id.toString(),
      t.date.toISOString().split('T')[0],
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.subcategory || ''}"`,
      t.transactionType,
      (t.amountMinor / 100).toFixed(2),
      t.currency,
      t.reviewStatus,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
