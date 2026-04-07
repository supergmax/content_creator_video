import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { FORMAT_DIMENSIONS, TEMPLATES } from '@/lib/templates';
import { spawnRender } from '@/lib/remotion/render';
import { renderProgress } from '@/lib/render-state';

const COMPOSITION_IDS: Record<string, string> = {
  'saas-promo': 'SaasPromo',
  'course-intro': 'CourseIntro',
  'social-hook': 'SocialHook',
  'text-reveal': 'TextReveal',
};

const renderRequestSchema = z.object({
  templateId: z.enum(['saas-promo', 'course-intro', 'social-hook', 'text-reveal']),
  format: z.enum(['16:9', '9:16', '1:1']),
  props: z.record(z.string(), z.unknown()),
  outputName: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = renderRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { templateId, format, props, outputName } = parsed.data;
  const template = TEMPLATES[templateId];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validatedProps = (template.schema as any).safeParse(props);

  if (!validatedProps.success) {
    return Response.json({ error: 'Invalid props' }, { status: 400 });
  }

  const { width, height } = FORMAT_DIMENSIONS[format];

  renderProgress.set(outputName, 0);

  spawnRender(
    {
      compositionId: COMPOSITION_IDS[templateId],
      outputName,
      width,
      height,
      props: validatedProps.data as Record<string, unknown>,
    },
    (percent) => renderProgress.set(outputName, percent),
  )
    .then(() => renderProgress.set(outputName, 100))
    .catch(() => renderProgress.set(outputName, -1));

  return Response.json({ renderKey: outputName, message: 'Render started' }, { status: 202 });
}
