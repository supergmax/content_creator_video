'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useStudioStore } from '@/lib/store/studio';
import { TEMPLATES } from '@/lib/templates';

export const AIPromptInput = () => {
  const [prompt, setPrompt] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { templateId, setProps, isGenerating, setIsGenerating } =
    useStudioStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    setValidationError(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, templateId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? 'Génération échouée');
      }

      const data = await res.json() as { text?: string };
      const text = data.text ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rawProps = JSON.parse(jsonMatch[0]);
        const template = TEMPLATES[templateId];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validated = (template.schema as any).safeParse(rawProps);
        if (validated.success) {
          setProps(validated.data as Record<string, unknown>);
        } else {
          setValidationError("L'IA a retourné des props invalides. Réessaie avec un prompt plus précis.");
        }
      } else {
        setValidationError("L'IA n'a pas retourné de données utilisables. Réessaie.");
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setValidationError("Erreur lors de la génération. Vérifie ta connexion et réessaie.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="ai-prompt"
        className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
      >
        ✦ Générer avec IA
      </label>
      <Textarea
        id="ai-prompt"
        placeholder="Ex: 'Intro SaaS dark mode 15s pour une app de gestion de tâches'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="text-xs min-h-16 resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.metaKey) handleGenerate();
        }}
      />
      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        size="sm"
        className="w-full text-xs"
        variant="outline"
      >
        {isGenerating ? '⟳ Génération…' : '✦ Générer avec IA'}
      </Button>
      {validationError && (
        <p className="text-xs text-red-500 mt-1">{validationError}</p>
      )}
    </div>
  );
};
