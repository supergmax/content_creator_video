import { Easing, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { RevealSceneProps, SectionProps } from '../schema';

const EASE_OUT_AE = Easing.bezier(0.25, 0.1, 0.25, 1);
const EASE_IN_OUT_AE = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * RevealScene V2 — le "money shot" de Sekiné.
 *
 * Corrections V1→V2 (feedback Sekiné 14 avril 2026):
 * 1. La CAMÉRA tourne autour du paper (pas le paper qui pivote sur place)
 *    → wrapper scene-camera avec rotateX propre qui bouge en sens inverse
 *    → perspective-origin qui se déplace pendant l'intro
 *    → le paper garde une rotation finale de ~6° (angle caméra conservé)
 * 2. Sections ralenties cinématiques, étalées pendant + après l'intro caméra
 *    → enterDelayFrames redistribués (commencent pendant l'intro)
 *    → durée d'anim par section 20→30 frames
 * 3. Palette sombre unifiée (reste sur #0a1230 dark blue)
 */
export const RevealScene = ({
  siteName,
  tagline,
  sections,
  backgroundColor,
  paperColor,
  cameraIntroDurationFrames,
  durationInSeconds,
}: RevealSceneProps) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Global fade in/out de la scène
  const sceneFadeIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: 'clamp',
    easing: EASE_OUT_AE,
  });
  const totalFrames = durationInSeconds * fps;
  const sceneFadeOut = interpolate(
    frame,
    [totalFrames - 22, totalFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE_OUT_AE,
    },
  );
  const globalOpacity = Math.min(sceneFadeIn, sceneFadeOut);

  // ─────────────────────────────────────────────────
  // INTRO CAMÉRA — simule la caméra qui tourne autour
  // ─────────────────────────────────────────────────
  // Le paper commence en perspective très inclinée, la caméra est "au-dessus"
  // À la fin, le paper est quasi-plat et la caméra est "en face" avec un léger angle
  //
  // Technique:
  // - Paper rotateX: 62° → 6° (garde un angle final au lieu de 0°)
  // - Paper rotateZ: -8° → 0° (redressement latéral)
  // - Paper translateY: 150 → 0 (monte dans le cadre)
  // - Paper scale: 0.85 → 1
  // - Scene wrapper rotateX: -12° → 0° (la caméra descend)
  // - Perspective-origin Y: 15% → 50% (la caméra se repositionne)
  //
  const cameraProgress = interpolate(
    frame,
    [0, cameraIntroDurationFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE_IN_OUT_AE,
    },
  );

  // Le paper
  const paperRotateX = interpolate(cameraProgress, [0, 1], [62, 6]);
  const paperRotateZ = interpolate(cameraProgress, [0, 1], [-8, 0]);
  const paperTranslateY = interpolate(cameraProgress, [0, 1], [150, 0]);
  const paperScale = interpolate(cameraProgress, [0, 1], [0.85, 1]);

  // Le wrapper "caméra" (rotation en sens inverse pour illusion de mouvement caméra)
  const cameraRotateX = interpolate(cameraProgress, [0, 1], [-12, 0]);
  const perspectiveOriginY = interpolate(cameraProgress, [0, 1], [15, 50]);

  // Ombre portée du paper qui apparaît au sol
  const paperShadowOpacity = interpolate(cameraProgress, [0.25, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Respiration continue du wrapper caméra APRÈS l'intro — mouvement subtil
  // pour garder la scène "vivante" et pas statique
  const postIntroFrame = Math.max(0, frame - cameraIntroDurationFrames);
  const cameraBreathX = Math.sin((postIntroFrame / 110) * Math.PI * 2) * 0.8;
  const cameraBreathY = Math.cos((postIntroFrame / 130) * Math.PI * 2) * 0.6;

  // ─────────────────────────────────────────────────
  // PAPER DIMENSIONS
  // ─────────────────────────────────────────────────
  const paperWidth = Math.round(width * 0.82);
  const paperHeight = Math.round(paperWidth * 1.25);

  // Titre du site — arrive en même temps que le début de l'intro caméra
  const titleProgress = interpolate(
    frame,
    [8, 34],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE_OUT_AE,
    },
  );
  const titleOpacity = titleProgress;
  const titleY = interpolate(titleProgress, [0, 1], [25, 0]);

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: backgroundColor,
        opacity: globalOpacity,
        perspective: '1600px',
        perspectiveOrigin: `50% ${perspectiveOriginY}%`,
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 90% 70% at 50% 50%, #ffffff08 0%, transparent 65%)`,
        }}
      />

      {/* Grille de fond cinématique subtile */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 80%)',
        }}
      />

      {/* Titre du site en haut */}
      <div
        style={{
          position: 'absolute',
          top: Math.round(height * 0.08),
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: '"Inter", system-ui, sans-serif',
            fontWeight: 900,
            fontSize: Math.round(width / 11),
            color: '#ffffff',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            textShadow: '0 4px 30px rgba(0,0,0,0.6), 0 0 80px rgba(255,255,255,0.08)',
          }}
        >
          {siteName}
        </div>
        {tagline && (
          <div
            style={{
              marginTop: 8,
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: Math.round(width / 28),
              color: 'rgba(255,255,255,0.55)',
              fontWeight: 400,
              letterSpacing: '0.04em',
            }}
          >
            {tagline}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SCENE CAMERA WRAPPER — simule la caméra qui tourne autour du paper */}
      {/* ═══════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${cameraRotateX + cameraBreathY}deg) rotateY(${cameraBreathX}deg)`,
          transformOrigin: '50% 60%',
        }}
      >
        {/* ═══════════════════════════════════════ */}
        {/* PAPER CONTAINER */}
        {/* ═══════════════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: paperWidth,
            height: paperHeight,
            transformStyle: 'preserve-3d',
            transform: `
              translate(-50%, -50%)
              translateY(${paperTranslateY}px)
              rotateZ(${paperRotateZ}deg)
              rotateX(${paperRotateX}deg)
              scale(${paperScale})
            `,
            transformOrigin: '50% 50%',
          }}
        >
          {/* Paper itself (plan blanc) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: paperColor,
              boxShadow: `
                0 ${50 * paperShadowOpacity}px ${100 * paperShadowOpacity}px rgba(0,0,0,${0.5 * paperShadowOpacity}),
                0 ${15 * paperShadowOpacity}px ${30 * paperShadowOpacity}px rgba(0,0,0,${0.35 * paperShadowOpacity})
              `,
              borderRadius: 2,
            }}
          />

          {/* Sections orchestrées */}
          {sections.map((section) => (
            <SectionLayer
              key={section.id}
              section={section}
              paperWidth={paperWidth}
              paperHeight={paperHeight}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SECTION LAYER V2 — animation plus longue + entrées cinématiques
// ═══════════════════════════════════════════════════════════════════

type SectionLayerProps = {
  section: SectionProps;
  paperWidth: number;
  paperHeight: number;
};

const SectionLayer = ({ section, paperWidth, paperHeight }: SectionLayerProps) => {
  const frame = useCurrentFrame();

  // V2: les sections arrivent dès le début de la scène (pas après l'intro caméra)
  // pour composer le site EN MÊME TEMPS que la caméra se pose
  // enterDelayFrames est maintenant interprété comme "frames depuis le début de la scène"
  const startFrame = section.enterDelayFrames;

  // V2: anim plus longue, 30 frames au lieu de 20
  const progress = interpolate(
    frame - startFrame,
    [0, 30],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE_OUT_AE,
    },
  );

  let translateX = 0;
  let translateY = 0;
  let scale = 1;
  const opacity = progress;

  switch (section.enterAnim) {
    case 'slide-up':
      translateY = interpolate(progress, [0, 1], [40, 0]);
      break;
    case 'slide-down':
      translateY = interpolate(progress, [0, 1], [-40, 0]);
      break;
    case 'slide-left':
      translateX = interpolate(progress, [0, 1], [45, 0]);
      break;
    case 'slide-right':
      translateX = interpolate(progress, [0, 1], [-45, 0]);
      break;
    case 'fade':
      break;
    case 'scale':
      scale = interpolate(progress, [0, 1], [0.82, 1]);
      break;
    case 'drop':
      translateY = interpolate(progress, [0, 1], [-80, 0]);
      scale = interpolate(progress, [0, 1], [0.9, 1]);
      break;
  }

  const top = (section.top / 100) * paperHeight;
  const left = (section.left / 100) * paperWidth;
  const width = (section.width / 100) * paperWidth;
  const height = (section.height / 100) * paperHeight;

  const defaultBgColor =
    section.bgColor ??
    (section.type === 'nav'
      ? '#0a0a0f'
      : section.type === 'button'
        ? '#00d4ff'
        : 'transparent');
  const defaultTextColor =
    section.textColor ??
    (section.type === 'nav' || section.type === 'button' ? '#ffffff' : '#0a0a0f');
  const defaultFontSize =
    section.fontSize ??
    (section.type === 'title' ? 38 : section.type === 'nav' ? 14 : 16);

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        background: defaultBgColor,
        color: defaultTextColor,
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: defaultFontSize,
        fontWeight: section.type === 'title' ? 900 : section.type === 'nav' ? 600 : 400,
        letterSpacing:
          section.type === 'title'
            ? '-0.02em'
            : section.type === 'nav'
              ? '0.08em'
              : 'normal',
        textTransform: section.type === 'nav' ? 'uppercase' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: section.type === 'nav' ? 'space-around' : 'flex-start',
        padding: section.type === 'hero' || section.type === 'card' ? 0 : 14,
        overflow: 'hidden',
        opacity,
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        boxShadow:
          section.type === 'card'
            ? '0 6px 24px rgba(0,0,0,0.18)'
            : 'none',
        borderRadius: section.type === 'button' ? 8 : section.type === 'card' ? 4 : 0,
      }}
    >
      {section.src ? (
        <Img
          src={section.src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <span>{section.text ?? ''}</span>
      )}
    </div>
  );
};
