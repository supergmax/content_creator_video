import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// SHARED PIECES
// ═══════════════════════════════════════════════════════════════════

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);

// ═══════════════════════════════════════════════════════════════════
// HOOK SCENE — premier plan d'accroche, style SocialHook V4
// ═══════════════════════════════════════════════════════════════════

export const hookSceneSchema = z.object({
  type: z.literal('hook'),
  hookText: z.string().describe('Titre principal, animé mot par mot. Le dernier mot est en accent.'),
  subText: z.string().optional().describe('Sous-texte optionnel sous le titre'),
  accentColor: hexColor.default('#00d4ff'),
  backgroundColor: hexColor.default('#020810'),
  textColor: hexColor.default('#ffffff'),
  showAccentLine: z.boolean().default(true),
  durationInSeconds: z.number().min(1).max(10).default(4),
});

// ═══════════════════════════════════════════════════════════════════
// PROBLEM SCENE — problème client verbalisé avec prop visuel
// ═══════════════════════════════════════════════════════════════════

export const problemSceneSchema = z.object({
  type: z.literal('problem'),
  problemText: z.string().describe('Texte du problème, révélé par range selector'),
  iconEmoji: z.string().optional().describe('Emoji fallback si pas d\'image'),
  iconSrc: z.string().optional().describe('Chemin vers image dans public/, ex: /images/clock.png'),
  accentColor: hexColor.default('#ff2d78'),
  backgroundColor: hexColor.default('#ffffff'),
  textColor: hexColor.default('#020810'),
  durationInSeconds: z.number().min(1).max(10).default(4),
});

// ═══════════════════════════════════════════════════════════════════
// REVEAL SCENE — le money shot: paper tilted + sections orchestrées
// ═══════════════════════════════════════════════════════════════════

export const sectionSchema = z.object({
  id: z.string().describe('Identifiant unique pour le key React'),
  type: z.enum(['nav', 'hero', 'title', 'card', 'text', 'button']).describe('Type visuel pour le style par défaut'),
  text: z.string().optional().describe('Texte affiché dans la section'),
  src: z.string().optional().describe('Image optionnelle pour card/hero'),
  // Position et taille en % du paper (0-100)
  top: z.number().min(0).max(100).describe('Position top en % du paper'),
  left: z.number().min(0).max(100).describe('Position left en % du paper'),
  width: z.number().min(1).max(100).describe('Largeur en % du paper'),
  height: z.number().min(1).max(100).describe('Hauteur en % du paper'),
  // Style
  bgColor: hexColor.optional().describe('Couleur de fond de la section, sinon transparent'),
  textColor: hexColor.optional().describe('Couleur du texte'),
  fontSize: z.number().optional().describe('Taille police absolue en px @ 720 width'),
  // Animation d'entrée
  enterDelayFrames: z.number().min(0).describe('Délai d\'entrée en frames après le début de la reveal scene'),
  enterAnim: z.enum(['slide-up', 'slide-down', 'slide-left', 'slide-right', 'fade', 'scale', 'drop']).default('slide-up'),
});

export const revealSceneSchema = z.object({
  type: z.literal('reveal'),
  siteName: z.string().describe('Nom du site client, ex: "ARCHIDOMO"'),
  tagline: z.string().optional().describe('Tagline optionnelle sous le nom'),
  sections: z.array(sectionSchema).max(10).describe('Liste des sections du site à orchestrer'),
  backgroundColor: hexColor.default('#0a1230'),
  paperColor: hexColor.default('#ffffff'),
  // Durée de l'intro caméra (paper qui se pose)
  cameraIntroDurationFrames: z.number().default(36).describe('Durée de l\'anim caméra (paper tilt → flat)'),
  durationInSeconds: z.number().min(3).max(15).default(6),
});

// ═══════════════════════════════════════════════════════════════════
// UNION DES SCÈNES
// ═══════════════════════════════════════════════════════════════════

export const sceneSchema = z.discriminatedUnion('type', [
  hookSceneSchema,
  problemSceneSchema,
  revealSceneSchema,
]);

// ═══════════════════════════════════════════════════════════════════
// COMPOSITION PRINCIPALE
// ═══════════════════════════════════════════════════════════════════

export const narrativeStorySchema = z.object({
  scenes: z.array(sceneSchema).min(1).max(6).describe('Liste ordonnée des scènes de la vidéo'),
  audioSrc: z.string().optional().describe('Piste audio optionnelle, ex: /audio/track.mp3'),
});

export type HookSceneProps = z.infer<typeof hookSceneSchema>;
export type ProblemSceneProps = z.infer<typeof problemSceneSchema>;
export type RevealSceneProps = z.infer<typeof revealSceneSchema>;
export type SectionProps = z.infer<typeof sectionSchema>;
export type SceneProps = z.infer<typeof sceneSchema>;
export type NarrativeStoryProps = z.infer<typeof narrativeStorySchema>;
