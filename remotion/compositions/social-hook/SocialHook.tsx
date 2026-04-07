import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { AnimatedText } from '@/remotion/shared/AnimatedText';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import type { SocialHookProps } from './schema';

export const SocialHook = ({
  hookText,
  subText,
  accentColor,
  backgroundColor,
  textColor,
}: SocialHookProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const pulseProgress = spring({ frame: frame - fps * 0.2, fps, config: { damping: 6, stiffness: 120, mass: 0.8 } });
  const scale = interpolate(pulseProgress, [0, 1], [0.85, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <BackgroundGradient color1={accentColor} color2="#ec4899" backgroundColor={backgroundColor} animated={false} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 40px', transform: `scale(${scale})` }}>
        <div style={{ color: textColor, fontSize: Math.round(width / 9), fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
          {hookText}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, opacity: interpolate(frame, [fps * 1, fps * 1.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        <AnimatedText
          text={subText}
          delay={fps * 1}
          color="rgba(255,255,255,0.7)"
          fontSize={Math.round(width / 18)}
          fontWeight={500}
          style="fade"
        />
      </div>
    </div>
  );
};
