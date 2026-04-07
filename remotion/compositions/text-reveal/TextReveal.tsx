import { useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimatedText } from '@/remotion/shared/AnimatedText';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import type { TextRevealProps } from './schema';

export const TextReveal = ({
  lines,
  fontSizeMultiplier,
  accentColor,
  backgroundColor,
  revealStyle,
}: TextRevealProps) => {
  const _frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const delayPerLine = fps * 0.5;
  const baseFontSize = Math.round(
    (width / (lines.length > 3 ? 12 : 8)) * fontSizeMultiplier,
  );
  const textStyle =
    revealStyle === 'typewriter'
      ? 'fade'
      : revealStyle === 'slide'
        ? 'slide-up'
        : 'fade';

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Math.round(baseFontSize * 0.4),
      }}
    >
      <BackgroundGradient
        color1={accentColor}
        color2="#6366f1"
        backgroundColor={backgroundColor}
        animated={false}
      />

      {lines.map((line, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: lines have no stable id; index is intentional for Remotion frame timing
        <div key={`line-${i}`} style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedText
            text={line}
            delay={i * delayPerLine}
            color={
              i === 0
                ? '#ffffff'
                : i % 2 === 0
                  ? accentColor
                  : 'rgba(255,255,255,0.7)'
            }
            fontSize={i === 0 ? baseFontSize : Math.round(baseFontSize * 0.75)}
            fontWeight={i === 0 ? 800 : 500}
            style={textStyle}
          />
        </div>
      ))}
    </div>
  );
};
