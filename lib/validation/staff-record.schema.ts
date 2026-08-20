import { z } from 'zod';

export const staffCategorySchema = z.enum([
  'ACADEMIC_SENIOR_MEMBER',
  'ADMINISTRATIVE_SENIOR_MEMBER',
  'PROFESSIONAL_SENIOR_MEMBER',
  'SENIOR_STAFF',
  'JUNIOR_STAFF',
]);

export const employmentStatusSchema = z.enum([
  'ACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'RETIRED',
  'RESIGNED',
  'TERMINATED',
  'DECEASED',
]);

const dateField = (label: string) => z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date.`);

export const staffRecordVerificationSchema = z.object({
  userId: z.coerce.number().int().positive(),
  staffNumber: z.string().trim().min(2, 'Staff number is required.').max(80),
  category: staffCategorySchema,
  employmentStatus: employmentStatusSchema,
  employmentStartedAt: dateField('Employment start date'),
  retirementDate: dateField('Retirement date'),
  rankCode: z.string().trim().min(2, 'Select the verified current rank.').max(100),
  rankStartedAt: dateField('Rank start date'),
  organizationUnitCode: z.string().trim().min(2, 'Select the primary organization unit.').max(100),
  assignmentStartedAt: dateField('Assignment start date'),
  positionTitle: z.string().trim().max(160).optional().nullable(),
  sourceRecordId: z.string().trim().max(160).optional().nullable(),
  appointmentRef: z.string().trim().max(160).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type StaffRecordVerificationInput = z.infer<typeof staffRecordVerificationSchema>;
