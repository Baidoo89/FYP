import { z } from 'zod';

export const documentCategorySchema = z.enum([
  'TEACHING',
  'RESEARCH',
  'SERVICE',
  'QUALIFICATIONS',
  'PUBLICATIONS',
  'PROFESSIONAL_DEVELOPMENT',
  'OTHER_SUPPORTING_EVIDENCE',
]);

export const academicRankSchema = z.enum([
  'ASSISTANT_LECTURER',
  'LECTURER',
  'SENIOR_LECTURER',
  'ASSOCIATE_PROFESSOR',
  'PROFESSOR',
]);

export const startPromotionRequestSchema = z.object({
  targetRank: academicRankSchema,
  yearsInCurrentRank: z.coerce.number().int().min(0, 'Years in current rank cannot be negative').max(60, 'Years in current rank looks too high').optional(),
  adminComment: z.string().optional().nullable(),
});

export const promotionRequestSchema = z.object({
  lecturerId: z.number().int().positive(),
  currentRank: z.string().min(2),
  targetRank: z.string().min(2),
  yearsInCurrentRank: z.number().int().min(0).optional(),
  adminComment: z.string().optional().nullable(),
});

export const documentUploadSchema = z.object({
  requestId: z.number().int().positive(),
  category: documentCategorySchema,
  title: z.string().min(3),
});

export const verificationSchema = z.object({
  documentId: z.number().int().positive(),
  verificationStatus: z.enum(['VERIFIED', 'REJECTED', 'REQUIRES_CORRECTION']),
  comment: z.string().optional().nullable(),
});
