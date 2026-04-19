import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// STYLE DESIGN STORY V5 — Template inspiré de @odune.fr sur TikTok
//
// V5 architecture (15 avril 2026, refactoring):
//
// SÉPARATION media / captions:
//  - 1 segment = 1 phrase sémantique complète (~2-5 sec) avec son média fixe
//  - Chaque segment contient N captions courtes (2-3 mots) qui changent au-dessus
//    du média pendant la durée du segment
//  - Le média (image/vidéo/bg) reste stable pendant toute la phrase
//  - Les captions changent rapidement au rythme de la voix off (timings word-level Whisper)
//
// Résultat: plus de flash noirs, plus de médias qui pop-despop, plus de phrases
// coupées au milieu. Le feel @odune authentique.
// ═══════════════════════════════════════════════════════════════════

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);

// ─────────────────────────────────────────────────
// CAPTION — un petit bout de texte affiché au-dessus du média
// ─────────────────────────────────────────────────
export const captionSchema = z.object({
  startSec: z.number().min(0).describe('Début caption en secondes (absolu, pas relatif au segment)'),
  endSec: z.number().min(0).describe('Fin caption en secondes'),
  text: z
    .string()
    .describe(
      'Texte court (2-3 mots) affiché. Supporte le markup {{mot}} pour highlight',
    ),
});

// ─────────────────────────────────────────────────
// SEGMENT — une phrase sémantique complète avec son média + captions imbriquées
// ─────────────────────────────────────────────────
export const segmentSchema = z.object({
  startSec: z.number().min(0).describe('Début du segment en secondes'),
  endSec: z.number().min(0).describe('Fin du segment en secondes'),

  // Média stable pour toute la durée du segment
  mediaSrc: z.string().optional().describe('Image ou vidéo, ex: /images/boulangerie.png'),
  mediaType: z.enum(['image', 'video', 'none']).default('none'),

  // Ou fond uni si pas de média
  backgroundColor: hexColor.optional(),

  // Captions imbriquées qui changent au fil du segment
  captions: z
    .array(captionSchema)
    .min(1)
    .describe('Liste des captions courtes affichées au fil du segment'),

  // Cadrage du média: fullscreen (couvre tout l'écran) ou viewfinder (dans le rectangle des lignes)
  mediaFit: z
    .enum(['fullscreen', 'viewfinder'])
    .default('fullscreen')
    .describe('fullscreen = image couvre tout. viewfinder = image cadrée dans le rectangle des lignes blanches'),

  // Style texte
  textColor: hexColor.default('#ffffff'),
  textPosition: z.enum(['center', 'top', 'bottom']).default('center'),

  // Animation du viewfinder pour ce segment
  viewfinderAnim: z
    .enum(['auto', 'static', 'pulse', 'redraw'])
    .default('auto')
    .describe('auto = redraw si le segment a un média, pulse si texte seul'),

  // Composant spécial (remplace le rendu normal du segment)
  specialComponent: z
    .enum(['none', 'geometric-logo', 'grid-chart'])
    .default('none')
    .describe('none = rendu normal. geometric-logo = cercles entrelacés + logo'),

  // Props pour GeometricLogoReveal (si specialComponent = geometric-logo)
  logoText: z.string().optional().describe('Texte du logo (ex: "Airbnb")'),
  logoSrc: z.string().optional().describe('Image du logo (ex: /images/airbnb-logo.png)'),
  logoSubText: z.string().optional().describe('Sous-texte sous le logo'),
  logoAccentColor: z.string().optional().describe('Couleur des cercles/lignes'),
});

export const styleDesignStorySchema = z.object({
  audioSrc: z.string(),
  audioDurationSec: z.number().min(1),
  segments: z.array(segmentSchema).min(1),
  viewfinderColor: hexColor.default('#ffffff'),
  viewfinderOpacity: z.number().min(0).max(1).default(0.85),
  fontFamily: z
    .string()
    .default('"JetBrains Mono", "IBM Plex Mono", "Courier New", monospace'),

  // Musique de fond
  musicSrc: z.string().optional().describe('Chemin vers la musique de fond, ex: /ambiance/track.mp3'),
  musicVolume: z.number().min(0).max(1).default(0.1).describe('Volume musique (0.08-0.15 recommandé pour ne pas couvrir la voix)'),

  // SFX
  sfxOnMediaChange: z.string().optional().describe('SFX joué quand un média change, ex: /sfx/swoosh.wav'),
  sfxOnDarkImpact: z.string().optional().describe('SFX joué sur les segments DARK impact, ex: /sfx/deep_hit.wav'),
  sfxOnHighlight: z.string().optional().describe('SFX joué quand un highlight {{}} apparaît, ex: /sfx/ding.mp3'),
  sfxVolume: z.number().min(0).max(1).default(0.35).describe('Volume des SFX'),
});

export type CaptionProps = z.infer<typeof captionSchema>;
export type SegmentProps = z.infer<typeof segmentSchema>;
export type StyleDesignStoryProps = z.infer<typeof styleDesignStorySchema>;

/**
 * Parse markup {{texte}} en segments: [{ text, highlighted }]
 */
export function parseHighlightMarkup(text: string): Array<{ text: string; highlighted: boolean }> {
  const parts: Array<{ text: string; highlighted: boolean }> = [];
  const regex = /\{\{([^}]+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlighted: false });
    }
    parts.push({ text: match[1], highlighted: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlighted: false });
  }
  return parts;
}

export function isVideoPath(src: string): boolean {
  return /\.(mp4|webm|mov|avi|mkv)$/i.test(src);
}
