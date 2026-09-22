import axios from 'axios';
import mongoose from 'mongoose';
import { RuleEngine } from './ruleEngine';
import { MerchantRule } from '../../models/MerchantRule';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { ClassificationMethod, TransactionType } from '../../config/constants';

export interface IClassificationResult {
  category: string;
  subcategory: string;
  leafCategory: string;
  categoryPath: string;
  transactionType: TransactionType;
  merchant?: string;
  confidence: number;
  method: ClassificationMethod;
}

const classificationCache = new Map<string, IClassificationResult>();

export class HybridClassifier {
  static async classifyBatch(
    items: { description: string; amountMinor: number }[],
    userId?: string | mongoose.Types.ObjectId
  ): Promise<IClassificationResult[]> {
    if (!items || items.length === 0) return [];

    const uidStr = userId ? userId.toString() : undefined;
    let compiledUserRules: { regex: RegExp; rule: any }[] = [];

    if (uidStr && mongoose.Types.ObjectId.isValid(uidStr) && mongoose.connection.readyState === 1) {
      try {
        const userRules = await MerchantRule.find({ userId: uidStr }).sort({ priority: -1 }).lean();
        compiledUserRules = userRules.map((r: any) => ({
          regex: new RegExp(r.pattern, 'i'),
          rule: r,
        }));
      } catch {
        compiledUserRules = [];
      }
    }

    const results: IClassificationResult[] = new Array(items.length);
    const unclassifiedIndices: { index: number; normalized: string; amountMinor: number }[] = [];

    // Pass 1: In-Memory User Rules & Deterministic Rule Engine
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const normalized = RuleEngine.normalizeDescription(item.description);
      const cacheKey = `${normalized}:${item.amountMinor}`;

      if (classificationCache.has(cacheKey)) {
        results[i] = classificationCache.get(cacheKey)!;
        continue;
      }

      // 1. In-memory user rules
      let matchedUserRule = false;
      for (const ur of compiledUserRules) {
        if (ur.regex.test(normalized)) {
          const res: IClassificationResult = {
            category: ur.rule.mainCategory,
            subcategory: ur.rule.subcategory,
            leafCategory: ur.rule.leafCategory || ur.rule.subcategory,
            categoryPath: `${ur.rule.mainCategory} > ${ur.rule.subcategory}`,
            transactionType: ur.rule.transactionType,
            merchant: ur.rule.merchantName,
            confidence: 1.0,
            method: 'USER',
          };
          classificationCache.set(cacheKey, res);
          results[i] = res;
          matchedUserRule = true;
          break;
        }
      }
      if (matchedUserRule) continue;

      // 2. Deterministic Rule Engine
      const ruleMatch = RuleEngine.matchMerchant(normalized, item.amountMinor);
      if (ruleMatch) {
        const res: IClassificationResult = {
          category: ruleMatch.mainCategory,
          subcategory: ruleMatch.subcategory,
          leafCategory: ruleMatch.leafCategory,
          categoryPath: `${ruleMatch.mainCategory} > ${ruleMatch.subcategory} > ${ruleMatch.leafCategory}`,
          transactionType: ruleMatch.transactionType,
          merchant: ruleMatch.merchantName,
          confidence: ruleMatch.confidence,
          method: 'MERCHANT',
        };
        classificationCache.set(cacheKey, res);
        results[i] = res;
        continue;
      }

      // Collect for batch ML
      unclassifiedIndices.push({ index: i, normalized, amountMinor: item.amountMinor });
    }

    // Pass 2: Vectorized Batch ML Service
    if (unclassifiedIndices.length > 0 && env.ML_SERVICE_URL) {
      try {
        const chunkSize = 500;
        for (let c = 0; c < unclassifiedIndices.length; c += chunkSize) {
          const chunk = unclassifiedIndices.slice(c, c + chunkSize);
          const response = await axios.post(
            `${env.ML_SERVICE_URL}/classify-batch`,
            {
              items: chunk.map((u) => ({
                description: u.normalized,
                amount_minor: u.amountMinor,
              })),
            },
            { timeout: 5000 }
          );

          if (response.data && Array.isArray(response.data.results)) {
            response.data.results.forEach((r: any, rIdx: number) => {
              const uItem = chunk[rIdx];
              if (r && r.category && uItem) {
                const res: IClassificationResult = {
                  category: r.category,
                  subcategory: r.subcategory || 'General',
                  leafCategory: r.leaf_category || r.subcategory || 'General',
                  categoryPath: `${r.category} > ${r.subcategory || 'General'}`,
                  transactionType: (r.transaction_type as TransactionType) || 'EXPENSE',
                  merchant: r.merchant || undefined,
                  confidence: r.confidence || 0.8,
                  method: 'ML',
                };
                classificationCache.set(`${uItem.normalized}:${uItem.amountMinor}`, res);
                results[uItem.index] = res;
              }
            });
          }
        }
      } catch (mlErr) {
        logger.debug('Batch ML service call skipped');
      }
    }

    // Pass 3: Fill remaining with smart heuristics
    for (let i = 0; i < items.length; i++) {
      if (!results[i]) {
        const item = items[i];
        const normalized = RuleEngine.normalizeDescription(item.description);
        const cacheKey = `${normalized}:${item.amountMinor}`;

        let inferredCategory = 'Other / Unclassified';
        let inferredSub = 'General Expense';
        let inferredType: TransactionType = 'EXPENSE';
        let conf = 0.7;

        if (/sal|salary|payroll|credit|dividend|stipend/i.test(normalized)) {
          inferredCategory = 'Income';
          inferredSub = 'Salary & Wages';
          inferredType = 'INCOME';
          conf = 0.88;
        } else if (/rent|landlord|flat|pg|society/i.test(normalized)) {
          inferredCategory = 'Housing & Rent';
          inferredSub = 'Rent';
          conf = 0.88;
        } else if (/upi|gpay|paytm|phonepe|transfer|imps|neft|rtgs/i.test(normalized)) {
          inferredCategory = 'Transfers & Payments';
          inferredSub = 'UPI / P2P Transfer';
          inferredType = 'TRANSFER';
          conf = 0.78;
        } else if (/atm|cash|wdr|withdraw/i.test(normalized)) {
          inferredCategory = 'Cash & ATM';
          inferredSub = 'ATM Withdrawal';
          inferredType = 'CASH_WITHDRAWAL';
          conf = 0.82;
        } else if (/swiggy|zomato|eats|cafe|restaurant|hotel|food|dine|bakes/i.test(normalized)) {
          inferredCategory = 'Food & Dining';
          inferredSub = 'Dining & Delivery';
          conf = 0.85;
        } else if (/amazon|flipkart|myntra|retail|mart|store|shop/i.test(normalized)) {
          inferredCategory = 'Shopping & Retail';
          inferredSub = 'Online Shopping';
          conf = 0.85;
        }

        const fallbackRes: IClassificationResult = {
          category: inferredCategory,
          subcategory: inferredSub,
          leafCategory: inferredSub,
          categoryPath: `${inferredCategory} > ${inferredSub}`,
          transactionType: inferredType,
          confidence: conf,
          method: 'UNKNOWN',
        };

        classificationCache.set(cacheKey, fallbackRes);
        results[i] = fallbackRes;
      }
    }

    return results;
  }

  static async classify(
    rawDescription: string,
    amountMinor: number,
    userId?: string
  ): Promise<IClassificationResult> {
    const normalized = RuleEngine.normalizeDescription(rawDescription);
    const cacheKey = `${normalized}:${amountMinor}`;

    if (classificationCache.has(cacheKey)) {
      return classificationCache.get(cacheKey)!;
    }

    // 1. User-specific custom merchant rules
    if (userId && mongoose.Types.ObjectId.isValid(userId) && mongoose.connection.readyState === 1) {
      try {
        const userRule = await MerchantRule.findOne({
          userId,
          $expr: {
            $regexMatch: {
              input: normalized,
              regex: '$pattern',
              options: 'i',
            },
          },
        }).sort({ priority: -1 });

        if (userRule) {
          const res: IClassificationResult = {
            category: userRule.mainCategory,
            subcategory: userRule.subcategory,
            leafCategory: userRule.leafCategory || userRule.subcategory,
            categoryPath: `${userRule.mainCategory} > ${userRule.subcategory}`,
            transactionType: userRule.transactionType,
            merchant: userRule.merchantName,
            confidence: 1.0,
            method: 'USER',
          };
          classificationCache.set(cacheKey, res);
          return res;
        }
      } catch {
        // Fallthrough to Rule Engine
      }
    }

    // 2. Deterministic Rule Engine
    const ruleMatch = RuleEngine.matchMerchant(normalized, amountMinor);
    if (ruleMatch) {
      const res: IClassificationResult = {
        category: ruleMatch.mainCategory,
        subcategory: ruleMatch.subcategory,
        leafCategory: ruleMatch.leafCategory,
        categoryPath: `${ruleMatch.mainCategory} > ${ruleMatch.subcategory} > ${ruleMatch.leafCategory}`,
        transactionType: ruleMatch.transactionType,
        merchant: ruleMatch.merchantName,
        confidence: ruleMatch.confidence,
        method: 'MERCHANT',
      };
      classificationCache.set(cacheKey, res);
      return res;
    }

    // 3. ML Service Proxy
    try {
      if (env.ML_SERVICE_URL) {
        const response = await axios.post(
          `${env.ML_SERVICE_URL}/classify`,
          { description: normalized, amount_minor: amountMinor },
          { timeout: 1500 }
        );

        if (response.data && response.data.category && response.data.confidence > 0.6) {
          const res: IClassificationResult = {
            category: response.data.category,
            subcategory: response.data.subcategory || 'General',
            leafCategory: response.data.leaf_category || response.data.subcategory || 'General',
            categoryPath: `${response.data.category} > ${response.data.subcategory || 'General'}`,
            transactionType: (response.data.transaction_type as TransactionType) || 'EXPENSE',
            merchant: response.data.merchant || undefined,
            confidence: response.data.confidence,
            method: 'ML',
          };
          classificationCache.set(cacheKey, res);
          return res;
        }
      }
    } catch (mlErr) {
      logger.debug('ML Service not reachable, falling back to heuristics');
    }

    // 4. OpenRouter AI Semantic LLM Classifier Fallback
    if (env.OPENROUTER_API_KEY && normalized.length >= 3) {
      try {
        const aiResult = await this.classifyWithLLM(normalized, amountMinor);
        if (aiResult && aiResult.category !== 'Other / Unclassified') {
          classificationCache.set(cacheKey, aiResult);
          return aiResult;
        }
      } catch (e) {
        logger.debug('OpenRouter AI classification skipped', e);
      }
    }

    // 5. Default Heuristic Fallback
    const defaultRes: IClassificationResult = {
      category: 'Other / Unclassified',
      subcategory: 'General Expense',
      leafCategory: 'Unclassified',
      categoryPath: 'Other / Unclassified > General Expense',
      transactionType: 'EXPENSE',
      confidence: 0.4,
      method: 'UNKNOWN',
    };
    classificationCache.set(cacheKey, defaultRes);
    return defaultRes;
  }

  private static async classifyWithLLM(
    description: string,
    amountMinor: number
  ): Promise<IClassificationResult | null> {
    const prompt = `You are a financial transaction categorization AI. Categorize this bank transaction:
Description: "${description}"
Amount (in minor currency units/paise): ${amountMinor}

Standard categories:
- Food & Dining
- Shopping & Retail
- Transportation
- Digital & Subscriptions
- Utilities & Bills
- Investments
- Income
- Transfers
- Refunds & Cashback
- Cash & ATM
- Education
- Healthcare
- Housing
- Debt & Loans
- Bank Charges & Taxes
- Personal Care
- Other / Unclassified

Respond ONLY with valid JSON in this exact structure:
{
  "category": "Standard Category Name",
  "subcategory": "Specific Subcategory",
  "transaction_type": "INCOME" | "EXPENSE" | "TRANSFER" | "INVESTMENT" | "REFUND" | "CASH_WITHDRAWAL" | "DEBT_PAYMENT" | "FEE",
  "confidence": 0.95
}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: env.OPENROUTER_MODEL || 'inclusionai/ling-3.0-flash-fin:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://financialflow.app',
          'X-Title': 'Financial Flow Engine',
        },
        timeout: 4000,
      }
    );

    const raw = response.data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.category) return null;

    return {
      category: parsed.category,
      subcategory: parsed.subcategory || 'General',
      leafCategory: parsed.subcategory || 'General',
      categoryPath: `${parsed.category} > ${parsed.subcategory || 'General'}`,
      transactionType: (parsed.transaction_type as TransactionType) || 'EXPENSE',
      confidence: parsed.confidence || 0.9,
      method: 'ML',
    };
  }
}
