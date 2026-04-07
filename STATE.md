# STATE.md — StellarPulse Video Creator

## Session courante
Date: 2026-04-07
Status: Projet complet — v1.0 opérationnelle

## Dernière tâche complétée
- Pipeline complet bout-en-bout : preview + IA + render MP4
- 4 skills Remotion installés

## Fonctionnalités livrées
- Dashboard avec grille de projets
- Éditeur split-pane (ControlPanel + PreviewPanel)
- 4 templates Remotion : SaaS Promo, Course Intro, Social Hook, Text Reveal
- 3 formats : 16:9, 9:16, 1:1
- Génération IA des props via Claude (Vercel AI Gateway)
- Rendu MP4 local via Remotion CLI + ffmpeg
- SSE progress bar pour le rendu
- 6 skills Claude configurés

## Blockers
- ffmpeg doit être installé manuellement pour le rendu : `winget install Gyan.FFmpeg`

## En cours
- Aucun blocker logiciel

## Prochaines étapes (ROADMAP v2)
- Remotion Lambda pour le rendu cloud
- Persistance des projets (fichiers JSON ou SQLite)
- Auth / multi-utilisateurs
- Marketplace de templates
