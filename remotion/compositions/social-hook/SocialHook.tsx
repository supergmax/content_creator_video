import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import type { SocialHookProps } from './schema';

// Chaque mot du hookText entre avec un spring snappy décalé
const WordReveal = ({
  word,
  startFrame,
  isAccent,
  accentColor,
  textColor,
  fontSize,
}: {
  word: string;
  startFrame: number;
  isAccent: boolean;
  accentColor: string;
  textColor: string;
  fontSize: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 7, stiffness: 400, mass: 0.4 },
  });

  const opacity = interpolate(progress, [0, 0.4, 1], [0, 1, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(progress, [0, 1], [1.5, 1], { extrapolateRight: 'clamp' });
  const y = interpolate(progress, [0, 1], [80, 0], { extrapolateRight: 'clamp' });
  const blur = interpolate(progress, [0, 0.5, 1], [8, 2, 0], { extrapolateRight: 'clamp' });

  return (
    <span
      style={{
        display: 'inline-block',
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        filter: `blur(${blur}px)`,
        color: isAccent ? accentColor : textColor,
        marginRight: '0.25em',
        textShadow: isAccent ? `0 0 40px ${accentColor}88` : 'none',
        transition: 'none',
      }}
    >
      {word}
    </span>
  );
};

export const SocialHook = ({
  hookText,
  subText,
  accentColor,
  backgroundColor,
  textColor,
}: SocialHookProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const words = hookText.split(' ');
  const WORD_DELAY = 7; // frames entre chaque mot
  const LAST_WORD_FRAME = words.length * WORD_DELAY;

  // Ligne accent : slide depuis la gauche
  const lineProgress = spring({
    frame: frame - Math.round(fps * 0.1),
    fps,
    config: { damping: 20, stiffness: 250 },
  });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, width * 0.65], {
    extrapolateRight: 'clamp',
  });

  // SubText : apparaît après le dernier mot
  const subDelay = LAST_WORD_FRAME + fps * 0.4;
  const subProgress = spring({
    frame: frame - subDelay,
    fps,
    config: { damping: 14, stiffness: 150 },
  });
  const subOpacity = interpolate(subProgress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const subY = interpolate(subProgress, [0, 1], [40, 0], { extrapolateRight: 'clamp' });

  // Badge "?" qui pulse à la fin
  const badgeDelay = LAST_WORD_FRAME + fps * 1.2;
  const badgeProgress = spring({
    frame: frame - badgeDelay,
    fps,
    config: { damping: 5, stiffness: 300, mass: 0.6 },
  });
  const badgeScale = interpolate(badgeProgress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });

  // Vignette de fond qui pulse en rythme avec les mots
  const vignetteOpacity = interpolate(
    frame % WORD_DELAY,
    [0, 2, WORD_DELAY],
    [0.6, 0.3, 0.4],
    { extrapolateRight: 'clamp' },
  );

  const fontSize = Math.round(width / 7);
  const subFontSize = Math.round(width / 18);

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Inter", system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Fond gradient animé */}
      <BackgroundGradient
        color1={accentColor}
        color2="#ec4899"
        backgroundColor={backgroundColor}
        animated={true}
      />

      {/* Vignette radiale pour donner du relief */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, ${backgroundColor}cc 100%)`,
          zIndex: 1,
          opacity: vignetteOpacity,
        }}
      />

      {/* Ligne accent horizontale */}
      <div
        style={{
          position: 'absolute',
          left: Math.round(width * 0.175),
          top: Math.round(height * 0.37),
          width: lineWidth,
          height: 5,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}00)`,
          borderRadius: 3,
          zIndex: 2,
          boxShadow: `0 0 20px ${accentColor}66`,
        }}
      />

      {/* Hook text — mot par mot */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          textAlign: 'center',
          padding: `0 ${Math.round(width * 0.08)}px`,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 0,
        }}
      >
        {words.map((word, i) => (
          <WordReveal
            key={i}
            word={word}
            startFrame={i * WORD_DELAY}
            isAccent={i === words.length - 1}
            accentColor={accentColor}
            textColor={textColor}
            fontSize={fontSize}
          />
        ))}
      </div>

      {/* SubText */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          marginTop: Math.round(height * 0.04),
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          textAlign: 'center',
          padding: `0 ${Math.round(width * 0.1)}px`,
          color: 'rgba(255,255,255,0.75)',
          fontSize: subFontSize,
          fontWeight: 500,
          letterSpacing: '0.01em',
          lineHeight: 1.4,
        }}
      >
        {subText}
      </div>

      {/* Badge accent en bas */}
      <div
        style={{
          position: 'absolute',
          bottom: Math.round(height * 0.08),
          zIndex: 3,
          transform: `scale(${badgeScale})`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: `${accentColor}22`,
          border: `2px solid ${accentColor}66`,
          borderRadius: 999,
          padding: `${Math.round(width * 0.02)}px ${Math.round(width * 0.06)}px`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />
        <span
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: Math.round(subFontSize * 0.85),
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          stellarpulse
        </span>
      </div>
    </div>
  );
};
