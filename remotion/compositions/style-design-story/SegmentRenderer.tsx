import { Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadArchivoBlack } from '@remotion/google-fonts/ArchivoBlack';
import { GeometricLogoReveal } from './GeometricLogoReveal';
import { parseHighlightMarkup, isVideoPath } from './schema';
import type { SegmentProps } from './schema';

// Font pour les highlights {{...}}
const { fontFamily: archivoBlackFamily } = loadArchivoBlack();

type Props = {
  segment: SegmentProps;
  segmentStartFrame: number; // frame de début du segment (absolu)
  fontFamily: string;
};

/**
 * SegmentRenderer V5
 *
 * Architecture V5:
 * - Background MÉDIA (image/vidéo/couleur) stable pendant toute la durée du segment
 * - Captions qui changent au-dessus au rythme de la voix off
 * - Détection de la caption active via useCurrentFrame (frame absolue) comparée aux
 *   timings absolus des captions (qui sont en secondes depuis le début de la vidéo)
 */
export const SegmentRenderer = ({ segment, segmentStartFrame, fontFamily }: Props) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // La frame absolue dans la vidéo entière = frame relative au segment + segmentStartFrame
  // Mais useCurrentFrame dans une <Sequence> retourne déjà la frame relative au from
  // Donc pour avoir la frame absolue, on ajoute segmentStartFrame
  const absoluteFrame = frame + segmentStartFrame;
  const absoluteTimeSec = absoluteFrame / fps;

  // Trouver la caption active à ce moment
  const activeCaption = segment.captions.find(
    (c) => absoluteTimeSec >= c.startSec && absoluteTimeSec < c.endSec,
  );

  const baseFontSize = Math.round(width / 19);
  const highlightFontSize = Math.round(baseFontSize * 1.35);

  const textTop =
    segment.textPosition === 'top'
      ? '22%'
      : segment.textPosition === 'bottom'
        ? '78%'
        : '50%';

  // Special component rendering — replaces normal segment entirely
  if (segment.specialComponent === 'geometric-logo') {
    return (
      <GeometricLogoReveal
        logoText={segment.logoText}
        logoSrc={segment.logoSrc}
        subText={segment.logoSubText}
        accentColor={segment.logoAccentColor ?? '#ffffff'}
      />
    );
  }

  // Résolution du chemin média via staticFile
  const resolvedSrc = segment.mediaSrc
    ? segment.mediaSrc.startsWith('/')
      ? staticFile(segment.mediaSrc.slice(1))
      : segment.mediaSrc
    : null;

  const isVideo =
    segment.mediaType === 'video' ||
    (segment.mediaType !== 'image' && segment.mediaSrc && isVideoPath(segment.mediaSrc));

  // Parse le texte de la caption active (avec markup {{...}})
  const textParts = activeCaption ? parseHighlightMarkup(activeCaption.text) : [];

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: segment.backgroundColor ?? '#000000',
      }}
    >
      {/* ═══════════════════════════════════════ */}
      {/* Background média — STABLE sur toute la durée du segment */}
      {/* ═══════════════════════════════════════ */}
      {resolvedSrc && (() => {
        const inViewfinder = segment.mediaFit === 'viewfinder';
        const mediaStyle: React.CSSProperties = inViewfinder
          ? {
              position: 'absolute',
              left: '9%',
              right: '9%',
              top: '15%',
              bottom: '15%',
              width: '82%',
              height: '70%',
              objectFit: 'cover',
              borderRadius: 2,
            }
          : {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            };

        return (
          <>
            {isVideo ? (
              <OffthreadVideo src={resolvedSrc} muted style={mediaStyle} />
            ) : (
              <Img src={resolvedSrc} style={mediaStyle} />
            )}
            <div
              style={{
                position: 'absolute',
                ...(inViewfinder
                  ? { left: '9%', right: '9%', top: '15%', bottom: '15%', borderRadius: 2 }
                  : { inset: 0 }),
                background: inViewfinder
                  ? 'rgba(0,0,0,0.2)'
                  : 'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.58) 50%, rgba(0,0,0,0.38) 100%)',
              }}
            />
          </>
        );
      })()}

      {/* ═══════════════════════════════════════ */}
      {/* Caption active — change au fil du temps   */}
      {/* ═══════════════════════════════════════ */}
      {activeCaption && (
        <div
          style={{
            position: 'absolute',
            top: textTop,
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            textAlign: 'center',
            padding: `0 ${Math.round(width * 0.12)}px`,
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontFamily,
              color: segment.textColor,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
              textShadow: '0 3px 18px rgba(0,0,0,0.82), 0 1px 4px rgba(0,0,0,0.95)',
              display: 'inline-flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'baseline',
              gap: '0.2em',
              maxWidth: '100%',
            }}
          >
            {textParts.map((part, i) => (
              <span
                key={i}
                style={{
                  fontSize: part.highlighted ? highlightFontSize : baseFontSize,
                  fontWeight: part.highlighted ? 900 : 500,
                  fontFamily: part.highlighted ? archivoBlackFamily : fontFamily,
                  letterSpacing: part.highlighted ? '-0.02em' : '-0.01em',
                  lineHeight: 1,
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                }}
              >
                {part.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
