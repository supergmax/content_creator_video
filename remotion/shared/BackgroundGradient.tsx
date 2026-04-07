import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface BackgroundGradientProps {
  color1?: string;
  color2?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export const BackgroundGradient = ({
  color1 = '#a855f7',
  color2 = '#38bdf8',
  backgroundColor = '#050505',
  animated = true,
}: BackgroundGradientProps) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = animated
    ? interpolate(frame, [0, durationInFrames], [0, 360], {
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60%',
          height: '60%',
          background: color1,
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.3,
          transform: `rotate(${progress}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '50%',
          height: '50%',
          background: color2,
          borderRadius: '50%',
          filter: 'blur(100px)',
          opacity: 0.2,
          transform: `rotate(${-progress}deg)`,
        }}
      />
    </div>
  );
};
