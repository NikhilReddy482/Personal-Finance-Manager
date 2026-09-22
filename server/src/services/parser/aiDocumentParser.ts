import { OpenRouterClient } from '../ai/openRouterClient';
import { logger } from '../../config/logger';
import { parseFinancialDate } from '../../utils/date';
import { toMinorUnits } from '../../utils/money';

export interface IAiExtractedTransaction {
  date: Date;
  description: string;
  amountMinor: number;
  transactionType: 'EXPENSE' | 'INCOME';
  referenceNumber?: string;
}

export class AiDocumentParser {
  static async extractTransactionsFromText(rawText: string): Promise<IAiExtractedTransaction[]> {
    if (!rawText || rawText.trim().length < 20) {
      return [];
    }

    // Limit text to first ~8000 characters to stay within fast token limits
    const truncatedText = rawText.slice(0, 8000);

    const prompt = `You are an expert financial document intelligence engine.
Analyze the following raw bank statement text and extract all financial transaction records into a strictly valid JSON array.

EXTRACTION RULES:
1. Extract every individual financial transaction you can find.
2. For each transaction, return a JSON object with:
   - "date": Date in "YYYY-MM-DD" or standard ISO format.
   - "description": The full narration or particulars text.
   - "amount": The positive numerical amount (e.g. 1420.50).
   - "type": "EXPENSE" (for withdrawals, debits, payments, purchases) or "INCOME" (for deposits, credits, salary, interest, refunds).
   - "referenceNumber": Any reference/UTR/cheque/transaction ID if available.
3. Ignore account summaries, opening/closing balance statements, disclaimers, and header footers.
4. Output ONLY valid JSON array starting with [ and ending with ]. Do not include markdown code blocks or explanations.

RAW STATEMENT TEXT:
${truncatedText}`;

    try {
      const completion = await OpenRouterClient.chatCompletion([
        {
          role: 'system',
          content: 'You are an automated financial transaction extractor. You output ONLY valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      let jsonText = completion.content || '';
      // Strip any markdown code fence if the LLM wrapped it
      jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

      const startIndex = jsonText.indexOf('[');
      const endIndex = jsonText.lastIndexOf(']');
      if (startIndex === -1 || endIndex === -1) {
        logger.warn('AI Document Parser did not return a valid JSON array');
        return [];
      }

      const cleanJson = jsonText.slice(startIndex, endIndex + 1);
      const rawRecords = JSON.parse(cleanJson);

      if (!Array.isArray(rawRecords)) return [];

      const results: IAiExtractedTransaction[] = [];
      for (const item of rawRecords) {
        if (!item.date || !item.description || !item.amount) continue;

        const date = parseFinancialDate(String(item.date));
        if (!date) continue;

        const rawNum = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount).replace(/[^0-9.-]/g, ''));
        if (isNaN(rawNum) || rawNum <= 0) continue;

        const amountMinor = toMinorUnits(rawNum);
        const typeStr = String(item.type || '').toUpperCase();
        const transactionType = typeStr.includes('INC') || typeStr.includes('CRED') || typeStr.includes('DEP') ? 'INCOME' : 'EXPENSE';

        results.push({
          date,
          description: String(item.description).trim(),
          amountMinor,
          transactionType,
          referenceNumber: item.referenceNumber ? String(item.referenceNumber).trim() : undefined,
        });
      }

      logger.info(`AI Document Parser successfully extracted ${results.length} transactions from unstructured text`);
      return results;
    } catch (err) {
      logger.error('AI Document Parser error', { error: err });
      return [];
    }
  }
}
