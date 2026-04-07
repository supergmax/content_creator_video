'use client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useStudioStore } from '@/lib/store/studio';

export const RenderList = () => {
  const { render } = useStudioStore();

  return (
    <div className="space-y-3">
      {render.lastRenderPath && (
        <div className="flex items-center justify-between bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-500 border-green-500/30">✓ Terminé</Badge>
            <div>
              <div className="text-sm font-medium">{render.lastRenderPath.split('/').pop()}</div>
              <div className="text-xs text-muted-foreground">Rendu complété</div>
            </div>
          </div>
          <a href={`/${render.lastRenderPath}`} download className="text-xs text-primary hover:underline">
            ⬇ Download
          </a>
        </div>
      )}
      {render.isRendering && (
        <div className="flex items-center justify-between bg-card border rounded-lg p-4 gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">⟳ En cours</Badge>
            <div className="text-sm font-medium">Rendu en cours…</div>
          </div>
          <div className="w-32">
            <Progress value={render.progress} className="h-1.5" />
            <div className="text-xs text-muted-foreground text-right mt-0.5">{Math.round(render.progress)}%</div>
          </div>
        </div>
      )}
      {!render.lastRenderPath && !render.isRendering && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Aucun rendu pour l'instant. Crée une vidéo dans l'éditeur.
        </div>
      )}
    </div>
  );
};
