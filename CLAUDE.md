# CLAUDE.md — StellarPulse Video Creator

## Projet
Studio de création vidéo local. Next.js 15 + Remotion 4. Pas de cloud, pas d'auth.

## Skills disponibles
- `remotion-best-practices` — patterns Remotion (useCurrentFrame, spring, interpolate)
- `remotion-render` — pipeline rendu local ffmpeg
- `remotion` (stitch) — intégration Next.js + Remotion
- `add-sfx` — audio et effets sonores
- `framer-motion` — animations Framer Motion dans les compositions
- `21st-dev-components` — composants 21st.dev + shadcn
- `ai-generation` — génération de props JSON pour les templates (via Claude Code)

## Commandes utiles
- `npm run dev` — Next.js sur localhost:3000
- `npm run remotion:studio` — Remotion Studio sur localhost:3001
- `npm run remotion:render <comp> <output>` — render MP4 local
- `/generate-props <template-id> <description>` — générer des props JSON depuis Claude Code

## Génération IA
L'IA utilise **Claude Code en subprocess** (`claude -p`). Aucune clé API requise.
- Via l'interface web : bouton "✦ Générer avec IA" dans l'éditeur
- Via Claude Code : commande `/generate-props`
- Prérequis : Claude Code doit être lancé dans le répertoire du projet

## Conventions
- Compositions Remotion dans `/remotion/compositions/<nom>/`
- Chaque composition a un `schema.ts` (Zod) + un `<Nom>.tsx`
- Props toujours validées par Zod avant d'être passées au Player
- Animations UI → Framer Motion. Animations vidéo → useCurrentFrame + spring

## À ne pas faire
- Ne pas utiliser `use server` dans les composants qui importent Remotion
- Ne pas importer @remotion/player côté serveur
- Ne pas rendre /public/renders/ dans git (fichiers MP4 gitignorés)
