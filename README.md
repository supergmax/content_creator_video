# StellarPulse Video Creator

Studio de création vidéo professionnel local. Génère des vidéos pour TikTok, Reels, YouTube et LinkedIn.

## Démarrage rapide

```bash
npm install
cp .env.example .env.local
# Auth IA : vercel link && vercel env pull .env.local (provisionne VERCEL_OIDC_TOKEN)
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Templates disponibles
- **SaaS Promo** (16:9, 15-30s) — présentation produit dark mode
- **Course Intro** (16:9, 10-20s) — intro de cours
- **Social Hook** (9:16, 7-15s) — hook TikTok/Reels
- **Text Reveal** (tous formats, 5-30s) — animation typographique

## Stack
Next.js 15 · Remotion 4 · shadcn/ui · Framer Motion · Claude via Vercel AI Gateway
