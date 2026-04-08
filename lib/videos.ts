import fs from 'node:fs'
import path from 'node:path'

export type VideoFormat = '9x16' | '16x9' | '1x1'

export type VideoMeta = {
  name: string
  template: string
  duration: number
  format: VideoFormat
  hasOutput: boolean
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const result: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()
    if (key) result[key] = val
  }
  return result
}

export function listVideos(): VideoMeta[] {
  const dir = path.join(process.cwd(), 'videos')
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => {
      const descPath = path.join(dir, d.name, 'description.md')
      if (!fs.existsSync(descPath)) return []
      const content = fs.readFileSync(descPath, 'utf-8')
      const fm = parseFrontmatter(content)
      return [
        {
          name: d.name,
          template: fm.template ?? 'social-hook',
          duration: Number(fm.duration ?? 8),
          format: (fm.format ?? '9x16') as VideoFormat,
          hasOutput: fs.existsSync(path.join(dir, d.name, 'output.mp4')),
        },
      ]
    })
}

export function getVideoMeta(name: string): VideoMeta | null {
  return listVideos().find((v) => v.name === name) ?? null
}

export function getVideoProps(name: string): Record<string, unknown> | null {
  const propsPath = path.join(process.cwd(), 'videos', name, 'props.json')
  if (!fs.existsSync(propsPath)) return null
  try {
    return JSON.parse(fs.readFileSync(propsPath, 'utf-8')) as Record<string, unknown>
  } catch {
    return null
  }
}
