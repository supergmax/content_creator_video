# StellarPulse Video Creator — Design Spec
**Date:** 2026-04-07  
**Status:** Approved  
**Project:** `content_creator_video`

---

## 1. Vision

Un studio de création vidéo local, full-stack, tournant dans le navigateur. L'utilisateur crée des vidéos professionnelles (SaaS promos, cours, hooks sociaux) en sélectionnant un template, en remplissant des champs ou en décrivant la vidéo en langage naturel. L'IA génère automatiquement les props de la composition. Le rendu produit un fichier MP4 via ffmpeg en local.

**Formats cibles :** 16:9 (YouTube/LinkedIn), 9:16 (TikTok/Reels/Shorts), 1:1 (Twitter/LinkedIn feed)

---

## 2. Architecture

### 2.1 Structure du projet

```
content_creator_video/            ← single Next.js app
├── .claude/                      ← cerveau Claude local
│   ├── settings.json
│   ├── commands/                 ← /render, /new-template, /preview
│   ├── skills/                   ← 6 skills (4 externes + 2 custom)
│   └── agents/                   ← specs des 5 agents
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── app/                          ← Next.js 15 App Router
│   ├── (studio)/
│   │   ├── page.tsx              ← Dashboard (liste des projets)
│   │   └── editor/[id]/
│   │       └── page.tsx          ← Split-pane Editor
│   ├── renders/
│   │   └── page.tsx              ← Historique des rendus
│   ├── api/
│   │   ├── render/
│   │   │   └── route.ts          ← POST → spawn Remotion CLI
│   │   ├── render/progress/
│   │   │   └── route.ts          ← GET → SSE progress stream
│   │   └── ai/generate/
│   │       └── route.ts          ← POST → Claude API streaming
│   ├── globals.css
│   └── layout.tsx
├── remotion/                     ← Remotion compositions
│   ├── Root.tsx                  ← registerRoot()
│   ├── compositions/
│   │   ├── saas-promo/
│   │   │   ├── SaasPromo.tsx
│   │   │   └── schema.ts         ← Zod props schema
│   │   ├── course-intro/
│   │   │   ├── CourseIntro.tsx
│   │   │   └── schema.ts
│   │   ├── social-hook/
│   │   │   ├── SocialHook.tsx
│   │   │   └── schema.ts
│   │   └── text-reveal/
│   │       ├── TextReveal.tsx
│   │       └── schema.ts
│   └── shared/                   ← composants Remotion partagés
│       ├── AnimatedText.tsx
│       ├── BackgroundGradient.tsx
│       └── AudioTrack.tsx
├── components/                   ← UI React/shadcn
│   ├── studio/
│   │   ├── ControlPanel.tsx      ← panneau gauche de l'éditeur
│   │   ├── PreviewPanel.tsx      ← panneau droit (Remotion Player)
│   │   ├── TemplateSelector.tsx
│   │   ├── FormatSelector.tsx
│   │   ├── AIPromptInput.tsx
│   │   └── RenderButton.tsx
│   ├── dashboard/
│   │   ├── ProjectGrid.tsx
│   │   └── ProjectCard.tsx
│   └── renders/
│       ├── RenderList.tsx
│       └── RenderProgressBar.tsx
├── lib/
│   ├── ai/
│   │   ├── client.ts             ← Vercel AI SDK + Claude config
│   │   └── prompts.ts            ← system prompts pour génération props
│   ├── remotion/
│   │   ├── templates.ts          ← registre des templates
│   │   └── render.ts             ← wrapper spawn CLI
│   ├── store/
│   │   └── studio.ts             ← Zustand store (état éditeur)
│   └── utils.ts
├── public/
│   └── renders/                  ← MP4 générés (gitignored)
├── docs/
│   ├── ARCHITECTURE.md
│   └── ADR/
│       ├── 001-single-nextjs-app.md
│       ├── 002-local-render.md
│       └── 003-ai-hybrid-templates.md
├── CLAUDE.md
├── README.md
├── STATE.md
├── TODO.md
├── ROADMAP.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── remotion.config.ts
├── next.config.ts
├── tailwind.config.ts
├── biome.json
└── package.json
```

### 2.2 Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| React | React 19 |
| UI | shadcn/ui + Tailwind CSS v4 |
| Composants premium | 21st.dev |
| Animations UI | Framer Motion 11 |
| État global | Zustand |
| Vidéo engine | Remotion 4 + @remotion/player |
| Animations vidéo | Framer Motion (dans les compositions) |
| AI | Claude API (claude-sonnet-4-6) via Vercel AI SDK |
| Validation | Zod |
| Rendu | Remotion CLI + ffmpeg (local) |
| Linting | Biome |
| Language | TypeScript strict |

---

## 3. Fonctionnalités

### 3.1 Dashboard
- Grille de projets vidéo (cards avec thumbnail preview)
- Bouton "Nouvelle vidéo" → sélection de template → redirige vers `/editor/[id]`
- Badges format (16:9 / 9:16 / 1:1) et durée sur chaque card

### 3.2 Studio Editor (split-pane)

**Panneau gauche — Contrôles :**
- Sélecteur de template (tabs : SaaS Promo / Course Intro / Social Hook / Text Reveal)
- Sélecteur de format (16:9 / 9:16 / 1:1) — adapte les dimensions du player
- Champs de formulaire générés dynamiquement depuis le schéma Zod du template
- Zone de prompt IA avec bouton "Générer avec IA"
- Bouton "Render MP4" avec indicateur de progression

**Panneau droit — Preview :**
- `@remotion/player` en taille adaptée au format sélectionné
- Timeline scrubber
- Contrôles play/pause/frame

### 3.3 Templates Remotion

Chaque template expose :
- `schema.ts` : schéma Zod des props (titre, sous-titre, couleurs, durée, assets…)
- Composition Remotion : animations via `useCurrentFrame()`, `spring()`, `interpolate()`
- Support Framer Motion pour les éléments complexes

**Templates :**
| Nom | Format | Durée | Description |
|---|---|---|---|
| SaaS Promo | 16:9 | 15-30s | Présentation produit dark mode, hero animé, CTA |
| Course Intro | 16:9 | 10-20s | Intro cours avec titre, auteur, progression |
| Social Hook | 9:16 | 7-15s | Hook fort en ouverture pour TikTok/Reels |
| Text Reveal | 16:9 / 9:16 / 1:1 | 5-30s | Animation typographique pure |

### 3.4 Intégration IA

- Endpoint `POST /api/ai/generate` avec streaming (Vercel AI SDK)
- Modèle : `claude-sonnet-4-6`
- Input : prompt texte + format sélectionné + template actif
- Output : JSON structuré des props du template (validé par Zod)
- Comportement : le player se met à jour en live dès réception des props

**Prompt system :** Le system prompt inclut le schéma Zod du template actif pour que Claude génère des props valides.

### 3.5 Pipeline de rendu

1. `POST /api/render` reçoit `{ compositionId, props, format, outputName }`
2. Spawn `npx remotion render <compositionId> <outputPath>` via `child_process.spawn`
3. Parse stdout pour extraire le pourcentage de progression
4. `GET /api/render/progress` retourne un stream SSE `{ progress: 0-100, done: bool, filePath }`
5. À completion : fichier MP4 dans `/public/renders/[outputName].mp4`
6. Page Renders affiche l'historique avec lien de téléchargement direct

**Formats :**
- 16:9 : 1920×1080 @ 30fps
- 9:16 : 1080×1920 @ 30fps  
- 1:1 : 1080×1080 @ 30fps

---

## 4. Écosystème Claude

### 4.1 Skills

| Skill | Source | Rôle |
|---|---|---|
| `remotion-best-practices` | `remotion-dev/skills` | Conventions et patterns Remotion |
| `remotion-render` | `inferen-sh/skills` | Config ffmpeg, flags CLI, codecs |
| `remotion` (stitch) | `google-labs-code/stitch-skills` | Intégration Next.js + Remotion |
| `add-sfx` | `remotion-dev/remotion` | Audio, SFX, sync audio/vidéo |
| `framer-motion` | custom (ce projet) | Patterns animation Framer Motion + Remotion |
| `21st-dev-components` | custom (ce projet) | Guide composants 21st.dev + shadcn |

Installation :
```bash
npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices
npx skills add https://github.com/inferen-sh/skills --skill remotion-render
npx skills add https://github.com/google-labs-code/stitch-skills --skill remotion
npx skills add https://github.com/remotion-dev/remotion --skill add-sfx
```

### 4.2 Commandes Claude

| Commande | Action |
|---|---|
| `/render` | Déclenche le rendu de la composition courante |
| `/new-template` | Guide la création d'un nouveau template |
| `/preview` | Lance le preview Remotion en mode dev |

### 4.3 Fichiers d'écosystème

- `CLAUDE.md` : instructions globales Claude pour ce repo (skills disponibles, patterns à suivre, conventions)
- `STATE.md` : journal de bord du dev en cours (mis à jour à chaque session)
- `TODO.md` : backlog court terme
- `ROADMAP.md` : vision moyen/long terme

---

## 5. Agent Team & Plan d'exécution

### Phase 1 — Parallèle

**Agent 1 — Infrastructure & Écosystème**
- Scaffold Next.js 15 avec TypeScript strict + Biome
- Crée toute la structure de fichiers racine (CLAUDE.md, README.md, STATE.md, TODO.md, ROADMAP.md, CONTRIBUTING.md, CHANGELOG.md, SECURITY.md, CODE_OF_CONDUCT.md)
- Crée `.claude/` (settings.json, commands/, skills/, agents/)
- Crée `.github/` (PR template, issue templates)
- Crée `docs/` (ARCHITECTURE.md, 3 ADR)
- Installe les 4 skills externes via `npx skills add`
- Crée les 2 skills custom (framer-motion, 21st-dev-components)
- Configure Tailwind v4 + shadcn/ui

**Agent 2 — Compositions Remotion**
- Installe Remotion 4 + @remotion/player + @remotion/media-utils
- Configure `remotion.config.ts` + bundler overrides pour Next.js
- Crée les 4 compositions avec schémas Zod
- Crée les composants partagés (AnimatedText, BackgroundGradient, AudioTrack)
- Configure `Root.tsx` avec tous les registerRoot

### Phase 2 — Parallèle (après Phase 1)

**Agent 3 — Interface Studio**
- Installe 21st.dev + Framer Motion
- Construit Dashboard + ProjectGrid + ProjectCard
- Construit Split-pane Editor (ControlPanel + PreviewPanel)
- Intègre @remotion/player dans PreviewPanel
- Construit FormatSelector, TemplateSelector, AIPromptInput
- Configure Zustand store
- Animations UI avec Framer Motion

**Agent 4 — Intégration IA**
- Configure Vercel AI SDK + Claude API
- Construit `/api/ai/generate` avec streaming
- Écrit les system prompts de génération de props
- Connecte AIPromptInput → API → mise à jour live du Player

### Phase 3 — Séquentiel (après Phase 2)

**Agent 5 — Pipeline de rendu**
- Construit `/api/render` (spawn CLI + gestion erreurs)
- Construit `/api/render/progress` (SSE stream)
- Construit page Renders avec historique et progress bars
- Connecte RenderButton → API → SSE → UI update
- Gestion des 3 formats (dimensions + noms de fichiers)

### Review finale

**Agent code-reviewer** — Validation qualité contre ce spec.

---

## 6. Décisions techniques (ADR résumées)

**ADR-001 : Single Next.js App**  
Remotion embarqué dans Next.js via @remotion/player. Évite la complexité d'un monorepo. Un seul `npm run dev`.

**ADR-002 : Rendu local uniquement**  
`child_process.spawn` + Remotion CLI + ffmpeg. Zéro dépendance cloud. Convient pour un usage local intensif.

**ADR-003 : Hybride templates + IA**  
Templates Remotion avec schémas Zod stricts. L'IA génère des props valides (pas du code). Sépare clairement la logique vidéo (Remotion) de la génération de contenu (Claude).

---

## 7. Ce qui est hors scope

- Rendu cloud (Remotion Lambda) — prévu en ROADMAP v2
- Auth / multi-utilisateurs — usage local mono-utilisateur
- Éditeur de timeline drag & drop — Remotion Studio pour ça
- Marketplace de templates — ROADMAP v3
