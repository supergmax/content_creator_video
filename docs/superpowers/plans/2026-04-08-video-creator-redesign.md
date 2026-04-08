# StellarPulse Video Creator Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repartir d'une base propre — site Next.js minimaliste (liste / preview / render / download) piloté par des fichiers `description.md` dans `videos/`, créés via le skill `/new-video`.

**Architecture:** Filesystem pur — Next.js scanne `videos/` au runtime, chaque dossier est une vidéo autonome (description.md + props.json + output.mp4). Aucune BDD, aucun état global. Les compositions Remotion existantes sont conservées intactes.

**Tech Stack:** Next.js 15 App Router, Remotion 4, @remotion/player, Framer Motion, shadcn/ui, Tailwind CSS 4, Zod, TypeScript

---

## File Map

**Créés :**
- `videos/.gitkeep` — garde le dossier vide dans git
- `templates/social-hook.md` — modèle description.md pour social-hook
- `templates/text-reveal.md` — modèle description.md pour text-reveal
- `templates/course-intro.md` — modèle description.md pour course-intro
- `templates/saas-promo.md` — modèle description.md pour saas-promo
- `lib/videos.ts` — scanner filesystem + parser frontmatter YAML
- `lib/render.ts` — wrapper spawnRender (output → `videos/<name>/output.mp4`)
- `app/api/videos/route.ts` — GET : liste les vidéos
- `app/api/render/route.ts` — POST : lance render SSE
- `app/api/renders/[name]/route.ts` — GET : télécharge le MP4
- `app/page.tsx` — page liste (remplace app/(studio)/page.tsx)
- `app/video/[name]/page.tsx` — page preview + render + download
- `components/VideoPlayer.tsx` — client component @remotion/player
- `components/RenderControls.tsx` — client component bouton render + download
- `.claude/commands/new-video.md` — skill /new-video

**Modifiés :**
- `app/layout.tsx` — supprimer imports inutiles
- `package.json` — supprimer @ai-sdk/gateway, ai, zustand, @base-ui/react
- `.claude/commands/generate-props.md` — supporte écriture dans `videos/<nom>/props.json`
- `CLAUDE.md` — mettre à jour le workflow
- `ROADMAP.md` — ajouter V2 : éditeur UI inline

**Supprimés :**
- `components/dashboard/`, `components/studio/`, `components/renders/`
- `app/(studio)/`, `app/renders/`
- `lib/ai/`, `lib/store/`, `lib/remotion/`, `lib/templates.ts`, `lib/render-state.ts`
- `docs/ADR/`, `docs/ARCHITECTURE.md`
- `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `STATE.md`, `TODO.md`, `use.md`
- `public/renders/`

---

## Task 1 : Supprimer l'ancien code

**Files:**
- Delete: `components/dashboard/`, `components/studio/`, `components/renders/`
- Delete: `app/(studio)/`, `app/renders/`
- Delete: `lib/ai/`, `lib/store/`, `lib/remotion/`, `lib/templates.ts`, `lib/render-state.ts`
- Delete: `docs/ADR/`, `docs/ARCHITECTURE.md`
- Delete: `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `STATE.md`, `TODO.md`, `use.md`
- Delete: `public/renders/`

- [ ] **Step 1 : Supprimer tous les fichiers obsolètes**

```bash
rm -rf components/dashboard components/studio components/renders
rm -rf "app/(studio)" app/renders
rm -rf lib/ai lib/store lib/remotion lib/templates.ts lib/render-state.ts
rm -rf docs/ADR docs/ARCHITECTURE.md
rm -f CHANGELOG.md CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md STATE.md TODO.md use.md
rm -rf public/renders
```

- [ ] **Step 2 : Vérifier qu'il ne reste rien d'obsolète**

```bash
ls components/ app/ lib/
```

Attendu : `components/` ne contient plus que `ui/`. `lib/` ne contient plus que `utils.ts`. `app/` ne contient que `globals.css` et `layout.tsx` (plus de `(studio)` ni `renders`).

- [ ] **Step 3 : Commit**

```bash
git add -A
git commit -m "chore: remove old studio UI, AI gateway, dashboard code"
```

---

## Task 2 : Supprimer les dépendances inutiles

**Files:**
- Modify: `package.json`

- [ ] **Step 1 : Retirer les dépendances obsolètes**

Dans `package.json`, supprimer de `"dependencies"` :
- `"@ai-sdk/gateway"` et sa ligne
- `"ai"` et sa ligne
- `"zustand"` et sa ligne
- `"@base-ui/react"` et sa ligne

- [ ] **Step 2 : Réinstaller**

```bash
npm install
```

Attendu : pas d'erreur, `package-lock.json` mis à jour.

- [ ] **Step 3 : Vérifier que le projet compile**

```bash
npm run type-check
```

Attendu : 0 erreur (il peut y avoir des erreurs liées aux fichiers supprimés — normal, on les résoudra dans les tâches suivantes).

- [ ] **Step 4 : Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused deps — ai-sdk, zustand, base-ui"
```

---

## Task 3 : Créer la structure de dossiers

**Files:**
- Create: `videos/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1 : Créer le dossier `videos/`**

```bash
mkdir -p videos
touch videos/.gitkeep
```

- [ ] **Step 2 : Vérifier que `.gitignore` couvre déjà `*.mp4`**

Ouvrir `.gitignore` et confirmer la ligne `*.mp4` est présente. Si oui, les fichiers `output.mp4` seront automatiquement ignorés. Si non, ajouter :

```
# video renders
videos/*/output.mp4
```

- [ ] **Step 3 : Commit**

```bash
git add videos/.gitkeep .gitignore
git commit -m "chore: add videos/ directory structure"
```

---

## Task 4 : Créer les 4 templates description.md

**Files:**
- Create: `templates/social-hook.md`
- Create: `templates/text-reveal.md`
- Create: `templates/course-intro.md`
- Create: `templates/saas-promo.md`

- [ ] **Step 1 : Créer `templates/social-hook.md`**

```markdown
---
template: social-hook
duration: 7
format: 9x16
---

## Objectif
[Accrocher l'audience dès les premières secondes avec une question ou affirmation forte]

## Message principal (hookText)
[Le texte accrocheur principal — ex: "You won't believe this..."]

## Sous-texte (subText)
[Texte secondaire — ex: "Thread below 👇"]

## Style
- Couleur d'accent (accentColor) : #f59e0b
- Fond (backgroundColor) : #050505
- Texte (textColor) : #ffffff

## Call to action
[Ce que le viewer doit ressentir ou faire après avoir vu la vidéo]
```

- [ ] **Step 2 : Créer `templates/text-reveal.md`**

```markdown
---
template: text-reveal
duration: 10
format: 16x9
---

## Objectif
[Révéler progressivement un message fort, ligne par ligne]

## Lignes de texte (lines — max 5 lignes)
- [Ligne 1]
- [Ligne 2]
- [Ligne 3]

## Style
- Style de révélation (revealStyle) : slide  # fade | slide | typewriter
- Couleur d'accent (accentColor) : #22c55e
- Fond (backgroundColor) : #050505
- Taille du texte (fontSizeMultiplier) : 1  # 0.5 à 3

## Call to action
[L'émotion ou l'idée que le viewer doit emporter]
```

- [ ] **Step 3 : Créer `templates/course-intro.md`**

```markdown
---
template: course-intro
duration: 10
format: 16x9
---

## Objectif
[Introduire un chapitre de cours de manière claire et professionnelle]

## Titre du cours (courseTitle)
[Nom complet du cours]

## Auteur (authorName)
[Nom de l'instructeur]

## Chapitre (chapterNumber)
[Numéro du chapitre — ex: 3]

## Titre du chapitre (chapterTitle)
[Titre de ce chapitre — ex: "Les closures en JavaScript"]

## Style
- Couleur d'accent (accentColor) : #38bdf8
- Fond (backgroundColor) : #050505

## Call to action
[Ce que l'étudiant va apprendre dans ce chapitre]
```

- [ ] **Step 4 : Créer `templates/saas-promo.md`**

```markdown
---
template: saas-promo
duration: 15
format: 16x9
---

## Objectif
[Promouvoir un produit SaaS avec impact et clarté]

## Nom du produit (productName)
[Nom du produit — ex: "Notion"]

## Tagline (tagline)
[Accroche courte — ex: "The future of productivity"]

## Call to action (ctaText)
[Texte du bouton — ex: "Get started →"]

## Style
- Couleur d'accent (accentColor) : #a855f7
- Fond (backgroundColor) : #050505
- Logo URL (logoUrl) : [optionnel — URL publique vers une image]

## Notes
[Autres éléments de contexte pour la génération des props]
```

- [ ] **Step 5 : Commit**

```bash
git add templates/
git commit -m "feat: add description.md templates for 4 compositions"
```

---

## Task 5 : Créer `lib/videos.ts`

**Files:**
- Create: `lib/videos.ts`

- [ ] **Step 1 : Écrire `lib/videos.ts`**

```typescript
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
```

- [ ] **Step 2 : Vérifier que TypeScript accepte le fichier**

```bash
npx tsc --noEmit --skipLibCheck
```

Attendu : pas d'erreur sur `lib/videos.ts`.

- [ ] **Step 3 : Commit**

```bash
git add lib/videos.ts
git commit -m "feat: add lib/videos.ts — filesystem scanner with frontmatter parser"
```

---

## Task 6 : Créer `lib/render.ts`

**Files:**
- Create: `lib/render.ts`

- [ ] **Step 1 : Écrire `lib/render.ts`**

```typescript
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
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 3 : Commit**

```bash
git add lib/render.ts
git commit -m "feat: add lib/render.ts — render to videos/<name>/output.mp4"
```

---

## Task 7 : Créer `app/api/videos/route.ts`

**Files:**
- Create: `app/api/videos/route.ts`

- [ ] **Step 1 : Créer le dossier et le fichier**

```bash
mkdir -p app/api/videos
```

- [ ] **Step 2 : Écrire `app/api/videos/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { listVideos } from '@/lib/videos'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(listVideos())
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 4 : Commit**

```bash
git add app/api/videos/
git commit -m "feat: add GET /api/videos — list videos from filesystem"
```

---

## Task 8 : Créer `app/api/render/route.ts`

**Files:**
- Create: `app/api/render/route.ts`

- [ ] **Step 1 : Créer le dossier**

```bash
mkdir -p app/api/render
```

- [ ] **Step 2 : Écrire `app/api/render/route.ts`**

```typescript
import type { NextRequest } from 'next/server'
import { getVideoMeta, getVideoProps } from '@/lib/videos'
import { spawnRender, COMPOSITION_IDS } from '@/lib/render'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { name: string }
  const { name } = body

  const meta = getVideoMeta(name)
  if (!meta) {
    return new Response(JSON.stringify({ error: 'Video not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const props = getVideoProps(name) ?? {}
  const compositionId = COMPOSITION_IDS[meta.template]
  if (!compositionId) {
    return new Response(JSON.stringify({ error: `Unknown template: ${meta.template}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      spawnRender(name, compositionId, props, (percent) => {
        send({ type: 'progress', percent })
      })
        .then(() => {
          send({ type: 'done', url: `/api/renders/${name}` })
          controller.close()
        })
        .catch((err: Error) => {
          send({ type: 'error', message: err.message })
          controller.close()
        })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 4 : Commit**

```bash
git add app/api/render/
git commit -m "feat: add POST /api/render — SSE render pipeline"
```

---

## Task 9 : Créer `app/api/renders/[name]/route.ts`

**Files:**
- Create: `app/api/renders/[name]/route.ts`

- [ ] **Step 1 : Créer les dossiers**

```bash
mkdir -p "app/api/renders/[name]"
```

- [ ] **Step 2 : Écrire `app/api/renders/[name]/route.ts`**

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const filePath = path.join(process.cwd(), 'videos', name, 'output.mp4')

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const stat = fs.statSync(filePath)
  const fileBuffer = fs.readFileSync(filePath)

  return new Response(fileBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${name}.mp4"`,
      'Content-Length': String(stat.size),
    },
  })
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 4 : Commit**

```bash
git add "app/api/renders/"
git commit -m "feat: add GET /api/renders/[name] — MP4 download"
```

---

## Task 10 : Mettre à jour `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1 : Remplacer `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'StellarPulse',
  description: 'Studio de création vidéo local',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`dark ${geist.variable} font-sans`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add app/layout.tsx
git commit -m "chore: simplify layout.tsx — remove unused fonts"
```

---

## Task 11 : Créer `components/VideoPlayer.tsx`

**Files:**
- Create: `components/VideoPlayer.tsx`

Note : ce composant est `'use client'` car `@remotion/player` utilise des API browser. Il ne doit jamais être importé côté serveur.

- [ ] **Step 1 : Écrire `components/VideoPlayer.tsx`**

```typescript
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
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 3 : Commit**

```bash
git add components/VideoPlayer.tsx
git commit -m "feat: add VideoPlayer client component with @remotion/player"
```

---

## Task 12 : Créer `components/RenderControls.tsx`

**Files:**
- Create: `components/RenderControls.tsx`

- [ ] **Step 1 : Écrire `components/RenderControls.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type Props = {
  videoName: string
  hasOutput: boolean
}

export function RenderControls({ videoName, hasOutput }: Props) {
  const [progress, setProgress] = useState<number | null>(null)
  const [done, setDone] = useState(hasOutput)
  const [error, setError] = useState<string | null>(null)

  const isRendering = progress !== null && !done && error === null

  async function handleRender() {
    setProgress(0)
    setError(null)
    setDone(false)

    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: videoName }),
    })

    if (!res.ok || !res.body) {
      setError('Erreur réseau')
      setProgress(null)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done: streamDone, value } = await reader.read()
      if (streamDone) break
      const text = decoder.decode(value)
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6)) as {
            type: string
            percent?: number
            message?: string
          }
          if (event.type === 'progress' && event.percent !== undefined) {
            setProgress(event.percent)
          }
          if (event.type === 'done') {
            setProgress(100)
            setDone(true)
          }
          if (event.type === 'error') {
            setError(event.message ?? 'Erreur inconnue')
            setProgress(null)
          }
        } catch {
          /* skip malformed SSE line */
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      {isRendering && (
        <Progress value={progress ?? 0} className="w-full" />
      )}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      <div className="flex gap-2">
        <Button onClick={handleRender} disabled={isRendering}>
          {isRendering ? `Rendu… ${progress ?? 0}%` : 'Render'}
        </Button>
        {done && (
          <Button variant="outline" asChild>
            <a href={`/api/renders/${videoName}`} download={`${videoName}.mp4`}>
              Télécharger MP4
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 3 : Commit**

```bash
git add components/RenderControls.tsx
git commit -m "feat: add RenderControls — SSE progress + download button"
```

---

## Task 13 : Créer `app/page.tsx` (liste des vidéos)

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1 : Écrire `app/page.tsx`**

```typescript
import Link from 'next/link'
import { listVideos } from '@/lib/videos'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function Home() {
  const videos = listVideos()

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">StellarPulse</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Lance{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">/new-video</code>{' '}
            dans Claude Code pour créer une vidéo.
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-32 text-muted-foreground">
            <p className="text-lg font-medium">Aucune vidéo pour l'instant.</p>
            <p className="text-sm mt-2">
              Lance{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">/new-video</code>{' '}
              dans Claude Code pour commencer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <Link key={v.name} href={`/video/${v.name}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{v.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{v.template}</Badge>
                    <Badge variant="outline">{v.format}</Badge>
                    <Badge variant="outline">{v.duration}s</Badge>
                    {v.hasOutput && (
                      <Badge className="bg-green-700 text-white">rendu</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2 : Lancer le dev server et vérifier**

```bash
npm run dev
```

Ouvrir `http://localhost:3000`. Attendu : page "StellarPulse" avec message "Aucune vidéo pour l'instant."

- [ ] **Step 3 : Commit**

```bash
git add app/page.tsx
git commit -m "feat: add home page — video list from filesystem"
```

---

## Task 14 : Créer `app/video/[name]/page.tsx`

**Files:**
- Create: `app/video/[name]/page.tsx`

- [ ] **Step 1 : Créer les dossiers**

```bash
mkdir -p "app/video/[name]"
```

- [ ] **Step 2 : Écrire `app/video/[name]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getVideoMeta, getVideoProps } from '@/lib/videos'
import { VideoPlayer } from '@/components/VideoPlayer'
import { RenderControls } from '@/components/RenderControls'
import { Badge } from '@/components/ui/badge'

type Props = { params: Promise<{ name: string }> }

export default async function VideoPage({ params }: Props) {
  const { name } = await params
  const meta = getVideoMeta(name)
  if (!meta) notFound()

  const props = getVideoProps(name) ?? {}

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          ← Retour
        </Link>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <Badge variant="secondary">{meta.template}</Badge>
          <Badge variant="outline">{meta.format}</Badge>
          <Badge variant="outline">{meta.duration}s</Badge>
        </div>

        <div className="mb-4 bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-48">
          <VideoPlayer
            template={meta.template}
            format={meta.format}
            duration={meta.duration}
            props={props}
          />
        </div>

        <RenderControls videoName={name} hasOutput={meta.hasOutput} />
      </div>
    </main>
  )
}
```

- [ ] **Step 3 : Tester manuellement**

Créer un dossier de test :

```bash
mkdir -p videos/test-video
cat > videos/test-video/description.md << 'EOF'
---
template: social-hook
duration: 7
format: 9x16
---

## Objectif
Test de la page vidéo

## Message principal (hookText)
Hello World!
EOF

cat > videos/test-video/props.json << 'EOF'
{
  "hookText": "Hello World!",
  "subText": "Thread below 👇",
  "accentColor": "#f59e0b",
  "backgroundColor": "#050505",
  "textColor": "#ffffff",
  "durationInSeconds": 7
}
EOF
```

Ouvrir `http://localhost:3000` → vérifier que la carte "test-video" apparaît → cliquer → vérifier preview Remotion + bouton Render.

- [ ] **Step 4 : Nettoyer le dossier de test**

```bash
rm -rf videos/test-video
```

- [ ] **Step 5 : Commit**

```bash
git add "app/video/"
git commit -m "feat: add video detail page — preview + render + download"
```

---

## Task 15 : Mettre à jour `generate-props` pour écrire dans `videos/<nom>/props.json`

**Files:**
- Modify: `.claude/commands/generate-props.md`

- [ ] **Step 1 : Réécrire `.claude/commands/generate-props.md`**

```markdown
# Commande : /generate-props

Génère des props JSON pour un template Remotion StellarPulse et les écrit dans `videos/<nom>/props.json`.

## Usage

```
/generate-props <template-id> <nom-video> <description>
```

**Exemples :**
```
/generate-props saas-promo mon-app "app de gestion de projet dark mode violet"
/generate-props social-hook fitness-hook "hook TikTok pour une app fitness"
/generate-props text-reveal citation-zen "citation motivationnelle sobre en 3 lignes"
/generate-props course-intro ts-chapitre3 "chapitre 3 d'un cours TypeScript avancé"
```

## Comportement attendu

1. Identifie le template ciblé (`saas-promo`, `course-intro`, `social-hook`, `text-reveal`)
2. Génère un objet JSON complet et valide selon le schéma Zod du template (voir ci-dessous)
3. Écrit le JSON dans `videos/<nom-video>/props.json` (crée le dossier si nécessaire)
4. Affiche le JSON généré dans le chat
5. Rappelle : "Ouvre http://localhost:3000/video/<nom-video> pour prévisualiser"

## Schémas Zod par template

### social-hook
```typescript
{
  hookText: string,         // texte accrocheur principal
  subText: string,          // texte secondaire (ex: "Thread below 👇")
  accentColor: string,      // hex color (ex: "#f59e0b")
  backgroundColor: string,  // hex color (ex: "#050505")
  textColor: string,        // hex color (ex: "#ffffff")
  durationInSeconds: number // entre 3 et 30
}
```

### text-reveal
```typescript
{
  lines: string[],          // 1 à 5 lignes de texte
  fontSizeMultiplier: number, // 0.5 à 3
  accentColor: string,      // hex color
  backgroundColor: string,  // hex color
  revealStyle: "fade" | "slide" | "typewriter",
  durationInSeconds: number // entre 3 et 60
}
```

### course-intro
```typescript
{
  courseTitle: string,
  authorName: string,
  chapterNumber: number,    // >= 1
  chapterTitle: string,
  accentColor: string,      // hex color
  backgroundColor: string,  // hex color
  durationInSeconds: number // entre 5 et 30
}
```

### saas-promo
```typescript
{
  productName: string,
  tagline: string,
  ctaText: string,
  accentColor: string,      // hex color
  backgroundColor: string,  // hex color
  logoUrl?: string,         // URL publique optionnelle
  durationInSeconds: number // entre 5 et 60
}
```
```

- [ ] **Step 2 : Commit**

```bash
git add .claude/commands/generate-props.md
git commit -m "feat: update generate-props — writes props.json to videos/<nom>/"
```

---

## Task 16 : Créer le skill `/new-video`

**Files:**
- Create: `.claude/commands/new-video.md`

- [ ] **Step 1 : Écrire `.claude/commands/new-video.md`**

````markdown
# Commande : /new-video

Crée une nouvelle vidéo dans `videos/<nom>/` avec son `description.md` et son `props.json`.

## Usage

- **Mode interactif** : `/new-video`
- **Mode auto** : `/new-video --auto <nom> <template> "<description courte>"`

---

## Mode interactif

Suis ces étapes dans l'ordre :

### Étape 1 — Nom de la vidéo
Demande à l'utilisateur le nom de la vidéo (slug : lowercase, tirets, pas d'espaces ni accents).
Exemple : `ma-promo-2026`, `fitness-hook-1`, `cours-ts-ch3`

Vérifie que `videos/<nom>/` n'existe pas déjà. Si c'est le cas, demande confirmation avant d'écraser.

### Étape 2 — Choix du template
Présente les 4 options :

| Template | Format | Usage typique |
|---|---|---|
| `social-hook` | 9x16 vertical | Hook court réseaux sociaux (TikTok, Reels) |
| `text-reveal` | 16x9 | Révélation de texte ligne par ligne |
| `course-intro` | 16x9 | Intro de chapitre de cours en ligne |
| `saas-promo` | 16x9 | Promo d'un produit SaaS |

### Étape 3 — Questions de contenu
Pose ces questions une par une selon le template choisi :

**Pour tous les templates :**
- Objectif : quel effet sur le viewer ?
- Message principal (le texte qui s'affichera)
- Ton et style (couleurs, ambiance, énergie)
- Call to action ou émotion finale

**Questions spécifiques par template :**
- `social-hook` → demander aussi le sous-texte (subText)
- `text-reveal` → demander les lignes de texte (jusqu'à 5) et le style de révélation (fade/slide/typewriter)
- `course-intro` → demander : titre du cours, nom de l'auteur, numéro et titre du chapitre
- `saas-promo` → demander : nom du produit, tagline, texte du CTA, URL du logo (optionnel)

### Étape 4 — Générer les fichiers

1. Copier `templates/<template>.md` → `videos/<nom>/description.md`
2. Remplir les sections du `description.md` avec les réponses de l'utilisateur
3. Utiliser le skill `/generate-props` pour créer `videos/<nom>/props.json`
   - Commande : `/generate-props <template> <nom> "<résumé du contenu>"`

### Étape 5 — Confirmation
Afficher :
```
✓ Vidéo "<nom>" créée avec le template <template>.
  → description.md : videos/<nom>/description.md
  → props.json     : videos/<nom>/props.json

Prévisualiser : http://localhost:3000/video/<nom>
Render        : clic sur le bouton "Render" dans l'interface
```

---

## Mode auto

Si la commande commence par `--auto`, parser les arguments :
```
/new-video --auto <nom> <template> "<description courte>"
```

**Exemple :**
```
/new-video --auto fitness-hook social-hook "hook TikTok énergique pour app fitness, texte blanc sur fond noir, accentColor rouge"
```

1. Créer `videos/<nom>/` (sans écraser si existant — afficher une erreur)
2. Générer `videos/<nom>/description.md` en inférant toutes les sections depuis la description courte
3. Générer `videos/<nom>/props.json` via `/generate-props <template> <nom> "<description>"`
4. Afficher le résumé (même format que l'étape 5 du mode interactif)

---

## Règles

- Le nom doit être un slug valide (regex : `^[a-z0-9-]+$`). Refuser sinon.
- Ne jamais écraser `videos/<nom>/` sans confirmation explicite de l'utilisateur.
- `props.json` doit respecter le schéma Zod du template (voir `remotion/compositions/<template>/schema.ts`).
- Utiliser les valeurs par défaut du schéma comme base, puis les remplacer avec le contenu de la description.
````

- [ ] **Step 2 : Commit**

```bash
git add .claude/commands/new-video.md
git commit -m "feat: add /new-video skill — interactive + auto modes"
```

---

## Task 17 : Mettre à jour `CLAUDE.md` et `ROADMAP.md`

**Files:**
- Modify: `CLAUDE.md`
- Modify: `ROADMAP.md`

- [ ] **Step 1 : Réécrire `CLAUDE.md`**

```markdown
# CLAUDE.md — StellarPulse Video Creator

## Projet
Studio de création vidéo local. Next.js 15 + Remotion 4. Pas de cloud, pas d'auth.
Workflow piloté par fichiers `description.md` dans `videos/`.

## Skills disponibles
- `/new-video` — créer une vidéo (interactif ou `--auto`)
- `/generate-props <template> <nom> <description>` — générer props.json
- `/preview` — lancer Remotion Studio
- `/render` — lancer le render MP4

## Skills de développement
- `remotion-best-practices` — patterns Remotion (useCurrentFrame, spring, interpolate)
- `new-template` — créer une nouvelle composition Remotion

## Commandes utiles
- `npm run dev` — Next.js sur localhost:3000
- `npm run remotion:studio` — Remotion Studio sur localhost:3001
- `npm run remotion:render <comp> <output>` — render MP4 local

## Structure clé
- `videos/<nom>/description.md` — description humaine de la vidéo
- `videos/<nom>/props.json` — props Remotion (générées par /generate-props)
- `videos/<nom>/output.mp4` — vidéo rendue (gitignorée)
- `templates/<template>.md` — modèles de description.md
- `remotion/compositions/<template>/` — composition Remotion + schema Zod

## Conventions
- Compositions Remotion dans `remotion/compositions/<nom>/`
- Chaque composition a un `schema.ts` (Zod) + un `<Nom>.tsx`
- Props toujours validées par Zod
- Animations UI → Framer Motion. Animations vidéo → useCurrentFrame + spring

## À ne pas faire
- Ne pas utiliser `use server` dans les composants qui importent Remotion
- Ne pas importer @remotion/player côté serveur (client component uniquement)
- Ne pas committer les fichiers `output.mp4` (déjà gitignorés via `*.mp4`)
```

- [ ] **Step 2 : Réécrire `ROADMAP.md`**

```markdown
# ROADMAP — StellarPulse

## V1 — Done ✓
- [x] 4 compositions Remotion (social-hook, text-reveal, course-intro, saas-promo)
- [x] Workflow description.md → props.json → render MP4
- [x] Page liste des vidéos (filesystem pur)
- [x] Preview @remotion/player
- [x] Render SSE + téléchargement MP4
- [x] Skills /new-video et /generate-props

## V2 — Éditeur UI inline
- [ ] Modifier les props directement dans l'interface (sliders, champs texte)
- [ ] Pas besoin d'éditer props.json manuellement
- [ ] Champs générés dynamiquement depuis le schéma Zod de chaque composition
- [ ] Sauvegarde auto dans videos/<nom>/props.json
- [ ] Hot-reload du Player à chaque changement

## V3 — Idées futures
- [ ] Export GIF
- [ ] Soundtrack / SFX via @remotion/media-utils
- [ ] Templates communautaires
```

- [ ] **Step 3 : Commit**

```bash
git add CLAUDE.md ROADMAP.md
git commit -m "docs: update CLAUDE.md workflow + ROADMAP V2 editor UI"
```

---

## Task 18 : Vérification finale

- [ ] **Step 1 : Build de production**

```bash
npm run build
```

Attendu : build réussi sans erreur critique (des warnings TypeScript peuvent subsister).

- [ ] **Step 2 : Test end-to-end**

```bash
npm run dev
```

1. Ouvrir `http://localhost:3000` → page vide "Aucune vidéo"
2. Lancer `/new-video` dans Claude Code → créer une vidéo test
3. Actualiser `http://localhost:3000` → la carte apparaît
4. Cliquer → preview Remotion fonctionne
5. Clic "Render" → progress SSE → MP4 généré
6. Clic "Télécharger MP4" → téléchargement

- [ ] **Step 3 : Vérifier que les fichiers gitignorés sont corrects**

```bash
git status
```

Attendu : `videos/*/output.mp4` n'apparaît pas dans git status.

- [ ] **Step 4 : Commit final**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```
