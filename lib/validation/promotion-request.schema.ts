import { z } from 'zod';

export const documentCategorySchema = z.enum(['RESEARCH', 'TEACHING', 'SERVICE']);

export const promotionRequestSchema = z.object({
  lecturerId: z.number().int().positive(),
  currentRank: z.string().min(2),
  targetRank: z.string().min(2),
  adminComment: z.string().optional().nullable(),
});

export const documentUploadSchema = z.object({
  requestId: z.number().int().positive(),
  category: documentCategorySchema,
  title: z.string().min(3),
});

export const verificationSchema = z.object({
  documentId: z.number().int().positive(),
  verificationStatus: z.enum(['VERIFIED', 'REJECTED']),
  comment: z.string().optional().nullable(),
});
