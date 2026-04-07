# CONTRIBUTING.md

## Setup
```bash
npm install
cp .env.example .env.local
```

## Ajouter un template
1. Créer `remotion/compositions/<nom>/schema.ts` avec le schéma Zod
2. Créer `remotion/compositions/<nom>/<Nom>.tsx` avec la composition
3. Enregistrer dans `remotion/Root.tsx`
4. Ajouter les métadonnées dans `lib/templates.ts`

## Conventions
- TypeScript strict, pas de `any`
- Biome pour le lint : `npm run lint:fix`
- Commits en anglais, format : `feat:` / `fix:` / `chore:`
