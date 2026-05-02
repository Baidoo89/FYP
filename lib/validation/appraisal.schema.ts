import { z } from 'zod';

export const appraisalSchema = z.object({
  lecturer_id: z.coerce.number().int().positive(),

  teaching_score: z.coerce.number().min(0).max(100),

  research_score: z.coerce.number().min(0).max(100),

  service_score: z.coerce.number().min(0).max(100),

  appraisal_date: z.string().optional(),

  reviewed_by: z.string().optional().nullable(),

  comments: z.string().optional().nullable(),
});