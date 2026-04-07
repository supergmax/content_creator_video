import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import path from 'node:path';

export interface RenderJob {
  compositionId: string;
  outputName: string;
  width: number;
  height: number;
  props: Record<string, unknown>;
}

export function spawnRender(
  job: RenderJob,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(
      process.cwd(),
      'public',
      'renders',
      `${job.outputName}.mp4`,
    );

    mkdirSync(path.join(process.cwd(), 'public', 'renders'), { recursive: true });

    const tempPropsPath = join(tmpdir(), `remotion-props-${job.outputName}.json`);
    writeFileSync(tempPropsPath, JSON.stringify(job.props));

    const child = spawn(
      'npx',
      [
        'remotion',
        'render',
        'remotion/Root.tsx',
        job.compositionId,
        outputPath,
        `--props=${tempPropsPath}`,
      ],
    );

    const parseProgress = (text: string) => {
      const match = text.match(/(\d+)%/);
      if (match) onProgress(parseInt(match[1], 10));
    };

    child.stdout.on('data', (data: Buffer) => parseProgress(data.toString()));
    child.stderr.on('data', (data: Buffer) => parseProgress(data.toString()));

    child.on('close', (code) => {
      try { unlinkSync(tempPropsPath); } catch { /* ignore cleanup errors */ }
      if (code === 0) resolve(`renders/${job.outputName}.mp4`);
      else reject(new Error(`Render exited with code ${code}`));
    });
  });
}
