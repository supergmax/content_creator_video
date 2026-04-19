---
template: narrative-story
duration: 14
format: 9x16
---

## Objectif
Premier test du template NarrativeStory (V1). Valider que:
- Les 3 scènes s'enchaînent proprement via `<Series>`
- Les fades entre scènes sont lisibles
- Le HookScene produit le même feel que la SocialHook V4 validée
- Le ProblemScene révèle le texte + anime une icône au centre
- Le RevealScene fait arriver un plan blanc en 3D et orchestre les sections du site par-dessus

## Structure narrative
1. **Hook (0-4s)**: "Les 5 erreurs qui ruinent ton site" — accroche + sous-texte
2. **Problème (4-8s)**: "Vous perdez des clients" + icône horloge (emoji fallback)
3. **Reveal (8-14s)**: "ARCHIDOMO" site composé sur plan blanc — nav, title, hero, 2 cards, bouton CTA

## Contraintes techniques validées (cf user_skills_motion_design.md)
- Pas de spring pour les textes → interpolate + Easing.bezier(0.25, 0.1, 0.25, 1) (ease-out AE)
- WORD_DELAY=5, WORD_ANIM_DURATION=22 (overlap entre mots)
- Paper 3D via CSS transform perspective + rotateX + transformStyle preserve-3d
- Sections orchestrées séquentiellement via enterDelayFrames + enterAnim par section

## Call to action
Le viewer doit ressentir: "OK ce template marche end-to-end, on peut générer plein de variations maintenant."
