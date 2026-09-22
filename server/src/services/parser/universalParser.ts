import { parse as parseCsv } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import pdfParse from 'pdf-parse';
import { COLUMN_SYNONYMS } from './synonymMap';
import { parseFinancialDate, formatDateISO } from '../../utils/date';
import { toMinorUnits } from '../../utils/money';
import { RuleEngine } from '../classification/ruleEngine';
import { DuplicateDetector, IParsedCandidate } from './duplicateDetector';
import { AiDocumentParser } from './aiDocumentParser';
import { HybridClassifier } from '../classification/hybridClassifier';
import { logger } from '../../config/logger';
import mongoose from 'mongoose';

export interface IParsedStatementResult {
  fileType: 'CSV' | 'XLSX' | 'PDF' | 'OCR';
  detectedCount: number;
  validCount: number;
  warningCount: number;
  duplicateCount: number;
  transactions: any[];
}

export class UniversalParser {
  static async parseStatement(
    buffer: Buffer,
    originalFilename: string,
    userId?: mongoose.Types.ObjectId | string,
    accountId?: mongoose.Types.ObjectId | string
  ): Promise<IParsedStatementResult> {
    const ext = originalFilename.split('.').pop()?.toLowerCase() || '';
    let rows: any[][] = [];
    let rawTextContent = '';
    let fileType: 'CSV' | 'XLSX' | 'PDF' | 'OCR' = 'CSV';

    const uidStr = (userId || 'usr_anonymous').toString();
    const accIdStr = (accountId || 'acc_default').toString();

    if (ext === 'csv') {
      fileType = 'CSV';
      rawTextContent = buffer.toString('utf-8');
      rows = this.parseCsvBuffer(buffer);
    } else if (ext === 'xlsx' || ext === 'xls') {
      fileType = 'XLSX';
      rows = this.parseXlsxBuffer(buffer);
      rawTextContent = rows.map((r) => r.join(' ')).join('\n');
    } else if (ext === 'pdf') {
      fileType = 'PDF';
      const pdfData = await pdfParse(buffer);
      rawTextContent = pdfData.text || '';
      rows = this.extractPdfLines(rawTextContent);
    } else {
      throw { status: 400, code: 'UNSUPPORTED_FORMAT', message: `Unsupported file format: .${ext}. Please upload a CSV, XLSX, or PDF statement.` };
    }

    const parsedCandidates: IParsedCandidate[] = [];
    let warnings = 0;
    let valids = 0;

    // --- PASS 1: Tabular Header Detection ---
    if (rows && rows.length >= 2) {
      const { headerIndex, columnMap, confidence } = this.detectHeaders(rows);

      if (confidence > 0.5 && columnMap.date !== undefined && columnMap.description !== undefined) {
        const dataRows = rows.slice(headerIndex + 1);
        for (const row of dataRows) {
          if (!row || row.length === 0 || row.every((cell) => !cell || cell.toString().trim() === '')) {
            continue;
          }

          const rawDate = row[columnMap.date]?.toString().trim();
          const rawDesc = row[columnMap.description]?.toString().trim();
          const rawRef = columnMap.reference !== undefined ? row[columnMap.reference]?.toString().trim() : undefined;

          if (!rawDate || !rawDesc) continue;

          const date = parseFinancialDate(rawDate);
          if (!date) {
            warnings++;
            continue;
          }

          let debit = 0;
          let credit = 0;
          let amountMinor = 0;
          let txnType = 'EXPENSE';

          const rawType = columnMap.type !== undefined ? row[columnMap.type]?.toString().toUpperCase().trim() : '';

          if (columnMap.debit !== undefined || columnMap.credit !== undefined) {
            const rawDebit = columnMap.debit !== undefined ? this.cleanNumber(row[columnMap.debit]) : 0;
            const rawCredit = columnMap.credit !== undefined ? this.cleanNumber(row[columnMap.credit]) : 0;

            debit = toMinorUnits(rawDebit);
            credit = toMinorUnits(rawCredit);

            if (credit > 0) {
              amountMinor = credit;
              txnType = 'INCOME';
            } else if (debit > 0) {
              amountMinor = debit;
              txnType = 'EXPENSE';
            }
          } else if (columnMap.amount !== undefined) {
            const rawAmt = this.cleanNumber(row[columnMap.amount]);
            amountMinor = toMinorUnits(Math.abs(rawAmt));

            if (rawType.includes('CR') || rawType.includes('CREDIT') || rawType.includes('DEPOSIT') || rawType.includes('INCOME')) {
              txnType = 'INCOME';
              credit = amountMinor;
            } else if (rawType.includes('DR') || rawType.includes('DEBIT') || rawType.includes('WITHDRAWAL') || rawType.includes('EXPENSE')) {
              txnType = 'EXPENSE';
              debit = amountMinor;
            } else if (rawAmt < 0) {
              txnType = 'EXPENSE';
              debit = amountMinor;
            } else {
              txnType = 'INCOME';
              credit = amountMinor;
            }
          }

          if (amountMinor <= 0) continue;

          // Clean description from leftover delimiters or CSV fragments
          let cleanDesc = rawDesc.replace(/[,;]+(CR|DR)[,;]*/gi, ' ').replace(/^[,;]+|[,;]+$/g, '').trim();
          if (cleanDesc.length < 2) cleanDesc = 'Bank Transaction';

          const normalizedDesc = RuleEngine.normalizeDescription(cleanDesc);
          const dateISO = formatDateISO(date);
          const fingerprint = DuplicateDetector.createFingerprint(
            uidStr,
            accIdStr,
            dateISO,
            amountMinor,
            normalizedDesc,
            rawRef
          );

          parsedCandidates.push({
            date,
            description: cleanDesc,
            normalizedDescription: normalizedDesc,
            amountMinor,
            transactionType: txnType,
            referenceNumber: rawRef,
            fingerprint,
          });

          valids++;
        }
      }
    }

    // --- PASS 2: Pattern-Anchor Scanning (If Tabular Pass yielded 0 transactions) ---
    if (parsedCandidates.length === 0 && rawTextContent) {
      logger.info('Tabular header mapping yielded 0 rows. Engaging Pattern-Anchor Scanner...');
      const anchorCandidates = this.scanPatternAnchors(rawTextContent, uidStr, accIdStr);
      for (const c of anchorCandidates) {
        parsedCandidates.push(c);
        valids++;
      }
    }

    // --- PASS 3: AI Document Semantic Fallback (If still 0 rows) ---
    if (parsedCandidates.length === 0 && rawTextContent && rawTextContent.trim().length > 30) {
      logger.info('Pattern scanner yielded 0 rows. Engaging AI Document Parser via OpenRouter...');
      const aiExtracted = await AiDocumentParser.extractTransactionsFromText(rawTextContent);
      for (const item of aiExtracted) {
        const normalizedDesc = RuleEngine.normalizeDescription(item.description);
        const dateISO = formatDateISO(item.date);
        const fingerprint = DuplicateDetector.createFingerprint(
          uidStr,
          accIdStr,
          dateISO,
          item.amountMinor,
          normalizedDesc,
          item.referenceNumber
        );

        parsedCandidates.push({
          date: item.date,
          description: item.description,
          normalizedDescription: normalizedDesc,
          amountMinor: item.amountMinor,
          transactionType: item.transactionType,
          referenceNumber: item.referenceNumber,
          fingerprint,
        });
        valids++;
      }
    }

    if (parsedCandidates.length === 0) {
      throw {
        status: 422,
        code: 'UNPARSABLE_DOCUMENT',
        message:
          'Could not extract financial transactions from this document. Please ensure the document is a bank statement or ledger with dates, descriptions, and debit/credit amounts.',
      };
    }

    // --- PASS 4: Hybrid ML Categorization for all extracted candidates ---
    for (const candidate of parsedCandidates) {
      try {
        const classification = await HybridClassifier.classify(
          candidate.description,
          candidate.amountMinor,
          uidStr
        );
        (candidate as any).category = classification.category;
        (candidate as any).subcategory = classification.subcategory;
        (candidate as any).leafCategory = classification.leafCategory;
        (candidate as any).categoryPath = classification.categoryPath;
        (candidate as any).classificationConfidence = classification.confidence;
        (candidate as any).classificationMethod = classification.method;
        if (classification.transactionType && (!candidate.transactionType || candidate.transactionType === 'EXPENSE')) {
          candidate.transactionType = classification.transactionType;
        }
      } catch (err) {
        (candidate as any).category = 'Other / Unclassified';
        (candidate as any).classificationConfidence = 0.5;
        (candidate as any).classificationMethod = 'DEFAULT';
      }
    }

    const { duplicatesCount, checkedCandidates } = await DuplicateDetector.detectDuplicates(
      userId,
      accountId,
      parsedCandidates
    );

    return {
      fileType,
      detectedCount: parsedCandidates.length,
      validCount: valids - duplicatesCount,
      warningCount: warnings,
      duplicateCount: duplicatesCount,
      transactions: checkedCandidates,
    };
  }

  private static parseCsvBuffer(buffer: Buffer): any[][] {
    const text = buffer.toString('utf-8');
    try {
      return parseCsv(text, {
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      });
    } catch {
      // Fallback line split
      return text.split('\n').map((l) => l.split(',').map((c) => c.trim())).filter((r) => r.length > 1);
    }
  }

  private static parseXlsxBuffer(buffer: Buffer): any[][] {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheet];
    return xlsx.utils.sheet_to_json(sheet, { header: 1 });
  }

  private static extractPdfLines(text: string): string[][] {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const rows: string[][] = [];

    for (const line of lines) {
      const parts = line.split(/\s{2,}|\t+|\|/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        rows.push(parts);
      }
    }
    return rows;
  }

  private static detectHeaders(rows: any[][]): { headerIndex: number; columnMap: any; confidence: number } {
    for (let r = 0; r < Math.min(rows.length, 25); r++) {
      const row = rows[r].map((cell) => (cell ? cell.toString().toLowerCase().trim() : ''));
      const map: any = {};

      for (let c = 0; c < row.length; c++) {
        const header = row[c];
        if (!header) continue;

        for (const [key, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
          if (synonyms.some((s) => header === s || header.includes(s))) {
            const canonical = key.toLowerCase();
            if (map[canonical] === undefined) {
              map[canonical] = c;
            }
          }
        }
      }

      if (
        map.date !== undefined &&
        map.description !== undefined &&
        (map.amount !== undefined || map.debit !== undefined || map.credit !== undefined)
      ) {
        return { headerIndex: r, columnMap: map, confidence: 1.0 };
      }
    }

    return {
      headerIndex: 0,
      columnMap: { date: 0, description: 1, debit: 2, credit: 3, balance: 4 },
      confidence: 0.2,
    };
  }

  private static scanPatternAnchors(
    text: string,
    userId: string,
    accountId: string
  ): IParsedCandidate[] {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const candidates: IParsedCandidate[] = [];

    // Date regex matching DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD MMM YYYY, etc.
    const dateRegex = /\b(\d{1,4}[-/. ](?:\d{1,2}|[A-Za-z]{3,9})[-/. ]\d{2,4})\b/;
    const moneyRegex = /(?:INR|Rs\.?|₹|\$|€)?\s*(-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*(CR|DR|Cr|Dr)?\b/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateMatch = line.match(dateRegex);
      if (!dateMatch) continue;

      const date = parseFinancialDate(dateMatch[1]);
      if (!date) continue;

      let cleanDesc = '';
      let amountMinor = 0;
      let txnType: 'INCOME' | 'EXPENSE' = 'EXPENSE';
      let rawRef: string | undefined = undefined;

      // Check if line is CSV / Delimited
      if (line.includes(',') || line.includes(';') || line.includes('\t') || line.includes('|')) {
        const delimiter = line.includes('\t') ? '\t' : line.includes('|') ? '|' : line.includes(';') ? ';' : ',';
        const cells = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());

        const textCells: string[] = [];
        const numCells: number[] = [];
        let typeCell = '';

        for (const cell of cells) {
          if (!cell) continue;
          if (dateRegex.test(cell)) continue; // date cell

          const upper = cell.toUpperCase();
          if (/^(CR|DR|CREDIT|DEBIT|INCOME|EXPENSE|DEPOSIT|WITHDRAWAL)$/i.test(upper)) {
            typeCell = upper;
            continue;
          }

          if (/^(UPI\/|CARD\/|NEFT\/|IMPS\/|REF\/|BILL\/|INT\/|ATM\/|POS\/|ECOM\/|ACH\/|TXN\/|CHQ\/|UTR\/|MB\/|CMS\/)/i.test(upper)) {
            rawRef = cell;
            continue;
          }

          const num = this.cleanNumber(cell);
          if (num > 0 && /^[₹$€0-9,.-]+$/.test(cell)) {
            numCells.push(num);
          } else {
            textCells.push(cell);
          }
        }

        if (textCells.length > 0) {
          cleanDesc = textCells.join(' ').trim();
        }

        if (numCells.length > 0) {
          // If 2 numbers exist (e.g. txn amount and balance), first non-balance or smaller is usually amount
          const amt = numCells[0];
          amountMinor = toMinorUnits(Math.abs(amt));
        }

        if (typeCell.includes('CR') || typeCell.includes('CREDIT') || typeCell.includes('DEPOSIT') || typeCell.includes('INCOME') || /received|refund|interest|salary|family/i.test(cleanDesc)) {
          txnType = 'INCOME';
        } else {
          txnType = 'EXPENSE';
        }
      }

      // Fallback if not delimited or delimited extraction failed
      if (!cleanDesc || amountMinor === 0) {
        const lineWithoutDate = line.replace(dateMatch[0], ' ');
        const moneyMatches = [...lineWithoutDate.matchAll(moneyRegex)];
        if (moneyMatches.length === 0) continue;

        const lastMoneyMatch = moneyMatches[0];
        const rawNum = parseFloat(lastMoneyMatch[1].replace(/,/g, ''));
        if (isNaN(rawNum) || rawNum === 0) continue;

        amountMinor = toMinorUnits(Math.abs(rawNum));
        const hasCr = /CR|Cr|Credit|Deposit|received/i.test(line);
        const isNegative = rawNum < 0 || /DR|Dr|Debit|Withdrawal|paid|spent/i.test(line);
        txnType = hasCr && !isNegative ? 'INCOME' : 'EXPENSE';

        cleanDesc = lineWithoutDate.replace(lastMoneyMatch[0], '').trim();
      }

      // Clean up description
      cleanDesc = cleanDesc
        .replace(/[,;]+(CR|DR)[,;]*/gi, ' ')
        .replace(/^(CR|DR|UPI\/[A-Z0-9_-]+)[,;\s-]*/gi, ' ')
        .replace(/^[-–—|:,]+|[-–—|:,]+$/g, '')
        .trim();

      if (cleanDesc.length < 2) {
        cleanDesc = 'Bank Transaction';
      }

      const normalizedDesc = RuleEngine.normalizeDescription(cleanDesc);
      const dateISO = formatDateISO(date);
      const fingerprint = DuplicateDetector.createFingerprint(
        userId,
        accountId,
        dateISO,
        amountMinor,
        normalizedDesc,
        rawRef
      );

      candidates.push({
        date,
        description: cleanDesc,
        normalizedDescription: normalizedDesc,
        amountMinor,
        transactionType: txnType,
        referenceNumber: rawRef,
        fingerprint,
      });
    }

    return candidates;
  }

  private static cleanNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const str = val.toString().replace(/,/g, '').replace(/[^0-9.-]/g, '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }
}
