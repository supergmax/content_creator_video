'use client';
import { TemplateSelector } from './TemplateSelector';
import { FormatSelector } from './FormatSelector';
import { useStudioStore } from '@/lib/store/studio';
import { TEMPLATES } from '@/lib/templates';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export const ControlPanel = () => {
  const { templateId, props, setProp } = useStudioStore();
  const template = TEMPLATES[templateId];

  // Extraire les champs du schéma Zod (Zod v4)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape = (template.schema as any)?.shape;
  const shapeObj: Record<string, unknown> = typeof shape === 'function' ? shape() : (shape ?? {});
  const fields = Object.entries(shapeObj).filter(([key]) => key !== 'durationInSeconds');

  return (
    <div className="h-full flex flex-col border-r">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          <TemplateSelector />
          <Separator className="opacity-30" />
          <FormatSelector />
          <Separator className="opacity-30" />

          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contenu</label>
            {fields.map(([key]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                <Input
                  value={String(props[key] ?? '')}
                  onChange={(e) => setProp(key, e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>

          <Separator className="opacity-30" />
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">✦ Générer avec IA</label>
            <p className="text-xs text-muted-foreground">Disponible dans la prochaine étape</p>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button variant="outline" size="sm" className="w-full text-xs" disabled>
          ⬇ Render MP4 (bientôt)
        </Button>
      </div>
    </div>
  );
};
