import mongoose from 'mongoose';
import { Transaction } from '../../models/Transaction';
import { toMajorUnits } from '../../utils/money';

export class AnalyticsService {
  static async getOverview(
    userId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date,
    accountId?: string
  ) {
    const match: any = {
      userId,
      date: { $gte: startDate, $lte: endDate },
      reviewStatus: { $in: ['VALID', 'CONFIRMED'] },
    };
    if (accountId) match.accountId = new mongoose.Types.ObjectId(accountId);

    const txs = await Transaction.find(match);

    let totalIncomeMinor = 0;
    let totalExpenseMinor = 0;
    let totalInvestmentsMinor = 0;
    let totalDebtPaymentsMinor = 0;
    let totalTransfersMinor = 0;
    let totalRefundsMinor = 0;

    for (const t of txs) {
      if (t.transactionType === 'INCOME') totalIncomeMinor += t.amountMinor;
      else if (t.transactionType === 'EXPENSE' || t.transactionType === 'FEE') totalExpenseMinor += t.amountMinor;
      else if (t.transactionType === 'INVESTMENT') totalInvestmentsMinor += t.amountMinor;
      else if (t.transactionType === 'DEBT_PAYMENT') totalDebtPaymentsMinor += t.amountMinor;
      else if (t.transactionType === 'TRANSFER') totalTransfersMinor += t.amountMinor;
      else if (t.transactionType === 'REFUND') totalRefundsMinor += t.amountMinor;
    }

    // Net cash flow = Total Income + Refunds - Expenses - Fees - Investments - Debt Payments
    const netCashFlowMinor = totalIncomeMinor + totalRefundsMinor - totalExpenseMinor - totalInvestmentsMinor - totalDebtPaymentsMinor;
    
    // Savings = Income - Consumption Expenses
    const savingsMinor = totalIncomeMinor - totalExpenseMinor;
    const savingsRate = totalIncomeMinor > 0 ? Math.max(0, (savingsMinor / totalIncomeMinor) * 100) : 0;

    return {
      period: { startDate, endDate },
      totalIncomeMinor,
      totalIncome: toMajorUnits(totalIncomeMinor),
      totalExpenseMinor,
      totalExpense: toMajorUnits(totalExpenseMinor),
      totalInvestmentsMinor,
      totalInvestments: toMajorUnits(totalInvestmentsMinor),
      totalDebtPaymentsMinor,
      totalDebtPayments: toMajorUnits(totalDebtPaymentsMinor),
      totalTransfersMinor,
      totalTransfers: toMajorUnits(totalTransfersMinor),
      totalRefundsMinor,
      totalRefunds: toMajorUnits(totalRefundsMinor),
      netCashFlowMinor,
      netCashFlow: toMajorUnits(netCashFlowMinor),
      savingsMinor,
      savings: toMajorUnits(savingsMinor),
      savingsRate: Number(savingsRate.toFixed(2)),
      transactionCount: txs.length,
    };
  }

  static async getCategoryBreakdown(
    userId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date,
    type: string = 'EXPENSE',
    accountId?: string
  ) {
    const match: any = {
      userId,
      date: { $gte: startDate, $lte: endDate },
      reviewStatus: { $in: ['VALID', 'CONFIRMED'] },
    };
    if (type) match.transactionType = type;
    if (accountId) match.accountId = new mongoose.Types.ObjectId(accountId);

    const breakdown = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { category: '$category', subcategory: '$subcategory' },
          totalAmountMinor: { $sum: '$amountMinor' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.category',
          totalAmountMinor: { $sum: '$totalAmountMinor' },
          count: { $sum: '$count' },
          subcategories: {
            $push: {
              subcategory: '$_id.subcategory',
              amountMinor: '$totalAmountMinor',
              count: '$count',
            },
          },
        },
      },
      { $sort: { totalAmountMinor: -1 } },
    ]);

    const totalCategorySpendMinor = breakdown.reduce((acc, c) => acc + c.totalAmountMinor, 0);

    return breakdown.map((cat) => ({
      category: cat._id,
      totalAmountMinor: cat.totalAmountMinor,
      totalAmount: toMajorUnits(cat.totalAmountMinor),
      percentage: totalCategorySpendMinor > 0 ? Number(((cat.totalAmountMinor / totalCategorySpendMinor) * 100).toFixed(2)) : 0,
      count: cat.count,
      subcategories: cat.subcategories.map((sub: any) => ({
        subcategory: sub.subcategory || 'General',
        amountMinor: sub.amountMinor,
        amount: toMajorUnits(sub.amountMinor),
        percentage: cat.totalAmountMinor > 0 ? Number(((sub.amountMinor / cat.totalAmountMinor) * 100).toFixed(2)) : 0,
        count: sub.count,
      })),
    }));
  }

  static async getMonthlyTrends(
    userId: mongoose.Types.ObjectId,
    months: number = 6,
    accountId?: string
  ) {
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months);
    fromDate.setDate(1);

    const match: any = {
      userId,
      date: { $gte: fromDate },
      reviewStatus: { $in: ['VALID', 'CONFIRMED'] },
    };
    if (accountId) match.accountId = new mongoose.Types.ObjectId(accountId);

    const trends = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            yearMonth: { $dateToString: { format: '%Y-%m', date: '$date' } },
            type: '$transactionType',
          },
          totalAmountMinor: { $sum: '$amountMinor' },
        },
      },
      {
        $group: {
          _id: '$_id.yearMonth',
          data: {
            $push: {
              type: '$_id.type',
              amountMinor: '$totalAmountMinor',
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return trends.map((t) => {
      let incomeMinor = 0;
      let expenseMinor = 0;
      let investmentMinor = 0;

      for (const item of t.data) {
        if (item.type === 'INCOME') incomeMinor = item.amountMinor;
        else if (item.type === 'EXPENSE' || item.type === 'FEE') expenseMinor += item.amountMinor;
        else if (item.type === 'INVESTMENT') investmentMinor = item.amountMinor;
      }

      const savingsMinor = incomeMinor - expenseMinor;
      const savingsRate = incomeMinor > 0 ? Math.max(0, (savingsMinor / incomeMinor) * 100) : 0;

      return {
        month: t._id,
        incomeMinor,
        income: toMajorUnits(incomeMinor),
        expenseMinor,
        expense: toMajorUnits(expenseMinor),
        investmentMinor,
        investment: toMajorUnits(investmentMinor),
        savingsMinor,
        savings: toMajorUnits(savingsMinor),
        savingsRate: Number(savingsRate.toFixed(2)),
      };
    });
  }

  static async getTopMerchants(
    userId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
    accountId?: string
  ) {
    const match: any = {
      userId,
      date: { $gte: startDate, $lte: endDate },
      transactionType: { $in: ['EXPENSE', 'FEE'] },
      merchant: { $exists: true, $ne: '' },
      reviewStatus: { $in: ['VALID', 'CONFIRMED'] },
    };
    if (accountId) match.accountId = new mongoose.Types.ObjectId(accountId);

    const merchants = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$merchant',
          totalAmountMinor: { $sum: '$amountMinor' },
          count: { $sum: 1 },
          category: { $first: '$category' },
        },
      },
      { $sort: { totalAmountMinor: -1 } },
      { $limit: limit },
    ]);

    return merchants.map((m) => ({
      merchant: m._id,
      totalAmountMinor: m.totalAmountMinor,
      totalAmount: toMajorUnits(m.totalAmountMinor),
      count: m.count,
      category: m.category,
      avgTicket: toMajorUnits(Math.round(m.totalAmountMinor / m.count)),
    }));
  }
}
