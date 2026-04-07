'use client';
import { Player } from '@remotion/player';
import { useStudioStore } from '@/lib/store/studio';
import { FORMAT_DIMENSIONS, TEMPLATES } from '@/lib/templates';
import { SaasPromo } from '@/remotion/compositions/saas-promo/SaasPromo';
import { CourseIntro } from '@/remotion/compositions/course-intro/CourseIntro';
import { SocialHook } from '@/remotion/compositions/social-hook/SocialHook';
import { TextReveal } from '@/remotion/compositions/text-reveal/TextReveal';

const COMPOSITION_MAP = {
  'saas-promo': SaasPromo,
  'course-intro': CourseIntro,
  'social-hook': SocialHook,
  'text-reveal': TextReveal,
} as const;

export const PreviewPanel = () => {
  const { templateId, props, format } = useStudioStore();
  const { width, height } = FORMAT_DIMENSIONS[format];
  const template = TEMPLATES[templateId];

  const validProps = (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (template.schema as any).safeParse(props);
    return result.success ? result.data : template.defaultProps;
  })();

  const durationInSeconds = (validProps as { durationInSeconds?: number }).durationInSeconds ?? 15;
  const Component = COMPOSITION_MAP[templateId];

  return (
    <div className="flex flex-col items-center justify-center h-full bg-black/40 gap-4 p-4">
      <div
        className="overflow-hidden rounded-lg border border-border/30"
        style={{ maxWidth: '100%', maxHeight: 'calc(100% - 60px)' }}
      >
        <Player
          component={Component as React.ComponentType<Record<string, unknown>>}
          durationInFrames={durationInSeconds * 30}
          fps={30}
          compositionWidth={width}
          compositionHeight={height}
          inputProps={validProps as Record<string, unknown>}
          style={{
            width: format === '9:16' ? 'auto' : '100%',
            height: format === '9:16' ? 'calc(100vh - 160px)' : 'auto',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 160px)',
          }}
          controls
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {width}×{height} · 30fps · {durationInSeconds}s
      </div>
    </div>
  );
};
