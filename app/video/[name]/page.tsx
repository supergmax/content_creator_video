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
