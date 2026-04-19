import { Easing, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { WordReveal } from '../shared/WordReveal';
import type { ProblemSceneProps } from '../schema';

const EASE_OUT_AE = Easing.bezier(0.25, 0.1, 0.25, 1);

/**
 * ProblemScene V2 — palette sombre unifiée + BG stylé sans images.
 *
 * Corrections V1→V2:
 * - Fond sombre (cohérence avec Hook et Reveal)
 * - BG cinématique: orb ambient qui respire, grain, grille subtile, rays
 *   plus nuancés (pas un flat rays sur gris f5f5f5 pourri)
 * - Icône animée avec léger slide + respiration après entrée
 */
export const ProblemScene = ({
  problemText,
  iconEmoji,
  iconSrc,
  accentColor,
  backgroundColor,
  textColor,
  durationInSeconds,
}: ProblemSceneProps) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Fade in/out
  const sceneFadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
    easing: EASE_OUT_AE,
  });
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

  // Texte reveal
  const words = problemText.split(' ');
  const textAnimEndFrame = words.length * 5 + 22;
  const iconDelayFrames = textAnimEndFrame + 6;

  // Icône : entrée cinématique
  const iconProgress = interpolate(
    frame - iconDelayFrames,
    [0, 32],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE_OUT_AE,
    },
  );
  const iconOpacity = iconProgress;
  const iconScale = interpolate(iconProgress, [0, 1], [0.3, 1]);
  const iconRotate = interpolate(iconProgress, [0, 1], [-10, 0]);
  const iconY = interpolate(iconProgress, [0, 1], [50, 0]);
  const iconBlur = interpolate(iconProgress, [0, 1], [14, 0]);

  // Respiration continue après entrée
  const iconBreathPhase = Math.max(0, frame - iconDelayFrames - 32);
  const iconBreathY = Math.sin((iconBreathPhase / 110) * Math.PI * 2) * 3;
  const iconBreathRot = Math.cos((iconBreathPhase / 140) * Math.PI * 2) * 1.2;

  // Orb ambient qui respire en fond
  const orbBreath = interpolate(
    Math.sin((frame / 80) * Math.PI * 2),
    [-1, 1],
    [0.5, 0.85],
  );
  const orbScale = interpolate(
    Math.cos((frame / 120) * Math.PI * 2),
    [-1, 1],
    [0.9, 1.05],
  );

  const textFontSize = Math.round(width / 9);
  const iconSize = Math.round(width * 0.45);

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
      {/* ═══════════════════════════════════════ */}
      {/* BACKGROUND LAYERS (cinématique stylé)   */}
      {/* ═══════════════════════════════════════ */}

      {/* Layer 1 — gradient radial profond */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 55%, ${accentColor}18 0%, transparent 65%)`,
        }}
      />

      {/* Layer 2 — orb ambient qui respire au centre */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: width * 1.1,
          height: width * 1.1,
          transform: `translate(-50%, -40%) scale(${orbScale})`,
          background: `radial-gradient(circle, ${accentColor}22 0%, ${accentColor}08 35%, transparent 70%)`,
          opacity: orbBreath,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 3 — grille subtile masquée au centre */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse 70% 50% at 50% 55%, transparent 20%, black 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 55%, transparent 20%, black 80%)',
        }}
      />

      {/* Layer 4 — sunburst rays depuis le centre, très subtil */}
      <svg
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: width * 2.2,
          height: width * 2.2,
          opacity: 0.06,
          pointerEvents: 'none',
        }}
        viewBox="-100 -100 200 200"
      >
        {Array.from({ length: 48 }).map((_, i) => {
          const angle = (i / 48) * 360;
          return (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={0}
              y2={-95}
              stroke={accentColor}
              strokeWidth={i % 3 === 0 ? 1.6 : 0.6}
              transform={`rotate(${angle})`}
            />
          );
        })}
      </svg>

      {/* Layer 5 — grain texture cinéma */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.05,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 6 — vignette périphérique */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 90% 70% at 50% 50%, transparent 40%, ${backgroundColor}ee 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* ═══════════════════════════════════════ */}
      {/* CONTENT                                 */}
      {/* ═══════════════════════════════════════ */}

      {/* Texte problème en haut */}
      <div
        style={{
          position: 'absolute',
          top: Math.round(height * 0.13),
          left: 0,
          right: 0,
          padding: `0 ${Math.round(width * 0.1)}px`,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 5,
        }}
      >
        <WordReveal
          text={problemText}
          accentColor={accentColor}
          textColor={textColor}
          fontSize={textFontSize}
          accentLastWord={false}
        />
      </div>

      {/* Icône centrée */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${iconY + iconBreathY}px) scale(${iconScale}) rotate(${iconRotate + iconBreathRot}deg)`,
          opacity: iconOpacity,
          filter: `blur(${iconBlur}px) drop-shadow(0 10px 40px ${accentColor}66)`,
          zIndex: 6,
        }}
      >
        {iconSrc ? (
          <Img
            src={iconSrc}
            style={{
              width: iconSize,
              height: iconSize,
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              fontSize: iconSize * 0.8,
              lineHeight: 1,
              textAlign: 'center',
              filter: `drop-shadow(0 0 30px ${accentColor}aa)`,
            }}
          >
            {iconEmoji ?? '⏰'}
          </div>
        )}
      </div>
    </div>
  );
};
