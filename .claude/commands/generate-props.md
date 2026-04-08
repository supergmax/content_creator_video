# Commande : /generate-props

Génère des props JSON pour un template Remotion StellarPulse et les écrit dans `videos/<nom>/props.json`.

## Usage

```
/generate-props <template-id> <nom-video> <description>
```

**Exemples :**
```
/generate-props saas-promo mon-app "app de gestion de projet dark mode violet"
/generate-props social-hook fitness-hook "hook TikTok pour une app fitness"
/generate-props text-reveal citation-zen "citation motivationnelle sobre en 3 lignes"
/generate-props course-intro ts-chapitre3 "chapitre 3 d'un cours TypeScript avancé"
```

## Comportement attendu

1. Identifie le template ciblé (`saas-promo`, `course-intro`, `social-hook`, `text-reveal`)
2. Génère un objet JSON complet et valide selon le schéma Zod du template (voir ci-dessous)
3. Crée le dossier `videos/<nom-video>/` si nécessaire
4. Écrit le JSON dans `videos/<nom-video>/props.json`
5. Affiche le JSON généré dans le chat
6. Rappelle : "Ouvre http://localhost:3000/video/<nom-video> pour prévisualiser"

## Schémas Zod par template

### social-hook
```typescript
{
  hookText: string,          // texte accrocheur principal
  subText: string,           // texte secondaire (ex: "Thread below 👇")
  accentColor: string,       // hex color (ex: "#f59e0b")
  backgroundColor: string,   // hex color (ex: "#050505")
  textColor: string,         // hex color (ex: "#ffffff")
  durationInSeconds: number  // entre 3 et 30
}
```

### text-reveal
```typescript
{
  lines: string[],            // 1 à 5 lignes de texte
  fontSizeMultiplier: number, // 0.5 à 3
  accentColor: string,        // hex color
  backgroundColor: string,    // hex color
  revealStyle: "fade" | "slide" | "typewriter",
  durationInSeconds: number   // entre 3 et 60
}
```

### course-intro
```typescript
{
  courseTitle: string,
  authorName: string,
  chapterNumber: number,     // >= 1
  chapterTitle: string,
  accentColor: string,       // hex color
  backgroundColor: string,   // hex color
  durationInSeconds: number  // entre 5 et 30
}
```

### saas-promo
```typescript
{
  productName: string,
  tagline: string,
  ctaText: string,
  accentColor: string,       // hex color
  backgroundColor: string,   // hex color
  logoUrl?: string,          // URL publique optionnelle
  durationInSeconds: number  // entre 5 et 60
}
```
