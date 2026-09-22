import { z } from 'zod';

export const createBudgetSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  amountLimit: z.number().positive('Budget amount must be positive'),
  alertThresholdPercent: z.number().min(1).max(100).default(80),
});

export const updateBudgetSchema = createBudgetSchema.partial();
