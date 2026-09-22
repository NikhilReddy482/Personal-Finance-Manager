import mongoose from 'mongoose';
import { Transaction } from '../../models/Transaction';
import { toMajorUnits } from '../../utils/money';

export class AnomalyService {
  static async scanAnomalies(userId: mongoose.Types.ObjectId) {
    // 1. Calculate statistical benchmarks per category for this user
    const stats = await Transaction.aggregate([
      {
        $match: {
          userId,
          transactionType: { $in: ['EXPENSE', 'FEE'] },
          reviewStatus: { $in: ['VALID', 'CONFIRMED'] },
        },
      },
      {
        $group: {
          _id: '$category',
          avgMinor: { $avg: '$amountMinor' },
          stdDevMinor: { $stdDevPop: '$amountMinor' },
          maxMinor: { $max: '$amountMinor' },
          minMinor: { $min: '$amountMinor' },
          count: { $sum: 1 },
        },
      },
    ]);

    const statMap: Record<string, any> = {};
    for (const s of stats) {
      statMap[s._id] = s;
    }

    const txs = await Transaction.find({
      userId,
      transactionType: { $in: ['EXPENSE', 'FEE'] },
    });

    for (const t of txs) {
      const catStat = statMap[t.category];
      if (!catStat || catStat.count < 3) continue;

      const avg = catStat.avgMinor;
      const stdDev = catStat.stdDevMinor || (avg * 0.5);

      // Flag transaction if amount is > 3.0 standard deviations from average OR > 3.5x category average
      const zScore = (t.amountMinor - avg) / (stdDev > 0 ? stdDev : 1);
      const multipleOfAvg = t.amountMinor / (avg > 0 ? avg : 1);

      if (multipleOfAvg >= 3.5 && zScore >= 2.5 && t.amountMinor > 300000) { // e.g. > 3,000 INR
        const formattedAvg = toMajorUnits(Math.round(avg));
        const formattedAmt = toMajorUnits(t.amountMinor);

        t.isAnomaly = true;
        t.anomalyScore = Number(Math.min(1.0, zScore / 5.0).toFixed(2));
        t.anomalyReason = `Amount of ₹${formattedAmt.toLocaleString()} is ${multipleOfAvg.toFixed(1)}x your typical ${t.category} spend (Avg: ₹${formattedAvg.toLocaleString()}).`;
        await t.save();
      }
    }
  }

  static async getAnomalies(userId: mongoose.Types.ObjectId) {
    await this.scanAnomalies(userId);
    const anomalies = await Transaction.find({
      userId,
      isAnomaly: true,
    }).sort({ date: -1 });

    return anomalies.map((a) => ({
      id: a._id,
      date: a.date,
      description: a.description,
      merchant: a.merchant,
      category: a.category,
      amountMinor: a.amountMinor,
      amount: toMajorUnits(a.amountMinor),
      anomalyScore: a.anomalyScore,
      anomalyReason: a.anomalyReason,
    }));
  }

  static async dismissAnomaly(userId: mongoose.Types.ObjectId, transactionId: string) {
    await Transaction.findOneAndUpdate(
      { _id: transactionId, userId },
      { isAnomaly: false, anomalyScore: 0, anomalyReason: undefined }
    );
    return { message: 'Anomaly dismissed' };
  }
}
