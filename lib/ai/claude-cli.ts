import { spawn } from 'node:child_process';

/**
 * Exécute `claude -p <prompt>` en subprocess.
 * Utilise l'auth de Claude Code — aucune clé API requise.
 */
export function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', prompt], {
      env: process.env,
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (d: Buffer) => {
      output += d.toString();
    });
    child.stderr.on('data', (d: Buffer) => {
      errorOutput += d.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`claude exited ${code}: ${errorOutput.trim()}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Impossible de lancer claude: ${err.message}`));
    });
  });
}
