import type { z } from 'zod';
import { courseIntroSchema } from '@/remotion/compositions/course-intro/schema';
import { saasPromoSchema } from '@/remotion/compositions/saas-promo/schema';
import { socialHookSchema } from '@/remotion/compositions/social-hook/schema';
import { textRevealSchema } from '@/remotion/compositions/text-reveal/schema';

export type VideoFormat = '16:9' | '9:16' | '1:1';

export const FORMAT_DIMENSIONS: Record<
  VideoFormat,
  { width: number; height: number }
> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
};

export type TemplateId =
  | 'saas-promo'
  | 'course-intro'
  | 'social-hook'
  | 'text-reveal';

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  defaultFormat: VideoFormat;
  supportedFormats: VideoFormat[];
  schema: z.ZodType;
  defaultProps: Record<string, unknown>;
}

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  'saas-promo': {
    id: 'saas-promo',
    name: 'SaaS Promo',
    description: 'Présentation produit dark mode avec CTA',
    defaultFormat: '16:9',
    supportedFormats: ['16:9', '9:16'],
    schema: saasPromoSchema,
    defaultProps: saasPromoSchema.parse({}),
  },
  'course-intro': {
    id: 'course-intro',
    name: 'Course Intro',
    description: 'Intro de cours avec auteur et chapitre',
    defaultFormat: '16:9',
    supportedFormats: ['16:9'],
    schema: courseIntroSchema,
    defaultProps: courseIntroSchema.parse({}),
  },
  'social-hook': {
    id: 'social-hook',
    name: 'Social Hook',
    description: 'Hook fort pour TikTok, Reels et Shorts',
    defaultFormat: '9:16',
    supportedFormats: ['9:16', '1:1'],
    schema: socialHookSchema,
    defaultProps: socialHookSchema.parse({}),
  },
  'text-reveal': {
    id: 'text-reveal',
    name: 'Text Reveal',
    description: 'Animation typographique pure',
    defaultFormat: '16:9',
    supportedFormats: ['16:9', '9:16', '1:1'],
    schema: textRevealSchema,
    defaultProps: textRevealSchema.parse({}),
  },
};
