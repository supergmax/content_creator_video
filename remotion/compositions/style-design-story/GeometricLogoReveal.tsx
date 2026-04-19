import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * GeometricLogoReveal — Animation d'introduction de logo style @odune.fr
 *
 * Reproduit l'effet observé dans les vidéos de référence:
 * - Fond noir
 * - Cercles entrelacés qui se dessinent progressivement (style construction géométrique)
 * - Carré central avec 4 "+" aux coins
 * - Logo (texte ou image) qui apparaît au centre
 * - Sous-texte optionnel en dessous
 *
 * Utilisation: comme segment spécial dans StyleDesignStory
 */

type Props = {
  logoText?: string;
  logoSrc?: string;
  subText?: string;
  accentColor?: string;
  circleCount?: number;
  drawDurationFrames?: number;
};

const EASE_OUT = Easing.bezier(0.25, 0.1, 0.25, 1);

export const GeometricLogoReveal = ({
  logoText,
  logoSrc,
  subText,
  accentColor = '#ffffff',
  circleCount = 3,
  drawDurationFrames = 45,
}: Props) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const cx = width / 2;
  const cy = height / 2;

  // ─────────────────────────────────────────────────
  // ANIMATION PHASES
  // Phase 1 (0 → drawDuration): circles draw in
  // Phase 2 (drawDuration → drawDuration+15): square appears
  // Phase 3 (drawDuration+15 → drawDuration+30): logo fades in
  // Phase 4 (drawDuration+30 → ...): subtext + breathing
  // ─────────────────────────────────────────────────

  const circleProgress = interpolate(
    frame,
    [0, drawDurationFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT },
  );

  const squareDelay = drawDurationFrames - 10;
  const squareProgress = interpolate(
    frame - squareDelay,
    [0, 18],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT },
  );

  const logoDelay = drawDurationFrames + 5;
  const logoProgress = interpolate(
    frame - logoDelay,
    [0, 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT },
  );

  const subDelay = logoDelay + 15;
  const subProgress = interpolate(
    frame - subDelay,
    [0, 18],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT },
  );

  // Circle breathing after draw-in (subtle scale oscillation)
  const breathPhase = Math.max(0, frame - drawDurationFrames);
  const breathScale = 1 + Math.sin((breathPhase / 90) * Math.PI * 2) * 0.008;

  // ─────────────────────────────────────────────────
  // CIRCLE LAYOUT — overlapping circles around center
  // ─────────────────────────────────────────────────
  const mainRadius = Math.min(width, height) * 0.32;
  const circleOffset = mainRadius * 0.45;

  const circles = Array.from({ length: circleCount }).map((_, i) => {
    const angle = (i / circleCount) * Math.PI * 2 - Math.PI / 2;
    return {
      cx: cx + Math.cos(angle) * circleOffset,
      cy: cy + Math.sin(angle) * circleOffset * 0.85,
      r: mainRadius,
    };
  });

  // Each circle's stroke-dasharray animation (staggered)
  const circumference = 2 * Math.PI * mainRadius;

  // ─────────────────────────────────────────────────
  // SQUARE — centered, with 4 "+" markers at corners
  // ─────────────────────────────────────────────────
  const squareSize = mainRadius * 0.75;
  const squareLeft = cx - squareSize / 2;
  const squareTop = cy - squareSize / 2;
  const plusSize = 14;

  const squareCorners = [
    { x: squareLeft, y: squareTop },
    { x: squareLeft + squareSize, y: squareTop },
    { x: squareLeft, y: squareTop + squareSize },
    { x: squareLeft + squareSize, y: squareTop + squareSize },
  ];

  // Logo font size
  const logoFontSize = logoSrc ? 0 : Math.round(width / 14);
  const subFontSize = Math.round(width / 28);

  // Resolved logo image
  const resolvedLogoSrc = logoSrc
    ? logoSrc.startsWith('/')
      ? staticFile(logoSrc.slice(1))
      : logoSrc
    : null;

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ═══════════════════════════════════════ */}
      {/* SVG: Circles + Square + Plus markers     */}
      {/* ═══════════════════════════════════════ */}
      <svg
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${breathScale})`,
        }}
      >
        {/* Circles — draw-in with staggered timing */}
        {circles.map((circle, i) => {
          const stagger = i * (drawDurationFrames / circleCount / 2);
          const individualProgress = interpolate(
            frame - stagger,
            [0, drawDurationFrames - stagger],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT },
          );
          const dashOffset = circumference * (1 - individualProgress);

          return (
            <circle
              key={`circle-${i}`}
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              fill="none"
              stroke={accentColor}
              strokeWidth={1.5}
              opacity={0.7}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          );
        })}

        {/* Carré et "+" retirés (feedback Sekiné: "casse le côté arc") */}
      </svg>

      {/* ═══════════════════════════════════════ */}
      {/* LOGO — text or image, centered             */}
      {/* ═══════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          opacity: logoProgress,
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.85, 1])})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {resolvedLogoSrc ? (
          <Img
            src={resolvedLogoSrc}
            style={{
              maxWidth: squareSize * 0.7,
              maxHeight: squareSize * 0.4,
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              fontFamily: '"Inter", system-ui, sans-serif',
              fontWeight: 900,
              fontSize: logoFontSize,
              color: accentColor,
              letterSpacing: '-0.02em',
              textShadow: `0 0 40px ${accentColor}44`,
            }}
          >
            {logoText ?? 'LOGO'}
          </div>
        )}

        {/* Sub text */}
        {subText && (
          <div
            style={{
              opacity: subProgress,
              transform: `translateY(${interpolate(subProgress, [0, 1], [15, 0])}px)`,
              fontFamily: '"JetBrains Mono", "IBM Plex Mono", monospace',
              fontSize: subFontSize,
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 400,
              letterSpacing: '0.02em',
            }}
          >
            {subText}
          </div>
        )}
      </div>
    </div>
  );
};
