import { Composition } from 'remotion';
import { SaasPromo } from './compositions/saas-promo/SaasPromo';
import { saasPromoSchema } from './compositions/saas-promo/schema';
import { CourseIntro } from './compositions/course-intro/CourseIntro';
import { courseIntroSchema } from './compositions/course-intro/schema';
import { SocialHook } from './compositions/social-hook/SocialHook';
import { socialHookSchema } from './compositions/social-hook/schema';
import { TextReveal } from './compositions/text-reveal/TextReveal';
import { textRevealSchema } from './compositions/text-reveal/schema';

export const RemotionRoot = () => {
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
    </>
  );
};
