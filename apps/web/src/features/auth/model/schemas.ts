import { z } from 'zod';

// Backend DTO (register/google-complete) bilan mos: harf/raqam/nuqta/pastki chiziq.
const usernameSchema = z
  .string()
  .min(3, 'Kamida 3 belgi')
  .max(30, 'Ko`pi bilan 30 belgi')
  .regex(/^[a-zA-Z0-9._]+$/, 'Faqat harf, raqam, nuqta va pastki chiziq');

export const loginSchema = z.object({
  email: z.string().email('Email noto`g`ri formatda'),
  password: z.string().min(1, 'Parolni kiriting'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(1, 'Ismni kiriting').max(100, 'Juda uzun'),
  username: usernameSchema,
  email: z.string().email('Email noto`g`ri formatda'),
  password: z
    .string()
    .min(8, 'Kamida 8 belgi')
    .max(72, 'Juda uzun'),
});
export type RegisterValues = z.infer<typeof registerSchema>;

export const onboardingSchema = z.object({
  username: usernameSchema,
});
export type OnboardingValues = z.infer<typeof onboardingSchema>;
