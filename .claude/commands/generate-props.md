# Commande : /generate-props

Génère des props JSON pour un template Remotion StellarPulse à partir d'une description en langage naturel.

## Usage

```
/generate-props <template-id> <description>
```

**Exemples :**
```
/generate-props saas-promo "app de gestion de projet dark mode violet"
/generate-props social-hook "hook TikTok pour une app fitness"
/generate-props text-reveal "citation motivationnelle sobre en 3 lignes"
/generate-props course-intro "chapitre 3 d'un cours TypeScript avancé"
```

## Comportement attendu

1. Identifie le template ciblé (`saas-promo`, `course-intro`, `social-hook`, `text-reveal`)
2. Génère un objet JSON complet et valide selon le schéma Zod du template (voir `.claude/skills/ai-generation.md`)
3. Affiche le JSON prêt à copier-coller dans l'éditeur
4. Rappelle comment l'utiliser : "Colle ce JSON dans l'éditeur ou clique '✦ Générer avec IA' dans l'interface"

## Rappel des schémas

Voir `.claude/skills/ai-generation.md` pour les contraintes de chaque template.
