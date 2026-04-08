import {
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { BackgroundGradient } from '@/remotion/shared/BackgroundGradient';
import { AnimatedText } from '@/remotion/shared/AnimatedText';
import type { StellarShowcaseProps } from './schema';

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
const VIOLET = '#7c3aed';
const PINK = '#ec4899';
const CYAN = '#06b6d4';
const GREEN = '#22c55e';
const AMBER = '#f59e0b';
const WHITE = '#ffffff';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sceneOpacity = (frame: number, dur: number): number =>
  interpolate(frame, [0, 10, dur - 10, dur], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

// ---------------------------------------------------------------------------
// Scene 1 — Intro Hook (90 frames / 3s)
// ---------------------------------------------------------------------------
interface SceneProps {
  viz: number[];
}

const SceneIntro = ({ viz }: SceneProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const opacity = sceneOpacity(frame, 90);
  const bass = viz[0];

  // Radial burst grows from center
  const burstW = interpolate(frame, [0, 60], [0, 120], { extrapolateRight: 'clamp' });
  const burstH = interpolate(frame, [0, 60], [0, 80], { extrapolateRight: 'clamp' });

  // "S" springs up
  const sProgress = spring({
    frame: frame - 5,
    fps,
    config: { damping: 10, stiffness: 180 },
  });
  const sScale = interpolate(sProgress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });

  // "TELLARPULSE" fades in from right
  const textProgress = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const textOpacity = interpolate(textProgress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const textX = interpolate(textProgress, [0, 1], [80, 0], { extrapolateRight: 'clamp' });

  // Subtle violet orb at center — appears at frame 0
  const orbOpacity = interpolate(frame, [0, 10], [0, 0.6], { extrapolateRight: 'clamp' });

  // Bass-reactive extra glow
  const glowExtra = bass * 80;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Black background */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#050505' }} />

      {/* Radial burst */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse ${burstW}% ${burstH}% at 50% 50%, ${VIOLET}22 0%, transparent 70%)`,
        }}
      />

      {/* Violet center orb */}
      <div
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: VIOLET,
          filter: 'blur(80px)',
          opacity: orbOpacity,
        }}
      />

      {/* Brand lockup */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Large "S" */}
        <span
          style={{
            fontSize: 350,
            fontWeight: 900,
            color: VIOLET,
            lineHeight: 1,
            transform: `scale(${sScale})`,
            transformOrigin: 'center',
            display: 'inline-block',
            textShadow: `0 0 ${60 + glowExtra}px ${VIOLET}, 0 0 ${180 + glowExtra * 2}px ${VIOLET}66`,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          S
        </span>

        {/* "TELLARPULSE" */}
        <span
          style={{
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: '0.15em',
            color: WHITE,
            opacity: textOpacity,
            transform: `translateX(${textX}px)`,
            display: 'inline-block',
            alignSelf: 'flex-end',
            paddingBottom: 40,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          TELLARPULSE
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Tagline (150 frames / 5s)
// ---------------------------------------------------------------------------
const SceneTagline = ({ viz }: SceneProps) => {
  const frame = useCurrentFrame();
  const bass = viz[0];
  const opacity = sceneOpacity(frame, 150);

  // Bass overlay
  const bassOpacity = bass * 0.3 + 0.05;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
      }}
    >
      <BackgroundGradient color1={VIOLET} color2={PINK} animated />

      {/* Bass-reactive radial overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${VIOLET} 0%, transparent 70%)`,
          opacity: bassOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Main tagline */}
      <div style={{ textAlign: 'center' }}>
        <AnimatedText
          text="Ton studio vidéo."
          delay={0}
          color={WHITE}
          fontSize={72}
          fontWeight={900}
          style="slide-up"
        />
        <AnimatedText
          text="En local."
          delay={15}
          color={WHITE}
          fontSize={72}
          fontWeight={900}
          style="slide-up"
        />
      </div>

      {/* Sublines */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatedText
          text="No cloud. No API key."
          delay={40}
          color="rgba(255,255,255,0.7)"
          fontSize={32}
          fontWeight={400}
          style="fade"
        />
        <AnimatedText
          text="Just code."
          delay={70}
          color={VIOLET}
          fontSize={32}
          fontWeight={700}
          style="fade"
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Tech Stack (210 frames / 7s)
// ---------------------------------------------------------------------------
const techItems = [
  { name: 'Next.js 15', label: 'App Router', color: WHITE, icon: '▲', delay: 20 },
  { name: 'Remotion 4', label: 'Video in React', color: GREEN, icon: '◉', delay: 40 },
  { name: 'Claude Code', label: 'AI skills', color: AMBER, icon: '✦', delay: 60 },
  { name: 'Tailwind CSS', label: 'v4', color: CYAN, icon: '◈', delay: 80 },
  { name: 'Framer Motion', label: 'UI animations', color: PINK, icon: '◎', delay: 100 },
  { name: 'Zod', label: 'Schema validation', color: '#a78bfa', icon: '◆', delay: 120 },
];

interface TechPillProps {
  name: string;
  label: string;
  color: string;
  icon: string;
  delay: number;
  index: number;
  viz: number[];
}

const TechPill = ({ name, label, color, icon, delay, index, viz }: TechPillProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bass = viz[0];

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 150 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const isLeft = index % 2 === 0;
  const translateX = interpolate(progress, [0, 1], [isLeft ? -60 : 60, 0], {
    extrapolateRight: 'clamp',
  });

  // Bass-reactive border glow
  const borderOpacity = 0.4 + bass * 0.4;

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${translateX}px)`,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${color}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}`,
        borderRadius: 16,
        padding: '20px 28px',
        display: 'flex',
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        flex: 1,
      }}
    >
      <span style={{ fontSize: 28, color }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: WHITE,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

const SceneTech = ({ viz }: SceneProps) => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 210);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        gap: 32,
      }}
    >
      <BackgroundGradient color1={VIOLET} color2={CYAN} animated />

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <AnimatedText
          text="Built With"
          delay={0}
          color="rgba(255,255,255,0.5)"
          fontSize={44}
          fontWeight={800}
          style="fade"
        />
      </div>

      {/* 2-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          width: '100%',
        }}
      >
        {techItems.map((item, i) => (
          <TechPill
            key={item.name}
            name={item.name}
            label={item.label}
            color={item.color}
            icon={item.icon}
            delay={item.delay}
            index={i}
            viz={viz}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Architecture (180 frames / 6s)
// ---------------------------------------------------------------------------
interface ArchCardProps {
  icon: string;
  title: string;
  lines: string[];
  color: string;
  delay: number;
  index: number;
}

const ArchCard = ({ icon, title, lines, color, delay, index }: ArchCardProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 130 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const isLeft = index % 2 === 0;
  const translateX = interpolate(progress, [0, 1], [isLeft ? -60 : 60, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${translateX}px)`,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${color}4d`,
        borderRadius: 16,
        padding: '24px 28px',
        width: '85%',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28, color }}>{icon}</span>
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: WHITE,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lines.map((line) => (
          <div key={line} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 19,
                color,
                fontFamily: 'monospace',
                flexShrink: 0,
              }}
            >
              →
            </span>
            <span
              style={{
                fontSize: 19,
                color: 'rgba(255,255,255,0.55)',
                fontFamily: 'monospace',
              }}
            >
              {line}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const archCards = [
  {
    icon: '▲',
    title: 'Next.js 15 App Router',
    lines: ['app/page.tsx', 'app/video/[name]/', 'api/render — SSE', 'api/videos — filesystem'],
    color: WHITE,
    delay: 20,
  },
  {
    icon: '◉',
    title: 'Remotion 4',
    lines: ['remotion/Root.tsx', 'compositions/ (4 templates)', 'schema Zod par template', 'Player + CLI render'],
    color: GREEN,
    delay: 70,
  },
  {
    icon: '✦',
    title: 'Claude Code Skills',
    lines: ['.claude/commands/', '/new-video — interactif', '/generate-props — IA', 'remotion-best-practices'],
    color: AMBER,
    delay: 120,
  },
];

const SceneArchitecture = ({ viz: _viz }: SceneProps) => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 180);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        gap: 20,
      }}
    >
      <BackgroundGradient color1={AMBER} color2={VIOLET} animated />

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 8, width: '85%' }}>
        <AnimatedText
          text="L'Architecture"
          delay={0}
          color="rgba(255,255,255,0.5)"
          fontSize={44}
          fontWeight={800}
          style="fade"
        />
      </div>

      {/* Cards */}
      {archCards.map((card, i) => (
        <ArchCard
          key={card.title}
          icon={card.icon}
          title={card.title}
          lines={card.lines}
          color={card.color}
          delay={card.delay}
          index={i}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — How It Works (180 frames / 6s)
// ---------------------------------------------------------------------------
interface HowItWorksPillarProps {
  badge: string;
  badgeColor: string;
  icon: string;
  title: string;
  titleColor: string;
  desc: string;
  delay: number;
}

const HowItWorksPillar = ({ badge, badgeColor, icon, title, titleColor, desc, delay }: HowItWorksPillarProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(progress, [0, 1], [40, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        textAlign: 'center',
        flex: 1,
      }}
    >
      {/* Number badge */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: badgeColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: WHITE,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {badge}
        </span>
      </div>

      {/* Icon */}
      <span style={{ fontSize: 80 }}>{icon}</span>

      {/* Title */}
      <span
        style={{
          fontSize: 40,
          fontWeight: 900,
          color: titleColor,
          letterSpacing: '0.1em',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {title}
      </span>

      {/* Description */}
      <span
        style={{
          fontSize: 22,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'Inter, system-ui, sans-serif',
          maxWidth: 500,
          lineHeight: 1.5,
        }}
      >
        {desc}
      </span>
    </div>
  );
};

const howItWorksPillars = [
  {
    badge: '01',
    badgeColor: VIOLET,
    icon: '📝',
    title: 'ÉCRIRE',
    titleColor: AMBER,
    desc: 'Une description Markdown qui guide la génération',
    delay: 20,
  },
  {
    badge: '02',
    badgeColor: PINK,
    icon: '🤖',
    title: 'GÉNÉRER',
    titleColor: PINK,
    desc: 'Claude Code crée les props JSON automatiquement',
    delay: 70,
  },
  {
    badge: '03',
    badgeColor: GREEN,
    icon: '🎬',
    title: 'RENDRE',
    titleColor: GREEN,
    desc: 'Preview live → Render local → Download MP4',
    delay: 120,
  },
];

const SceneHowItWorks = ({ viz: _viz }: SceneProps) => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 180);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 40px',
        gap: 40,
      }}
    >
      <BackgroundGradient color1={CYAN} color2={VIOLET} animated />

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <AnimatedText
          text="Comment ça marche"
          delay={0}
          color={WHITE}
          fontSize={52}
          fontWeight={900}
          style="slide-up"
        />
      </div>

      {/* Pillars row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          width: '100%',
          padding: '0 40px',
        }}
      >
        {howItWorksPillars.map((pillar) => (
          <HowItWorksPillar
            key={pillar.badge}
            badge={pillar.badge}
            badgeColor={pillar.badgeColor}
            icon={pillar.icon}
            title={pillar.title}
            titleColor={pillar.titleColor}
            desc={pillar.desc}
            delay={pillar.delay}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — Workflow (180 frames / 6s)
// ---------------------------------------------------------------------------
const workflowSteps = [
  {
    icon: '📝',
    label: 'description.md',
    labelColor: AMBER,
    desc: 'Décris ta vidéo en Markdown',
    delay: 20,
  },
  {
    icon: '✦',
    label: 'props.json',
    labelColor: VIOLET,
    desc: 'Claude Code génère les props',
    delay: 80,
  },
  {
    icon: '🎬',
    label: 'output.mp4',
    labelColor: GREEN,
    desc: 'Preview → Render → Download',
    delay: 140,
  },
];

interface WorkflowStepProps {
  icon: string;
  label: string;
  labelColor: string;
  desc: string;
  delay: number;
}

const WorkflowStep = ({ icon, label, labelColor, desc, delay }: WorkflowStepProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(progress, [0, 1], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 60 }}>{icon}</span>
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: labelColor,
          fontFamily: 'monospace, Inter, system-ui',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 22,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {desc}
      </span>
    </div>
  );
};

interface ConnectorLineProps {
  delay: number;
}

const ConnectorLine = ({ delay }: ConnectorLineProps) => {
  const frame = useCurrentFrame();

  const height = interpolate(frame, [delay, delay + 30], [0, 80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: 3,
        height,
        background: `linear-gradient(${VIOLET}, ${PINK})`,
        borderRadius: 2,
        alignSelf: 'center',
      }}
    />
  );
};

const SceneWorkflow = ({ viz: _viz }: SceneProps) => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 180);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        gap: 0,
      }}
    >
      <BackgroundGradient color1={AMBER} color2={VIOLET} animated backgroundColor="#050505" />

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <AnimatedText
          text="Le Workflow"
          delay={0}
          color="rgba(255,255,255,0.6)"
          fontSize={44}
          fontWeight={800}
          style="fade"
        />
      </div>

      {/* Steps with connectors */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <WorkflowStep
          icon={workflowSteps[0].icon}
          label={workflowSteps[0].label}
          labelColor={workflowSteps[0].labelColor}
          desc={workflowSteps[0].desc}
          delay={workflowSteps[0].delay}
        />

        <ConnectorLine delay={60} />

        <WorkflowStep
          icon={workflowSteps[1].icon}
          label={workflowSteps[1].label}
          labelColor={workflowSteps[1].labelColor}
          desc={workflowSteps[1].desc}
          delay={workflowSteps[1].delay}
        />

        <ConnectorLine delay={120} />

        <WorkflowStep
          icon={workflowSteps[2].icon}
          label={workflowSteps[2].label}
          labelColor={workflowSteps[2].labelColor}
          desc={workflowSteps[2].desc}
          delay={workflowSteps[2].delay}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 7 — How To Use It (210 frames / 7s)
// ---------------------------------------------------------------------------
interface HowToUseStepProps {
  number: string;
  title: string;
  desc: string;
  command: string;
  color: string;
  delay: number;
}

const HowToUseStep = ({ number, title, desc, command, color, delay }: HowToUseStepProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 140 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const translateX = interpolate(progress, [0, 1], [-50, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${translateX}px)`,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}59`,
        borderRadius: 20,
        padding: '28px 32px',
        width: '85%',
        display: 'flex',
        flexDirection: 'row',
        gap: 24,
        alignItems: 'flex-start',
      }}
    >
      {/* Number badge */}
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `${color}33`,
          border: `2px solid ${color}80`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            color,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {number}
        </span>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: WHITE,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.5,
          }}
        >
          {desc}
        </span>
        {/* Command pill */}
        <div
          style={{
            background: `${color}26`,
            border: `1px solid ${color}4d`,
            borderRadius: 8,
            padding: '6px 16px',
            display: 'inline-block',
            width: 'fit-content',
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontFamily: 'monospace',
              color,
            }}
          >
            {command}
          </span>
        </div>
      </div>
    </div>
  );
};

const howToUseSteps = [
  {
    number: '01',
    title: 'Lance /new-video',
    desc: 'Claude Code te guide : nom, template, contenu. Il génère description.md + props.json automatiquement.',
    command: '/new-video',
    color: VIOLET,
    delay: 20,
  },
  {
    number: '02',
    title: 'Preview dans le browser',
    desc: 'Ouvre localhost:3000 — preview live avec @remotion/player. Vois ta vidéo avant de rendre.',
    command: 'localhost:3000',
    color: CYAN,
    delay: 80,
  },
  {
    number: '03',
    title: 'Render & Download',
    desc: 'Clic sur Render — SSE progress en direct. Output.mp4 prêt à télécharger.',
    command: 'output.mp4 ↓',
    color: GREEN,
    delay: 140,
  },
];

const SceneHowToUse = ({ viz: _viz }: SceneProps) => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 210);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        gap: 20,
      }}
    >
      <BackgroundGradient color1={GREEN} color2={VIOLET} animated />

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 8, width: '85%' }}>
        <AnimatedText
          text="Comment l'utiliser"
          delay={0}
          color="rgba(255,255,255,0.5)"
          fontSize={44}
          fontWeight={800}
          style="fade"
        />
      </div>

      {/* Steps */}
      {howToUseSteps.map((step) => (
        <HowToUseStep
          key={step.number}
          number={step.number}
          title={step.title}
          desc={step.desc}
          command={step.command}
          color={step.color}
          delay={step.delay}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 8 — Skills (180 frames / 6s)
// ---------------------------------------------------------------------------
const skillCommands = [
  { cmd: '/new-video', desc: 'Créer une vidéo complète', color: VIOLET, delay: 20 },
  { cmd: '/generate-props', desc: 'Props JSON via IA', color: AMBER, delay: 55 },
  { cmd: '/preview', desc: 'Remotion Studio', color: GREEN, delay: 90 },
  { cmd: '/render', desc: 'Export MP4 local', color: CYAN, delay: 125 },
  { cmd: '/new-template', desc: 'Nouvelle composition', color: PINK, delay: 160 },
];

interface SkillRowProps {
  cmd: string;
  desc: string;
  color: string;
  delay: number;
}

const SkillRow = ({ cmd, desc, color, delay }: SkillRowProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 200 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(progress, [0, 1], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <span
        style={{
          fontSize: 20,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'monospace',
          flexShrink: 0,
        }}
      >
        &gt;
      </span>
      <span
        style={{
          fontSize: 26,
          fontWeight: 700,
          color,
          fontFamily: 'monospace, Courier New',
          flex: 1,
        }}
      >
        {cmd}
      </span>
      <span
        style={{
          fontSize: 20,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'right',
        }}
      >
        {desc}
      </span>
    </div>
  );
};

const SceneSkills = ({ viz: _viz }: SceneProps) => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 180);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        gap: 32,
      }}
    >
      <BackgroundGradient color1={VIOLET} color2={PINK} animated />

      {/* Title */}
      <div style={{ textAlign: 'center', width: '85%' }}>
        <AnimatedText
          text="Skills Claude Code"
          delay={0}
          color={WHITE}
          fontSize={40}
          fontWeight={800}
          style="slide-up"
        />
      </div>

      {/* Terminal card */}
      <div
        style={{
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 20,
          padding: 40,
          width: '85%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {skillCommands.map((item) => (
          <SkillRow
            key={item.cmd}
            cmd={item.cmd}
            desc={item.desc}
            color={item.color}
            delay={item.delay}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 9 — Outro (240 frames / 8s)
// ---------------------------------------------------------------------------
const outroBadges = [
  { label: '4 Templates', icon: '🎬', color: VIOLET, delay: 10 },
  { label: 'Audio Support', icon: '🎵', color: PINK, delay: 40 },
  { label: 'IA Powered', icon: '✦', color: AMBER, delay: 70 },
  { label: '100% Local', icon: '🔒', color: GREEN, delay: 100 },
];

interface OutroBadgeProps {
  label: string;
  icon: string;
  color: string;
  delay: number;
}

const OutroBadge = ({ label, icon, color, delay }: OutroBadgeProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(progress, [0, 1], [0.7, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        background: 'rgba(255,255,255,0.07)',
        border: `1px solid ${color}66`,
        borderRadius: 24,
        padding: '20px 28px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <span style={{ fontSize: 36 }}>{icon}</span>
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: WHITE,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {label}
      </span>
    </div>
  );
};

const SceneOutro = ({ viz }: SceneProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bass = viz[0];

  // Phase timings (adjusted for 240 frames)
  // badges: 0–120
  const badgesOpacity = interpolate(frame, [0, 10, 110, 120], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 2: wordmark 120–200
  const wordmarkProgress = spring({
    frame: frame - 120,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const wordmarkOpacity = interpolate(wordmarkProgress, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const wordmarkScale = interpolate(wordmarkProgress, [0, 1], [0.8, 1], {
    extrapolateRight: 'clamp',
  });

  // Hide wordmark at 200–240
  const wordmarkFadeOut = interpolate(frame, [200, 240], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 3: burst 200–240
  const burstRadius = interpolate(frame, [200, 240], [0, 150], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const burstOpacity = interpolate(frame, [200, 220, 230, 240], [0, 0.7, 0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Final fade to black 220–240
  const finalFade = interpolate(frame, [220, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Bass-reactive large orb
  const bassOrbSize = 200 + bass * 300;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        overflow: 'hidden',
      }}
    >
      <BackgroundGradient color1={VIOLET} color2={PINK} animated />

      {/* Bass-reactive orb burst */}
      <div
        style={{
          position: 'absolute',
          width: bassOrbSize,
          height: bassOrbSize,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${VIOLET}44 0%, transparent 70%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Phase 1 — Badges grid */}
      <div
        style={{
          opacity: badgesOpacity,
          position: 'absolute',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          width: '85%',
        }}
      >
        {outroBadges.map((b) => (
          <OutroBadge
            key={b.label}
            label={b.label}
            icon={b.icon}
            color={b.color}
            delay={b.delay}
          />
        ))}
      </div>

      {/* Phase 2 — Wordmark */}
      <div
        style={{
          opacity: wordmarkOpacity * wordmarkFadeOut,
          transform: `scale(${wordmarkScale})`,
          position: 'absolute',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <span
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: WHITE,
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          StellarPulse
        </span>
        <span
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Video Studio. Locally.
        </span>
        {/* Version badge */}
        <div
          style={{
            background: VIOLET,
            borderRadius: 999,
            padding: '8px 24px',
            display: 'inline-block',
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: WHITE,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            v1.0
          </span>
        </div>
      </div>

      {/* Phase 3 — Radial burst */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse ${burstRadius}% ${burstRadius * 0.75}% at 50% 50%, ${VIOLET}88 0%, ${PINK}44 40%, transparent 70%)`,
          opacity: burstOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Final fade to black */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#050505',
          opacity: finalFade,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
export const StellarShowcase = ({ audioSrc, durationInSeconds: _durationInSeconds }: StellarShowcaseProps) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  // Audio visualization — called once in root, passed to all scenes
  const audioData = useAudioData(audioSrc);
  const viz: number[] = audioData
    ? visualizeAudio({
        fps,
        frame,
        audioData,
        numberOfSamples: 8,
        smoothing: true,
      })
    : (Array(8).fill(0) as number[]);

  const bass = viz[0];

  // Bass flash hex: clamp to 2-digit hex
  const bassHex = Math.min(255, Math.round(bass * 40))
    .toString(16)
    .padStart(2, '0');

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#050505',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {/* Audio track */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* Global bass-reactive flash overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% 50%, ${VIOLET}${bassHex} 0%, transparent 60%)`,
        }}
      />

      {/* Scene 1 — Intro Hook (0–90 / 3s) */}
      <Sequence from={0} durationInFrames={90}>
        <SceneIntro viz={viz} />
      </Sequence>

      {/* Scene 2 — Tagline (90–240 / 5s) */}
      <Sequence from={90} durationInFrames={150}>
        <SceneTagline viz={viz} />
      </Sequence>

      {/* Scene 3 — How We Build It: Tech Stack (240–450 / 7s) */}
      <Sequence from={240} durationInFrames={210}>
        <SceneTech viz={viz} />
      </Sequence>

      {/* Scene 4 — How We Build It: Architecture (450–630 / 6s) */}
      <Sequence from={450} durationInFrames={180}>
        <SceneArchitecture viz={viz} />
      </Sequence>

      {/* Scene 5 — How It Works: Concept (630–810 / 6s) */}
      <Sequence from={630} durationInFrames={180}>
        <SceneHowItWorks viz={viz} />
      </Sequence>

      {/* Scene 6 — How It Works: Workflow (810–990 / 6s) */}
      <Sequence from={810} durationInFrames={180}>
        <SceneWorkflow viz={viz} />
      </Sequence>

      {/* Scene 7 — How To Use It (990–1200 / 7s) */}
      <Sequence from={990} durationInFrames={210}>
        <SceneHowToUse viz={viz} />
      </Sequence>

      {/* Scene 8 — Skills (1200–1380 / 6s) */}
      <Sequence from={1200} durationInFrames={180}>
        <SceneSkills viz={viz} />
      </Sequence>

      {/* Scene 9 — Outro (1380–1620 / 8s) */}
      <Sequence from={1380} durationInFrames={240}>
        <SceneOutro viz={viz} />
      </Sequence>
    </div>
  );
};
