import mongoose from 'mongoose';
import { AnalyticsService } from '../analytics/analytics.service';
import { BudgetService } from '../budget/budget.service';
import { RecurringService } from '../recurring/recurring.service';
import { AnomalyService } from '../anomaly/anomaly.service';
import { InsightEngine } from '../insights/insightEngine';

export class ToolRegistry {
  static async executeTool(
    userId: mongoose.Types.ObjectId,
    toolName: string,
    args: any
  ): Promise<{ summary: string; data: any }> {
    const now = new Date();
    const period = args?.period || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    switch (toolName) {
      case 'getFinancialSummary': {
        const overview = await AnalyticsService.getOverview(userId, startDate, endDate, args?.accountId);
        return {
          summary: `Income: ₹${overview.totalIncome}, Expenses: ₹${overview.totalExpense}, Savings: ₹${overview.savings} (${overview.savingsRate}%)`,
          data: overview,
        };
      }

      case 'getCategorySpending': {
        const breakdown = await AnalyticsService.getCategoryBreakdown(userId, startDate, endDate, 'EXPENSE', args?.accountId);
        return {
          summary: `Top spending categories: ${breakdown.slice(0, 3).map((c) => `${c.category} (₹${c.totalAmount})`).join(', ')}`,
          data: breakdown,
        };
      }

      case 'getMerchantSpending': {
        const merchants = await AnalyticsService.getTopMerchants(userId, startDate, endDate, args?.limit || 10);
        return {
          summary: `Top merchants: ${merchants.slice(0, 3).map((m) => `${m.merchant} (₹${m.totalAmount})`).join(', ')}`,
          data: merchants,
        };
      }

      case 'getBudgetStatus': {
        const budgets = await BudgetService.listBudgets(userId, period);
        return {
          summary: `Tracking ${budgets.length} budget(s).`,
          data: budgets,
        };
      }

      case 'getAnomalies': {
        const anomalies = await AnomalyService.getAnomalies(userId);
        return {
          summary: `Detected ${anomalies.length} unusual transaction(s).`,
          data: anomalies,
        };
      }

      case 'getRecurringExpenses': {
        const recurring = await RecurringService.getRecurringSummary(userId);
        return {
          summary: `Total Monthly Commitments: ₹${recurring.totalMonthlyCommitment}`,
          data: recurring,
        };
      }

      case 'getMonthlyComparison': {
        const explanation = await InsightEngine.explainMyFinances(userId, period);
        return {
          summary: explanation.narrative,
          data: explanation,
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  static getToolDefinitions() {
    return [
      {
        type: 'function',
        function: {
          name: 'getFinancialSummary',
          description: 'Get total income, total expenses, net cash flow, and savings rate for a given month (YYYY-MM).',
          parameters: {
            type: 'object',
            properties: {
              period: { type: 'string', description: 'Month in YYYY-MM format' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getCategorySpending',
          description: 'Get expense breakdown across hierarchical categories and subcategories.',
          parameters: {
            type: 'object',
            properties: {
              period: { type: 'string', description: 'Month in YYYY-MM format' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getMerchantSpending',
          description: 'Get spending totals and transaction counts grouped by merchant.',
          parameters: {
            type: 'object',
            properties: {
              period: { type: 'string', description: 'Month in YYYY-MM format' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getBudgetStatus',
          description: 'Get spending pace, remaining amounts, and utilization for monthly budgets.',
          parameters: {
            type: 'object',
            properties: {
              period: { type: 'string', description: 'Month in YYYY-MM format' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getAnomalies',
          description: 'List unusual transactions detected by statistical and ML anomaly models.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getRecurringExpenses',
          description: 'Get detected subscriptions and recurring commitments with annualized costs.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getMonthlyComparison',
          description: 'Get month-over-month comparison, category delta drivers, and financial narrative.',
          parameters: {
            type: 'object',
            properties: {
              period: { type: 'string', description: 'Month in YYYY-MM format' },
            },
          },
        },
      },
    ];
  }
}
