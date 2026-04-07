---
name: framer-motion
description: Patterns Framer Motion pour animations UI et compositions Remotion
---

# Framer Motion — Guide pour StellarPulse

## Dans les compositions Remotion

Framer Motion peut être utilisé dans les compositions mais les animations doivent
être synchronisées avec useCurrentFrame() pour un rendu déterministe.

### Pattern recommandé

```tsx
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { motion } from 'framer-motion';

export const AnimatedTitle = ({ text }: { text: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = Math.min(frame / (fps * 0.5), 1); // 0.5s d'animation

  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: progress, y: (1 - progress) * 20 }}
      style={{ opacity: progress }}
    >
      {text}
    </motion.h1>
  );
};
```

## Dans l'UI Next.js

Pour les animations de l'interface (transitions, hover, etc.) :

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Transition de page
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>

// Hover card
<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} />
```
