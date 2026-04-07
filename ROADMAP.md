# ROADMAP.md — StellarPulse Video Creator

## v1.0 — Studio local ✓ (2026-04-07)
- [x] Infrastructure Next.js 15 + Remotion 4 + TypeScript strict
- [x] 4 templates Remotion (SaaS Promo · Course Intro · Social Hook · Text Reveal)
- [x] 3 formats de sortie (16:9 · 9:16 · 1:1)
- [x] Preview live avec @remotion/player
- [x] Génération IA via Claude Code subprocess (sans clé API)
- [x] Render MP4 local via Remotion CLI + ffmpeg
- [x] SSE progress bar + historique des rendus
- [x] Écosystème Claude Code complet (7 skills + commandes)

## v1.1 — Améliorations UX
- [ ] Slider de durée dans le ControlPanel
- [ ] Bouton "Copier les props JSON"
- [ ] Preview vidéo inline dans `/renders`
- [ ] Composant `AudioTrack` partagé (musique de fond)
- [ ] Persistance des projets en JSON local (`~/.stellarpulse/projects/`)

## v2.0 — Rendu cloud
- [ ] Remotion Lambda (AWS) pour le rendu parallélisé
- [ ] Queue de rendus avec statuts
- [ ] Stockage S3 des MP4

## v3.0 — Collaboration & Marketplace
- [ ] Auth multi-utilisateurs
- [ ] Bibliothèque de templates communautaires
- [ ] Upload direct vers YouTube / TikTok / LinkedIn
- [ ] Éditeur de timeline drag & drop
