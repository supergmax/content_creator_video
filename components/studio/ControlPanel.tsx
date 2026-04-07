'use client';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useStudioStore } from '@/lib/store/studio';
import { TEMPLATES } from '@/lib/templates';
import { AIPromptInput } from './AIPromptInput';
import { FormatSelector } from './FormatSelector';
import { RenderButton } from './RenderButton';
import { TemplateSelector } from './TemplateSelector';

export const ControlPanel = () => {
  const { templateId, props, setProp } = useStudioStore();
  const template = TEMPLATES[templateId];

  // Extraire les champs du schéma Zod (Zod v4)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape = (template.schema as any)?.shape;
  const shapeObj: Record<string, unknown> =
    typeof shape === 'function' ? shape() : (shape ?? {});
  const fields = Object.entries(shapeObj).filter(
    ([key]) => key !== 'durationInSeconds',
  );

  return (
    <div className="h-full flex flex-col border-r">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          <TemplateSelector />
          <Separator className="opacity-30" />
          <FormatSelector />
          <Separator className="opacity-30" />

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Contenu
            </p>
            {fields.map(([key]) => (
              <div key={key} className="space-y-1.5">
                <label
                  htmlFor={`field-${key}`}
                  className="text-xs text-muted-foreground capitalize"
                >
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                <Input
                  id={`field-${key}`}
                  value={String(props[key] ?? '')}
                  onChange={(e) => setProp(key, e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>

          <Separator className="opacity-30" />
          <AIPromptInput />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <RenderButton />
      </div>
    </div>
  );
};
