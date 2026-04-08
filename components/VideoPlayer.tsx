'use client'

import { Player } from '@remotion/player'
import type { ComponentType } from 'react'
import { SocialHook } from '@/remotion/compositions/social-hook/SocialHook'
import { TextReveal } from '@/remotion/compositions/text-reveal/TextReveal'
import { CourseIntro } from '@/remotion/compositions/course-intro/CourseIntro'
import { SaasPromo } from '@/remotion/compositions/saas-promo/SaasPromo'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPOSITIONS: Record<string, ComponentType<any>> = {
  'social-hook': SocialHook,
  'text-reveal': TextReveal,
  'course-intro': CourseIntro,
  'saas-promo': SaasPromo,
}

const FORMAT_SIZES: Record<string, { width: number; height: number }> = {
  '9x16': { width: 1080, height: 1920 },
  '16x9': { width: 1920, height: 1080 },
  '1x1': { width: 1080, height: 1080 },
}

type Props = {
  template: string
  format: string
  duration: number
  props: Record<string, unknown>
}

export function VideoPlayer({ template, format, duration, props }: Props) {
  const Component = COMPOSITIONS[template]
  const { width, height } = FORMAT_SIZES[format] ?? { width: 1080, height: 1920 }

  if (!Component) {
    return (
      <p className="text-red-500 p-4">Template inconnu : {template}</p>
    )
  }

  return (
    <Player
      component={Component}
      durationInFrames={duration * 30}
      fps={30}
      compositionWidth={width}
      compositionHeight={height}
      inputProps={props}
      style={{ width: '100%', maxHeight: '70vh' }}
      controls
    />
  )
}
