import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().optional().default(''),
  SESSION_SECRET: z.string().min(16).default('super_secret_session_key_minimum_32_chars_12345'),
  MFA_ENCRYPTION_KEY: z.string().min(32).default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  EMAIL_HOST: z.string().optional().default(process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp-relay.brevo.com'),
  EMAIL_PORT: z.coerce.number().default(Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587),
  EMAIL_USER: z.string().optional().default(process.env.SMTP_USER || process.env.EMAIL_USER || ''),
  EMAIL_PASSWORD: z.string().optional().default(process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || ''),
  EMAIL_FROM: z.string().default(process.env.SMTP_FROM || process.env.EMAIL_FROM || 'Financial Flow <nikhilreddygurrala2@gmail.com>'),
  BREVO_API_KEY: z.string().optional().default(process.env.BREVO_API_KEY || ''),
  RESEND_API_KEY: z.string().optional().default(process.env.RESEND_API_KEY || ''),
  ML_SERVICE_URL: z.string().default('http://127.0.0.1:8000'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.6-flash'),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_MODEL: z.string().default('inclusionai/ling-3.0-flash-fin:free'),
  OPENROUTER_FALLBACK_MODEL: z.string().default('nex-agi/nex-n2.5-pro:free'),
  MAX_UPLOAD_SIZE: z.coerce.number().default(10485760),
});

export const env = envSchema.parse(process.env);
