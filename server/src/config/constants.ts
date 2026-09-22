export const TRANSACTION_TYPES = [
  'INCOME',
  'EXPENSE',
  'TRANSFER',
  'INVESTMENT',
  'DEBT_PAYMENT',
  'REFUND',
  'CASH_WITHDRAWAL',
  'CASH_DEPOSIT',
  'FEE',
  'OTHER'
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const ACCOUNT_TYPES = [
  'SAVINGS',
  'CURRENT',
  'CREDIT_CARD',
  'CASH',
  'INVESTMENT',
  'LOAN',
  'OTHER'
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const CLASSIFICATION_METHODS = [
  'RULE',
  'MERCHANT',
  'ML',
  'USER',
  'RECURRING_PATTERN',
  'UNKNOWN'
] as const;

export type ClassificationMethod = (typeof CLASSIFICATION_METHODS)[number];

export const REVIEW_STATUSES = [
  'VALID',
  'WARNING',
  'REQUIRES_REVIEW',
  'CONFIRMED'
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const IMPORT_STATUSES = [
  'UPLOADED',
  'PROCESSING',
  'REVIEW_REQUIRED',
  'READY',
  'IMPORTING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
] as const;

export type ImportStatus = (typeof IMPORT_STATUSES)[number];

export const RECURRING_FREQUENCIES = [
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY'
] as const;

export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];
