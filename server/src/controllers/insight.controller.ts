import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { InsightEngine } from '../services/insights/insightEngine';

export class InsightController {
  static async explainMyFinances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { period, startDate, endDate, accountId } = req.query as any;
      const result = await InsightEngine.explainMyFinances(authReq.userId, period, {
        startDate,
        endDate,
        accountId: accountId && accountId !== 'all' ? accountId : undefined,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
