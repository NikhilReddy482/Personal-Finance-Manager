import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session';

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fullName, email, password } = req.body;
      const result = await AuthService.register(fullName, email, password);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const clientInfo = { ip: req.ip, ua: req.headers['user-agent'] };
      const result = await AuthService.verifyEmail(email, otp, clientInfo);

      res.cookie('session_token', result.sessionToken, getCookieOptions());

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, purpose } = req.body;
      await AuthService.generateAndSendOTP(email, purpose || 'REGISTRATION');
      res.status(200).json({ success: true, data: { message: 'Verification code resent successfully.' } });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const clientInfo = { ip: req.ip, ua: req.headers['user-agent'] };
      const result = await AuthService.login(email, password, clientInfo);

      // If MFA is disabled, sessionToken is generated immediately
      if (result.sessionToken) {
        res.cookie('session_token', result.sessionToken, getCookieOptions());
      }

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async verifyLoginOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, method } = req.body;
      const clientInfo = { ip: req.ip, ua: req.headers['user-agent'] };
      const result = await AuthService.verifyLoginOTP(email, otp, method || 'EMAIL', clientInfo);

      res.cookie('session_token', result.sessionToken, getCookieOptions());

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async checkPasskeyAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        res.status(200).json({ success: true, data: { hasPasskeys: false } });
        return;
      }
      const hasPasskeys = await AuthService.checkUserHasPasskeys(email);
      res.status(200).json({ success: true, data: { hasPasskeys } });
    } catch (err) {
      next(err);
    }
  }

  static async passkeyLoginOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const options = await AuthService.generatePasskeyLoginOptions(email);
      res.status(200).json({ success: true, data: options });
    } catch (err) {
      next(err);
    }
  }

  static async passkeyLoginVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, response } = req.body;
      const clientInfo = { ip: req.ip, ua: req.headers['user-agent'] };
      const result = await AuthService.verifyPasskeyLogin(email, response, clientInfo);

      res.cookie('session_token', result.sessionToken, getCookieOptions());

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async demoLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientInfo = { ip: req.ip, ua: req.headers['user-agent'] };
      const session = await AuthService.createSession(
        (await AuthService.register('Alex Morgan (Demo)', 'demo@financialflow.io', 'DemoPass@1234').catch(() => {}),
        (await (await import('../models/User')).User.findOne({ email: 'demo@financialflow.io' }))!._id),
        clientInfo
      );

      res.cookie('session_token', session.token, getCookieOptions());

      const user = await (await import('../models/User')).User.findOne({ email: 'demo@financialflow.io' });
      res.status(200).json({
        success: true,
        data: {
          sessionToken: session.token,
          user: AuthService.sanitizeUser(user!),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.sessionId) {
        await Session.findByIdAndUpdate(authReq.sessionId, { isRevoked: true });
      }
      res.clearCookie('session_token', getCookieOptions());
      res.status(200).json({ success: true, data: { message: 'Logged out successfully.' } });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, password } = req.body;
      const result = await AuthService.resetPasswordWithOTP(email, otp, password);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      res.status(200).json({ success: true, data: { user: AuthService.sanitizeUser(authReq.user) } });
    } catch (err) {
      next(err);
    }
  }
}
