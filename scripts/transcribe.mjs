/**
 * transcribe.mjs — Transcription audio locale via Whisper (@xenova/transformers)
 *
 * Usage:
 *   node scripts/transcribe.mjs <audio.mp3> <output.json>
 *   node scripts/transcribe.mjs public/audio/odune-boulangerie.mp3 videos/odune-boulangerie/transcription.json
 *
 * 100% LOCAL, ZÉRO COÛT, ZÉRO CLÉ API
 * - Première fois: télécharge le modèle Whisper multilingual base (~140 MB) dans S:\dev\cache\huggingface
 * - Runs suivants: utilise le cache local, ~30-60s de transcription pour 30s d'audio
 * - Output: JSON avec texte complet + chunks word-level (startSec, endSec, word)
 *
 * Pipeline:
 *   MP3 → ffmpeg (PCM float32 16kHz mono) → Whisper → JSON
 */

// IMPORTANT: set le cache AVANT d'importer transformers, sinon il utilise le default
process.env.TRANSFORMERS_CACHE = 'S:\\dev\\cache\\huggingface';
process.env.HF_HOME = 'S:\\dev\\cache\\huggingface';

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// ─────────────────────────────────────────────────
// CLI args
// ─────────────────────────────────────────────────
const audioPath = process.argv[2];
const outputPath = process.argv[3];

if (!audioPath || !outputPath) {
  console.error('Usage: node scripts/transcribe.mjs <audio.mp3> <output.json>');
  process.exit(1);
}

if (!fs.existsSync(audioPath)) {
  console.error(`❌ Audio file not found: ${audioPath}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────
// Step 1: Convert MP3 → PCM Float32 16kHz mono via ffmpeg
// Whisper expects 16kHz mono float32 audio
// ─────────────────────────────────────────────────
console.log('📥 Step 1: Converting audio to PCM float32 16kHz mono...');

const ffmpegPath = path.resolve(
  'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe',
);

if (!fs.existsSync(ffmpegPath)) {
  console.error(`❌ ffmpeg not found at ${ffmpegPath}`);
  console.error('   Make sure Remotion is installed in this project.');
  process.exit(1);
}

const tempWavPath = path.join(
  path.dirname(outputPath),
  `.tmp_${path.basename(audioPath, path.extname(audioPath))}.wav`,
);

// Ensure output dir exists
fs.mkdirSync(path.dirname(tempWavPath), { recursive: true });

// Use WAV pcm_s16le (supported by Remotion's bundled ffmpeg)
// We'll convert to Float32 in Node afterward
const ffmpegResult = spawnSync(
  ffmpegPath,
  [
    '-y',
    '-i', audioPath,
    '-acodec', 'pcm_s16le',
    '-ar', '16000',
    '-ac', '1',
    tempWavPath,
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);

if (ffmpegResult.status !== 0) {
  console.error('❌ ffmpeg failed:');
  console.error(ffmpegResult.stderr.toString());
  process.exit(1);
}

// Parse WAV file: skip 44-byte RIFF header, read as Int16, convert to Float32
const wavBuffer = fs.readFileSync(tempWavPath);
// The actual data offset may not be 44 bytes — parse the chunk headers to find 'data'
let dataOffset = 12; // skip RIFF header
while (dataOffset < wavBuffer.length - 8) {
  const chunkId = wavBuffer.toString('ascii', dataOffset, dataOffset + 4);
  const chunkSize = wavBuffer.readUInt32LE(dataOffset + 4);
  if (chunkId === 'data') {
    dataOffset += 8;
    break;
  }
  dataOffset += 8 + chunkSize;
}

const sampleCount = (wavBuffer.length - dataOffset) / 2; // int16 = 2 bytes
const audioFloat32 = new Float32Array(sampleCount);
for (let i = 0; i < sampleCount; i++) {
  const sample = wavBuffer.readInt16LE(dataOffset + i * 2);
  audioFloat32[i] = sample / 32768; // normalize to [-1, 1]
}

const audioDurationSec = audioFloat32.length / 16000;
console.log(
  `   ✓ Audio loaded: ${audioFloat32.length} samples (${audioDurationSec.toFixed(2)}s @ 16kHz mono)`,
);

// ─────────────────────────────────────────────────
// Step 2: Load Whisper pipeline (first run = download ~140 MB)
// ─────────────────────────────────────────────────
console.log('\n📦 Step 2: Loading Whisper model...');
console.log(`   Cache dir: ${process.env.TRANSFORMERS_CACHE}`);
console.log('   Model: Xenova/whisper-medium (multilingual, ~140 MB)');
console.log('   (First run downloads from HuggingFace, subsequent runs use cache)');

const { pipeline, env } = await import('@xenova/transformers');
// Double-sécurité: explicitement set le cache dir via l'env de transformers
env.cacheDir = 'S:\\dev\\cache\\huggingface';
env.localModelPath = 'S:\\dev\\cache\\huggingface';

const transcriber = await pipeline(
  'automatic-speech-recognition',
  'Xenova/whisper-medium',
);

console.log('   ✓ Model loaded');

// ─────────────────────────────────────────────────
// Step 3: Transcribe with word-level timestamps
// ─────────────────────────────────────────────────
console.log('\n🎙️  Step 3: Transcribing (may take 30-90s for ~30s audio on CPU)...');

const t0 = Date.now();

const result = await transcriber(audioFloat32, {
  return_timestamps: 'word', // word-level timestamps
  language: 'french',
  task: 'transcribe',
  chunk_length_s: 30,
  stride_length_s: 5,
});

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`   ✓ Transcription complete in ${elapsed}s`);

// ─────────────────────────────────────────────────
// Step 4: Save result
// ─────────────────────────────────────────────────
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`\n💾 Saved transcription to: ${outputPath}`);

// Cleanup temp wav file
fs.unlinkSync(tempWavPath);

// ─────────────────────────────────────────────────
// Print summary
// ─────────────────────────────────────────────────
console.log('\n📝 Transcription text:');
console.log(`   "${result.text?.trim()}"`);

if (result.chunks) {
  console.log(`\n⏱️  Word-level chunks (${result.chunks.length} words):`);
  result.chunks.slice(0, 5).forEach((chunk) => {
    const [start, end] = chunk.timestamp;
    console.log(
      `   ${start?.toFixed(2) ?? '?'}s - ${end?.toFixed(2) ?? '?'}s  "${chunk.text}"`,
    );
  });
  if (result.chunks.length > 5) {
    console.log(`   ... and ${result.chunks.length - 5} more`);
  }
}

console.log(
  '\n✅ Done. Next step: use scripts/chunks-to-segments.mjs to convert into props.json format.',
);
