---
description: Déclencher le rendu MP4 de la composition courante
---

Lance le rendu de la composition spécifiée en argument.

Usage: /render <compositionId> <outputName> <format>

Exemple: /render SaasPromo product-launch 16:9

Étapes:
1. Vérifier que ffmpeg est installé (ffmpeg -version)
2. Lancer: npx remotion render <compositionId> public/renders/<outputName>.mp4
3. Confirmer la création du fichier
