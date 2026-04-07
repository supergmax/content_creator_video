# STATE.md — StellarPulse Video Creator

## Session courante
Date: 2026-04-07
Status: **v1.0 complète et opérationnelle**

## Stack en production
- Next.js 15.5 · React 19 · TypeScript strict
- Remotion 4 · @remotion/player
- Framer Motion 12 · shadcn/ui · Tailwind v4
- Zustand 5 · Zod 4 · Biome 2

## Fonctionnalités livrées
- Dashboard avec grille de projets (`/`)
- Éditeur split-pane (`/editor/[id]`) : ControlPanel + PreviewPanel
- 4 templates Remotion avec schémas Zod :
  - SaaS Promo (16:9)
  - Course Intro (16:9)
  - Social Hook (9:16)
  - Text Reveal (16:9 · 9:16 · 1:1)
- Génération IA via **Claude Code subprocess** — sans clé API
- Render MP4 local via Remotion CLI + ffmpeg + SSE progress
- Historique des rendus persistant avec taille et date (`/renders`)
- 7 skills Claude Code dans `.claude/skills/`
- Commande `/generate-props` depuis Claude Code

## Prérequis installés
- ffmpeg 8.1 (`winget install Gyan.FFmpeg` — fait)
- Claude Code CLI (en cours d'exécution)

## Démarrer
```bash
npm run dev   # http://localhost:3000
```

## Blockers
- Aucun

## Derniers commits
- `ea41d44` feat: replace AI Gateway with claude CLI subprocess
- `b9c7a07` fix: command injection, SSE leak, AI error feedback, persistent render history
- `b1d9d48` chore: lint fixes and final quality review
