# Commande : /new-video

Crée une nouvelle vidéo dans `videos/<nom>/` avec son `description.md` et son `props.json`.

## Usage

- **Mode interactif** : `/new-video`
- **Mode auto** : `/new-video --auto <nom> <template> "<description courte>"`

---

## Mode interactif

Suis ces étapes dans l'ordre :

### Étape 1 — Nom de la vidéo
Demande à l'utilisateur le nom de la vidéo (slug : lowercase, tirets, pas d'espaces ni accents).
Exemple : `ma-promo-2026`, `fitness-hook-1`, `cours-ts-ch3`

Vérifie que `videos/<nom>/` n'existe pas déjà. Si c'est le cas, demande confirmation avant d'écraser.

### Étape 2 — Choix du template
Présente les 4 options :

| Template | Format | Usage typique |
|---|---|---|
| `social-hook` | 9x16 vertical | Hook court réseaux sociaux (TikTok, Reels) |
| `text-reveal` | 16x9 | Révélation de texte ligne par ligne |
| `course-intro` | 16x9 | Intro de chapitre de cours en ligne |
| `saas-promo` | 16x9 | Promo d'un produit SaaS |

### Étape 3 — Questions de contenu
Pose ces questions une par une selon le template choisi :

**Pour tous les templates :**
- Objectif : quel effet sur le viewer ?
- Message principal (le texte qui s'affichera)
- Ton et style (couleurs, ambiance, énergie)
- Call to action ou émotion finale

**Questions spécifiques par template :**
- `social-hook` → demander aussi le sous-texte (subText)
- `text-reveal` → demander les lignes de texte (jusqu'à 5) et le style de révélation (fade/slide/typewriter)
- `course-intro` → demander : titre du cours, nom de l'auteur, numéro et titre du chapitre
- `saas-promo` → demander : nom du produit, tagline, texte du CTA, URL du logo (optionnel)

### Étape 4 — Générer les fichiers

1. Créer `videos/<nom>/` si nécessaire
2. Copier `templates/<template>.md` → `videos/<nom>/description.md`
3. Remplir les sections du `description.md` avec les réponses de l'utilisateur
4. Utiliser le skill `/generate-props` pour créer `videos/<nom>/props.json`

### Étape 5 — Confirmation
Afficher :
```
✓ Vidéo "<nom>" créée avec le template <template>.
  → description.md : videos/<nom>/description.md
  → props.json     : videos/<nom>/props.json

Prévisualiser : http://localhost:3000/video/<nom>
Render        : clic sur le bouton "Render" dans l'interface
```

---

## Mode auto

Si la commande commence par `--auto`, parser les arguments :
```
/new-video --auto <nom> <template> "<description courte>"
```

**Exemple :**
```
/new-video --auto fitness-hook social-hook "hook TikTok énergique pour app fitness, texte blanc sur fond noir, accentColor rouge"
```

1. Créer `videos/<nom>/` (sans écraser si existant — afficher une erreur)
2. Générer `videos/<nom>/description.md` en inférant toutes les sections depuis la description courte
3. Générer `videos/<nom>/props.json` via `/generate-props <template> <nom> "<description>"`
4. Afficher le résumé (même format que l'étape 5 du mode interactif)

---

## Règles

- Le nom doit être un slug valide (regex : `^[a-z0-9-]+$`). Refuser sinon.
- Ne jamais écraser `videos/<nom>/` sans confirmation explicite de l'utilisateur.
- `props.json` doit respecter le schéma Zod du template (voir `remotion/compositions/<template>/schema.ts`).
- Utiliser les valeurs par défaut du schéma comme base, puis les remplacer avec le contenu de la description.
