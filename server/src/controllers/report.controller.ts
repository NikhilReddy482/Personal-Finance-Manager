import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ReportService } from '../services/reports/report.service';

export class ReportController {
  static async getMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const now = new Date();
      const period = (req.query.period as string) || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const report = await ReportService.getMonthlyReport(authReq.userId, period);
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { startDate, endDate } = req.query as any;
      const csv = await ReportService.exportTransactionsCsv(
        authReq.userId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="financial_flow_transactions.csv"');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}
