# ADR-002 : Rendu local uniquement

Date: 2026-04-07
Status: Accepted

## Décision
Rendu via Remotion CLI + ffmpeg local. Pas de Remotion Lambda.

## Raisons
- Zéro coût cloud
- Usage local intensif
- Pas de dépendance AWS

## Conséquences
- Rendu séquentiel (pas parallélisé)
- Remotion Lambda prévu en v2.0
