import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AccountService } from '../services/account/account.service';

export class AccountController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const accounts = await AccountService.listAccounts(authReq.userId);
      res.status(200).json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const account = await AccountService.createAccount(authReq.userId, req.body);
      res.status(201).json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const account = await AccountService.getAccountById(authReq.userId, String(req.params.id));
      res.status(200).json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const account = await AccountService.updateAccount(authReq.userId, String(req.params.id), req.body);
      res.status(200).json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await AccountService.deleteAccount(authReq.userId, String(req.params.id));
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
