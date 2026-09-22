import mongoose from 'mongoose';
import { Goal } from '../../models/Goal';
import { toMinorUnits, toMajorUnits } from '../../utils/money';

export class GoalService {
  static async listGoals(userId: mongoose.Types.ObjectId) {
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
    return goals.map((g) => {
      const remainingMinor = Math.max(0, g.targetAmountMinor - g.currentAmountMinor);
      const progressPercent = g.targetAmountMinor > 0 ? (g.currentAmountMinor / g.targetAmountMinor) * 100 : 0;

      let monthlySavingRequired = 0;
      if (g.targetDate && remainingMinor > 0) {
        const now = new Date();
        const target = new Date(g.targetDate);
        const diffMonths = Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
        monthlySavingRequired = toMajorUnits(Math.round(remainingMinor / diffMonths));
      }

      return {
        id: g._id,
        name: g.name,
        targetAmount: toMajorUnits(g.targetAmountMinor),
        currentAmount: toMajorUnits(g.currentAmountMinor),
        remainingAmount: toMajorUnits(remainingMinor),
        progressPercent: Number(progressPercent.toFixed(1)),
        targetDate: g.targetDate,
        priority: g.priority,
        monthlySavingRequired,
      };
    });
  }

  static async createGoal(userId: mongoose.Types.ObjectId, data: any) {
    return Goal.create({
      userId,
      name: data.name,
      targetAmountMinor: toMinorUnits(data.targetAmount),
      currentAmountMinor: toMinorUnits(data.currentAmount || 0),
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      priority: data.priority || 'MEDIUM',
      linkedAccountId: data.linkedAccountId || undefined,
    });
  }

  static async updateGoal(userId: mongoose.Types.ObjectId, goalId: string, data: any) {
    const update: any = {};
    if (data.name) update.name = data.name;
    if (data.targetAmount) update.targetAmountMinor = toMinorUnits(data.targetAmount);
    if (data.currentAmount !== undefined) update.currentAmountMinor = toMinorUnits(data.currentAmount);
    if (data.targetDate) update.targetDate = new Date(data.targetDate);
    if (data.priority) update.priority = data.priority;

    return Goal.findOneAndUpdate({ _id: goalId, userId }, update, { new: true });
  }

  static async deleteGoal(userId: mongoose.Types.ObjectId, goalId: string) {
    await Goal.findOneAndDelete({ _id: goalId, userId });
    return { message: 'Goal deleted successfully' };
  }
}
