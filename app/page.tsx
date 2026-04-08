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
