import { type NextRequest } from 'next/server';
import { renderProgress } from '../route';

export async function GET(req: NextRequest) {
  const renderKey = req.nextUrl.searchParams.get('key');

  if (!renderKey) {
    return Response.json({ error: 'Missing key' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        const progress = renderProgress.get(renderKey) ?? 0;
        const done = progress === 100;
        const error = progress === -1;

        const data = JSON.stringify({
          progress: error ? 0 : progress,
          done,
          error,
          filePath: done ? `renders/${renderKey}.mp4` : null,
        });

        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

        if (done || error) {
          clearInterval(interval);
          controller.close();
          if (!error) renderProgress.delete(renderKey);
        }
      }, 500);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
