import { z } from 'zod';
import { TRANSACTION_TYPES, REVIEW_STATUSES } from '../config/constants';

export const createTransactionSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  transactionType: z.enum(TRANSACTION_TYPES),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  leafCategory: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  reviewStatus: z.enum(REVIEW_STATUSES).optional(),
});

export const transactionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  accountId: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  transactionType: z.enum(TRANSACTION_TYPES).optional(),
  search: z.string().max(100).optional(),
  merchant: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  isRecurring: z.coerce.boolean().optional(),
  isAnomaly: z.coerce.boolean().optional(),
  reviewStatus: z.enum(REVIEW_STATUSES).optional(),
  sortBy: z.enum(['date', 'amountMinor', 'category', 'merchant']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
