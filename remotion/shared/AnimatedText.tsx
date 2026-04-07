import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface AnimatedTextProps {
  text: string;
  delay?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  style?: 'fade' | 'slide-up' | 'scale';
}

export const AnimatedText = ({
  text,
  delay = 0,
  color = '#ffffff',
  fontSize = 48,
  fontWeight = 700,
  style = 'slide-up',
}: AnimatedTextProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.5 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateY =
    style === 'slide-up'
      ? interpolate(progress, [0, 1], [30, 0], { extrapolateRight: 'clamp' })
      : 0;
  const scale =
    style === 'scale'
      ? interpolate(progress, [0, 1], [0.8, 1], { extrapolateRight: 'clamp' })
      : 1;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        color,
        fontSize,
        fontWeight,
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: 1.2,
      }}
    >
      {text}
    </div>
  );
};
