'use client';
import { Button } from '@/components/ui/button';
import { useStudioStore } from '@/lib/store/studio';
import { TEMPLATES, type VideoFormat } from '@/lib/templates';

const FORMAT_LABELS: Record<VideoFormat, { label: string; icon: string }> = {
  '16:9': { label: '16:9', icon: '▬' },
  '9:16': { label: '9:16', icon: '▮' },
  '1:1': { label: '1:1', icon: '■' },
};

export const FormatSelector = () => {
  const { templateId, format, setFormat } = useStudioStore();
  const supportedFormats = TEMPLATES[templateId].supportedFormats;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Format
      </p>
      <div className="flex gap-2">
        {(Object.keys(FORMAT_LABELS) as VideoFormat[]).map((f) => {
          const isSupported = supportedFormats.includes(f);
          const isActive = format === f;
          return (
            <Button
              key={f}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              disabled={!isSupported}
              onClick={() => setFormat(f)}
              className="text-xs gap-1.5"
            >
              <span>{FORMAT_LABELS[f].icon}</span>
              {FORMAT_LABELS[f].label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
