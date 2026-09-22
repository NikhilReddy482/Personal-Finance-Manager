import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000),
  sessionId: z.string().optional(),
  contextState: z.object({
    selectedPeriod: z.string().optional(),
    accountFilter: z.string().optional(),
    activeCategory: z.string().optional(),
  }).optional(),
});
