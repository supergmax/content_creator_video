import { Composition, registerRoot } from 'remotion';
import { CourseIntro } from './compositions/course-intro/CourseIntro';
import { courseIntroSchema } from './compositions/course-intro/schema';
import { NarrativeStory } from './compositions/narrative-story/NarrativeStory';
import { narrativeStorySchema } from './compositions/narrative-story/schema';
import { StyleDesignStory } from './compositions/style-design-story/StyleDesignStory';
import { styleDesignStorySchema } from './compositions/style-design-story/schema';
import { SaasPromo } from './compositions/saas-promo/SaasPromo';
import { saasPromoSchema } from './compositions/saas-promo/schema';
import { SocialHook } from './compositions/social-hook/SocialHook';
import { socialHookSchema } from './compositions/social-hook/schema';
import { textRevealSchema } from './compositions/text-reveal/schema';
import { TextReveal } from './compositions/text-reveal/TextReveal';
import { StellarShowcase } from './compositions/stellar-showcase/StellarShowcase';
import { stellarShowcaseSchema } from './compositions/stellar-showcase/schema';

const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SaasPromo"
        component={SaasPromo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        schema={saasPromoSchema as any}
        defaultProps={saasPromoSchema.parse({})}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.durationInSeconds * 30,
        })}
      />
      <Composition
        id="CourseIntro"
        component={CourseIntro}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={courseIntroSchema as any}
        defaultProps={courseIntroSchema.parse({})}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.durationInSeconds * 30,
        })}
      />
      <Composition
        id="SocialHook"
        component={SocialHook}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1920}
        schema={socialHookSchema as any}
        defaultProps={socialHookSchema.parse({})}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.durationInSeconds * 30,
        })}
      />
      <Composition
        id="TextReveal"
        component={TextReveal}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={textRevealSchema as any}
        defaultProps={textRevealSchema.parse({})}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.durationInSeconds * 30,
        })}
      />
      <Composition
        id="StellarShowcase"
        component={StellarShowcase}
        durationInFrames={1620}
        fps={30}
        width={1080}
        height={1920}
        schema={stellarShowcaseSchema as any}
        defaultProps={stellarShowcaseSchema.parse({})}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.durationInSeconds * 30,
        })}
      />
      <Composition
        id="NarrativeStory"
        component={NarrativeStory}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        schema={narrativeStorySchema as any}
        defaultProps={{
          scenes: [
            {
              type: 'hook',
              hookText: 'Les 5 erreurs qui ruinent ton site',
              subText: 'Celles que 90% des artisans font',
              accentColor: '#00d4ff',
              backgroundColor: '#020810',
              textColor: '#ffffff',
              showAccentLine: true,
              durationInSeconds: 4,
            },
            {
              type: 'problem',
              problemText: 'Vous perdez des clients',
              iconEmoji: '⏰',
              accentColor: '#ff2d78',
              backgroundColor: '#f5f5f5',
              textColor: '#020810',
              durationInSeconds: 4,
            },
            {
              type: 'reveal',
              siteName: 'VOTRE SITE',
              tagline: 'stellarpulse.fr',
              sections: [
                {
                  id: 'nav',
                  type: 'nav',
                  text: 'ACCUEIL · AGENCE · CONTACT',
                  top: 0,
                  left: 0,
                  width: 100,
                  height: 8,
                  enterDelayFrames: 0,
                  enterAnim: 'slide-down',
                },
                {
                  id: 'title',
                  type: 'title',
                  text: 'Artisan pro',
                  top: 12,
                  left: 5,
                  width: 90,
                  height: 12,
                  enterDelayFrames: 6,
                  enterAnim: 'slide-right',
                },
                {
                  id: 'hero',
                  type: 'hero',
                  bgColor: '#e0e0e0',
                  top: 28,
                  left: 5,
                  width: 90,
                  height: 35,
                  enterDelayFrames: 12,
                  enterAnim: 'scale',
                },
                {
                  id: 'card1',
                  type: 'card',
                  bgColor: '#ffffff',
                  text: 'Projet 1',
                  top: 67,
                  left: 5,
                  width: 42,
                  height: 20,
                  enterDelayFrames: 18,
                  enterAnim: 'drop',
                },
                {
                  id: 'card2',
                  type: 'card',
                  bgColor: '#ffffff',
                  text: 'Projet 2',
                  top: 67,
                  left: 53,
                  width: 42,
                  height: 20,
                  enterDelayFrames: 22,
                  enterAnim: 'drop',
                },
                {
                  id: 'button',
                  type: 'button',
                  text: 'DEVIS GRATUIT',
                  top: 91,
                  left: 30,
                  width: 40,
                  height: 6,
                  enterDelayFrames: 28,
                  enterAnim: 'fade',
                },
              ],
              backgroundColor: '#0a1230',
              paperColor: '#ffffff',
              cameraIntroDurationFrames: 36,
              durationInSeconds: 6,
            },
          ],
        }}
        calculateMetadata={async ({ props }) => {
          const totalSeconds = props.scenes.reduce(
            (sum, scene) => sum + scene.durationInSeconds,
            0,
          );
          return {
            durationInFrames: Math.round(totalSeconds * 30),
          };
        }}
      />
      <Composition
        id="StyleDesignStory"
        component={StyleDesignStory}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        schema={styleDesignStorySchema as any}
        defaultProps={{
          audioSrc: '/audio/odune-boulangerie.mp3',
          audioDurationSec: 29.31,
          segments: [
            {
              startSec: 0,
              endSec: 2,
              backgroundColor: '#0a0a0f',
              textColor: '#ffffff',
              textPosition: 'center',
              viewfinderAnim: 'static',
              mediaType: 'none',
              captions: [
                { startSec: 0, endSec: 1, text: 'La boulangerie' },
                { startSec: 1, endSec: 2, text: 'de votre quartier' },
              ],
            },
          ],
          viewfinderColor: '#ffffff',
          viewfinderOpacity: 0.85,
          fontFamily: '"JetBrains Mono", "IBM Plex Mono", "Courier New", monospace',
        }}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: Math.round(props.audioDurationSec * 30),
        })}
      />
    </>
  );
};

registerRoot(RemotionRoot);
