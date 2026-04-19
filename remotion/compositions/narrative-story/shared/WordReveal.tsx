import { Easing, interpolate, useCurrentFrame } from 'remotion';

/**
 * Reveal un texte mot par mot avec un feel After Effects:
 * - Ease out cubic (style lissage début/fin AE)
 * - Overlap entre les mots pour créer un flow continu (pas un pop-by-pop)
 * - Le dernier mot est optionnellement mis en accentColor
 *
 * Calibré sur la SocialHook V4 validée par Sekiné le 14 avril 2026.
 */

const WORD_ANIM_DURATION = 22; // durée d'animation par mot (frames @ 30fps)
const WORD_DELAY = 5; // frames entre le démarrage de chaque mot (overlap = 17 frames)
const EASE_OUT_AE = Easing.bezier(0.25, 0.1, 0.25, 1); // équivalent ease-out cubic AE

type Props = {
  text: string;
  startDelayFrames?: number;
  accentLastWord?: boolean;
  accentColor?: string;
  textColor?: string;
  fontSize: number;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  maxWidth?: string;
  letterSpacing?: string;
  lineHeight?: number;
  fontFamily?: string;
};

export const WordReveal = ({
  text,
  startDelayFrames = 0,
  accentLastWord = true,
  accentColor = '#00d4ff',
  textColor = '#ffffff',
  fontSize,
  fontWeight = 900,
  textAlign = 'center',
  maxWidth,
  letterSpacing = '-0.02em',
  lineHeight = 1.12,
  fontFamily = '"Inter", system-ui, sans-serif',
}: Props) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');

  return (
    <div
      style={{
        textAlign,
        fontWeight,
        fontSize,
        lineHeight,
        letterSpacing,
        fontFamily,
        maxWidth,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
        gap: 0,
      }}
    >
      {words.map((word, i) => {
        const startFrame = startDelayFrames + i * WORD_DELAY;
        const progress = interpolate(
          frame - startFrame,
          [0, WORD_ANIM_DURATION],
          [0, 1],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: EASE_OUT_AE,
          },
        );

        const opacity = progress;
        const scale = interpolate(progress, [0, 1], [1.08, 1]);
        const translateY = interpolate(progress, [0, 1], [50, 0]);
        const blur = interpolate(progress, [0, 1], [6, 0]);

        const isAccent = accentLastWord && i === words.length - 1;

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              filter: `blur(${blur}px)`,
              color: isAccent ? accentColor : textColor,
              marginRight: '0.25em',
              textShadow: isAccent ? `0 0 40px ${accentColor}88` : 'none',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
