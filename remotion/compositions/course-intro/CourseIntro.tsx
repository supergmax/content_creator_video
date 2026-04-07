import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { AnimatedText } from '@/remotion/shared/AnimatedText';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import type { CourseIntroProps } from './schema';

export const CourseIntro = ({
  courseTitle,
  authorName,
  chapterNumber,
  chapterTitle,
  accentColor,
  backgroundColor,
}: CourseIntroProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const lineProgress = spring({ frame: frame - fps * 0.8, fps, config: { damping: 20, stiffness: 80 } });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, width * 0.06], { extrapolateRight: 'clamp' });

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center' }}>
      <BackgroundGradient color1={accentColor} color2="#6366f1" backgroundColor={backgroundColor} />

      <div style={{ position: 'relative', zIndex: 1, paddingLeft: width * 0.1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatedText
          text={`CHAPITRE ${chapterNumber}`}
          delay={0}
          color={accentColor}
          fontSize={Math.round(width / 60)}
          fontWeight={600}
          style="fade"
        />
        <div style={{ width: lineWidth, height: 3, background: accentColor, borderRadius: 2 }} />
        <AnimatedText
          text={chapterTitle}
          delay={fps * 0.5}
          color="#ffffff"
          fontSize={Math.round(width / 18)}
          fontWeight={800}
          style="slide-up"
        />
        <AnimatedText
          text={courseTitle}
          delay={fps * 0.9}
          color="rgba(255,255,255,0.5)"
          fontSize={Math.round(width / 50)}
          fontWeight={400}
          style="fade"
        />
        <AnimatedText
          text={`par ${authorName}`}
          delay={fps * 1.1}
          color="rgba(255,255,255,0.4)"
          fontSize={Math.round(width / 60)}
          fontWeight={300}
          style="fade"
        />
      </div>
    </div>
  );
};
