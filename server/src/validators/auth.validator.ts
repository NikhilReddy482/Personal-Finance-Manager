import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const verifyEmailSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
});

export const verifyLoginOtpSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().min(6, 'Code must be at least 6 characters'),
  method: z.enum(['EMAIL', 'TOTP', 'RECOVERY']).optional().default('EMAIL'),
});


export const resendVerificationSchema = z.object({
  email: z.string().email().toLowerCase(),
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET']).optional().default('REGISTRATION'),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const mfaVerifySchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  code: z.string().min(6, 'Verification code is required'),
  isRecoveryCode: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const resetPasswordOtpSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const disableMfaSchema = z.object({
  password: z.string().optional(),
  code: z.string().optional(),
}).refine((data) => Boolean(data.password || data.code), {
  message: 'Either password or 6-digit Authenticator code is required to disable 2FA',
});

export const getRecoveryCodesSchema = z.object({
  code: z.string().min(6, 'Authenticator code must be at least 6 characters'),
});

