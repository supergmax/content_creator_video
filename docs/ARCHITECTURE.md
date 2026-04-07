# Architecture — StellarPulse Video Creator

## Vue globale

```
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
  ├── POST /api/ai/generate → Claude AI Gateway → JSON props
  ├── POST /api/render → spawn Remotion CLI → MP4
  └── GET  /api/render/progress → SSE stream

Remotion Compositions (/remotion/)
  ├── SaasPromo
  ├── CourseIntro
  ├── SocialHook
  └── TextReveal
```

## Flux de données

1. **Preview live** : props Zustand → @remotion/player re-render
2. **Génération IA** : prompt → /api/ai/generate → props JSON → Zustand store → player
3. **Render** : bouton → /api/render → child_process spawn → SSE → MP4 fichier
