import { z } from 'zod';
import { runClaude } from '@/lib/ai/claude-cli';
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
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { prompt, templateId } = parsed.data;
  const fullPrompt = `${buildSystemPrompt(templateId)}\n\n${buildUserPrompt(prompt)}`;

  try {
    const text = await runClaude(fullPrompt);
    return Response.json({ text });
  } catch (err) {
    console.error('[ai/generate] claude CLI error:', err);
    return Response.json(
      { error: 'Génération IA échouée — claude CLI non disponible' },
      { status: 503 },
    );
  }
}
