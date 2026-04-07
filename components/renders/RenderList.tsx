'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStudioStore } from '@/lib/store/studio';
import type { RenderFile } from '@/app/api/renders/route';

export const RenderList = () => {
  const { render } = useStudioStore();
  const [history, setHistory] = useState<RenderFile[]>([]);

  useEffect(() => {
    fetch('/api/renders')
      .then((r) => r.json())
      .then((data: RenderFile[]) => setHistory(data))
      .catch(() => {/* non-critical, silently ignore */});
  }, [render.lastRenderPath]); // re-fetch after each new render

  const isEmpty = !render.isRendering && history.length === 0;

  return (
    <div className="space-y-3">
      {render.isRendering && (
        <div className="flex items-center justify-between bg-card border rounded-lg p-4 gap-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="text-yellow-500 border-yellow-500/30"
            >
              ⟳ En cours
            </Badge>
            <div className="text-sm font-medium">Rendu en cours…</div>
          </div>
          <div className="w-32">
            <Progress value={render.progress} className="h-1.5" />
            <div className="text-xs text-muted-foreground text-right mt-0.5">
              {Math.round(render.progress)}%
            </div>
          </div>
        </div>
      )}
      {history.map((file) => (
        <div
          key={file.path}
          className="flex items-center justify-between bg-card border rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="text-green-500 border-green-500/30"
            >
              ✓ Terminé
            </Badge>
            <div>
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(file.createdAt).toLocaleString('fr-FR')}
                {' · '}
                {(file.sizeBytes / 1_000_000).toFixed(1)} Mo
              </div>
            </div>
          </div>
          <a
            href={`/${file.path}`}
            download
            className="text-xs text-primary hover:underline"
          >
            ⬇ Download
          </a>
        </div>
      ))}
      {isEmpty && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Aucun rendu pour l'instant. Crée une vidéo dans l'éditeur.
        </div>
      )}
    </div>
  );
};
