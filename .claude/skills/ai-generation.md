# Skill : Génération de props IA pour StellarPulse

## Rôle
Ce skill permet à Claude Code de générer directement des props JSON valides pour les templates Remotion de StellarPulse, sans passer par l'interface web.

## Templates disponibles

| ID | Nom | Champs clés |
|---|---|---|
| `saas-promo` | SaaS Promo (16:9) | productName, tagline, ctaText, accentColor, backgroundColor, durationInSeconds |
| `course-intro` | Course Intro (16:9) | courseTitle, authorName, chapterNumber, chapterTitle, accentColor, backgroundColor, durationInSeconds |
| `social-hook` | Social Hook (9:16) | hookText, subText, accentColor, backgroundColor, textColor, durationInSeconds |
| `text-reveal` | Text Reveal (tous formats) | lines[], fontSizeMultiplier, accentColor, backgroundColor, revealStyle, durationInSeconds |

## Contraintes de génération

- Couleurs en hex (`#rrggbb`) uniquement
- `durationInSeconds` : entre 5 et 30
- `revealStyle` pour text-reveal : `"word"` | `"line"` | `"character"`
- `lines` pour text-reveal : tableau de strings, max 5 éléments
- Textes courts et percutants (hooks < 10 mots, titres < 6 mots)

## Usage depuis Claude Code

Quand l'utilisateur demande de générer des props pour un template, produis un JSON valide selon le schéma du template.

### Exemple — social-hook

```json
{
  "hookText": "Arrête de perdre du temps",
  "subText": "L'app qui gère tout à ta place",
  "accentColor": "#6366f1",
  "backgroundColor": "#0a0a0a",
  "textColor": "#ffffff",
  "durationInSeconds": 10
}
```

### Exemple — saas-promo

```json
{
  "productName": "TaskFlow",
  "tagline": "Gérez vos projets sans effort",
  "ctaText": "Essai gratuit 14 jours",
  "accentColor": "#8b5cf6",
  "backgroundColor": "#020617",
  "durationInSeconds": 20
}
```

## Workflow recommandé

1. L'utilisateur décrit sa vidéo en langage naturel
2. Tu génères les props JSON selon le template ciblé
3. L'utilisateur colle le JSON dans le champ correspondant de l'éditeur (ou utilise la commande `/generate-props`)
4. Le Player Remotion se met à jour en live
5. L'utilisateur clique "Render MP4"
