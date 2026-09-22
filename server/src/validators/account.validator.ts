import { z } from 'zod';
import { ACCOUNT_TYPES } from '../config/constants';

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100),
  institutionName: z.string().min(1, 'Institution name is required').max(100),
  accountType: z.enum(ACCOUNT_TYPES),
  currency: z.string().default('INR'),
  maskedIdentifier: z.string().max(20).optional(),
  openingBalance: z.number().default(0),
  creditLimit: z.number().optional(),
});

export const updateAccountSchema = createAccountSchema.partial();
