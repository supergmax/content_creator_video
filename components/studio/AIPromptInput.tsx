'use client';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useStudioStore } from '@/lib/store/studio';
import { TEMPLATES } from '@/lib/templates';

export const AIPromptInput = () => {
  const [prompt, setPrompt] = useState('');
  const { templateId, setProps, isGenerating, setIsGenerating } = useStudioStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, templateId }),
      });

      if (!res.ok) throw new Error('Génération échouée');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rawProps = JSON.parse(jsonMatch[0]);
        const template = TEMPLATES[templateId];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validated = (template.schema as any).safeParse(rawProps);
        if (validated.success) {
          setProps(validated.data as Record<string, unknown>);
        }
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        ✦ Générer avec IA
      </label>
      <Textarea
        placeholder="Ex: 'Intro SaaS dark mode 15s pour une app de gestion de tâches'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="text-xs min-h-16 resize-none"
        onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleGenerate(); }}
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
    </div>
  );
};
