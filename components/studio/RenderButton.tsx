'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useStudioStore } from '@/lib/store/studio';

export const RenderButton = () => {
  const {
    templateId,
    props,
    format,
    render,
    setRenderProgress,
    setRenderComplete,
    setRenderIdle,
  } = useStudioStore();
  const [error, setError] = useState<string | null>(null);

  const handleRender = async () => {
    if (render.isRendering) return;
    setError(null);
    setRenderIdle();

    const outputName = `${templateId}-${Date.now()}`;

    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, format, props, outputName }),
    });

    if (!res.ok) {
      setError('Erreur au démarrage du rendu');
      return;
    }

    setRenderProgress(1);

    const sse = new EventSource(`/api/render/progress?key=${outputName}`);

    sse.onmessage = (e) => {
      const data = JSON.parse(e.data) as {
        progress: number;
        done: boolean;
        error: boolean;
        filePath: string | null;
      };
      if (data.error) {
        setError('Rendu échoué');
        setRenderIdle();
        sse.close();
        return;
      }
      if (data.done && data.filePath) {
        setRenderComplete(data.filePath);
        sse.close();
      } else {
        setRenderProgress(data.progress);
      }
    };

    sse.onerror = () => {
      setError('Connexion SSE perdue');
      setRenderIdle();
      sse.close();
    };
  };

  return (
    <div className="space-y-2">
      {render.isRendering && (
        <div className="space-y-1">
          <Progress value={render.progress} className="h-1.5" />
          <div className="text-xs text-muted-foreground text-center">
            {Math.round(render.progress)}% — rendu en cours…
          </div>
        </div>
      )}
      {render.lastRenderPath && !render.isRendering && (
        <a
          href={`/${render.lastRenderPath}`}
          download
          className="block text-center text-xs text-primary hover:underline py-1"
        >
          ⬇ Télécharger le MP4
        </a>
      )}
      {error && (
        <div className="text-xs text-destructive text-center">{error}</div>
      )}
      <Button
        onClick={handleRender}
        disabled={render.isRendering}
        size="sm"
        className="w-full text-xs"
        variant="outline"
      >
        {render.isRendering
          ? `⟳ ${Math.round(render.progress)}%`
          : '⬇ Render MP4'}
      </Button>
    </div>
  );
};
