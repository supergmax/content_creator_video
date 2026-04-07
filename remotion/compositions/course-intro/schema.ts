import { z } from 'zod';

export const courseIntroSchema = z.object({
  courseTitle: z.string().default('Course Title'),
  authorName: z.string().default('Author Name'),
  chapterNumber: z.number().min(1).default(1),
  chapterTitle: z.string().default('Introduction'),
  accentColor: z.string().default('#38bdf8'),
  backgroundColor: z.string().default('#050505'),
  durationInSeconds: z.number().min(5).max(30).default(10),
});

export type CourseIntroProps = z.infer<typeof courseIntroSchema>;
