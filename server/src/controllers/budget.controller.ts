import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { BudgetService } from '../services/budget/budget.service';

export class BudgetController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const now = new Date();
      const period = (req.query.period as string) || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const result = await BudgetService.listBudgets(authReq.userId, period);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async set(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const budget = await BudgetService.setBudget(authReq.userId, req.body);
      res.status(200).json({ success: true, data: budget });
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await BudgetService.deleteBudget(authReq.userId, String(req.params.id));
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
