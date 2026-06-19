import { z } from 'zod';

// Backend PATCH /profile DTO bilan mos: username lowercase-only, fullName ≤60, bio ≤160.
export const editProfileSchema = z.object({
  fullName: z.string().min(1, 'Ismni kiriting').max(60, 'Ko`pi bilan 60 belgi'),
  username: z
    .string()
    .min(3, 'Kamida 3 belgi')
    .max(30, 'Ko`pi bilan 30 belgi')
    .regex(/^[a-z0-9_.]+$/, 'Faqat kichik harf, raqam, nuqta va pastki chiziq'),
  bio: z.string().max(160, 'Ko`pi bilan 160 belgi'),
});

export type EditProfileValues = z.infer<typeof editProfileSchema>;
