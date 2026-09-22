import { generateFingerprint } from '../../security/crypto';
import { Transaction } from '../../models/Transaction';
import mongoose from 'mongoose';

export interface IParsedCandidate {
  date: Date;
  description: string;
  normalizedDescription: string;
  amountMinor: number;
  transactionType: string;
  referenceNumber?: string;
  fingerprint: string;
  isDuplicate?: boolean;
}

export class DuplicateDetector {
  static createFingerprint(
    userId: string,
    accountId: string,
    dateISO: string,
    amountMinor: number,
    normalizedDesc: string,
    referenceNumber?: string
  ): string {
    if (referenceNumber && referenceNumber.trim().length > 3) {
      return generateFingerprint(`${userId}:${accountId}:${referenceNumber.trim().toUpperCase()}`);
    }
    return generateFingerprint(`${userId}:${accountId}:${dateISO}:${amountMinor}:${normalizedDesc.trim().toUpperCase()}`);
  }

  static async detectDuplicates(
    userId?: any,
    accountId?: any,
    candidates: IParsedCandidate[] = []
  ): Promise<{ duplicatesCount: number; checkedCandidates: IParsedCandidate[] }> {
    let existingSet = new Set<string>();
    if (userId && accountId && mongoose.connection.readyState === 1) {
      try {
        const fingerprints = candidates.map((c) => c.fingerprint);
        const existing = await Transaction.find({
          userId,
          accountId,
          fingerprint: { $in: fingerprints },
        }).select('fingerprint');
        existingSet = new Set(existing.map((t) => t.fingerprint));
      } catch {
        existingSet = new Set<string>();
      }
    }

    const seenInBatch = new Set<string>();

    let duplicatesCount = 0;
    const checkedCandidates = candidates.map((c) => {
      const isDup = existingSet.has(c.fingerprint) || seenInBatch.has(c.fingerprint);
      if (isDup) {
        duplicatesCount++;
      }
      seenInBatch.add(c.fingerprint);
      return {
        ...c,
        isDuplicate: isDup,
      };
    });

    return { duplicatesCount, checkedCandidates };
  }
}
