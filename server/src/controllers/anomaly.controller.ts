import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AnomalyService } from '../services/anomaly/anomaly.service';

export class AnomalyController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await AnomalyService.getAnomalies(authReq.userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async dismiss(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await AnomalyService.dismissAnomaly(authReq.userId, String(req.params.id));
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
