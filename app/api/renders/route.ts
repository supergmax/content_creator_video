import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface RenderFile {
  name: string;
  path: string;
  createdAt: string;
  sizeBytes: number;
}

export async function GET() {
  const rendersDir = join(process.cwd(), 'public', 'renders');

  let files: RenderFile[] = [];
  try {
    const entries = readdirSync(rendersDir);
    files = entries
      .filter((f) => f.endsWith('.mp4'))
      .map((f) => {
        const stat = statSync(join(rendersDir, f));
        return {
          name: f,
          path: `renders/${f}`,
          createdAt: stat.birthtime.toISOString(),
          sizeBytes: stat.size,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  } catch {
    // Directory doesn't exist yet — return empty list
  }

  return Response.json(files);
}
