'use client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudioStore } from '@/lib/store/studio';
import { TEMPLATES, type TemplateId } from '@/lib/templates';

export const TemplateSelector = () => {
  const { templateId, setTemplateId } = useStudioStore();

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Template
      </p>
      <Tabs
        value={templateId}
        onValueChange={(v) => setTemplateId(v as TemplateId)}
      >
        <TabsList className="grid grid-cols-2 h-auto gap-1 bg-transparent p-0">
          {Object.values(TEMPLATES).map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs py-1.5">
              {t.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
