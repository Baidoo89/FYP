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
  department: z.string().min(2, 'Department is required'),
  staffId: z.string().min(2, 'Staff ID is required'),
  currentRank: z.enum(['ASSISTANT_LECTURER', 'LECTURER', 'SENIOR_LECTURER', 'ASSOCIATE_PROFESSOR'] as const),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
