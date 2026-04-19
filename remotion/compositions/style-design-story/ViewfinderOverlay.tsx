import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * ViewfinderOverlay V2 — signature graphique @odune.fr
 *
 * V2 changes (15 avril 2026):
 * - Inset X passé de 5.2% à 9% (lignes verticales rapprochées du centre)
 * - Inset Y passé de 11.5% à 15% (lignes horizontales rapprochées)
 * - Nouvelle prop `segmentAnims`: par segment, type d'animation (redraw/pulse/static)
 * - Redraw = les lignes se redessinent complètement au début du segment
 * - Pulse = juste les "+" et "⊕" pulsent aux transitions
 */

type SegmentAnim = {
  startFrame: number;
  anim: 'redraw' | 'pulse' | 'static';
};

type Props = {
  color: string;
  opacity: number;
  segmentAnims: SegmentAnim[];
};

const EASE_OUT_AE = Easing.bezier(0.25, 0.1, 0.25, 1);
const REDRAW_DURATION = 16; // frames pour le redraw d'un segment
const PULSE_DURATION = 12;

export const ViewfinderOverlay = ({
  color,
  opacity: baseOpacity,
  segmentAnims,
}: Props) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // ─────────────────────────────────────────────────
  // Dimensions du viewfinder — V2: rapproché du centre
  // ─────────────────────────────────────────────────
  const insetX = width * 0.09; // 9% au lieu de 5.2%
  const insetY = height * 0.15; // 15% au lieu de 11.5%
  const innerLeft = insetX;
  const innerRight = width - insetX;
  const innerTop = insetY;
  const innerBottom = height - insetY;

  const reticleY = (innerTop + innerBottom) / 2;

  // ─────────────────────────────────────────────────
  // Calcul du progress de "draw" global
  // Au démarrage total: 0 → 18 frames (draw-in initial)
  // À chaque segment avec 'redraw': les lignes se redessinent sur 16 frames
  // ─────────────────────────────────────────────────
  let drawProgress = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT_AE,
  });

  // Trouve le redraw le plus récent (s'il y en a un)
  let pulseScale = 1;
  for (const seg of segmentAnims) {
    const delta = frame - seg.startFrame;
    if (delta < 0) continue;

    if (seg.anim === 'redraw' && delta < REDRAW_DURATION) {
      // Le redraw commence à 0 et monte à 1 sur REDRAW_DURATION
      drawProgress = interpolate(delta, [0, REDRAW_DURATION], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: EASE_OUT_AE,
      });
    } else if (seg.anim === 'pulse' && delta < PULSE_DURATION) {
      // Pulsation courte sur les "+" et "⊕"
      const phase = delta / PULSE_DURATION;
      pulseScale = 1 + Math.sin(phase * Math.PI) * 0.28;
    }
  }

  // Breath global subtil
  const breath = interpolate(
    Math.sin((frame / 90) * Math.PI * 2),
    [-1, 1],
    [0.82, 1],
  );
  const globalOpacity = baseOpacity * drawProgress * breath;

  const strokeWidth = 1.8;
  const plusSize = 20;
  const reticleOuterR = 12;
  const reticleInnerR = 4;

  // Offsets pour le draw-in des lignes longues
  const vLineDashOffset = interpolate(drawProgress, [0, 1], [height, 0]);
  const hLineDashOffset = interpolate(drawProgress, [0, 1], [width, 0]);

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        inset: 0,
        opacity: globalOpacity,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Lignes verticales longues qui dépassent le cadre intérieur */}
      <line
        x1={innerLeft}
        y1={0}
        x2={innerLeft}
        y2={height}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={height}
        strokeDashoffset={vLineDashOffset}
      />
      <line
        x1={innerRight}
        y1={0}
        x2={innerRight}
        y2={height}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={height}
        strokeDashoffset={vLineDashOffset}
      />

      {/* Lignes horizontales longues */}
      <line
        x1={0}
        y1={innerTop}
        x2={width}
        y2={innerTop}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={width}
        strokeDashoffset={hLineDashOffset}
      />
      <line
        x1={0}
        y1={innerBottom}
        x2={width}
        y2={innerBottom}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={width}
        strokeDashoffset={hLineDashOffset}
      />

      {/* 4 markers "+" aux coins intérieurs */}
      {[
        { cx: innerLeft + 26, cy: innerTop + 26 },
        { cx: innerRight - 26, cy: innerTop + 26 },
        { cx: innerLeft + 26, cy: innerBottom - 26 },
        { cx: innerRight - 26, cy: innerBottom - 26 },
      ].map((pos, i) => (
        <g
          key={`plus-${i}`}
          transform={`translate(${pos.cx}, ${pos.cy}) scale(${pulseScale})`}
          opacity={drawProgress}
        >
          <line
            x1={-plusSize / 2}
            y1={0}
            x2={plusSize / 2}
            y2={0}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <line
            x1={0}
            y1={-plusSize / 2}
            x2={0}
            y2={plusSize / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* 2 reticles "⊕" aux milieux gauche/droite */}
      {[
        { cx: innerLeft, cy: reticleY },
        { cx: innerRight, cy: reticleY },
      ].map((pos, i) => (
        <g
          key={`reticle-${i}`}
          transform={`translate(${pos.cx}, ${pos.cy}) scale(${pulseScale})`}
          opacity={drawProgress}
        >
          <circle
            cx={0}
            cy={0}
            r={reticleOuterR}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <circle cx={0} cy={0} r={reticleInnerR} fill={color} />
          <line
            x1={-reticleOuterR - 5}
            y1={0}
            x2={-reticleOuterR - 1}
            y2={0}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <line
            x1={reticleOuterR + 1}
            y1={0}
            x2={reticleOuterR + 5}
            y2={0}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <line
            x1={0}
            y1={-reticleOuterR - 5}
            x2={0}
            y2={-reticleOuterR - 1}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <line
            x1={0}
            y1={reticleOuterR + 1}
            x2={0}
            y2={reticleOuterR + 5}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </g>
      ))}
    </svg>
  );
};
