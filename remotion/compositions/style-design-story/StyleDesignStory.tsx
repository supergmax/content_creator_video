import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import { SegmentRenderer } from './SegmentRenderer';
import { ViewfinderOverlay } from './ViewfinderOverlay';
import type { StyleDesignStoryProps } from './schema';

/**
 * StyleDesignStory V2
 *
 * V2 changes:
 * - Logique auto pour viewfinderAnim: redraw sur segments avec mediaSrc, pulse sinon
 * - segmentAnims passés à ViewfinderOverlay pour animations par segment
 */
export const StyleDesignStory = ({
  audioSrc,
  segments,
  viewfinderColor,
  viewfinderOpacity,
  fontFamily,
  musicSrc,
  musicVolume = 0.1,
  sfxOnMediaChange,
  sfxOnDarkImpact,
  sfxOnHighlight,
  sfxVolume = 0.35,
}: StyleDesignStoryProps) => {
  const { fps } = useVideoConfig();

  // V6: chaque segment s'étend jusqu'au DÉBUT du suivant (pas un avant).
  // Ça élimine les gaps temporels qui causaient des flashs noirs.
  // Le dernier segment s'étend jusqu'à la fin de l'audio.
  const totalDurationFrames = Math.round(
    (segments[segments.length - 1]?.endSec ?? 30) * fps,
  );
  const segmentFrames = segments.map((seg, i) => {
    const startFrame = Math.round(seg.startSec * fps);
    const nextStartFrame =
      i + 1 < segments.length
        ? Math.round(segments[i + 1].startSec * fps)
        : totalDurationFrames + 30; // le dernier segment s'étend au-delà
    const endFrame = nextStartFrame; // jusqu'AU DÉBUT du segment suivant (pas moins 1)
    const durationInFrames = Math.max(1, endFrame - startFrame);
    return { startFrame, endFrame, durationInFrames };
  });

  // V7: Règles viewfinder affinées
  // - REDRAW: uniquement quand un média apparaît après un segment SANS média
  //   (premier média de la scène, ou reprise après des segments bg)
  // - PULSE: quand un média change d'un segment à l'autre (swap), ou sur DARK impact
  // - STATIC: même média que précédent, ou bg consécutifs
  const segmentAnims = segments.map((seg, i) => {
    let anim: 'redraw' | 'pulse' | 'static';

    if (seg.viewfinderAnim === 'auto') {
      const prev = i > 0 ? segments[i - 1] : null;
      const prevHadMedia = !!prev?.mediaSrc;
      const currHasMedia = !!seg.mediaSrc;

      if (currHasMedia && !prevHadMedia) {
        // Un média apparaît après absence de média → REDRAW (entrée marquée)
        anim = 'redraw';
      } else if (currHasMedia && prevHadMedia && seg.mediaSrc !== prev?.mediaSrc) {
        // Swap entre 2 médias différents → PULSE (plus subtil)
        anim = 'pulse';
      } else if (!currHasMedia && seg.backgroundColor === '#000000') {
        // DARK impact → PULSE
        anim = 'pulse';
      } else {
        // Même média OU bg consécutif → STATIC (rien)
        anim = 'static';
      }
    } else {
      anim = seg.viewfinderAnim;
    }

    return {
      startFrame: segmentFrames[i].startFrame,
      anim,
    };
  });

  return (
    <AbsoluteFill style={{ background: '#000000' }}>
      {/* Audio voix off */}
      <Audio src={audioSrc.startsWith('/') ? staticFile(audioSrc.slice(1)) : audioSrc} />

      {/* Musique de fond (volume bas pour ne pas couvrir la voix) */}
      {musicSrc && (
        <Audio
          src={musicSrc.startsWith('/') ? staticFile(musicSrc.slice(1)) : musicSrc}
          volume={musicVolume}
          loop
        />
      )}

      {/* SFX: satisfaisant (redraw, max 3) + swoosh (pulse) + deep hit (dark) */}
      {(() => {
        const allSfx: Array<{ src: string; frame: number; vol: number }> = [];
        let satisfyingCount = 0;

        segments.forEach((seg, i) => {
          const { startFrame } = segmentFrames[i];
          const anim = segmentAnims[i].anim;
          const isDark = seg.backgroundColor === '#000000';

          if (isDark && sfxOnDarkImpact) {
            allSfx.push({ src: sfxOnDarkImpact, frame: startFrame, vol: sfxVolume * 0.8 });
          } else if (anim === 'redraw' && sfxOnMediaChange && satisfyingCount < 3) {
            allSfx.push({ src: sfxOnMediaChange, frame: startFrame, vol: sfxVolume });
            satisfyingCount++;
          } else if ((anim === 'pulse' || anim === 'redraw') && sfxOnHighlight) {
            allSfx.push({ src: sfxOnHighlight, frame: startFrame, vol: sfxVolume * 0.5 });
          }
        });

        return allSfx.map((sfx, j) => (
          <Sequence key={`sfx-${j}`} from={sfx.frame} durationInFrames={150}>
            <Audio
              src={sfx.src.startsWith('/') ? staticFile(sfx.src.slice(1)) : sfx.src}
              volume={sfx.vol}
            />
          </Sequence>
        ));
      })()}

      {/* Segments séquentiels — chaque segment a son média stable + captions imbriquées */}
      {segments.map((segment, i) => {
        const { startFrame, durationInFrames } = segmentFrames[i];
        return (
          <Sequence
            key={`seg-${i}`}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <SegmentRenderer
              segment={segment}
              segmentStartFrame={startFrame}
              fontFamily={fontFamily}
            />
          </Sequence>
        );
      })}

      {/* Viewfinder overlay avec animations par segment */}
      <ViewfinderOverlay
        color={viewfinderColor}
        opacity={viewfinderOpacity}
        segmentAnims={segmentAnims}
      />
    </AbsoluteFill>
  );
};
