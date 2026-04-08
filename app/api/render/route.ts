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
