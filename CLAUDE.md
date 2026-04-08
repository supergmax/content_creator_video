# CLAUDE.md — StellarPulse Video Creator

## Projet
Studio de création vidéo local. Next.js 15 + Remotion 4. Pas de cloud, pas d'auth.
Workflow piloté par fichiers `description.md` dans `videos/`.

## Skills disponibles
- `/new-video` — créer une vidéo (interactif ou `--auto`)
- `/generate-props <template> <nom> <description>` — générer props.json
- `/preview` — lancer Remotion Studio
- `/render` — lancer le render MP4

## Skills de développement
- `remotion-best-practices` — patterns Remotion (useCurrentFrame, spring, interpolate)
- `new-template` — créer une nouvelle composition Remotion

## Commandes utiles
- `npm run dev` — Next.js sur localhost:3000
- `npm run remotion:studio` — Remotion Studio sur localhost:3001
- `npm run remotion:render <comp> <output>` — render MP4 local

## Structure clé
- `videos/<nom>/description.md` — description humaine de la vidéo
- `videos/<nom>/props.json` — props Remotion (générées par /generate-props)
- `videos/<nom>/output.mp4` — vidéo rendue (gitignorée via *.mp4)
- `templates/<template>.md` — modèles de description.md
- `remotion/compositions/<template>/` — composition Remotion + schema Zod

## Conventions
- Compositions Remotion dans `remotion/compositions/<nom>/`
- Chaque composition a un `schema.ts` (Zod) + un `<Nom>.tsx`
- Props toujours validées par Zod
- Animations UI → Framer Motion. Animations vidéo → useCurrentFrame + spring

## À ne pas faire
- Ne pas utiliser `use server` dans les composants qui importent Remotion
- Ne pas importer @remotion/player côté serveur (client component uniquement)
- Ne pas committer les fichiers `output.mp4` (gitignorés via `*.mp4`)
