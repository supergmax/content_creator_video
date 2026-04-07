import { z } from 'zod';

export const saasPromoSchema = z.object({
  productName: z.string().default('Product Name'),
  tagline: z.string().default('The future of X'),
  ctaText: z.string().default('Get started →'),
  accentColor: z.string().default('#a855f7'),
  backgroundColor: z.string().default('#050505'),
  logoUrl: z.string().url().optional(),
  durationInSeconds: z.number().min(5).max(60).default(15),
});

export type SaasPromoProps = z.infer<typeof saasPromoSchema>;
