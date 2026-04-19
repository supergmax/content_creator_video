import { Audio, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import type { SocialHookProps } from './schema';

// Durée d'animation d'un mot (en frames @ 30fps)
// Avec WORD_DELAY plus court, ça crée l'overlap = feel AE lissé
// v3: ralenti légèrement pour laisser respirer le texte
const WORD_ANIM_DURATION = 22;
const WORD_DELAY = 5; // frames entre le démarrage de chaque mot → overlap

// Courbe AE-like : ease-out cubic (démarrage franc, fin très lisse)
// Équivalent approximatif d'un lissage fin ~70% dans After Effects
const EASE_OUT_AE = Easing.bezier(0.25, 0.1, 0.25, 1);

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

  // Progress du mot sur sa durée d'animation, avec easing AE-like
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

  // Propriétés animées depuis progress lissé
  const opacity = progress;
  const scale = interpolate(progress, [0, 1], [1.08, 1]); // pop discret, pas de 1.5
  const y = interpolate(progress, [0, 1], [50, 0]);
  const blur = interpolate(progress, [0, 1], [6, 0]);

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
  audioSrc,
}: SocialHookProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const words = hookText.split(' ');
  const LAST_WORD_START = (words.length - 1) * WORD_DELAY;
  const LAST_WORD_END = LAST_WORD_START + WORD_ANIM_DURATION;

  // Ligne accent horizontale : slide depuis la gauche, easing smooth
  const lineProgress = interpolate(
    frame - Math.round(fps * 0.1),
    [0, 28],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE_OUT_AE,
    },
  );
  const lineWidth = interpolate(lineProgress, [0, 1], [0, width * 0.65]);

  // SubText : apparaît après le dernier mot, ease out smooth
  const subDelay = LAST_WORD_END + Math.round(fps * 0.1);
  const subProgress = interpolate(
    frame - subDelay,
    [0, 20],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE_OUT_AE,
    },
  );
  const subOpacity = subProgress;
  const subY = interpolate(subProgress, [0, 1], [30, 0]);

  // Badge "stellarpulse" en bas — v3: refactor complet
  // Entrée : slide-up depuis le bas + micro-rotation + blur fade + scale subtil
  // Après l'entrée : respiration cosinus très légère sur Y et rotation
  const badgeDelay = LAST_WORD_END + Math.round(fps * 0.6);
  const badgeFrame = frame - badgeDelay;
  const BADGE_ENTER_DURATION = 28;

  // Entrée avec ease out cubic AE-like
  const badgeEnterProgress = interpolate(
    badgeFrame,
    [0, BADGE_ENTER_DURATION],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE_OUT_AE,
    },
  );

  const badgeOpacity = badgeEnterProgress;
  const badgeEnterY = interpolate(badgeEnterProgress, [0, 1], [55, 0]);
  const badgeEnterRot = interpolate(badgeEnterProgress, [0, 1], [-3, 0]);
  const badgeEnterScale = interpolate(badgeEnterProgress, [0, 1], [0.85, 1]);
  const badgeBlur = interpolate(badgeEnterProgress, [0, 1], [10, 0]);

  // Respiration continue (cosine) — commence uniquement après l'entrée
  // v4: ralenti en mode "chill" — périodes plus longues, amplitudes adoucies
  const breathPhase = Math.max(0, badgeFrame - BADGE_ENTER_DURATION);
  const breathY = Math.sin((breathPhase / 120) * Math.PI * 2) * 2; // ±2px, période 4s
  const breathRot = Math.cos((breathPhase / 150) * Math.PI * 2) * 0.5; // ±0.5°, période 5s

  const badgeY = badgeEnterY + breathY;
  const badgeRot = badgeEnterRot + breathRot;
  const badgeScale = badgeEnterScale;

  // Vignette de fond qui respire — plus lisse qu'avant (période plus longue)
  const vignetteOpacity = interpolate(
    Math.sin((frame / 45) * Math.PI * 2),
    [-1, 1],
    [0.35, 0.55],
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
      {/* Audio optionnel */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* Fond gradient animé */}
      <BackgroundGradient
        color1={accentColor}
        color2="#ec4899"
        backgroundColor={backgroundColor}
        animated={true}
      />

      {/* Vignette radiale qui respire doucement */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, ${backgroundColor}cc 100%)`,
          zIndex: 1,
          opacity: vignetteOpacity,
        }}
      />

      {/* Ligne accent horizontale — v4: positionnée entre "Les 5" et "erreurs" (souligne sans barrer) */}
      <div
        style={{
          position: 'absolute',
          left: Math.round(width * 0.175),
          top: Math.round(height * 0.35),
          width: lineWidth,
          height: 5,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}00)`,
          borderRadius: 3,
          zIndex: 2,
          boxShadow: `0 0 20px ${accentColor}66`,
        }}
      />

      {/* Hook text — mot par mot avec overlap */}
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

      {/* Badge accent en bas — v3: slide-up + rotation + blur fade + cosine respiration */}
      <div
        style={{
          position: 'absolute',
          bottom: Math.round(height * 0.08),
          zIndex: 3,
          transform: `translateY(${badgeY}px) rotate(${badgeRot}deg) scale(${badgeScale})`,
          filter: `blur(${badgeBlur}px)`,
          opacity: badgeOpacity,
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
