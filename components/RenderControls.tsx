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
