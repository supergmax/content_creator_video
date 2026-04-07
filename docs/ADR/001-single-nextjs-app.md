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
