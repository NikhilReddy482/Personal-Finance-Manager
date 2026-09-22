import { Router } from 'express';
import multer from 'multer';
import { AuthController } from '../controllers/auth.controller';
import { SecurityController } from '../controllers/security.controller';
import { AccountController } from '../controllers/account.controller';
import { ImportController } from '../controllers/import.controller';
import { TransactionController } from '../controllers/transaction.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import { BudgetController } from '../controllers/budget.controller';
import { RecurringController } from '../controllers/recurring.controller';
import { AnomalyController } from '../controllers/anomaly.controller';
import { GoalController } from '../controllers/goal.controller';
import { InsightController } from '../controllers/insight.controller';
import { ReportController } from '../controllers/report.controller';
import { AssistantController } from '../controllers/assistant.controller';
import { SeedController } from '../controllers/seed.controller';

import { requireAuth } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimiter.middleware';

import {
  registerSchema,
  verifyEmailSchema,
  verifyLoginOtpSchema,
  resendVerificationSchema,
  loginSchema,
  mfaVerifySchema,
  forgotPasswordSchema,
  resetPasswordOtpSchema,
  disableMfaSchema,
  getRecoveryCodesSchema,
} from '../validators/auth.validator';
import { createAccountSchema, updateAccountSchema } from '../validators/account.validator';
import { createTransactionSchema, updateTransactionSchema, transactionQuerySchema } from '../validators/transaction.validator';
import { createBudgetSchema } from '../validators/budget.validator';
import { createGoalSchema, updateGoalSchema } from '../validators/goal.validator';
import { chatMessageSchema } from '../validators/assistant.validator';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const apiRouter = Router();

// --- Auth Routes ---
apiRouter.post('/auth/register', authRateLimiter, validateBody(registerSchema), AuthController.register);
apiRouter.post('/auth/verify-email', otpRateLimiter, validateBody(verifyEmailSchema), AuthController.verifyEmail);
apiRouter.post('/auth/resend-verification', otpRateLimiter, validateBody(resendVerificationSchema), AuthController.resendVerification);
apiRouter.post('/auth/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
apiRouter.post('/auth/verify-login-otp', otpRateLimiter, validateBody(verifyLoginOtpSchema), AuthController.verifyLoginOTP);
apiRouter.post('/auth/passkeys/check', AuthController.checkPasskeyAvailability);
apiRouter.post('/auth/passkeys/login-options', AuthController.passkeyLoginOptions);
apiRouter.post('/auth/passkeys/login-verify', AuthController.passkeyLoginVerify);
apiRouter.post('/auth/demo', AuthController.demoLogin);
apiRouter.post('/auth/logout', requireAuth, AuthController.logout);
apiRouter.post('/auth/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), AuthController.forgotPassword);
apiRouter.post('/auth/reset-password', authRateLimiter, validateBody(resetPasswordOtpSchema), AuthController.resetPassword);
apiRouter.get('/auth/me', requireAuth, AuthController.getMe);


// --- Security Center Routes ---
apiRouter.get('/security/sessions', requireAuth, SecurityController.getActiveSessions);
apiRouter.delete('/security/sessions/:sessionId', requireAuth, SecurityController.revokeSession);
apiRouter.delete('/security/sessions', requireAuth, SecurityController.revokeOtherSessions);
apiRouter.post('/security/mfa/setup', requireAuth, SecurityController.setupMFA);
apiRouter.post('/security/mfa/enable', requireAuth, SecurityController.enableMFA);
apiRouter.post('/security/mfa/disable', requireAuth, validateBody(disableMfaSchema), SecurityController.disableMFA);
apiRouter.post('/security/mfa/recovery-codes', requireAuth, validateBody(getRecoveryCodesSchema), SecurityController.getRecoveryCodes);
apiRouter.get('/security/passkeys', requireAuth, SecurityController.getPasskeys);
apiRouter.post('/security/passkeys/register-options', requireAuth, SecurityController.passkeyRegisterOptions);
apiRouter.post('/security/passkeys/register-verify', requireAuth, SecurityController.passkeyRegisterVerify);
apiRouter.delete('/security/passkeys/:credentialId', requireAuth, SecurityController.deletePasskey);
apiRouter.post('/security/account/delete-otp', requireAuth, otpRateLimiter, SecurityController.requestAccountDeleteOTP);
apiRouter.post('/security/account/delete-confirm', requireAuth, SecurityController.confirmAccountDelete);
apiRouter.get('/security/activity', requireAuth, SecurityController.getAuditActivity);

// --- Accounts ---
apiRouter.get('/accounts', requireAuth, AccountController.list);
apiRouter.post('/accounts', requireAuth, validateBody(createAccountSchema), AccountController.create);
apiRouter.get('/accounts/:id', requireAuth, AccountController.getOne);
apiRouter.put('/accounts/:id', requireAuth, validateBody(updateAccountSchema), AccountController.update);
apiRouter.delete('/accounts/:id', requireAuth, AccountController.remove);

// --- Statement Import ---
apiRouter.post('/imports/upload', requireAuth, upload.single('statement'), ImportController.uploadStatement);
apiRouter.get('/imports/:batchId/preview', requireAuth, ImportController.getPreview);
apiRouter.post('/imports/:batchId/confirm', requireAuth, ImportController.confirmImport);

// --- Transactions ---
apiRouter.get('/transactions', requireAuth, validateQuery(transactionQuerySchema), TransactionController.list);
apiRouter.get('/transactions/review', requireAuth, TransactionController.getReviewQueue);
apiRouter.put('/transactions/:id', requireAuth, validateBody(updateTransactionSchema), TransactionController.update);
apiRouter.delete('/transactions/:id', requireAuth, TransactionController.remove);

// --- Analytics ---
apiRouter.get('/analytics/overview', requireAuth, AnalyticsController.getOverview);
apiRouter.get('/analytics/breakdown', requireAuth, AnalyticsController.getBreakdown);
apiRouter.get('/analytics/trends', requireAuth, AnalyticsController.getTrends);
apiRouter.get('/analytics/merchants', requireAuth, AnalyticsController.getMerchants);

// --- Budgets ---
apiRouter.get('/budgets', requireAuth, BudgetController.list);
apiRouter.post('/budgets', requireAuth, validateBody(createBudgetSchema), BudgetController.set);
apiRouter.delete('/budgets/:id', requireAuth, BudgetController.remove);

// --- Recurring & Subscriptions ---
apiRouter.get('/recurring', requireAuth, RecurringController.getSummary);

// --- Anomalies ---
apiRouter.get('/anomalies', requireAuth, AnomalyController.list);
apiRouter.patch('/anomalies/:id/dismiss', requireAuth, AnomalyController.dismiss);

// --- Goals ---
apiRouter.get('/goals', requireAuth, GoalController.list);
apiRouter.post('/goals', requireAuth, validateBody(createGoalSchema), GoalController.create);
apiRouter.put('/goals/:id', requireAuth, validateBody(updateGoalSchema), GoalController.update);
apiRouter.delete('/goals/:id', requireAuth, GoalController.remove);

// --- Insights & Reports ---
apiRouter.get('/insights/explain-my-finances', requireAuth, InsightController.explainMyFinances);
apiRouter.get('/reports/monthly', requireAuth, ReportController.getMonthly);
apiRouter.get('/reports/export/csv', requireAuth, ReportController.exportCsv);

// --- AI Assistant ---
apiRouter.post('/assistant/chat', requireAuth, validateBody(chatMessageSchema), AssistantController.chat);
apiRouter.get('/assistant/sessions', requireAuth, AssistantController.listSessions);
apiRouter.get('/assistant/sessions/:id', requireAuth, AssistantController.getSession);

// --- Demo Seed Data ---
apiRouter.post('/seed/demo', requireAuth, SeedController.seedDemoData);
