# Design Spec — StellarPulse Video Creator Redesign
**Date:** 2026-04-08  
**Status:** Approved

---

## Objectif

Repartir d'une base propre : un site Next.js minimaliste pour prévisualiser, rendre et télécharger des vidéos Remotion. Le workflow est piloté par des fichiers `description.md` dans un dossier `videos/`, créés via un skill Claude Code `/new-video`.

---

## Architecture

### Structure des fichiers

```
content_creator_video/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                    # Liste des vidéos dans videos/
│   ├── video/[name]/page.tsx       # Preview + render + download
│   └── api/
│       ├── videos/route.ts         # Scanne et liste les dossiers videos/
│       ├── render/route.ts         # Lance le render Remotion (SSE)
│       └── renders/[name]/route.ts # Téléchargement du MP4
├── videos/                         # Vidéos créées (gitignored sauf *.md)
│   └── ma-promo/
│       ├── description.md          # Description humaine de la vidéo
│       └── props.json              # Props Remotion générées par le skill
├── templates/                      # Modèles description.md par composition
│   ├── social-hook.md
│   ├── text-reveal.md
│   ├── course-intro.md
│   └── saas-promo.md
├── remotion/                       # Compositions Remotion (inchangées)
│   ├── Root.tsx
│   ├── compositions/
│   │   ├── social-hook/
│   │   ├── text-reveal/
│   │   ├── course-intro/
│   │   └── saas-promo/
│   └── shared/
│       ├── AnimatedText.tsx
│       └── BackgroundGradient.tsx
├── components/ui/                  # shadcn/ui conservés
├── lib/
│   ├── videos.ts                   # Helpers lecture filesystem videos/
│   ├── render.ts                   # Wrapper render Remotion
│   └── utils.ts
├── .claude/
│   ├── commands/
│   │   └── new-video.md            # Skill /new-video
│   └── skills/                     # Skills existants conservés
├── CLAUDE.md
└── ROADMAP.md
```

---

## Flux principal

1. `GET /api/videos` — scanne `videos/` → retourne la liste des dossiers avec leur `description.md` (frontmatter parsé)
2. `app/page.tsx` — affiche la liste des vidéos (nom, template, durée, format)
3. Clic → `/video/[name]` — charge `videos/<name>/props.json` → `@remotion/player` pour la preview live
4. Bouton **Render** → `POST /api/render` → lance `npx remotion render` → streaming SSE de la progression → MP4 dans `videos/<name>/output.mp4`
5. Bouton **Download** → `GET /api/renders/[name]` → stream du fichier MP4

---

## Format `description.md`

```markdown
---
template: social-hook          # composition Remotion : social-hook | text-reveal | course-intro | saas-promo
duration: 8                    # durée en secondes
format: 9x16                   # 9x16 | 16x9 | 1x1
---

## Objectif
[Quel effet doit produire la vidéo sur le viewer]

## Message principal
[Le texte/contenu central de la vidéo]

## Ton / Style
[Energique, minimaliste, dark theme, couleurs...]

## Éléments visuels
- Couleur dominante : [couleur]
- [autres éléments visuels]

## Call to action
[Ce que le viewer doit faire ou ressentir à la fin]
```

---

## Skill `/new-video`

Fichier : `.claude/commands/new-video.md`

### Mode interactif (`/new-video`)
1. Demande : nom de la vidéo (slug, ex: `ma-promo`)
2. Demande : template à utiliser (liste les 4 options)
3. Demande : objectif, message principal, ton/style, call to action
4. Génère `videos/<nom>/description.md` depuis le template correspondant dans `templates/`
5. Appelle le skill `generate-props` pour inférer `props.json` depuis le `description.md`
6. Affiche : "Preview : ouvre `/video/<nom>` dans le browser. Render : `/new-video` est prêt."

### Mode auto (`/new-video --auto <nom> <template> "<description>"`)
1. Génère `videos/<nom>/description.md` en inférant toutes les sections depuis `<description>`
2. Génère `props.json` via `generate-props` sans questions
3. Affiche le résumé

---

## Ménage — Suppressions

### Code supprimé
- `components/dashboard/` — ProjectCard, ProjectGrid
- `components/studio/` — tous les composants studio
- `components/renders/` — RenderList
- `app/(studio)/` — route group studio
- `app/renders/` — page renders
- `lib/ai/` — claude-cli.ts, client.ts, prompts.ts
- `lib/store/` — studio.ts (zustand)
- `lib/templates.ts`
- `lib/render-state.ts`
- `docs/ADR/`, `docs/ARCHITECTURE.md`
- `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `STATE.md`, `TODO.md`, `use.md`
- `public/renders/` — MP4 de démo

### Dépendances supprimées
- `@ai-sdk/gateway`, `ai` — plus d'AI Gateway
- `zustand` — plus de state global
- `@base-ui/react` — non utilisé

### Dépendances conservées
- `remotion`, `@remotion/*`, `framer-motion`, `next`, `react`, `zod`
- `tailwindcss`, `shadcn`, `lucide-react`, `clsx`, `tailwind-merge`

---

## Roadmap V2

Ajouté dans `ROADMAP.md` : éditeur UI inline — modification des props directement dans l'interface (sliders, champs texte) sans passer par le fichier `props.json` manuellement.

---

## Ce qui ne change pas

- Les 4 compositions Remotion (social-hook, text-reveal, course-intro, saas-promo) et leurs schémas Zod
- `remotion/shared/` (AnimatedText, BackgroundGradient)
- `components/ui/` (shadcn/ui)
- `remotion.config.ts`
- Scripts npm : `dev`, `remotion:studio`, `remotion:render`
- `.claude/skills/` existants (remotion-best-practices, generate-props, etc.)
