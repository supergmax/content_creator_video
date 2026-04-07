import { z } from 'zod';

export const textRevealSchema = z.object({
  lines: z.array(z.string()).min(1).max(5).default(['Line one', 'Line two']),
  fontSizeMultiplier: z.number().min(0.5).max(3).default(1),
  accentColor: z.string().default('#22c55e'),
  backgroundColor: z.string().default('#050505'),
  revealStyle: z.enum(['fade', 'slide', 'typewriter']).default('slide'),
  durationInSeconds: z.number().min(3).max(60).default(10),
});

export type TextRevealProps = z.infer<typeof textRevealSchema>;
