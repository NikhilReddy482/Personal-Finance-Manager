import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AssistantService } from '../services/ai/assistant.service';
import { ChatSession } from '../models/ChatSession';

export class AssistantController {
  static async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { message, sessionId, contextState } = req.body;

      const result = await AssistantService.processUserMessage(
        authReq.userId,
        message,
        sessionId,
        contextState
      );

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const sessions = await ChatSession.find({ userId: authReq.userId }).sort({ updatedAt: -1 }).select('title createdAt updatedAt');
      res.status(200).json({ success: true, data: sessions });
    } catch (err) {
      next(err);
    }
  }

  static async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const session = await ChatSession.findOne({ _id: req.params.id, userId: authReq.userId });
      if (!session) {
        res.status(404).json({ success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Chat session not found.' } });
        return;
      }
      res.status(200).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }
}
