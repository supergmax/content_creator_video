# TODO.md — Backlog court terme

## v1.0 — Livré ✓
- [x] Infrastructure Next.js 15 + Remotion 4 + Biome + TypeScript strict
- [x] 4 templates Remotion : SaaS Promo, Course Intro, Social Hook, Text Reveal
- [x] 3 formats : 16:9 · 9:16 · 1:1
- [x] Preview live avec @remotion/player
- [x] Génération IA via Claude Code subprocess (sans clé API)
- [x] Render MP4 local via Remotion CLI + ffmpeg (SSE progress)
- [x] Historique des rendus persistant (`/renders`)
- [x] 7 skills Claude Code configurés
- [x] Commande `/generate-props`

## Bugs connus
- [ ] `durationInSeconds` non exposé dans le formulaire UI (contrôlé via IA ou JSON direct)

## Prochains quick wins (v1.1)
- [ ] Slider de durée dans le ControlPanel
- [ ] Bouton "Copier les props JSON" dans l'éditeur
- [ ] Preview vidéo inline dans la page `/renders` (balise `<video>`)
- [ ] Composant `AudioTrack` partagé pour ajouter de la musique aux compositions
