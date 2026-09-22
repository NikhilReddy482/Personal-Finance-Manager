import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Session } from '../models/Session';
import { User, IUser } from '../models/User';
import { hashToken } from '../security/crypto';

export interface AuthenticatedRequest extends Request {
  userId: mongoose.Types.ObjectId;
  user: IUser;
  sessionId: mongoose.Types.ObjectId;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // Check cookie first
    if (req.cookies && req.cookies.session_token) {
      token = req.cookies.session_token;
    }

    // Check authorization header fallback
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const tokenHash = hashToken(token);
    const session = await Session.findOne({ tokenHash, isRevoked: false });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        error: { code: 'SESSION_EXPIRED', message: 'Session is invalid or expired' },
      });
      return;
    }

    const user = await User.findById(session.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User account not found' },
      });
      return;
    }

    // Update session active timestamp lazily
    session.lastActiveAt = new Date();
    await session.save();

    (req as AuthenticatedRequest).userId = user._id;
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).sessionId = session._id;

    next();
  } catch (error) {
    next(error);
  }
}
