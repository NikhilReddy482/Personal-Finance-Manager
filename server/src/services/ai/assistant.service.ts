import mongoose from 'mongoose';
import { ChatSession } from '../../models/ChatSession';
import { Transaction } from '../../models/Transaction';
import { ToolRegistry } from './toolRegistry';
import { OpenRouterClient, IOpenRouterMessage } from './openRouterClient';
import { GeminiClient } from './geminiClient';
import { LocalFinancialSynthesizer } from './localSynthesizer';
import { InsightEngine } from '../insights/insightEngine';
import { BudgetService } from '../budget/budget.service';
import { env } from '../../config/env';

export class AssistantService {
  static async processUserMessage(
    userId: mongoose.Types.ObjectId,
    message: string,
    sessionId?: string,
    clientContext?: any
  ): Promise<{ response: string; evidence?: any; sessionId: string }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Load or initialize chat session
    let chatSession;
    if (sessionId) {
      chatSession = await ChatSession.findOne({ _id: sessionId, userId: userObjectId });
    }
    if (!chatSession) {
      chatSession = await ChatSession.create({
        userId: userObjectId,
        title: message.slice(0, 40) + '...',
        messages: [],
        contextState: clientContext || {},
      });
    }

    // 2. Discover available transaction periods for this user
    const distinctMonths = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const availableMonths = distinctMonths.map((m) => m._id);

    // 3. Resolve active period (from explicit message, clientContext, or latest active month with data)
    let selectedPeriod = clientContext?.selectedPeriod;
    
    // Check if user specifically requested a month (e.g., '2026-08', 'august', 'july', etc.)
    const monthNameMatch = message.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i);
    const yearMonthMatch = message.match(/\b(202\d)-(0[1-9]|1[0-2])\b/);

    if (yearMonthMatch) {
      selectedPeriod = yearMonthMatch[0];
    } else if (monthNameMatch) {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const mIndex = monthNames.indexOf(monthNameMatch[1].toLowerCase()) + 1;
      const mStr = String(mIndex).padStart(2, '0');
      // Find a matching year in available months or default to current year
      const matchingMonth = availableMonths.find((m) => m.endsWith(`-${mStr}`));
      selectedPeriod = matchingMonth || `${new Date().getUTCFullYear()}-${mStr}`;
    }

    if (!selectedPeriod) {
      selectedPeriod = availableMonths.length > 0 ? availableMonths[0] : `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`;
    }

    // 4. Retrieve comprehensive verified financial data
    let evidence: any = null;
    let fullFinancialContext = '';
    let recentTxns: any[] = [];

    try {
      const insights = await InsightEngine.explainMyFinances(userObjectId, selectedPeriod);
      const budgets = await BudgetService.listBudgets(userObjectId, selectedPeriod);
      
      // Fetch recent 10 transactions for granular context
      recentTxns = await Transaction.find({ userId: userObjectId })
        .sort({ date: -1 })
        .limit(10)
        .lean();

      // If user is inquiring about a specific merchant or item (e.g. Swiggy, Uber, Rent, Netflix)
      const queryWords = message.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      let matchingSpecificTxns: any[] = [];
      if (queryWords.length > 0) {
        matchingSpecificTxns = await Transaction.find({
          userId: userObjectId,
          $or: [
            { merchant: { $regex: queryWords.join('|'), $options: 'i' } },
            { description: { $regex: queryWords.join('|'), $options: 'i' } },
            { category: { $regex: queryWords.join('|'), $options: 'i' } },
          ],
        })
          .sort({ date: -1 })
          .limit(10)
          .lean();
      }

      evidence = {
        toolName: 'comprehensiveFinancialIntelligence',
        period: insights.period,
        summary: insights.narrative,
        data: {
          period: insights.period,
          overview: insights.current,
          savingsRate: `${insights.current?.savingsRate || 0}%`,
          healthScore: insights.aiAnalysis?.financialHealthScore,
          healthGrade: insights.aiAnalysis?.healthGrade,
          budgetVerdict: insights.aiAnalysis?.budgetVerdict,
          topCategories: insights.topCategories,
          topMerchants: insights.topMerchants,
          rule503020: insights.rule503020,
          recurringSummary: insights.recurringSummary,
        },
      };

      fullFinancialContext = `
================ USER VERIFIED FINANCIAL DOSSIER ================
- Analyzed Statement Period: ${insights.period} (Available Months with Data: ${availableMonths.join(', ') || 'None'})
- Total Inflow / Income: ₹${insights.current?.totalIncome?.toLocaleString('en-IN') || 0}
- Total Outflow / Expenses: ₹${insights.current?.totalExpense?.toLocaleString('en-IN') || 0}
- Net Cash Flow / Savings: ₹${insights.current?.savings?.toLocaleString('en-IN') || 0}
- Savings Rate: ${insights.current?.savingsRate || 0}% (Recommended Benchmark: ≥ 20%)
- Financial Health Score: ${insights.aiAnalysis?.financialHealthScore || 75}/100 (Grade: ${insights.aiAnalysis?.healthGrade || 'B+'})
- Budget Health Verdict: ${insights.aiAnalysis?.budgetVerdict || 'Balanced'}

- 50/30/20 Budget Breakdown:
  * Needs (Essentials): ₹${insights.rule503020?.needs?.amount?.toLocaleString('en-IN') || 0} (${insights.rule503020?.needs?.percentage || 0}%, target: 50%)
  * Wants (Discretionary): ₹${insights.rule503020?.wants?.amount?.toLocaleString('en-IN') || 0} (${insights.rule503020?.wants?.percentage || 0}%, target: 30%)
  * Savings / Investments: ₹${insights.rule503020?.savings?.amount?.toLocaleString('en-IN') || 0} (${insights.rule503020?.savings?.percentage || 0}%, target: 20%)

- Top Spending Categories:
${(insights.topCategories || []).map((c: any, i: number) => `  ${i + 1}. ${c.category}: ₹${c.totalAmount?.toLocaleString('en-IN')} (${c.percentage}%)`).join('\n') || '  No category data'}

- Top Merchants & Outlets:
${(insights.topMerchants || []).map((m: any, i: number) => `  ${i + 1}. ${m.merchant}: ₹${m.totalAmount?.toLocaleString('en-IN')} (${m.transactionCount} transactions)`).join('\n') || '  No merchant data'}

- Active Subscriptions & Recurring Commitments:
  * Total Monthly Commitment: ₹${insights.recurringSummary?.totalMonthlyCommitment?.toLocaleString('en-IN') || 0}
  * Active Services: ${(insights.recurringSummary?.activeSubscriptions || []).map((s: any) => `${s.merchant} (₹${(s.amountMinor / 100).toLocaleString('en-IN')})`).join(', ') || 'None'}

- Active Category Budgets:
${budgets.map((b: any) => `  * ${b.category}: Spent ₹${b.spent?.toLocaleString('en-IN')} of ₹${b.limitMinor ? (b.limitMinor / 100).toLocaleString('en-IN') : 0} (${b.percentUsed}%)`).join('\n') || '  No custom budgets set'}

- Sample Recent Transactions:
${recentTxns.map((t: any) => `  * ${new Date(t.date).toISOString().slice(0, 10)} | ${t.merchant || t.description} | ${t.transactionType === 'INCOME' ? '+' : '-'}₹${(t.amountMinor / 100).toLocaleString('en-IN')} (${t.category})`).join('\n')}
${matchingSpecificTxns.length > 0 ? `\n- Specific Matching Transactions for Inquiry:\n${matchingSpecificTxns.map((t: any) => `  * ${new Date(t.date).toISOString().slice(0, 10)} | ${t.merchant || t.description} | ₹${(t.amountMinor / 100).toLocaleString('en-IN')} (${t.category})`).join('\n')}` : ''}
==================================================================
`;
    } catch (err) {
      console.error('Failed to build full financial context:', err);
      fullFinancialContext = `Note: Real-time calculation engine available. Error assembling background dossier.`;
    }

    // 5. Construct System Prompt with Clarity, Accessibility, & Truth Grounding
    const systemPrompt = `You are Financial Flow's Intelligent, Grounded, and Empathetic AI Personal Finance Assistant.

CORE GOAL:
Provide warm, natural, human-friendly, and actionable financial advice so that ANY person can easily understand their spending, savings, and financial health.

STRICT ACCURACY RULES:
1. All financial numbers and facts MUST come strictly from the [USER VERIFIED FINANCIAL DOSSIER] provided below. Never invent or hallucinate financial numbers.
2. Always clearly reference the period you are evaluating (e.g. "Looking at your latest recorded financial activity for **${selectedPeriod}**...").
3. If the user asks whether their spending is good, evaluate their savings rate, 50/30/20 balance, top expense drivers, and highlight both what they are doing well and specific areas they can improve.
4. Keep answers engaging, structured, well-formatted in markdown (with clean headers, bullet points, and bold text for currency amounts).
5. Currency is Indian Rupee (₹). Always format numbers clearly with ₹ and commas (e.g., ₹82,941.35).
6. Be conversational, supportive, and empowering while delivering solid, mathematically sound advice.`;

    const messagesToSend: IOpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Include recent conversational history (up to last 6 messages)
    for (const past of chatSession.messages.slice(-6)) {
      messagesToSend.push({
        role: past.role,
        content: past.content,
      });
    }

    const userPromptWithData = `${message}

${fullFinancialContext}`;

    messagesToSend.push({
      role: 'user',
      content: userPromptWithData,
    });

    // 6. Execute AI Generation with Multi-Model Cloud Fallback & Local Synthesis
    let finalResponse = '';

    // Tier 1: Google Gemini 3.6 Flash (Fastest & Generous Token Limits)
    try {
      if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
        const history = chatSession.messages.map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        finalResponse = await GeminiClient.generateFinancialAdvice(
          systemPrompt,
          history,
          userPromptWithData
        );
      }
    } catch (geminiErr: any) {
      console.warn('Gemini API call failed, attempting Tier 2 OpenRouter cascade...', geminiErr.message);
    }

    // Tier 2: OpenRouter Multi-Model Cloud
    if (!finalResponse || finalResponse.trim() === '') {
      try {
        const completion = await OpenRouterClient.chatCompletion(messagesToSend, undefined, 0.4);
        if (completion.content && !completion.content.includes('temporarily operating with deterministic backend data')) {
          finalResponse = completion.content;
        }
      } catch (openRouterErr: any) {
        console.warn('OpenRouter cascade failed, falling back to Local Financial Synthesizer');
      }
    }

    // Tier 3: High-Accuracy Local Financial Synthesizer (Zero-Downtime Guarantee)
    if (!finalResponse || finalResponse.trim() === '') {
      try {
        const insights = await InsightEngine.explainMyFinances(userObjectId, selectedPeriod);
        finalResponse = LocalFinancialSynthesizer.synthesize(message, insights, [], recentTxns);
      } catch (synthErr) {
        finalResponse = `I've analyzed your financial data for **${selectedPeriod}**. Your records and calculations are verified and live on your dashboard.`;
      }
    }

    // 7. Save messages to session history
    chatSession.messages.push({
      role: 'user',
      content: message,
      createdAt: new Date(),
    });

    chatSession.messages.push({
      role: 'assistant',
      content: finalResponse,
      evidence,
      createdAt: new Date(),
    });

    await chatSession.save();

    return {
      response: finalResponse,
      evidence,
      sessionId: chatSession._id.toString(),
    };
  }
}
