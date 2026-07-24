import { z } from 'zod';

const ALLOWED_DOMAIN = '@live.gctu.edu.gh';

export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .refine((email) => email.endsWith(ALLOWED_DOMAIN), `Only official GCTU staff credentials are permitted. Use ${ALLOWED_DOMAIN}`),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const onboardingSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required').max(80, 'First name is too long'),
  middleName: z.string().trim().max(80, 'Middle name is too long').optional().or(z.literal('')),
  lastName: z.string().trim().min(2, 'Last name is required').max(80, 'Last name is too long'),
  faculty: z.string().min(2, 'Faculty or school is required'),
  department: z.string().min(2, 'Department is required'),
  staffId: z.string().min(2, 'Staff ID is required'),
  currentRank: z.enum(['ASSISTANT_LECTURER', 'LECTURER', 'SENIOR_LECTURER', 'ASSOCIATE_PROFESSOR', 'PROFESSOR'] as const),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
