import { useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimatedText } from '@/remotion/shared/AnimatedText';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import type { SaasPromoProps } from './schema';

export const SaasPromo = ({
  productName,
  tagline,
  ctaText,
  accentColor,
  backgroundColor,
  durationInSeconds,
}: SaasPromoProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const ctaDelay = fps * 1.2;
  const ctaProgress = Math.min(Math.max((frame - ctaDelay) / (fps * 0.4), 0), 1);

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <BackgroundGradient
        color1={accentColor}
        color2="#38bdf8"
        backgroundColor={backgroundColor}
      />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', gap: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <AnimatedText
          text={productName}
          delay={0}
          color="#ffffff"
          fontSize={Math.round(width / 15)}
          fontWeight={800}
          style="slide-up"
        />
        <AnimatedText
          text={tagline}
          delay={fps * 0.3}
          color="rgba(255,255,255,0.6)"
          fontSize={Math.round(width / 35)}
          fontWeight={400}
          style="fade"
        />

        <div
          style={{
            marginTop: 8,
            background: accentColor,
            color: '#ffffff',
            padding: `${Math.round(width / 80)}px ${Math.round(width / 30)}px`,
            borderRadius: Math.round(width / 60),
            fontSize: Math.round(width / 45),
            fontWeight: 600,
            opacity: ctaProgress,
            transform: `scale(${0.8 + ctaProgress * 0.2})`,
          }}
        >
          {ctaText}
        </div>
      </div>
    </div>
  );
};
