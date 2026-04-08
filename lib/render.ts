import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import path from 'node:path'

export const COMPOSITION_IDS: Record<string, string> = {
  'social-hook': 'SocialHook',
  'text-reveal': 'TextReveal',
  'course-intro': 'CourseIntro',
  'saas-promo': 'SaasPromo',
}

export const FORMAT_SIZES: Record<string, { width: number; height: number }> = {
  '9x16': { width: 1080, height: 1920 },
  '16x9': { width: 1920, height: 1080 },
  '1x1': { width: 1080, height: 1080 },
}

export function spawnRender(
  videoName: string,
  compositionId: string,
  props: Record<string, unknown>,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(process.cwd(), 'videos', videoName)
    mkdirSync(outputDir, { recursive: true })
    const outputPath = path.join(outputDir, 'output.mp4')

    const tempPropsPath = join(
      tmpdir(),
      `remotion-props-${videoName}-${Date.now()}.json`,
    )
    writeFileSync(tempPropsPath, JSON.stringify(props))

    const child = spawn('npx', [
      'remotion',
      'render',
      'remotion/Root.tsx',
      compositionId,
      outputPath,
      `--props=${tempPropsPath}`,
    ])

    const parseProgress = (text: string) => {
      const match = text.match(/(\d+)%/)
      if (match) onProgress(parseInt(match[1], 10))
    }

    child.stdout.on('data', (data: Buffer) => parseProgress(data.toString()))
    child.stderr.on('data', (data: Buffer) => parseProgress(data.toString()))

    child.on('close', (code) => {
      try {
        unlinkSync(tempPropsPath)
      } catch {
        /* ignore cleanup errors */
      }
      if (code === 0) resolve()
      else reject(new Error(`Render exited with code ${code}`))
    })
  })
}
