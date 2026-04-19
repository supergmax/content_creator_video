/**
 * remove-breaths.mjs — Noise gate pour supprimer les respirations ElevenLabs
 *
 * Usage:
 *   node scripts/remove-breaths.mjs <input.mp3> <output.mp3>
 *
 * Ce que le script fait:
 * 1. Convertit MP3 → PCM WAV 16-bit via ffmpeg
 * 2. Analyse le volume par fenêtres de 30ms
 * 3. Détecte les segments de volume bas (respirations, bruits de bouche)
 * 4. Les remplace par du silence pur
 * 5. Reconvertit en MP3
 *
 * L'audio garde EXACTEMENT la même durée → les timestamps Whisper restent valides.
 * Intégrable dans le pipeline avant transcribe.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const FFMPEG = path.resolve(
  'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe',
);

// ─────────────────────────────────────────────────
// NOISE GATE PARAMETERS
// ─────────────────────────────────────────────────
const SAMPLE_RATE = 44100;
const WINDOW_MS = 30; // taille de la fenêtre d'analyse en ms
const WINDOW_SAMPLES = Math.round(SAMPLE_RATE * WINDOW_MS / 1000);

// Seuil RMS sous lequel on considère que c'est une respiration/bruit
// À ajuster si trop agressif (coupe des mots) ou pas assez (laisse des respirations)
const GATE_THRESHOLD = 0.008;

const MIN_SILENCE_MS = 150;
const MIN_SILENCE_WINDOWS = Math.round(MIN_SILENCE_MS / WINDOW_MS);

const FADE_SAMPLES = 1200;

// Speed up factor (1.0 = normal, 1.15 = 15% plus rapide)
const SPEED_FACTOR = 1.0; // Désactivé: on utilise le silence trimmer à la place

// Silence trimmer: si un silence dure > MAX_SILENCE_MS, le raccourcir à TARGET_SILENCE_MS
const MAX_SILENCE_MS = 800;
const TARGET_SILENCE_MS = 350;

// ─────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────
const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/remove-breaths.mjs <input.mp3> <output.mp3>');
  process.exit(1);
}

console.log('🎙️  Breath removal — noise gate');
console.log(`   Input: ${inputPath}`);
console.log(`   Gate threshold: ${GATE_THRESHOLD}`);
console.log(`   Min silence: ${MIN_SILENCE_MS}ms`);

// ─────────────────────────────────────────────────
// Step 1: MP3 → WAV PCM 16-bit
// ─────────────────────────────────────────────────
const tempWav = inputPath + '.tmp.wav';
const tempOutWav = inputPath + '.tmp.out.wav';

console.log('\n📥 Converting MP3 → WAV...');
const toWav = spawnSync(FFMPEG, [
  '-y', '-i', inputPath, '-acodec', 'pcm_s16le', '-ar', String(SAMPLE_RATE), '-ac', '1', tempWav,
], { stdio: ['ignore', 'pipe', 'pipe'] });

if (toWav.status !== 0) {
  console.error('ffmpeg error:', toWav.stderr.toString().slice(0, 300));
  process.exit(1);
}

// ─────────────────────────────────────────────────
// Step 2: Read WAV and apply noise gate
// ─────────────────────────────────────────────────
console.log('🔇 Applying noise gate...');

const wavBuffer = fs.readFileSync(tempWav);

// Find data chunk
let dataOffset = 12;
while (dataOffset < wavBuffer.length - 8) {
  const chunkId = wavBuffer.toString('ascii', dataOffset, dataOffset + 4);
  const chunkSize = wavBuffer.readUInt32LE(dataOffset + 4);
  if (chunkId === 'data') {
    dataOffset += 8;
    break;
  }
  dataOffset += 8 + chunkSize;
}

const headerBytes = Buffer.from(wavBuffer.subarray(0, dataOffset));
const sampleCount = (wavBuffer.length - dataOffset) / 2;
const samples = new Int16Array(sampleCount);

for (let i = 0; i < sampleCount; i++) {
  samples[i] = wavBuffer.readInt16LE(dataOffset + i * 2);
}

// Analyze windows and find breath segments
const windowCount = Math.floor(sampleCount / WINDOW_SAMPLES);
const rmsValues = new Float32Array(windowCount);

for (let w = 0; w < windowCount; w++) {
  let sumSq = 0;
  const start = w * WINDOW_SAMPLES;
  for (let i = 0; i < WINDOW_SAMPLES; i++) {
    const val = samples[start + i] / 32768;
    sumSq += val * val;
  }
  rmsValues[w] = Math.sqrt(sumSq / WINDOW_SAMPLES);
}

// Find continuous segments below threshold
let breathSegments = 0;
let samplesGated = 0;
let w = 0;

while (w < windowCount) {
  if (rmsValues[w] < GATE_THRESHOLD) {
    // Start of a potential breath
    let silenceStart = w;
    while (w < windowCount && rmsValues[w] < GATE_THRESHOLD) {
      w++;
    }
    const silenceLen = w - silenceStart;

    if (silenceLen >= MIN_SILENCE_WINDOWS) {
      // Gate this segment — replace with silence
      const startSample = silenceStart * WINDOW_SAMPLES;
      const endSample = Math.min(w * WINDOW_SAMPLES, sampleCount);

      // Apply fade out at start
      for (let i = 0; i < FADE_SAMPLES && startSample + i < sampleCount; i++) {
        const fade = 1 - (i / FADE_SAMPLES);
        samples[startSample + i] = Math.round(samples[startSample + i] * fade);
      }

      // Silence the middle
      for (let i = startSample + FADE_SAMPLES; i < endSample - FADE_SAMPLES; i++) {
        if (i >= 0 && i < sampleCount) samples[i] = 0;
      }

      // Apply fade in at end
      for (let i = 0; i < FADE_SAMPLES && endSample - FADE_SAMPLES + i < sampleCount; i++) {
        const fade = i / FADE_SAMPLES;
        const idx = endSample - FADE_SAMPLES + i;
        if (idx >= 0 && idx < sampleCount) {
          samples[idx] = Math.round(samples[idx] * fade);
        }
      }

      breathSegments++;
      samplesGated += endSample - startSample;
    }
  }
  w++;
}

console.log(`   Found ${breathSegments} breath segments`);
console.log(`   Gated ${(samplesGated / SAMPLE_RATE).toFixed(2)}s of audio`);

// ─────────────────────────────────────────────────
// Step 2.5: Silence trimmer — raccourcir les pauses trop longues
// Au lieu de juste silencer (Step 2), ici on COUPE physiquement les silences
// pour que l'audio soit plus compact (style TikTok: pas de temps mort).
// ─────────────────────────────────────────────────
console.log('✂️  Trimming long silences...');

const maxSilenceSamples = Math.round(SAMPLE_RATE * MAX_SILENCE_MS / 1000);
const targetSilenceSamples = Math.round(SAMPLE_RATE * TARGET_SILENCE_MS / 1000);
const silenceThreshold = 0.020;
const checkWindow = Math.round(SAMPLE_RATE * 0.02); // 20ms windows for detection

// Build output by copying samples and trimming long silences
const trimmedSamples = [];
let i2 = 0;
let silencesTrimmed = 0;
let totalTrimmedMs = 0;

while (i2 < sampleCount) {
  // Check if current position is silence
  let silenceLen = 0;
  let checkPos = i2;

  while (checkPos + checkWindow < sampleCount) {
    let sumSq = 0;
    for (let j = 0; j < checkWindow; j++) {
      const val = samples[checkPos + j] / 32768;
      sumSq += val * val;
    }
    const rms = Math.sqrt(sumSq / checkWindow);

    if (rms < silenceThreshold) {
      silenceLen += checkWindow;
      checkPos += checkWindow;
    } else {
      break;
    }
  }

  if (silenceLen > maxSilenceSamples) {
    // Long silence found — keep only TARGET_SILENCE_MS worth
    // Copy the first targetSilenceSamples of silence
    for (let j = 0; j < targetSilenceSamples && i2 + j < sampleCount; j++) {
      trimmedSamples.push(samples[i2 + j]);
    }
    silencesTrimmed++;
    totalTrimmedMs += (silenceLen - targetSilenceSamples) / SAMPLE_RATE * 1000;
    i2 += silenceLen;
  } else {
    // Not a long silence — copy as is
    trimmedSamples.push(samples[i2]);
    i2++;
  }
}

console.log(`   Silences trimmed: ${silencesTrimmed}`);
console.log(`   Time saved: ${(totalTrimmedMs / 1000).toFixed(2)}s`);
console.log(`   New duration: ${(trimmedSamples.length / SAMPLE_RATE).toFixed(2)}s (was ${(sampleCount / SAMPLE_RATE).toFixed(2)}s)`);

// ─────────────────────────────────────────────────
// Step 3: Write modified WAV (with trimmed silences)
// ─────────────────────────────────────────────────
const finalSampleCount = trimmedSamples.length;

// Update WAV header with new data size
const newDataSize = finalSampleCount * 2;
const outBuffer = Buffer.alloc(headerBytes.length + newDataSize);
headerBytes.copy(outBuffer, 0);

// Fix the RIFF chunk size and data chunk size in the header
// RIFF size = file size - 8
outBuffer.writeUInt32LE(outBuffer.length - 8, 4);
// Find the data chunk size position (4 bytes before dataOffset)
outBuffer.writeUInt32LE(newDataSize, headerBytes.length - 4);

for (let i = 0; i < finalSampleCount; i++) {
  outBuffer.writeInt16LE(trimmedSamples[i], headerBytes.length + i * 2);
}
fs.writeFileSync(tempOutWav, outBuffer);

// ─────────────────────────────────────────────────
// Step 4: WAV → MP3 with speed up
// ─────────────────────────────────────────────────
console.log(`📤 Converting WAV → MP3 (speed: ${SPEED_FACTOR}x)...`);
const toMp3 = spawnSync(FFMPEG, [
  '-y', '-i', tempOutWav,
  '-filter:a', `atempo=${SPEED_FACTOR}`,
  '-acodec', 'libmp3lame', '-q:a', '2', outputPath,
], { stdio: ['ignore', 'pipe', 'pipe'] });

if (toMp3.status !== 0) {
  console.error('ffmpeg error:', toMp3.stderr.toString().slice(0, 300));
  process.exit(1);
}

// Cleanup temp files
fs.unlinkSync(tempWav);
fs.unlinkSync(tempOutWav);

const inputSize = fs.statSync(inputPath).size;
const outputSize = fs.statSync(outputPath).size;
console.log(`\n✅ Done!`);
console.log(`   Input:  ${(inputSize / 1024).toFixed(0)} KB`);
console.log(`   Output: ${(outputSize / 1024).toFixed(0)} KB`);
console.log(`   Breaths removed: ${breathSegments}`);
