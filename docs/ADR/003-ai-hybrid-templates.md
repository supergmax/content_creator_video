# ADR-003 : Hybride templates + IA

Date: 2026-04-07
Status: Accepted

## Décision
L'IA génère des JSON props (pas du code Remotion). Les templates sont du code fixe.

## Raisons
- Séparation claire entre logique vidéo (Remotion) et contenu (Claude)
- Props validées par Zod = sécurité
- Templates maintiennent leur qualité indépendamment de l'IA

## Conséquences
- L'IA ne peut pas créer de nouveaux templates (c'est voulu)
- Ajouter un template = tâche de développement
