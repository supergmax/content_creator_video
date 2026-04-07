import type { TemplateId } from '@/lib/templates';
import { TEMPLATES } from '@/lib/templates';

export function buildSystemPrompt(templateId: TemplateId): string {
  const template = TEMPLATES[templateId];
  // Zod v4: shape is a plain object property on ZodObject
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape: Record<string, unknown> = (template.schema as any)?.shape ?? {};
  const fields = Object.keys(shape).join(', ');

  return `Tu es un expert en création de vidéos professionnelles pour les réseaux sociaux.
Tu génères des props JSON pour le template "${template.name}".

Description du template: ${template.description}

Les props que tu dois générer sont: ${fields}

IMPORTANT:
- Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans explications.
- Les couleurs doivent être au format hex (#rrggbb).
- Les durées sont en secondes.
- Garde les textes courts et percutants.

Exemple de réponse valide (JSON pur):
${JSON.stringify(template.defaultProps, null, 2)}`;
}

export function buildUserPrompt(userPrompt: string): string {
  return `Génère les props pour cette vidéo: "${userPrompt}"`;
}
