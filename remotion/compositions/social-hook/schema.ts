import { z } from 'zod';

export const socialHookSchema = z.object({
  hookText: z.string().default("You won't believe this..."),
  subText: z.string().default('Thread below 👇'),
  accentColor: z.string().default('#f59e0b'),
  backgroundColor: z.string().default('#050505'),
  textColor: z.string().default('#ffffff'),
  durationInSeconds: z.number().min(3).max(60).default(7),
  audioSrc: z.string().optional(),
});

export type SocialHookProps = z.infer<typeof socialHookSchema>;
