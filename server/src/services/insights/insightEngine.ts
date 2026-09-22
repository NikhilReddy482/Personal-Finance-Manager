import mongoose from 'mongoose';
import axios from 'axios';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnomalyService } from '../anomaly/anomaly.service';
import { RecurringService } from '../recurring/recurring.service';
import { Transaction } from '../../models/Transaction';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface IExplainFinancesResult {
  period: string;
  availableMonths: string[];
  current: any;
  previous: any;
  delta: {
    expenseDiff: number;
    expensePctChange: number;
    incomeDiff: number;
    incomePctChange: number;
  };
  rule503020: {
    needs: { amount: number; percentage: number; targetPercentage: number };
    wants: { amount: number; percentage: number; targetPercentage: number };
    savings: { amount: number; percentage: number; targetPercentage: number };
  };
  topCategories: any[];
  topMerchants: any[];
  recurringSummary: any;
  anomaliesCount: number;
  structuredInsights: { type: string; title: string; message: string; severity: 'INFO' | 'WARNING' | 'POSITIVE' }[];
  narrative: string;
  aiAnalysis: {
    executiveSummary: string;
    financialHealthScore: number;
    healthGrade: string;
    budgetVerdict: string;
    keyTakeaways: string[];
    actionableRecommendations: string[];
  };
}

export class InsightEngine {
  static async explainMyFinances(
    userId: mongoose.Types.ObjectId,
    selectedMonth?: string,
    options?: { startDate?: string; endDate?: string; accountId?: string }
  ): Promise<IExplainFinancesResult> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const accountId = options?.accountId;

    const monthMatch: any = { userId: userObjectId };
    if (accountId) monthMatch.accountId = new mongoose.Types.ObjectId(accountId);

    // 1. Discover all distinct transaction months for this user
    const distinctMonths = await Transaction.aggregate([
      { $match: monthMatch },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const availableMonths = distinctMonths.map((m) => m._id);

    let currentStart: Date;
    let currentEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;
    let activePeriodLabel = selectedMonth;

    if (options?.startDate && options?.endDate) {
      currentStart = new Date(options.startDate);
      currentEnd = new Date(options.endDate);
      const durationMs = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - durationMs);
      activePeriodLabel = `${options.startDate.substring(0, 10)} to ${options.endDate.substring(0, 10)}`;
    } else {
      // 2. Select active month (default to latest month with data if not passed)
      const now = new Date();
      const currentMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const activeMonth = selectedMonth || (availableMonths.length > 0 ? availableMonths[0] : currentMonthStr);
      activePeriodLabel = activeMonth;

      const [yearStr, monthStr] = activeMonth.split('-');
      const currentYear = parseInt(yearStr, 10);
      const currentMonthNum = parseInt(monthStr, 10);

      currentStart = new Date(Date.UTC(currentYear, currentMonthNum - 1, 1));
      currentEnd = new Date(Date.UTC(currentYear, currentMonthNum, 0, 23, 59, 59, 999));

      prevStart = new Date(Date.UTC(currentYear, currentMonthNum - 2, 1));
      prevEnd = new Date(Date.UTC(currentYear, currentMonthNum - 1, 0, 23, 59, 59, 999));
    }

    // 3. Compute deterministic aggregates concurrently
    const [
      current,
      previous,
      categoryBreakdown,
      topMerchants,
      anomalies,
      recurring,
    ] = await Promise.all([
      AnalyticsService.getOverview(userObjectId, currentStart, currentEnd, accountId),
      AnalyticsService.getOverview(userObjectId, prevStart, prevEnd, accountId),
      AnalyticsService.getCategoryBreakdown(userObjectId, currentStart, currentEnd, 'EXPENSE', accountId),
      AnalyticsService.getTopMerchants(userObjectId, currentStart, currentEnd, 5, accountId),
      AnomalyService.getAnomalies(userObjectId),
      RecurringService.getRecurringSummary(userObjectId),
    ]);

    // Delta calculations
    const expenseDiff = current.totalExpense - previous.totalExpense;
    const expensePctChange = previous.totalExpense > 0 ? (expenseDiff / previous.totalExpense) * 100 : 0;

    const incomeDiff = current.totalIncome - previous.totalIncome;
    const incomePctChange = previous.totalIncome > 0 ? (incomeDiff / previous.totalIncome) * 100 : 0;

    // 4. Calculate 50/30/20 Rule Breakdown
    const needsCategories = ['Housing', 'Utilities & Bills', 'Healthcare', 'Debt & Loans', 'Groceries'];
    const wantsCategories = ['Shopping & Retail', 'Food & Dining', 'Entertainment', 'Digital & Subscriptions', 'Personal Care'];

    let needsAmount = 0;
    let wantsAmount = 0;

    for (const cat of categoryBreakdown) {
      if (needsCategories.includes(cat.category)) {
        needsAmount += cat.totalAmount;
      } else if (wantsCategories.includes(cat.category)) {
        wantsAmount += cat.totalAmount;
      } else {
        // Distribute other between needs and wants
        needsAmount += cat.totalAmount * 0.5;
        wantsAmount += cat.totalAmount * 0.5;
      }
    }

    const totalIncome = current.totalIncome > 0 ? current.totalIncome : current.totalExpense;
    const needsPct = totalIncome > 0 ? Number(((needsAmount / totalIncome) * 100).toFixed(1)) : 0;
    const wantsPct = totalIncome > 0 ? Number(((wantsAmount / totalIncome) * 100).toFixed(1)) : 0;
    const savingsPct = current.savingsRate;

    const rule503020 = {
      needs: { amount: Math.round(needsAmount), percentage: needsPct, targetPercentage: 50 },
      wants: { amount: Math.round(wantsAmount), percentage: wantsPct, targetPercentage: 30 },
      savings: { amount: Math.max(0, current.savings), percentage: savingsPct, targetPercentage: 20 },
    };

    // 5. Algorithmic Signals
    const structuredInsights: { type: string; title: string; message: string; severity: 'INFO' | 'WARNING' | 'POSITIVE' }[] = [];

    if (expensePctChange > 15) {
      structuredInsights.push({
        type: 'HIGH_EXPENSE_GROWTH',
        title: 'Expenses Surged',
        message: `Your spending increased by ${expensePctChange.toFixed(1)}% (+₹${Math.abs(expenseDiff).toLocaleString()}) compared to previous period.`,
        severity: 'WARNING',
      });
    } else if (expensePctChange < -10) {
      structuredInsights.push({
        type: 'EXPENSE_REDUCTION',
        title: 'Spending Under Control',
        message: `You reduced overall expenses by ${Math.abs(expensePctChange).toFixed(1)}% (-₹${Math.abs(expenseDiff).toLocaleString()}) compared to previous period.`,
        severity: 'POSITIVE',
      });
    }

    if (current.savingsRate >= 30) {
      structuredInsights.push({
        type: 'STRONG_SAVINGS',
        title: 'Outstanding Savings Rate',
        message: `You saved ${current.savingsRate}% of your income in ${activePeriodLabel}, comfortably beating the recommended 20% benchmark.`,
        severity: 'POSITIVE',
      });
    } else if (current.savingsRate < 10 && current.totalIncome > 0) {
      structuredInsights.push({
        type: 'LOW_SAVINGS',
        title: 'Tight Cash Buffer',
        message: `Your savings rate was ${current.savingsRate}% in ${activePeriodLabel}. Consider re-evaluating top discretionary expenses.`,
        severity: 'WARNING',
      });
    }

    if (wantsPct > 40) {
      structuredInsights.push({
        type: 'HIGH_DISCRETIONARY',
        title: 'High Discretionary Spending',
        message: `Discretionary 'Wants' accounted for ${wantsPct}% of cash flow (Target: 30%). Shopping and dining drove the majority.`,
        severity: 'WARNING',
      });
    }

    if (anomalies.length > 0) {
      structuredInsights.push({
        type: 'UNUSUAL_TRANSACTIONS',
        title: 'Unusual Outliers Flagged',
        message: `${anomalies.length} transaction(s) were flagged as statistical anomalies for this profile.`,
        severity: 'INFO',
      });
    }

    // Deterministic Narrative
    const topCatName = categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'None';
    const topCatAmount = categoryBreakdown.length > 0 ? categoryBreakdown[0].totalAmount : 0;

    const narrative = `In ${activePeriodLabel}, you earned ₹${current.totalIncome.toLocaleString()} and spent ₹${current.totalExpense.toLocaleString()}, resulting in net savings of ₹${current.savings.toLocaleString()} (${current.savingsRate}% savings rate). ` +
      `Your largest spending driver was ${topCatName} at ₹${topCatAmount.toLocaleString()} (${categoryBreakdown.length > 0 ? categoryBreakdown[0].percentage : 0}% of total expenses). ` +
      (expenseDiff > 0
        ? `Expenses increased by ${expensePctChange.toFixed(1)}% compared to the previous period.`
        : expenseDiff < 0
        ? `Expenses decreased by ${Math.abs(expensePctChange).toFixed(1)}% compared to the previous period.`
        : `Spending remained stable compared to the previous period.`);

    // 6. Deep OpenRouter AI Financial Intelligence
    let aiAnalysis = {
      executiveSummary: narrative,
      financialHealthScore: Math.min(100, Math.max(20, Math.round(50 + current.savingsRate * 0.8))),
      healthGrade: current.savingsRate >= 35 ? 'A+' : current.savingsRate >= 20 ? 'A' : current.savingsRate >= 10 ? 'B' : current.savingsRate >= 0 ? 'C' : 'D',
      budgetVerdict: current.savings >= 0 ? 'Cash Flow Positive' : 'Deficit / Overspending',
      keyTakeaways: [
        `Net savings of ₹${current.savings.toLocaleString()} achieved for ${activePeriodLabel}.`,
        `Top expense category is ${topCatName} (₹${topCatAmount.toLocaleString()}).`,
        `Discretionary spending is at ${wantsPct}% against the 30% standard.`,
      ],
      actionableRecommendations: [
        `Cap ${topCatName} spending next month to boost monthly savings by 5-10%.`,
        `Audit recurring subscriptions and utilities for consolidation opportunities.`,
        `Direct surplus savings into liquid or index investment vehicles.`,
      ],
    };

    if (env.OPENROUTER_API_KEY && (current.totalIncome > 0 || current.totalExpense > 0)) {
      try {
        const aiPrompt = `You are a Chief Financial Officer and Senior Personal Wealth Advisor. Analyze this verified monthly financial profile:
Period: ${activePeriodLabel}
Total Income: ₹${current.totalIncome.toLocaleString()}
Total Expenses: ₹${current.totalExpense.toLocaleString()}
Net Cash Flow / Savings: ₹${current.savings.toLocaleString()} (${current.savingsRate}% Savings Rate)
Top Spending Categories: ${categoryBreakdown.slice(0, 5).map((c: any) => `${c.category} (₹${c.totalAmount.toLocaleString()} - ${c.percentage}%)`).join(', ')}
Top Payees/Merchants: ${topMerchants.map((m: any) => `${m.merchant} (₹${m.totalAmount.toLocaleString()})`).join(', ')}
50/30/20 Distribution: Needs ${needsPct}% (Target 50%), Wants ${wantsPct}% (Target 30%), Savings ${savingsPct}% (Target 20%)

Provide an insightful, executive-level financial analysis in STRICT JSON format:
{
  "executiveSummary": "A 2-3 sentence executive macroeconomic overview of this month's cash flow, discipline, and capital preservation.",
  "financialHealthScore": 85,
  "healthGrade": "A" | "A+" | "B" | "C" | "D",
  "budgetVerdict": "Optimal & Sustainable" | "Needs Minor Adjustment" | "Overextended",
  "keyTakeaways": [
    "Key takeaway point 1 with specific numbers",
    "Key takeaway point 2 on top drivers",
    "Key takeaway point 3 on discipline or risk"
  ],
  "actionableRecommendations": [
    "Concrete optimization action 1",
    "Concrete optimization action 2",
    "Concrete optimization action 3"
  ]
}`;

        const aiResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: env.OPENROUTER_MODEL || 'inclusionai/ling-3.0-flash-fin:free',
            messages: [{ role: 'user', content: aiPrompt }],
            temperature: 0.2,
          },
          {
            headers: {
              Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://financialflow.app',
              'X-Title': 'Financial Flow Intelligence',
            },
            timeout: 5000,
          }
        );

        const rawAi = aiResponse.data.choices?.[0]?.message?.content?.trim();
        if (rawAi) {
          const jsonMatch = rawAi.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.executiveSummary && Array.isArray(parsed.keyTakeaways)) {
              aiAnalysis = {
                executiveSummary: parsed.executiveSummary,
                financialHealthScore: parsed.financialHealthScore || aiAnalysis.financialHealthScore,
                healthGrade: parsed.healthGrade || aiAnalysis.healthGrade,
                budgetVerdict: parsed.budgetVerdict || aiAnalysis.budgetVerdict,
                keyTakeaways: parsed.keyTakeaways,
                actionableRecommendations: parsed.actionableRecommendations || aiAnalysis.actionableRecommendations,
              };
            }
          }
        }
      } catch (aiErr) {
        logger.debug('OpenRouter insight generation skipped', aiErr);
      }
    }

    return {
      period: activePeriodLabel || 'Current Period',
      availableMonths,
      current,
      previous,
      delta: {
        expenseDiff,
        expensePctChange: Number(expensePctChange.toFixed(2)),
        incomeDiff,
        incomePctChange: Number(incomePctChange.toFixed(2)),
      },
      rule503020,
      topCategories: categoryBreakdown.slice(0, 6),
      topMerchants,
      recurringSummary: recurring,
      anomaliesCount: anomalies.length,
      structuredInsights,
      narrative,
      aiAnalysis,
    };
  }
}

