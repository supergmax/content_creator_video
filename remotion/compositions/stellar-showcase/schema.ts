import { z } from 'zod';

export const stellarShowcaseSchema = z.object({
  audioSrc: z.string().default('/audio/alquimia.mp3'),
  durationInSeconds: z.number().default(40),
});

export type StellarShowcaseProps = z.infer<typeof stellarShowcaseSchema>;
