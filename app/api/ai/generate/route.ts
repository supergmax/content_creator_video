import { streamText } from 'ai';
import { z } from 'zod';
import { AI_MODEL } from '@/lib/ai/client';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai/prompts';

const requestSchema = z.object({
  prompt: z.string().min(1).max(500),
  templateId: z.enum([
    'saas-promo',
    'course-intro',
    'social-hook',
    'text-reveal',
  ]),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { prompt, templateId } = parsed.data;

  const result = streamText({
    model: AI_MODEL,
    system: buildSystemPrompt(templateId),
    prompt: buildUserPrompt(prompt),
    maxOutputTokens: 500,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
