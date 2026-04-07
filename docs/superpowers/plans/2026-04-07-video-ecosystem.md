# StellarPulse Video Creator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un studio de création vidéo local basé sur Next.js 15 + Remotion 4, avec preview live, 4 templates professionnels, génération IA des props, et export MP4 en local.

**Architecture:** Single Next.js 15 App Router avec Remotion Player embarqué côté client. Les compositions Remotion vivent dans `/remotion/compositions/` avec schémas Zod. Le rendu MP4 est déclenché via une API route qui spawn `npx remotion render`. L'IA (Claude via Vercel AI SDK) génère des JSON props validés Zod.

**Tech Stack:** Next.js 15, React 19, Remotion 4, Framer Motion 11, shadcn/ui, Tailwind v4, Zustand, Vercel AI SDK + Claude via AI Gateway (`anthropic/claude-sonnet-4.6`), Zod, Biome, TypeScript strict

---

## Parallelisme d'exécution

```
Phase 1A ──── Task 1 → 2 → 3 → 4 → 5 → 6 → 7   (Infra + Éco)
Phase 1B ──── Task 8 → 9 → 10 → 11 → 12 → 13   (Remotion — parallèle avec 1A)
                          ↓
Phase 2A ──── Task 14 → 15 → 16 → 17 → 18 → 19  (UI Studio)
Phase 2B ──── Task 20 → 21 → 22                  (AI — parallèle avec 2A)
                          ↓
Phase 3  ──── Task 23 → 24 → 25 → 26 → 27        (Render Pipeline)
                          ↓
Review   ──── Task 28                             (Integration + validation)
```

---

## File Map

| Fichier | Responsabilité |
|---|---|
| `package.json` | dépendances, scripts |
| `next.config.ts` | config Next.js (webpack override pour Remotion) |
| `remotion.config.ts` | config bundler Remotion |
| `biome.json` | lint + format |
| `tailwind.config.ts` | thème dark + couleurs StellarPulse |
| `components.json` | config shadcn/ui |
| `remotion/Root.tsx` | registerRoot() pour toutes les compositions |
| `remotion/compositions/saas-promo/schema.ts` | Zod props SaaS Promo |
| `remotion/compositions/saas-promo/SaasPromo.tsx` | composition Remotion |
| `remotion/compositions/course-intro/schema.ts` | Zod props Course Intro |
| `remotion/compositions/course-intro/CourseIntro.tsx` | composition Remotion |
| `remotion/compositions/social-hook/schema.ts` | Zod props Social Hook |
| `remotion/compositions/social-hook/SocialHook.tsx` | composition Remotion |
| `remotion/compositions/text-reveal/schema.ts` | Zod props Text Reveal |
| `remotion/compositions/text-reveal/TextReveal.tsx` | composition Remotion |
| `remotion/shared/AnimatedText.tsx` | texte animé partagé |
| `remotion/shared/BackgroundGradient.tsx` | fond gradient animé |
| `lib/templates.ts` | registre des templates (id → schema + meta) |
| `lib/store/studio.ts` | Zustand store (état éditeur) |
| `lib/ai/client.ts` | config Vercel AI SDK + Claude |
| `lib/ai/prompts.ts` | system prompts génération props |
| `app/(studio)/page.tsx` | Dashboard |
| `app/(studio)/editor/[id]/page.tsx` | Split-pane Editor |
| `app/renders/page.tsx` | Historique des rendus |
| `app/api/ai/generate/route.ts` | POST → Claude streaming |
| `app/api/render/route.ts` | POST → spawn Remotion CLI |
| `app/api/render/progress/route.ts` | GET → SSE progress |
| `components/studio/ControlPanel.tsx` | panneau gauche éditeur |
| `components/studio/PreviewPanel.tsx` | panneau droit + Remotion Player |
| `components/studio/TemplateSelector.tsx` | tabs sélection template |
| `components/studio/FormatSelector.tsx` | 16:9 / 9:16 / 1:1 |
| `components/studio/AIPromptInput.tsx` | zone prompt + bouton IA |
| `components/studio/RenderButton.tsx` | bouton render + progress |
| `components/dashboard/ProjectGrid.tsx` | grille projets |
| `components/dashboard/ProjectCard.tsx` | card projet |
| `components/renders/RenderList.tsx` | liste historique rendus |

---

## Phase 1A — Infrastructure & Écosystème

### Task 1 : Scaffold Next.js 15

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/globals.css`

- [ ] **Initialiser le projet Next.js 15**

```bash
cd "C:/Users/gmax9/OneDrive/Bureau/stellarPulse/content_creator_video"
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --yes
```

- [ ] **Installer les dépendances core**

```bash
npm install remotion @remotion/player @remotion/cli @remotion/media-utils @remotion/noise
npm install framer-motion zustand
npm install ai @ai-sdk/gateway
npm install zod
npm install --save-dev @biomejs/biome
```

- [ ] **Configurer `next.config.ts`** (webpack override requis pour Remotion)

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Remotion requiert webpack, pas turbopack
  },
  webpack: (config, { isServer }) => {
    // Remotion utilise des workers — exclure côté serveur
    if (isServer) {
      config.externals = [...(config.externals ?? []), 'remotion', '@remotion/player'];
    }
    return config;
  },
};

export default nextConfig;
```

- [ ] **Créer `remotion.config.ts`**

```ts
// remotion.config.ts
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
```

- [ ] **Configurer Biome**

```bash
npx @biomejs/biome init
```

Remplacer le contenu de `biome.json` par :

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedVariables": "warn" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  }
}
```

- [ ] **Ajouter les scripts dans `package.json`**

Ajouter dans la section `"scripts"` :

```json
"remotion:studio": "npx remotion studio remotion/Root.tsx",
"remotion:render": "npx remotion render",
"lint": "npx @biomejs/biome check .",
"lint:fix": "npx @biomejs/biome check --write ."
```

- [ ] **Commit**

```bash
git init
git add package.json next.config.ts tsconfig.json biome.json remotion.config.ts
git commit -m "feat: scaffold Next.js 15 + Remotion 4 + tooling"
```

---

### Task 2 : Configurer Tailwind v4 + thème dark

**Files:**
- Modify: `app/globals.css`, `tailwind.config.ts`

- [ ] **Remplacer `app/globals.css`**

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-brand: oklch(60% 0.25 290);
  --color-brand-dark: oklch(45% 0.25 290);
  --color-surface: oklch(8% 0 0);
  --color-surface-elevated: oklch(12% 0 0);
  --color-border: oklch(18% 0 0);
  --color-text-primary: oklch(96% 0 0);
  --color-text-muted: oklch(50% 0 0);
  --font-sans: 'Inter', system-ui, sans-serif;
}

:root {
  color-scheme: dark;
}

body {
  background: var(--color-surface);
  color: var(--color-text-primary);
}
```

- [ ] **Mettre à jour `app/layout.tsx`**

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StellarPulse Studio',
  description: 'Professional video creation for social media',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Commit**

```bash
git add app/globals.css app/layout.tsx tailwind.config.ts
git commit -m "feat: configure Tailwind v4 dark theme"
```

---

### Task 3 : Installer et configurer shadcn/ui

**Files:**
- Create: `components.json`, `components/ui/` (géré par shadcn)

- [ ] **Initialiser shadcn/ui**

```bash
npx shadcn@latest init --defaults
```

Quand on vous demande le style, choisir `Default` et la couleur de base `Zinc`.

- [ ] **Installer les composants nécessaires**

```bash
npx shadcn@latest add button card badge tabs input textarea scroll-area progress separator tooltip
```

- [ ] **Commit**

```bash
git add components.json components/ui/
git commit -m "feat: install shadcn/ui with base components"
```

---

### Task 4 : Créer les fichiers d'écosystème racine

**Files:**
- Create: `CLAUDE.md`, `README.md`, `STATE.md`, `TODO.md`, `ROADMAP.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.gitignore`

- [ ] **Créer `CLAUDE.md`**

```markdown
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

## Commandes utiles
- `npm run dev` — Next.js sur localhost:3000
- `npm run remotion:studio` — Remotion Studio sur localhost:3001
- `npm run remotion:render <comp> <output>` — render MP4 local

## Conventions
- Compositions Remotion dans `/remotion/compositions/<nom>/`
- Chaque composition a un `schema.ts` (Zod) + un `<Nom>.tsx`
- Props toujours validées par Zod avant d'être passées au Player
- Animations UI → Framer Motion. Animations vidéo → useCurrentFrame + spring

## À ne pas faire
- Ne pas utiliser `use server` dans les composants qui importent Remotion
- Ne pas importer @remotion/player côté serveur
- Ne pas rendre /public/renders/ dans git (fichiers MP4 gitignorés)
```

- [ ] **Créer `README.md`**

```markdown
# StellarPulse Video Creator

Studio de création vidéo professionnel local. Génère des vidéos pour TikTok, Reels, YouTube et LinkedIn.

## Démarrage rapide

\`\`\`bash
npm install
cp .env.example .env.local
# Auth IA : vercel link && vercel env pull .env.local (provisionne VERCEL_OIDC_TOKEN)
npm run dev
\`\`\`

Ouvrir [http://localhost:3000](http://localhost:3000)

## Templates disponibles
- **SaaS Promo** (16:9, 15-30s) — présentation produit dark mode
- **Course Intro** (16:9, 10-20s) — intro de cours
- **Social Hook** (9:16, 7-15s) — hook TikTok/Reels
- **Text Reveal** (tous formats, 5-30s) — animation typographique

## Stack
Next.js 15 · Remotion 4 · shadcn/ui · Framer Motion · Claude API
```

- [ ] **Créer `.env.example`**

```bash
# .env.example
# Auth Vercel AI Gateway via OIDC (recommandé)
# Lancer: vercel link && vercel env pull .env.local
# → provisionne automatiquement VERCEL_OIDC_TOKEN (valide ~24h)
```

- [ ] **Créer `STATE.md`**

```markdown
# STATE.md — Journal de bord

## Session courante
Date: 2026-04-07
Status: Initialisation du projet

## Dernière tâche complétée
- Scaffold + configuration initiale

## En cours
- Voir TODO.md

## Blockers
- Aucun
```

- [ ] **Créer `TODO.md`**

```markdown
# TODO.md — Backlog court terme

## En cours
- [ ] Phase 1 : Infrastructure + Remotion setup

## À faire
- [ ] Phase 2 : UI Studio (Dashboard + Editor)
- [ ] Phase 3 : AI Integration
- [ ] Phase 4 : Render Pipeline
```

- [ ] **Créer `ROADMAP.md`**

```markdown
# ROADMAP.md

## v1.0 — Studio local (en cours)
- [x] Scaffold projet
- [ ] 4 templates Remotion
- [ ] Preview live dans le navigateur
- [ ] Génération IA des props
- [ ] Export MP4 local

## v2.0 — Rendu cloud
- [ ] Remotion Lambda (AWS)
- [ ] Render parallélisé

## v3.0 — Marketplace
- [ ] Bibliothèque de templates communautaires
- [ ] Export vers plateformes (upload direct)
```

- [ ] **Créer `CONTRIBUTING.md`**

```markdown
# CONTRIBUTING.md

## Setup
\`\`\`bash
npm install
cp .env.example .env.local
\`\`\`

## Ajouter un template
1. Créer `remotion/compositions/<nom>/schema.ts` avec le schéma Zod
2. Créer `remotion/compositions/<nom>/<Nom>.tsx` avec la composition
3. Enregistrer dans `remotion/Root.tsx`
4. Ajouter les métadonnées dans `lib/templates.ts`

## Conventions
- TypeScript strict, pas de `any`
- Biome pour le lint : `npm run lint:fix`
- Commits en anglais, format : `feat:` / `fix:` / `chore:`
```

- [ ] **Créer `CHANGELOG.md`**

```markdown
# CHANGELOG.md

## [Unreleased]

### Added
- Initial project scaffold
- Next.js 15 + Remotion 4 setup
```

- [ ] **Créer `SECURITY.md`**

```markdown
# SECURITY.md

## Signaler une vulnérabilité
Ouvrir une issue privée ou contacter directement via GitHub.

## Données sensibles
- `.env.local` (contenant `VERCEL_OIDC_TOKEN`) ne doit jamais être commité
- Les fichiers `.env.local` sont gitignorés
```

- [ ] **Créer `CODE_OF_CONDUCT.md`**

```markdown
# Code of Conduct

Ce projet suit le [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
```

- [ ] **Mettre à jour `.gitignore`**

Ajouter à la fin du `.gitignore` généré par Next.js :

```
# Renders
/public/renders/

# Superpowers
.superpowers/

# Env
.env.local
.env*.local
```

- [ ] **Commit**

```bash
git add CLAUDE.md README.md STATE.md TODO.md ROADMAP.md CONTRIBUTING.md CHANGELOG.md SECURITY.md CODE_OF_CONDUCT.md .env.example .gitignore
git commit -m "docs: add project ecosystem files"
```

---

### Task 5 : Créer l'écosystème `.claude/`

**Files:**
- Create: `.claude/settings.json`, `.claude/commands/render.md`, `.claude/commands/new-template.md`, `.claude/commands/preview.md`

- [ ] **Créer `.claude/settings.json`**

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx remotion *)",
      "Bash(git *)"
    ]
  }
}
```

- [ ] **Créer `.claude/commands/render.md`**

```markdown
---
description: Déclencher le rendu MP4 de la composition courante
---

Lance le rendu de la composition spécifiée en argument.

Usage: /render <compositionId> <outputName> <format>

Exemple: /render SaasPromo product-launch 16:9

Étapes:
1. Vérifier que ffmpeg est installé (ffmpeg -version)
2. Lancer: npx remotion render <compositionId> public/renders/<outputName>.mp4
3. Confirmer la création du fichier
```

- [ ] **Créer `.claude/commands/new-template.md`**

```markdown
---
description: Guider la création d'un nouveau template Remotion
---

Crée un nouveau template en suivant la structure standard.

1. Demander le nom, le format cible, et la durée
2. Créer remotion/compositions/<nom>/schema.ts avec le schéma Zod
3. Créer remotion/compositions/<nom>/<Nom>.tsx avec la composition de base
4. Enregistrer dans remotion/Root.tsx
5. Ajouter dans lib/templates.ts
```

- [ ] **Créer `.claude/commands/preview.md`**

```markdown
---
description: Lancer le Remotion Studio pour prévisualiser les compositions
---

Lance Remotion Studio en parallèle du serveur Next.js.

\`\`\`bash
npm run remotion:studio
\`\`\`

Ouvrir http://localhost:3001 pour le Remotion Studio.
```

- [ ] **Commit**

```bash
git add .claude/
git commit -m "chore: add .claude ecosystem (settings + commands)"
```

---

### Task 6 : Créer les templates `.github/`

**Files:**
- Create: `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`

- [ ] **Créer `.github/PULL_REQUEST_TEMPLATE.md`**

```markdown
## Description
<!-- Résumer les changements -->

## Type de changement
- [ ] Nouveau template Remotion
- [ ] Correction de bug
- [ ] Amélioration UI
- [ ] Autre

## Tests
- [ ] Preview live testé dans le navigateur
- [ ] Render MP4 testé localement

## Formats testés
- [ ] 16:9
- [ ] 9:16
- [ ] 1:1
```

- [ ] **Créer `.github/ISSUE_TEMPLATE/bug_report.md`**

```markdown
---
name: Bug report
about: Signaler un bug
---

**Description du bug**

**Étapes pour reproduire**
1.
2.

**Comportement attendu**

**Comportement observé**

**Environnement**
- OS:
- Node.js version:
- Template concerné:
- Format (16:9/9:16/1:1):
```

- [ ] **Créer `.github/ISSUE_TEMPLATE/feature_request.md`**

```markdown
---
name: Feature request
about: Proposer une nouvelle fonctionnalité
---

**Problème résolu**

**Solution proposée**

**Template ou composant concerné**
```

- [ ] **Commit**

```bash
git add .github/
git commit -m "chore: add GitHub PR and issue templates"
```

---

### Task 7 : Créer la documentation technique

**Files:**
- Create: `docs/ARCHITECTURE.md`, `docs/ADR/001-single-nextjs-app.md`, `docs/ADR/002-local-render.md`, `docs/ADR/003-ai-hybrid-templates.md`

- [ ] **Créer `docs/ARCHITECTURE.md`**

```markdown
# Architecture — StellarPulse Video Creator

## Vue globale

\`\`\`
Browser
  └── Next.js App (localhost:3000)
        ├── Dashboard — liste des projets
        ├── Editor — split-pane
        │    ├── ControlPanel (gauche)
        │    │    ├── TemplateSelector
        │    │    ├── FormatSelector
        │    │    ├── Champs Zod-driven
        │    │    └── AIPromptInput
        │    └── PreviewPanel (droite)
        │         └── @remotion/player
        └── Renders — historique MP4
  
API Routes
  ├── POST /api/ai/generate → Claude API → JSON props
  ├── POST /api/render → spawn Remotion CLI → MP4
  └── GET  /api/render/progress → SSE stream

Remotion Compositions (/remotion/)
  ├── SaasPromo
  ├── CourseIntro
  ├── SocialHook
  └── TextReveal
\`\`\`

## Flux de données

1. **Preview live** : props Zustand → @remotion/player re-render
2. **Génération IA** : prompt → /api/ai/generate → props JSON → Zustand store → player
3. **Render** : bouton → /api/render → child_process spawn → SSE → MP4 fichier
```

- [ ] **Créer `docs/ADR/001-single-nextjs-app.md`**

```markdown
# ADR-001 : Single Next.js App

Date: 2026-04-07
Status: Accepted

## Décision
Remotion embarqué dans Next.js via @remotion/player. Pas de monorepo.

## Raisons
- Un seul `npm run dev`
- Preview live dans le navigateur sans port séparé
- Moins de configuration

## Conséquences
- webpack override nécessaire dans next.config.ts
- @remotion/player importé uniquement dans des Client Components
```

- [ ] **Créer `docs/ADR/002-local-render.md`**

```markdown
# ADR-002 : Rendu local uniquement

Date: 2026-04-07
Status: Accepted

## Décision
Rendu via Remotion CLI + ffmpeg local. Pas de Remotion Lambda.

## Raisons
- Zéro coût cloud
- Usage local intensif
- Pas de dépendance AWS

## Conséquences
- Rendu séquentiel (pas parallélisé)
- Remotion Lambda prévu en v2.0
```

- [ ] **Créer `docs/ADR/003-ai-hybrid-templates.md`**

```markdown
# ADR-003 : Hybride templates + IA

Date: 2026-04-07
Status: Accepted

## Décision
L'IA génère des JSON props (pas du code Remotion). Les templates sont du code fixe.

## Raisons
- Séparation claire entre logique vidéo (Remotion) et contenu (Claude)
- Props validées par Zod = sécurité
- Templates maintiennent leur qualité indépendamment de l'IA

## Conséquences
- L'IA ne peut pas créer de nouveaux templates (c'est voulu)
- Ajouter un template = tâche de développement
```

- [ ] **Commit**

```bash
git add docs/
git commit -m "docs: add ARCHITECTURE.md and ADRs"
```

---

### Task 8 : Installer les skills Claude

**Files:**
- Create: `.claude/skills/framer-motion.md`, `.claude/skills/21st-dev-components.md`

- [ ] **Installer les 4 skills externes**

```bash
npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices
npx skills add https://github.com/inferen-sh/skills --skill remotion-render
npx skills add https://github.com/google-labs-code/stitch-skills --skill remotion
npx skills add https://github.com/remotion-dev/remotion --skill add-sfx
```

> Note : si une URL échoue, vérifier la disponibilité du repo et adapter la commande.

- [ ] **Créer `.claude/skills/framer-motion.md`**

```markdown
---
name: framer-motion
description: Patterns Framer Motion pour animations UI et compositions Remotion
---

# Framer Motion — Guide pour StellarPulse

## Dans les compositions Remotion

Framer Motion peut être utilisé dans les compositions mais les animations doivent
être synchronisées avec useCurrentFrame() pour un rendu déterministe.

### Pattern recommandé

\`\`\`tsx
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { motion } from 'framer-motion';

export const AnimatedTitle = ({ text }: { text: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = Math.min(frame / (fps * 0.5), 1); // 0.5s d'animation

  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: progress, y: (1 - progress) * 20 }}
      style={{ opacity: progress }}
    >
      {text}
    </motion.h1>
  );
};
\`\`\`

## Dans l'UI Next.js

Pour les animations de l'interface (transitions, hover, etc.) :

\`\`\`tsx
import { motion, AnimatePresence } from 'framer-motion';

// Transition de page
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>

// Hover card
<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} />
\`\`\`
```

- [ ] **Créer `.claude/skills/21st-dev-components.md`**

```markdown
---
name: 21st-dev-components
description: Guide d'utilisation des composants 21st.dev dans ce projet
---

# 21st.dev — Guide pour StellarPulse

## Utilisation
21st.dev fournit des composants React premium compatibles shadcn/ui.
Parcourir : https://21st.dev/home

## Installation d'un composant
\`\`\`bash
npx shadcn@latest add "https://21st.dev/r/<component-name>"
\`\`\`

## Composants recommandés pour ce projet
- Animated backgrounds pour les compositions vidéo
- Gradient text components pour les titres
- Animated counters pour les stats

## Conventions
- Toujours vérifier la compatibilité Tailwind v4
- Adapter les tokens de couleur au thème StellarPulse
- Préférer les composants sans dépendances externes lourdes
```

- [ ] **Commit**

```bash
git add .claude/skills/
git commit -m "chore: add framer-motion and 21st-dev skills"
```

---

## Phase 1B — Remotion Compositions (parallèle avec 1A)

### Task 9 : Créer les schémas Zod des templates

**Files:**
- Create: `remotion/compositions/saas-promo/schema.ts`, `remotion/compositions/course-intro/schema.ts`, `remotion/compositions/social-hook/schema.ts`, `remotion/compositions/text-reveal/schema.ts`, `lib/templates.ts`

- [ ] **Créer `remotion/compositions/saas-promo/schema.ts`**

```ts
// remotion/compositions/saas-promo/schema.ts
import { z } from 'zod';

export const saasPromoSchema = z.object({
  productName: z.string().default('Product Name'),
  tagline: z.string().default('The future of X'),
  ctaText: z.string().default('Get started →'),
  accentColor: z.string().default('#a855f7'),
  backgroundColor: z.string().default('#050505'),
  logoUrl: z.string().url().optional(),
  durationInSeconds: z.number().min(5).max(60).default(15),
});

export type SaasPromoProps = z.infer<typeof saasPromoSchema>;
```

- [ ] **Créer `remotion/compositions/course-intro/schema.ts`**

```ts
// remotion/compositions/course-intro/schema.ts
import { z } from 'zod';

export const courseIntroSchema = z.object({
  courseTitle: z.string().default('Course Title'),
  authorName: z.string().default('Author Name'),
  chapterNumber: z.number().min(1).default(1),
  chapterTitle: z.string().default('Introduction'),
  accentColor: z.string().default('#38bdf8'),
  backgroundColor: z.string().default('#050505'),
  durationInSeconds: z.number().min(5).max(30).default(10),
});

export type CourseIntroProps = z.infer<typeof courseIntroSchema>;
```

- [ ] **Créer `remotion/compositions/social-hook/schema.ts`**

```ts
// remotion/compositions/social-hook/schema.ts
import { z } from 'zod';

export const socialHookSchema = z.object({
  hookText: z.string().default('You won\'t believe this...'),
  subText: z.string().default('Thread below 👇'),
  accentColor: z.string().default('#f59e0b'),
  backgroundColor: z.string().default('#050505'),
  textColor: z.string().default('#ffffff'),
  durationInSeconds: z.number().min(3).max(30).default(7),
});

export type SocialHookProps = z.infer<typeof socialHookSchema>;
```

- [ ] **Créer `remotion/compositions/text-reveal/schema.ts`**

```ts
// remotion/compositions/text-reveal/schema.ts
import { z } from 'zod';

export const textRevealSchema = z.object({
  lines: z.array(z.string()).min(1).max(5).default(['Line one', 'Line two']),
  fontSizeMultiplier: z.number().min(0.5).max(3).default(1),
  accentColor: z.string().default('#22c55e'),
  backgroundColor: z.string().default('#050505'),
  revealStyle: z.enum(['fade', 'slide', 'typewriter']).default('slide'),
  durationInSeconds: z.number().min(3).max(60).default(10),
});

export type TextRevealProps = z.infer<typeof textRevealSchema>;
```

- [ ] **Créer `lib/templates.ts`**

```ts
// lib/templates.ts
import { saasPromoSchema, type SaasPromoProps } from '@/remotion/compositions/saas-promo/schema';
import { courseIntroSchema, type CourseIntroProps } from '@/remotion/compositions/course-intro/schema';
import { socialHookSchema, type SocialHookProps } from '@/remotion/compositions/social-hook/schema';
import { textRevealSchema, type TextRevealProps } from '@/remotion/compositions/text-reveal/schema';
import { z } from 'zod';

export type VideoFormat = '16:9' | '9:16' | '1:1';

export const FORMAT_DIMENSIONS: Record<VideoFormat, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
};

export type TemplateId = 'saas-promo' | 'course-intro' | 'social-hook' | 'text-reveal';

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  defaultFormat: VideoFormat;
  supportedFormats: VideoFormat[];
  schema: z.ZodSchema;
  defaultProps: Record<string, unknown>;
}

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  'saas-promo': {
    id: 'saas-promo',
    name: 'SaaS Promo',
    description: 'Présentation produit dark mode avec CTA',
    defaultFormat: '16:9',
    supportedFormats: ['16:9', '9:16'],
    schema: saasPromoSchema,
    defaultProps: saasPromoSchema.parse({}),
  },
  'course-intro': {
    id: 'course-intro',
    name: 'Course Intro',
    description: 'Intro de cours avec auteur et chapitre',
    defaultFormat: '16:9',
    supportedFormats: ['16:9'],
    schema: courseIntroSchema,
    defaultProps: courseIntroSchema.parse({}),
  },
  'social-hook': {
    id: 'social-hook',
    name: 'Social Hook',
    description: 'Hook fort pour TikTok, Reels et Shorts',
    defaultFormat: '9:16',
    supportedFormats: ['9:16', '1:1'],
    schema: socialHookSchema,
    defaultProps: socialHookSchema.parse({}),
  },
  'text-reveal': {
    id: 'text-reveal',
    name: 'Text Reveal',
    description: 'Animation typographique pure',
    defaultFormat: '16:9',
    supportedFormats: ['16:9', '9:16', '1:1'],
    schema: textRevealSchema,
    defaultProps: textRevealSchema.parse({}),
  },
};
```

- [ ] **Commit**

```bash
git add remotion/compositions/ lib/templates.ts
git commit -m "feat: add Zod schemas for all 4 templates + template registry"
```

---

### Task 10 : Créer les composants Remotion partagés

**Files:**
- Create: `remotion/shared/AnimatedText.tsx`, `remotion/shared/BackgroundGradient.tsx`

- [ ] **Créer `remotion/shared/AnimatedText.tsx`**

```tsx
// remotion/shared/AnimatedText.tsx
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

interface AnimatedTextProps {
  text: string;
  delay?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  style?: 'fade' | 'slide-up' | 'scale';
}

export const AnimatedText = ({
  text,
  delay = 0,
  color = '#ffffff',
  fontSize = 48,
  fontWeight = 700,
  style = 'slide-up',
}: AnimatedTextProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.5 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = style === 'slide-up' ? interpolate(progress, [0, 1], [30, 0], { extrapolateRight: 'clamp' }) : 0;
  const scale = style === 'scale' ? interpolate(progress, [0, 1], [0.8, 1], { extrapolateRight: 'clamp' }) : 1;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        color,
        fontSize,
        fontWeight,
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: 1.2,
      }}
    >
      {text}
    </div>
  );
};
```

- [ ] **Créer `remotion/shared/BackgroundGradient.tsx`**

```tsx
// remotion/shared/BackgroundGradient.tsx
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface BackgroundGradientProps {
  color1?: string;
  color2?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export const BackgroundGradient = ({
  color1 = '#a855f7',
  color2 = '#38bdf8',
  backgroundColor = '#050505',
  animated = true,
}: BackgroundGradientProps) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = animated
    ? interpolate(frame, [0, durationInFrames], [0, 360], { extrapolateRight: 'clamp' })
    : 0;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60%',
          height: '60%',
          background: color1,
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.3,
          transform: `rotate(${progress}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '50%',
          height: '50%',
          background: color2,
          borderRadius: '50%',
          filter: 'blur(100px)',
          opacity: 0.2,
          transform: `rotate(${-progress}deg)`,
        }}
      />
    </div>
  );
};
```

- [ ] **Commit**

```bash
git add remotion/shared/
git commit -m "feat: add shared Remotion components (AnimatedText, BackgroundGradient)"
```

---

### Task 11 : Créer la composition SaaS Promo

**Files:**
- Create: `remotion/compositions/saas-promo/SaasPromo.tsx`

- [ ] **Créer `remotion/compositions/saas-promo/SaasPromo.tsx`**

```tsx
// remotion/compositions/saas-promo/SaasPromo.tsx
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { AnimatedText } from '@/remotion/shared/AnimatedText';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import type { SaasPromoProps } from './schema';

export const SaasPromo = ({
  productName,
  tagline,
  ctaText,
  accentColor,
  backgroundColor,
  durationInSeconds,
}: SaasPromoProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const totalFrames = durationInSeconds * fps;

  const ctaDelay = fps * 1.2;
  const ctaProgress = Math.min(Math.max((frame - ctaDelay) / (fps * 0.4), 0), 1);

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <BackgroundGradient
        color1={accentColor}
        color2="#38bdf8"
        backgroundColor={backgroundColor}
      />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', gap: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <AnimatedText
          text={productName}
          delay={0}
          color="#ffffff"
          fontSize={Math.round(width / 15)}
          fontWeight={800}
          style="slide-up"
        />
        <AnimatedText
          text={tagline}
          delay={fps * 0.3}
          color="rgba(255,255,255,0.6)"
          fontSize={Math.round(width / 35)}
          fontWeight={400}
          style="fade"
        />

        <div
          style={{
            marginTop: 8,
            background: accentColor,
            color: '#ffffff',
            padding: `${Math.round(width / 80)}px ${Math.round(width / 30)}px`,
            borderRadius: Math.round(width / 60),
            fontSize: Math.round(width / 45),
            fontWeight: 600,
            opacity: ctaProgress,
            transform: `scale(${0.8 + ctaProgress * 0.2})`,
          }}
        >
          {ctaText}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Commit**

```bash
git add remotion/compositions/saas-promo/SaasPromo.tsx
git commit -m "feat: add SaaS Promo Remotion composition"
```

---

### Task 12 : Créer les compositions Course Intro, Social Hook, Text Reveal

**Files:**
- Create: `remotion/compositions/course-intro/CourseIntro.tsx`, `remotion/compositions/social-hook/SocialHook.tsx`, `remotion/compositions/text-reveal/TextReveal.tsx`

- [ ] **Créer `remotion/compositions/course-intro/CourseIntro.tsx`**

```tsx
// remotion/compositions/course-intro/CourseIntro.tsx
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { AnimatedText } from '@/remotion/shared/AnimatedText';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import type { CourseIntroProps } from './schema';

export const CourseIntro = ({
  courseTitle,
  authorName,
  chapterNumber,
  chapterTitle,
  accentColor,
  backgroundColor,
  durationInSeconds,
}: CourseIntroProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const lineProgress = spring({ frame: frame - fps * 0.8, fps, config: { damping: 20, stiffness: 80 } });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, width * 0.06], { extrapolateRight: 'clamp' });

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center' }}>
      <BackgroundGradient color1={accentColor} color2="#6366f1" backgroundColor={backgroundColor} />

      <div style={{ position: 'relative', zIndex: 1, paddingLeft: width * 0.1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatedText
          text={`CHAPITRE ${chapterNumber}`}
          delay={0}
          color={accentColor}
          fontSize={Math.round(width / 60)}
          fontWeight={600}
          style="fade"
        />
        <div style={{ width: lineWidth, height: 3, background: accentColor, borderRadius: 2 }} />
        <AnimatedText
          text={chapterTitle}
          delay={fps * 0.5}
          color="#ffffff"
          fontSize={Math.round(width / 18)}
          fontWeight={800}
          style="slide-up"
        />
        <AnimatedText
          text={courseTitle}
          delay={fps * 0.9}
          color="rgba(255,255,255,0.5)"
          fontSize={Math.round(width / 50)}
          fontWeight={400}
          style="fade"
        />
        <AnimatedText
          text={`par ${authorName}`}
          delay={fps * 1.1}
          color="rgba(255,255,255,0.4)"
          fontSize={Math.round(width / 60)}
          fontWeight={300}
          style="fade"
        />
      </div>
    </div>
  );
};
```

- [ ] **Créer `remotion/compositions/social-hook/SocialHook.tsx`**

```tsx
// remotion/compositions/social-hook/SocialHook.tsx
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { AnimatedText } from '@/remotion/shared/AnimatedText';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import type { SocialHookProps } from './schema';

export const SocialHook = ({
  hookText,
  subText,
  accentColor,
  backgroundColor,
  textColor,
  durationInSeconds,
}: SocialHookProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const pulseProgress = spring({ frame: frame - fps * 0.2, fps, config: { damping: 6, stiffness: 120, mass: 0.8 } });
  const scale = interpolate(pulseProgress, [0, 1], [0.85, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <BackgroundGradient color1={accentColor} color2="#ec4899" backgroundColor={backgroundColor} animated={false} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 40px', transform: `scale(${scale})` }}>
        <div style={{ color: textColor, fontSize: Math.round(width / 9), fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
          {hookText}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, opacity: interpolate(frame, [fps * 1, fps * 1.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        <AnimatedText
          text={subText}
          delay={fps * 1}
          color="rgba(255,255,255,0.7)"
          fontSize={Math.round(width / 18)}
          fontWeight={500}
          style="fade"
        />
      </div>
    </div>
  );
};
```

- [ ] **Créer `remotion/compositions/text-reveal/TextReveal.tsx`**

```tsx
// remotion/compositions/text-reveal/TextReveal.tsx
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimatedText } from '@/remotion/shared/AnimatedText';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import type { TextRevealProps } from './schema';

export const TextReveal = ({
  lines,
  fontSizeMultiplier,
  accentColor,
  backgroundColor,
  revealStyle,
  durationInSeconds,
}: TextRevealProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const delayPerLine = fps * 0.5;
  const baseFontSize = Math.round((width / (lines.length > 3 ? 12 : 8)) * fontSizeMultiplier);
  const textStyle = revealStyle === 'typewriter' ? 'fade' : revealStyle === 'slide' ? 'slide-up' : 'fade';

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: Math.round(baseFontSize * 0.4) }}>
      <BackgroundGradient color1={accentColor} color2="#6366f1" backgroundColor={backgroundColor} animated={false} />

      {lines.map((line, i) => (
        <div key={i} style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedText
            text={line}
            delay={i * delayPerLine}
            color={i === 0 ? '#ffffff' : i % 2 === 0 ? accentColor : 'rgba(255,255,255,0.7)'}
            fontSize={i === 0 ? baseFontSize : Math.round(baseFontSize * 0.75)}
            fontWeight={i === 0 ? 800 : 500}
            style={textStyle}
          />
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Commit**

```bash
git add remotion/compositions/course-intro/CourseIntro.tsx remotion/compositions/social-hook/SocialHook.tsx remotion/compositions/text-reveal/TextReveal.tsx
git commit -m "feat: add Course Intro, Social Hook, Text Reveal compositions"
```

---

### Task 13 : Créer Root.tsx et enregistrer les compositions

**Files:**
- Create: `remotion/Root.tsx`

- [ ] **Créer `remotion/Root.tsx`**

```tsx
// remotion/Root.tsx
import { Composition } from 'remotion';
import { SaasPromo } from './compositions/saas-promo/SaasPromo';
import { saasPromoSchema } from './compositions/saas-promo/schema';
import { CourseIntro } from './compositions/course-intro/CourseIntro';
import { courseIntroSchema } from './compositions/course-intro/schema';
import { SocialHook } from './compositions/social-hook/SocialHook';
import { socialHookSchema } from './compositions/social-hook/schema';
import { TextReveal } from './compositions/text-reveal/TextReveal';
import { textRevealSchema } from './compositions/text-reveal/schema';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SaasPromo"
        component={SaasPromo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        schema={saasPromoSchema}
        defaultProps={saasPromoSchema.parse({})}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.durationInSeconds * 30,
        })}
      />
      <Composition
        id="CourseIntro"
        component={CourseIntro}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={courseIntroSchema}
        defaultProps={courseIntroSchema.parse({})}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.durationInSeconds * 30,
        })}
      />
      <Composition
        id="SocialHook"
        component={SocialHook}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1920}
        schema={socialHookSchema}
        defaultProps={socialHookSchema.parse({})}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.durationInSeconds * 30,
        })}
      />
      <Composition
        id="TextReveal"
        component={TextReveal}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={textRevealSchema}
        defaultProps={textRevealSchema.parse({})}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.durationInSeconds * 30,
        })}
      />
    </>
  );
};
```

- [ ] **Vérifier que Remotion Studio démarre**

```bash
npm run remotion:studio
```

Attendu : Remotion Studio s'ouvre sur http://localhost:3001 avec les 4 compositions visibles.

- [ ] **Commit**

```bash
git add remotion/Root.tsx
git commit -m "feat: register all 4 compositions in Root.tsx"
```

---

## Phase 2A — Interface Studio

### Task 14 : Créer le Zustand store

**Files:**
- Create: `lib/store/studio.ts`

- [ ] **Créer `lib/store/studio.ts`**

```ts
// lib/store/studio.ts
import { create } from 'zustand';
import type { TemplateId, VideoFormat } from '@/lib/templates';
import { TEMPLATES } from '@/lib/templates';

interface RenderState {
  isRendering: boolean;
  progress: number;
  lastRenderPath: string | null;
}

interface StudioState {
  // Template
  templateId: TemplateId;
  props: Record<string, unknown>;
  format: VideoFormat;

  // Render
  render: RenderState;

  // AI
  isGenerating: boolean;

  // Actions
  setTemplateId: (id: TemplateId) => void;
  setProps: (props: Record<string, unknown>) => void;
  setProp: (key: string, value: unknown) => void;
  setFormat: (format: VideoFormat) => void;
  setRenderProgress: (progress: number) => void;
  setRenderComplete: (path: string) => void;
  setRenderIdle: () => void;
  setIsGenerating: (v: boolean) => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  templateId: 'saas-promo',
  props: TEMPLATES['saas-promo'].defaultProps,
  format: '16:9',
  render: { isRendering: false, progress: 0, lastRenderPath: null },
  isGenerating: false,

  setTemplateId: (id) => set({
    templateId: id,
    props: TEMPLATES[id].defaultProps,
    format: TEMPLATES[id].defaultFormat,
  }),

  setProps: (props) => set({ props }),

  setProp: (key, value) => set((state) => ({
    props: { ...state.props, [key]: value },
  })),

  setFormat: (format) => set({ format }),

  setRenderProgress: (progress) => set((state) => ({
    render: { ...state.render, isRendering: true, progress },
  })),

  setRenderComplete: (path) => set({
    render: { isRendering: false, progress: 100, lastRenderPath: path },
  }),

  setRenderIdle: () => set({
    render: { isRendering: false, progress: 0, lastRenderPath: null },
  }),

  setIsGenerating: (v) => set({ isGenerating: v }),
}));
```

- [ ] **Commit**

```bash
git add lib/store/studio.ts
git commit -m "feat: add Zustand studio store"
```

---

### Task 15 : Créer le Dashboard

**Files:**
- Create: `app/(studio)/page.tsx`, `components/dashboard/ProjectCard.tsx`, `components/dashboard/ProjectGrid.tsx`

- [ ] **Créer `components/dashboard/ProjectCard.tsx`**

```tsx
// components/dashboard/ProjectCard.tsx
'use client';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  name: string;
  templateName: string;
  format: string;
  updatedAt: string;
  accentColor?: string;
}

export const ProjectCard = ({ id, name, templateName, format, updatedAt, accentColor = '#a855f7' }: ProjectCardProps) => {
  return (
    <Link href={`/editor/${id}`}>
      <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
        <Card className="overflow-hidden border-border/40 bg-surface-elevated hover:border-border cursor-pointer transition-colors">
          <div
            className="h-32 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${accentColor}20, #38bdf810)` }}
          >
            <span className="text-xs font-mono" style={{ color: accentColor }}>▶ {templateName}</span>
          </div>
          <div className="p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate">{name}</span>
              <Badge variant="outline" className="text-xs shrink-0">{format}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{updatedAt}</span>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
};
```

- [ ] **Créer `components/dashboard/ProjectGrid.tsx`**

```tsx
// components/dashboard/ProjectGrid.tsx
'use client';
import { motion } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Données statiques pour v1 (pas de BDD)
const DEMO_PROJECTS = [
  { id: 'demo-1', name: 'Product Launch', templateName: 'SaaS Promo', format: '16:9', updatedAt: 'il y a 2h', accentColor: '#a855f7' },
  { id: 'demo-2', name: 'Reel Intro', templateName: 'Social Hook', format: '9:16', updatedAt: 'hier', accentColor: '#f59e0b' },
];

export const ProjectGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {DEMO_PROJECTS.map((project, i) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <ProjectCard {...project} />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: DEMO_PROJECTS.length * 0.08 }}
      >
        <Link href="/editor/new">
          <div className="h-full min-h-40 flex items-center justify-center border border-dashed border-border/40 rounded-lg hover:border-border/70 transition-colors cursor-pointer">
            <span className="text-3xl text-muted-foreground">+</span>
          </div>
        </Link>
      </motion.div>
    </div>
  );
};
```

- [ ] **Créer `app/(studio)/page.tsx`**

```tsx
// app/(studio)/page.tsx
import { ProjectGrid } from '@/components/dashboard/ProjectGrid';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <span className="text-base font-bold text-brand">⬡ StellarPulse</span>
        <div className="flex items-center gap-3">
          <Link href="/renders">
            <Button variant="ghost" size="sm">Renders</Button>
          </Link>
          <Link href="/editor/new">
            <Button size="sm">+ Nouvelle vidéo</Button>
          </Link>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Mes vidéos</h1>
          <p className="text-sm text-muted-foreground mt-1">Créez des vidéos professionnelles pour vos réseaux</p>
        </div>
        <ProjectGrid />
      </main>
    </div>
  );
}
```

- [ ] **Tester dans le navigateur**

```bash
npm run dev
```

Naviguer vers http://localhost:3000 — Dashboard doit s'afficher avec les cartes projets.

- [ ] **Commit**

```bash
git add app/ components/dashboard/
git commit -m "feat: add Dashboard page with project grid"
```

---

### Task 16 : Créer les composants TemplateSelector et FormatSelector

**Files:**
- Create: `components/studio/TemplateSelector.tsx`, `components/studio/FormatSelector.tsx`

- [ ] **Créer `components/studio/TemplateSelector.tsx`**

```tsx
// components/studio/TemplateSelector.tsx
'use client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TEMPLATES, type TemplateId } from '@/lib/templates';
import { useStudioStore } from '@/lib/store/studio';

export const TemplateSelector = () => {
  const { templateId, setTemplateId } = useStudioStore();

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Template</label>
      <Tabs value={templateId} onValueChange={(v) => setTemplateId(v as TemplateId)}>
        <TabsList className="grid grid-cols-2 h-auto gap-1 bg-transparent p-0">
          {Object.values(TEMPLATES).map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="text-xs py-1.5 data-[state=active]:bg-brand/20 data-[state=active]:text-brand"
            >
              {t.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
```

- [ ] **Créer `components/studio/FormatSelector.tsx`**

```tsx
// components/studio/FormatSelector.tsx
'use client';
import { Button } from '@/components/ui/button';
import { TEMPLATES, type VideoFormat } from '@/lib/templates';
import { useStudioStore } from '@/lib/store/studio';

const FORMAT_LABELS: Record<VideoFormat, { label: string; icon: string }> = {
  '16:9': { label: '16:9', icon: '▬' },
  '9:16': { label: '9:16', icon: '▮' },
  '1:1': { label: '1:1', icon: '■' },
};

export const FormatSelector = () => {
  const { templateId, format, setFormat } = useStudioStore();
  const supportedFormats = TEMPLATES[templateId].supportedFormats;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Format</label>
      <div className="flex gap-2">
        {(Object.keys(FORMAT_LABELS) as VideoFormat[]).map((f) => {
          const isSupported = supportedFormats.includes(f);
          const isActive = format === f;
          return (
            <Button
              key={f}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              disabled={!isSupported}
              onClick={() => setFormat(f)}
              className={`text-xs gap-1.5 ${isActive ? 'bg-brand/20 text-brand border-brand/40 hover:bg-brand/30' : ''}`}
            >
              <span>{FORMAT_LABELS[f].icon}</span>
              {FORMAT_LABELS[f].label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Commit**

```bash
git add components/studio/TemplateSelector.tsx components/studio/FormatSelector.tsx
git commit -m "feat: add TemplateSelector and FormatSelector components"
```

---

### Task 17 : Créer le PreviewPanel avec Remotion Player

**Files:**
- Create: `components/studio/PreviewPanel.tsx`

- [ ] **Créer `components/studio/PreviewPanel.tsx`**

```tsx
// components/studio/PreviewPanel.tsx
'use client';
import { Player } from '@remotion/player';
import { useStudioStore } from '@/lib/store/studio';
import { FORMAT_DIMENSIONS, TEMPLATES } from '@/lib/templates';
import { SaasPromo } from '@/remotion/compositions/saas-promo/SaasPromo';
import { CourseIntro } from '@/remotion/compositions/course-intro/CourseIntro';
import { SocialHook } from '@/remotion/compositions/social-hook/SocialHook';
import { TextReveal } from '@/remotion/compositions/text-reveal/TextReveal';

const COMPOSITION_MAP = {
  'saas-promo': SaasPromo,
  'course-intro': CourseIntro,
  'social-hook': SocialHook,
  'text-reveal': TextReveal,
} as const;

export const PreviewPanel = () => {
  const { templateId, props, format } = useStudioStore();
  const { width, height } = FORMAT_DIMENSIONS[format];
  const template = TEMPLATES[templateId];

  const validProps = (() => {
    const result = template.schema.safeParse(props);
    return result.success ? result.data : template.defaultProps;
  })();

  const durationInSeconds = (validProps as { durationInSeconds?: number }).durationInSeconds ?? 15;
  const Component = COMPOSITION_MAP[templateId];

  return (
    <div className="flex flex-col items-center justify-center h-full bg-black/40 gap-4 p-4">
      <div
        className="overflow-hidden rounded-lg border border-border/30"
        style={{ maxWidth: '100%', maxHeight: 'calc(100% - 60px)' }}
      >
        <Player
          component={Component as React.ComponentType<Record<string, unknown>>}
          durationInFrames={durationInSeconds * 30}
          fps={30}
          compositionWidth={width}
          compositionHeight={height}
          inputProps={validProps as Record<string, unknown>}
          style={{
            width: format === '9:16' ? 'auto' : '100%',
            height: format === '9:16' ? 'calc(100vh - 160px)' : 'auto',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 160px)',
          }}
          controls
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {width}×{height} · 30fps · {durationInSeconds}s
      </div>
    </div>
  );
};
```

- [ ] **Commit**

```bash
git add components/studio/PreviewPanel.tsx
git commit -m "feat: add PreviewPanel with Remotion Player"
```

---

### Task 18 : Créer le ControlPanel

**Files:**
- Create: `components/studio/ControlPanel.tsx`

- [ ] **Créer `components/studio/ControlPanel.tsx`**

```tsx
// components/studio/ControlPanel.tsx
'use client';
import { TemplateSelector } from './TemplateSelector';
import { FormatSelector } from './FormatSelector';
import { AIPromptInput } from './AIPromptInput';
import { RenderButton } from './RenderButton';
import { useStudioStore } from '@/lib/store/studio';
import { TEMPLATES } from '@/lib/templates';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export const ControlPanel = () => {
  const { templateId, props, setProp } = useStudioStore();
  const template = TEMPLATES[templateId];
  const schema = template.schema;

  // Extraire les champs du schéma Zod pour le formulaire dynamique
  const shape = (schema as { shape?: Record<string, { description?: string }> }).shape ?? {};
  const fields = Object.entries(shape).filter(([key]) => key !== 'durationInSeconds');

  return (
    <div className="h-full flex flex-col border-r border-border/40 bg-surface-elevated">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          <TemplateSelector />
          <Separator className="opacity-30" />
          <FormatSelector />
          <Separator className="opacity-30" />

          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contenu</label>
            {fields.map(([key]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                <Input
                  value={String(props[key] ?? '')}
                  onChange={(e) => setProp(key, e.target.value)}
                  className="h-8 text-xs bg-surface border-border/40"
                />
              </div>
            ))}
          </div>

          <Separator className="opacity-30" />
          <AIPromptInput />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/40">
        <RenderButton />
      </div>
    </div>
  );
};
```

- [ ] **Commit**

```bash
git add components/studio/ControlPanel.tsx
git commit -m "feat: add ControlPanel with dynamic Zod-driven form"
```

---

### Task 19 : Créer la page Editor et la page Renders

**Files:**
- Create: `app/(studio)/editor/[id]/page.tsx`, `app/renders/page.tsx`, `components/renders/RenderList.tsx`

- [ ] **Créer `app/(studio)/editor/[id]/page.tsx`**

```tsx
// app/(studio)/editor/[id]/page.tsx
import { ControlPanel } from '@/components/studio/ControlPanel';
import { PreviewPanel } from '@/components/studio/PreviewPanel';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditorPage() {
  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      <header className="border-b border-border/40 px-4 py-2 flex items-center gap-4 shrink-0">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-xs">← Dashboard</Button>
        </Link>
        <span className="text-sm font-medium text-brand">⬡ StellarPulse Studio</span>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 shrink-0 overflow-hidden">
          <ControlPanel />
        </div>
        <div className="flex-1 overflow-hidden">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Créer `components/renders/RenderList.tsx`**

```tsx
// components/renders/RenderList.tsx
'use client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useStudioStore } from '@/lib/store/studio';

export const RenderList = () => {
  const { render } = useStudioStore();

  return (
    <div className="space-y-3">
      {render.lastRenderPath && (
        <div className="flex items-center justify-between bg-surface-elevated border border-border/40 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-500 border-green-500/30">✓ Terminé</Badge>
            <div>
              <div className="text-sm font-medium">{render.lastRenderPath.split('/').pop()}</div>
              <div className="text-xs text-muted-foreground">Rendu complété</div>
            </div>
          </div>
          <a href={`/${render.lastRenderPath}`} download className="text-xs text-brand hover:underline">
            ⬇ Download
          </a>
        </div>
      )}

      {render.isRendering && (
        <div className="flex items-center justify-between bg-surface-elevated border border-border/40 rounded-lg p-4 gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">⟳ En cours</Badge>
            <div className="text-sm font-medium">Rendu en cours…</div>
          </div>
          <div className="w-32">
            <Progress value={render.progress} className="h-1.5" />
            <div className="text-xs text-muted-foreground text-right mt-0.5">{Math.round(render.progress)}%</div>
          </div>
        </div>
      )}

      {!render.lastRenderPath && !render.isRendering && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Aucun rendu pour l'instant. Crée une vidéo dans l'éditeur.
        </div>
      )}
    </div>
  );
};
```

- [ ] **Créer `app/renders/page.tsx`**

```tsx
// app/renders/page.tsx
import { RenderList } from '@/components/renders/RenderList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RendersPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <span className="text-base font-bold text-brand">⬡ StellarPulse</span>
        <Link href="/"><Button variant="ghost" size="sm">← Dashboard</Button></Link>
      </header>
      <main className="px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Historique des rendus</h1>
        <RenderList />
      </main>
    </div>
  );
}
```

- [ ] **Tester l'éditeur**

```bash
npm run dev
```

Naviguer vers http://localhost:3000/editor/test — le split-pane doit s'afficher avec le Remotion Player actif.

- [ ] **Commit**

```bash
git add app/ components/renders/
git commit -m "feat: add Editor split-pane page and Renders history page"
```

---

## Phase 2B — Intégration IA (parallèle avec 2A)

### Task 20 : Configurer Vercel AI SDK + Claude

**Files:**
- Create: `lib/ai/client.ts`, `lib/ai/prompts.ts`

- [ ] **Configurer l'auth AI Gateway** (choisir une option)

**Option A — OIDC via Vercel (recommandé, token auto-refresh) :**
```bash
vercel link          # Lier le projet à Vercel
vercel env pull .env.local   # Provisionne VERCEL_OIDC_TOKEN (~24h)
```

**Option B — Sans Vercel (CI/CD) :**
```bash
# Utiliser vercel env pull depuis un compte Vercel pour obtenir VERCEL_OIDC_TOKEN
# ou configurer un token de service via le dashboard Vercel AI Gateway
```

- [ ] **Créer `lib/ai/client.ts`**

```ts
// lib/ai/client.ts
// Vercel AI SDK v6 : une plain string "provider/model" route
// automatiquement via AI Gateway (auth OIDC via VERCEL_OIDC_TOKEN).
// Aucun import de provider nécessaire.
export const AI_MODEL = 'anthropic/claude-sonnet-4.6';
```

- [ ] **Créer `lib/ai/prompts.ts`**

```ts
// lib/ai/prompts.ts
import type { TemplateId } from '@/lib/templates';
import { TEMPLATES } from '@/lib/templates';

export function buildSystemPrompt(templateId: TemplateId): string {
  const template = TEMPLATES[templateId];
  const schemaShape = (template.schema as { shape?: Record<string, { description?: string }> }).shape ?? {};
  const fields = Object.keys(schemaShape).join(', ');

  return `Tu es un expert en création de vidéos professionnelles pour les réseaux sociaux.
Tu génères des props JSON pour le template "${template.name}".

Description du template: ${template.description}

Les props que tu dois générer sont: ${fields}

IMPORTANT:
- Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans explications.
- Les couleurs doivent être au format hex (#rrggbb).
- Les durées sont en secondes.
- Garde les textes courts et percutants.
- Adapte le contenu au format ${template.name}.

Exemple de réponse valide (JSON pur):
${JSON.stringify(template.defaultProps, null, 2)}`;
}

export function buildUserPrompt(userPrompt: string): string {
  return `Génère les props pour cette vidéo: "${userPrompt}"`;
}
```

- [ ] **Commit**

```bash
git add lib/ai/
git commit -m "feat: configure Vercel AI SDK + Claude client and prompts"
```

---

### Task 21 : Créer la route API AI generate

**Files:**
- Create: `app/api/ai/generate/route.ts`

- [ ] **Créer `app/api/ai/generate/route.ts`**

```ts
// app/api/ai/generate/route.ts
import { streamText } from 'ai';
import { AI_MODEL } from '@/lib/ai/client';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai/prompts';
import { TEMPLATES } from '@/lib/templates';
import { z } from 'zod';

const requestSchema = z.object({
  prompt: z.string().min(1).max(500),
  templateId: z.enum(['saas-promo', 'course-intro', 'social-hook', 'text-reveal']),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { prompt, templateId } = parsed.data;

  const result = streamText({
    model: AI_MODEL, // plain string → AI Gateway auto-routing
    system: buildSystemPrompt(templateId),
    prompt: buildUserPrompt(prompt),
    maxTokens: 500,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Commit**

```bash
git add app/api/ai/generate/
git commit -m "feat: add POST /api/ai/generate with Claude streaming"
```

---

### Task 22 : Créer le composant AIPromptInput

**Files:**
- Create: `components/studio/AIPromptInput.tsx`

- [ ] **Créer `components/studio/AIPromptInput.tsx`**

```tsx
// components/studio/AIPromptInput.tsx
'use client';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useStudioStore } from '@/lib/store/studio';
import { TEMPLATES } from '@/lib/templates';

export const AIPromptInput = () => {
  const [prompt, setPrompt] = useState('');
  const { templateId, setProps, isGenerating, setIsGenerating } = useStudioStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, templateId }),
      });

      if (!res.ok) throw new Error('Génération échouée');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      // Parser le JSON généré par Claude
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rawProps = JSON.parse(jsonMatch[0]);
        const template = TEMPLATES[templateId];
        const validated = template.schema.safeParse(rawProps);
        if (validated.success) {
          setProps(validated.data as Record<string, unknown>);
        }
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        ✦ Générer avec IA
      </label>
      <Textarea
        placeholder="Ex: 'Intro SaaS dark mode 15s pour une app de gestion de tâches'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="text-xs min-h-16 bg-surface border-border/40 resize-none"
        onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleGenerate(); }}
      />
      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        size="sm"
        className="w-full text-xs bg-brand/20 text-brand border border-brand/30 hover:bg-brand/30"
        variant="ghost"
      >
        {isGenerating ? '⟳ Génération…' : '✦ Générer avec IA'}
      </Button>
    </div>
  );
};
```

- [ ] **Tester le flux IA**

```bash
npm run dev
```

1. Ouvrir http://localhost:3000/editor/test
2. Entrer un prompt dans la zone IA
3. Cliquer "Générer avec IA"
4. Vérifier que les champs se mettent à jour et que le Player re-render

- [ ] **Commit**

```bash
git add components/studio/AIPromptInput.tsx
git commit -m "feat: add AIPromptInput with streaming Claude generation"
```

---

## Phase 3 — Pipeline de Rendu

### Task 23 : Créer la route API render

**Files:**
- Create: `app/api/render/route.ts`, `lib/remotion/render.ts`

- [ ] **Créer le dossier `public/renders/`**

```bash
mkdir -p "C:/Users/gmax9/OneDrive/Bureau/stellarPulse/content_creator_video/public/renders"
echo "# Renders output directory — gitignored" > public/renders/.gitkeep
```

- [ ] **Créer `lib/remotion/render.ts`**

```ts
// lib/remotion/render.ts
import { spawn } from 'node:child_process';
import path from 'node:path';

export interface RenderJob {
  compositionId: string;
  outputName: string;
  width: number;
  height: number;
  props: Record<string, unknown>;
}

export function spawnRender(
  job: RenderJob,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(process.cwd(), 'public', 'renders', `${job.outputName}.mp4`);
    const propsJson = JSON.stringify(job.props);

    const child = spawn('npx', [
      'remotion',
      'render',
      'remotion/Root.tsx',
      job.compositionId,
      outputPath,
      `--props=${propsJson}`,
      '--log=verbose',
    ], { shell: true });

    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      // Remotion affiche "X% done" dans stdout
      const match = text.match(/(\d+)%/);
      if (match) onProgress(parseInt(match[1], 10));
    });

    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      const match = text.match(/(\d+)%/);
      if (match) onProgress(parseInt(match[1], 10));
    });

    child.on('close', (code) => {
      if (code === 0) resolve(`renders/${job.outputName}.mp4`);
      else reject(new Error(`Render exited with code ${code}`));
    });
  });
}
```

- [ ] **Créer `app/api/render/route.ts`**

```ts
// app/api/render/route.ts
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { FORMAT_DIMENSIONS, TEMPLATES } from '@/lib/templates';
import { spawnRender } from '@/lib/remotion/render';

// Map compositionId → Remotion composition ID
const COMPOSITION_IDS: Record<string, string> = {
  'saas-promo': 'SaasPromo',
  'course-intro': 'CourseIntro',
  'social-hook': 'SocialHook',
  'text-reveal': 'TextReveal',
};

// Store en mémoire des progresses (pour dev mono-utilisateur)
export const renderProgress: Map<string, number> = new Map();

const renderRequestSchema = z.object({
  templateId: z.enum(['saas-promo', 'course-intro', 'social-hook', 'text-reveal']),
  format: z.enum(['16:9', '9:16', '1:1']),
  props: z.record(z.unknown()),
  outputName: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = renderRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { templateId, format, props, outputName } = parsed.data;
  const template = TEMPLATES[templateId];
  const validatedProps = template.schema.safeParse(props);

  if (!validatedProps.success) {
    return Response.json({ error: 'Invalid props', details: validatedProps.error.flatten() }, { status: 400 });
  }

  const { width, height } = FORMAT_DIMENSIONS[format];

  // Lancer le rendu en arrière-plan (non bloquant)
  renderProgress.set(outputName, 0);

  spawnRender(
    {
      compositionId: COMPOSITION_IDS[templateId],
      outputName,
      width,
      height,
      props: validatedProps.data as Record<string, unknown>,
    },
    (percent) => renderProgress.set(outputName, percent),
  )
    .then(() => renderProgress.set(outputName, 100))
    .catch(() => renderProgress.set(outputName, -1));

  return Response.json({ renderKey: outputName, message: 'Render started' }, { status: 202 });
}
```

- [ ] **Commit**

```bash
git add app/api/render/ lib/remotion/
git commit -m "feat: add POST /api/render with Remotion CLI spawn"
```

---

### Task 24 : Créer la route SSE progress

**Files:**
- Create: `app/api/render/progress/route.ts`

- [ ] **Créer `app/api/render/progress/route.ts`**

```ts
// app/api/render/progress/route.ts
import { type NextRequest } from 'next/server';
import { renderProgress } from '../route';

export async function GET(req: NextRequest) {
  const renderKey = req.nextUrl.searchParams.get('key');

  if (!renderKey) {
    return Response.json({ error: 'Missing key' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        const progress = renderProgress.get(renderKey) ?? 0;
        const done = progress === 100;
        const error = progress === -1;

        const data = JSON.stringify({
          progress: error ? 0 : progress,
          done,
          error,
          filePath: done ? `renders/${renderKey}.mp4` : null,
        });

        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

        if (done || error) {
          clearInterval(interval);
          controller.close();
          if (!error) renderProgress.delete(renderKey);
        }
      }, 500);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
```

- [ ] **Commit**

```bash
git add app/api/render/progress/
git commit -m "feat: add GET /api/render/progress SSE stream"
```

---

### Task 25 : Créer le RenderButton avec progress

**Files:**
- Create: `components/studio/RenderButton.tsx`

- [ ] **Créer `components/studio/RenderButton.tsx`**

```tsx
// components/studio/RenderButton.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useStudioStore } from '@/lib/store/studio';
import { TEMPLATES } from '@/lib/templates';

export const RenderButton = () => {
  const { templateId, props, format, render, setRenderProgress, setRenderComplete, setRenderIdle } = useStudioStore();
  const [error, setError] = useState<string | null>(null);

  const handleRender = async () => {
    if (render.isRendering) return;
    setError(null);
    setRenderIdle();

    const outputName = `${templateId}-${Date.now()}`;

    // Lancer le rendu
    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, format, props, outputName }),
    });

    if (!res.ok) {
      setError('Erreur au démarrage du rendu');
      return;
    }

    setRenderProgress(1);

    // Écouter le SSE progress
    const sse = new EventSource(`/api/render/progress?key=${outputName}`);

    sse.onmessage = (e) => {
      const data = JSON.parse(e.data) as { progress: number; done: boolean; error: boolean; filePath: string | null };
      if (data.error) {
        setError('Rendu échoué');
        setRenderIdle();
        sse.close();
        return;
      }
      if (data.done && data.filePath) {
        setRenderComplete(data.filePath);
        sse.close();
      } else {
        setRenderProgress(data.progress);
      }
    };

    sse.onerror = () => {
      setError('Connexion SSE perdue');
      setRenderIdle();
      sse.close();
    };
  };

  return (
    <div className="space-y-2">
      {render.isRendering && (
        <div className="space-y-1">
          <Progress value={render.progress} className="h-1.5" />
          <div className="text-xs text-muted-foreground text-center">{Math.round(render.progress)}% — rendu en cours…</div>
        </div>
      )}

      {render.lastRenderPath && !render.isRendering && (
        <a
          href={`/${render.lastRenderPath}`}
          download
          className="block text-center text-xs text-brand hover:underline py-1"
        >
          ⬇ Télécharger le MP4
        </a>
      )}

      {error && <div className="text-xs text-red-400 text-center">{error}</div>}

      <Button
        onClick={handleRender}
        disabled={render.isRendering}
        size="sm"
        className="w-full text-xs"
        variant="outline"
      >
        {render.isRendering ? `⟳ ${Math.round(render.progress)}%` : '⬇ Render MP4'}
      </Button>
    </div>
  );
};
```

- [ ] **Commit**

```bash
git add components/studio/RenderButton.tsx
git commit -m "feat: add RenderButton with SSE progress tracking"
```

---

### Task 26 : Tester le pipeline complet de bout en bout

- [ ] **Vérifier que ffmpeg est installé**

```bash
ffmpeg -version
```

Si non installé : https://ffmpeg.org/download.html (Windows : `winget install Gyan.FFmpeg`)

- [ ] **Vérifier que tous les services démarrent**

```bash
npm run dev
```

Attendu : Next.js sur http://localhost:3000 sans erreur de compilation.

- [ ] **Test E2E du flux complet**

1. Ouvrir http://localhost:3000
2. Cliquer "+ Nouvelle vidéo" → arrive sur /editor/new
3. Sélectionner template "SaaS Promo"
4. Entrer un prompt IA : "Présentation d'une app de gestion de projet dark mode"
5. Cliquer "Générer avec IA" → vérifier que les props se remplissent
6. Cliquer "Render MP4" → vérifier la progress bar
7. À completion : vérifier que `public/renders/saas-promo-[timestamp].mp4` existe
8. Cliquer "Télécharger le MP4" → vérifier le téléchargement

- [ ] **Vérifier `public/renders/` est gitignored**

```bash
git status
```

Les fichiers `.mp4` ne doivent pas apparaître.

- [ ] **Commit final**

```bash
git add -A
git commit -m "feat: complete render pipeline — end-to-end video generation working"
```

---

### Task 27 : Installer les skills Remotion externes

- [ ] **Installer les 4 skills**

```bash
npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices
```

```bash
npx skills add https://github.com/inferen-sh/skills --skill remotion-render
```

```bash
npx skills add https://github.com/google-labs-code/stitch-skills --skill remotion
```

```bash
npx skills add https://github.com/remotion-dev/remotion --skill add-sfx
```

> Si un repo échoue, créer le skill manuellement dans `.claude/skills/<nom>.md` avec le contenu de la documentation officielle.

- [ ] **Vérifier que les skills sont accessibles**

```bash
ls .claude/skills/
```

Attendu : `remotion-best-practices.md`, `remotion-render.md`, `remotion.md`, `add-sfx.md`, `framer-motion.md`, `21st-dev-components.md`

- [ ] **Mettre à jour `STATE.md`**

```markdown
## Session courante
Date: 2026-04-07
Status: Projet complet — v1.0 opérationnelle

## Dernière tâche complétée
- Pipeline complet bout-en-bout : preview + IA + render MP4

## En cours
- Aucun blocker

## Prochaines étapes (ROADMAP v2)
- Remotion Lambda pour le rendu cloud
- Persistance des projets (fichiers JSON ou SQLite)
```

- [ ] **Commit final du projet**

```bash
git add .claude/skills/ STATE.md
git commit -m "chore: install Remotion skills + update STATE.md — v1.0 complete"
```

---

### Task 28 : Review qualité finale

- [ ] **Lancer Biome lint**

```bash
npm run lint
```

Corriger les erreurs critiques :

```bash
npm run lint:fix
```

- [ ] **Vérifier l'absence de `any` TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Tester les 4 templates en preview**

Pour chaque template (saas-promo, course-intro, social-hook, text-reveal) :
1. Le sélectionner dans l'éditeur
2. Vérifier que le Player s'affiche sans erreur
3. Modifier un champ → le Player se met à jour

- [ ] **Tester les 3 formats**

Pour le template "text-reveal" (supporte tous les formats) :
1. Sélectionner 16:9 → Player en landscape
2. Sélectionner 9:16 → Player en portrait
3. Sélectionner 1:1 → Player en carré

- [ ] **Commit de review**

```bash
git add -A
git commit -m "chore: lint fixes and final quality review"
```

---

## Récapitulatif des tâches

| # | Tâche | Phase | Agent |
|---|---|---|---|
| 1 | Scaffold Next.js 15 | 1A | Infra |
| 2 | Tailwind v4 dark theme | 1A | Infra |
| 3 | shadcn/ui install | 1A | Infra |
| 4 | Fichiers écosystème racine | 1A | Infra |
| 5 | `.claude/` setup | 1A | Infra |
| 6 | `.github/` templates | 1A | Infra |
| 7 | `docs/` ARCHITECTURE + ADR | 1A | Infra |
| 8 | Skills Claude | 1A | Infra |
| 9 | Schémas Zod des templates | 1B | Remotion |
| 10 | Composants partagés Remotion | 1B | Remotion |
| 11 | Composition SaaS Promo | 1B | Remotion |
| 12 | Compositions Course / Hook / Text | 1B | Remotion |
| 13 | Root.tsx + enregistrement | 1B | Remotion |
| 14 | Zustand store | 2A | UI |
| 15 | Dashboard | 2A | UI |
| 16 | TemplateSelector + FormatSelector | 2A | UI |
| 17 | PreviewPanel + Remotion Player | 2A | UI |
| 18 | ControlPanel dynamique | 2A | UI |
| 19 | Editor page + Renders page | 2A | UI |
| 20 | Vercel AI SDK + Claude config | 2B | AI |
| 21 | `/api/ai/generate` route | 2B | AI |
| 22 | AIPromptInput component | 2B | AI |
| 23 | `/api/render` route | 3 | Render |
| 24 | `/api/render/progress` SSE | 3 | Render |
| 25 | RenderButton + progress UI | 3 | Render |
| 26 | Test E2E bout-en-bout | 3 | Render |
| 27 | Skills externes + STATE.md | 3 | Infra |
| 28 | Review qualité finale | Review | Review |
