import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { AuthService } from '../services/auth/auth.service';

export class SecurityController {
  static async getActiveSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const sessions = await Session.find({ userId: authReq.userId, isRevoked: false, expiresAt: { $gt: new Date() } }).sort({ lastActiveAt: -1 });

      const mapped = sessions.map((s) => ({
        id: s._id,
        isCurrent: s._id.toString() === authReq.sessionId.toString(),
        userAgent: s.userAgent || 'Unknown Browser',
        ipAddress: s.ipAddress || 'Unknown IP',
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
      }));

      res.status(200).json({ success: true, data: mapped });
    } catch (err) {
      next(err);
    }
  }

  static async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { sessionId } = req.params;
      await Session.findOneAndUpdate({ _id: sessionId, userId: authReq.userId }, { isRevoked: true });
      res.status(200).json({ success: true, data: { message: 'Session revoked.' } });
    } catch (err) {
      next(err);
    }
  }

  static async revokeOtherSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      await Session.updateMany({ userId: authReq.userId, _id: { $ne: authReq.sessionId } }, { isRevoked: true });
      res.status(200).json({ success: true, data: { message: 'All other sessions have been logged out.' } });
    } catch (err) {
      next(err);
    }
  }

  static async setupMFA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await AuthService.setupMFA(authReq.userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async enableMFA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { secret, token } = req.body;
      const result = await AuthService.enableMFA(authReq.userId, secret, token);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async disableMFA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { password, code } = req.body;
      const result = await AuthService.disableMFA(authReq.userId, password, code);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getRecoveryCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { code } = req.body;
      const result = await AuthService.regenerateRecoveryCodes(authReq.userId, code);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // --- Passkeys (Biometrics / Fingerprint) ---
  static async getPasskeys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = await User.findById(authReq.userId);
      res.status(200).json({
        success: true,
        data: (user?.passkeys || []).map((p) => ({
          credentialId: p.credentialId,
          deviceName: p.deviceName,
          createdAt: p.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  static async passkeyRegisterOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const options = await AuthService.generatePasskeyRegisterOptions(authReq.userId);
      res.status(200).json({ success: true, data: options });
    } catch (err) {
      next(err);
    }
  }

  static async passkeyRegisterVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { response, deviceName } = req.body;
      const result = await AuthService.verifyPasskeyRegister(authReq.userId, response, deviceName);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async deletePasskey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { credentialId } = req.params;
      const result = await AuthService.deletePasskey(authReq.userId, String(credentialId));
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // --- Account Deletion ---
  static async requestAccountDeleteOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await AuthService.requestAccountDeleteOTP(authReq.userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async confirmAccountDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { otp, password } = req.body;
      const result = await AuthService.confirmAccountDelete(authReq.userId, otp, password);

      res.clearCookie('session_token');
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getAuditActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const logs = await AuditLog.find({ userId: authReq.userId }).sort({ createdAt: -1 }).limit(50);
      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}
