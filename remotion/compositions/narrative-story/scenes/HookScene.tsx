import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { WordReveal } from '../shared/WordReveal';
import type { HookSceneProps } from '../schema';

const EASE_OUT_AE = Easing.bezier(0.25, 0.1, 0.25, 1);

export const HookScene = ({
  hookText,
  subText,
  accentColor,
  backgroundColor,
  textColor,
  showAccentLine,
  durationInSeconds,
}: HookSceneProps) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Fade in global de la scène (15 frames)
  const sceneFadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
    easing: EASE_OUT_AE,
  });

  // Fade out de la scène à la fin (20 dernières frames)
  const totalFrames = durationInSeconds * fps;
  const sceneFadeOut = interpolate(
    frame,
    [totalFrames - 20, totalFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE_OUT_AE,
    },
  );
  const globalOpacity = Math.min(sceneFadeIn, sceneFadeOut);

  // Ligne accent horizontale — slide-in depuis la gauche
  const lineProgress = interpolate(frame - 3, [0, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT_AE,
  });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, width * 0.65]);

  // Délai du subText : arrive après les mots du hook
  const words = hookText.split(' ');
  const subDelayFrames = words.length * 5 + 22 + 6; // fin du dernier mot + pause
  const subProgress = interpolate(
    frame - subDelayFrames,
    [0, 20],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE_OUT_AE,
    },
  );
  const subOpacity = subProgress;
  const subY = interpolate(subProgress, [0, 1], [25, 0]);

  // Vignette qui respire doucement
  const vignetteBreath = interpolate(
    Math.sin((frame / 90) * Math.PI * 2),
    [-1, 1],
    [0.4, 0.55],
  );

  const hookFontSize = Math.round(width / 7);
  const subFontSize = Math.round(width / 18);

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: backgroundColor,
        opacity: globalOpacity,
      }}
    >
      {/* Background glow / blob ambient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${accentColor}22 0%, transparent 60%)`,
        }}
      />

      {/* Vignette qui respire */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, ${backgroundColor}dd 100%)`,
          opacity: vignetteBreath,
        }}
      />

      {/* Ligne accent horizontale */}
      {showAccentLine && (
        <div
          style={{
            position: 'absolute',
            left: Math.round(width * 0.175),
            top: Math.round(height * 0.35),
            width: lineWidth,
            height: 5,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}00)`,
            borderRadius: 3,
            boxShadow: `0 0 20px ${accentColor}66`,
          }}
        />
      )}

      {/* Hook text centré */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `0 ${Math.round(width * 0.08)}px`,
          zIndex: 3,
        }}
      >
        <WordReveal
          text={hookText}
          accentColor={accentColor}
          textColor={textColor}
          fontSize={hookFontSize}
        />

        {/* SubText optionnel */}
        {subText && (
          <div
            style={{
              marginTop: Math.round(height * 0.04),
              opacity: subOpacity,
              transform: `translateY(${subY}px)`,
              textAlign: 'center',
              color: 'rgba(255,255,255,0.75)',
              fontSize: subFontSize,
              fontWeight: 500,
              letterSpacing: '0.01em',
              lineHeight: 1.4,
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            {subText}
          </div>
        )}
      </div>
    </div>
  );
};
