import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .trim()
    .min(3, 'Comment must be at least 3 characters')
    .max(2000, 'Comment is too long'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
