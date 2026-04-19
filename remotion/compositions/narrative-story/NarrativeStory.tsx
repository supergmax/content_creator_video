import { Audio, Series, useVideoConfig } from 'remotion';
import { HookScene } from './scenes/HookScene';
import { ProblemScene } from './scenes/ProblemScene';
import { RevealScene } from './scenes/RevealScene';
import type { NarrativeStoryProps, SceneProps } from './schema';

/**
 * NarrativeStory — Template principal pour les vidéos Stellar Pulse
 *
 * Orchestration:
 * - Utilise <Series> de Remotion pour enchaîner les scènes séquentiellement
 * - Chaque scène est auto-suffisante et gère son propre fade in/out
 * - L'audio optionnel joue sur toute la durée
 *
 * Calibré à partir de l'analyse des 3 vidéos de référence de Sekiné
 * (Stellar1, xouzaviez, yooo) le 14 avril 2026.
 */
export const NarrativeStory = ({ scenes, audioSrc }: NarrativeStoryProps) => {
  const { fps } = useVideoConfig();

  return (
    <>
      {audioSrc && <Audio src={audioSrc} />}

      <Series>
        {scenes.map((scene, i) => {
          const durationInFrames = Math.round(scene.durationInSeconds * fps);
          return (
            <Series.Sequence
              key={`scene-${i}`}
              durationInFrames={durationInFrames}
            >
              <SceneRenderer scene={scene} />
            </Series.Sequence>
          );
        })}
      </Series>
    </>
  );
};

// Dispatcher qui rend la bonne scène selon son type
const SceneRenderer = ({ scene }: { scene: SceneProps }) => {
  switch (scene.type) {
    case 'hook':
      return <HookScene {...scene} />;
    case 'problem':
      return <ProblemScene {...scene} />;
    case 'reveal':
      return <RevealScene {...scene} />;
  }
};
