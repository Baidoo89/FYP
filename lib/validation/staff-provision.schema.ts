import { z } from 'zod';
import { employmentStatusSchema, staffCategorySchema } from './staff-record.schema';

const INSTITUTIONAL_EMAIL_DOMAINS = ['@gctu.edu.gh', '@live.gctu.edu.gh'];

const dateField = (label: string) => z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date.`);

export const staffProvisionSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required.').max(80),
  middleName: z.string().trim().max(80).optional().nullable(),
  lastName: z.string().trim().min(2, 'Last name is required.').max(80),
  officialEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid institutional email address.')
    .refine(
      (email) => INSTITUTIONAL_EMAIL_DOMAINS.some((domain) => email.endsWith(domain)),
      'Use an approved GCTU institutional email address.',
    ),
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

export type StaffProvisionInput = z.infer<typeof staffProvisionSchema>;
