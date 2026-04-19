/**
 * gen-images.mjs — Génération d'images via HuggingFace Inference API
 *
 * Usage:
 *   node scripts/gen-images.mjs <props.json> [--dry-run]
 *
 * Utilise FLUX.1-schnell via HuggingFace (gratuit avec token).
 * Token lu depuis .env.local (HF_TOKEN=hf_xxx).
 *
 * Le script:
 * 1. Lit le props.json
 * 2. Pour chaque segment sans mediaSrc → génère un prompt
 * 3. Appelle HuggingFace Inference API
 * 4. Sauvegarde dans public/images/generated/
 * 5. Met à jour le props.json
 */

import fs from 'node:fs';
import path from 'node:path';

// ─────────────────────────────────────────────────
// Load .env.local
// ─────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.error('❌ HF_TOKEN not found in .env.local');
  process.exit(1);
}

// ─────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────
const MODEL = 'black-forest-labs/FLUX.1-schnell';
const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL}`;
const DEFAULT_STYLE = 'Cinematic photograph, extremely warm golden amber color grading, rich orange sunset light, warm color temperature 3200K, shallow depth of field, film grain texture, professional commercial quality, 4K, photorealistic';
const OUTPUT_DIR = 'public/images/generated';

// ─────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const propsPath = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');

if (!propsPath) {
  console.error('Usage: node scripts/gen-images.mjs <props.json> [--dry-run]');
  process.exit(1);
}

const props = JSON.parse(fs.readFileSync(propsPath, 'utf-8'));
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────
// PROMPT GENERATION
// ─────────────────────────────────────────────────
function captionsToPrompt(segment) {
  const text = segment.captions
    .map((c) => c.text.replace(/\{\{|\}\}/g, ''))
    .join(' ')
    .trim();

  return `${DEFAULT_STYLE}. Scene depicting: ${text}. French urban setting, modern, clean composition.`;
}

// ─────────────────────────────────────────────────
// IMAGE GENERATION via HuggingFace
// ─────────────────────────────────────────────────
async function generateImage(prompt, outputPath) {
  console.log(`   📥 Generating via HuggingFace FLUX.1-schnell...`);
  console.log(`   Prompt: "${prompt.slice(0, 100)}..."`);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width: 768,
        height: 1344,  // 9:16 vertical (validé fonctionnel sur FLUX.1-schnell)
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

// ─────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────
async function main() {
  const segments = props.segments;
  let generated = 0;
  let skipped = 0;

  console.log(`\n🎨 Image generation — HuggingFace FLUX.1-schnell`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Segments: ${segments.length}\n`);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.mediaSrc || (seg.specialComponent && seg.specialComponent !== 'none')) {
      console.log(`  ${i + 1}. SKIP (has media or special component)`);
      skipped++;
      continue;
    }

    if (seg.backgroundColor === '#000000') {
      console.log(`  ${i + 1}. SKIP (dark impact)`);
      skipped++;
      continue;
    }

    const prompt = captionsToPrompt(seg);
    const filename = `seg_${String(i + 1).padStart(2, '0')}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    const publicPath = `/images/generated/${filename}`;

    console.log(`  ${i + 1}. GENERATE`);
    console.log(`     Text: "${seg.captions.map((c) => c.text).join(' | ')}"`);

    if (dryRun) {
      console.log(`     [DRY RUN] Prompt: "${prompt.slice(0, 80)}..."\n`);
      continue;
    }

    try {
      const bytes = await generateImage(prompt, outputPath);
      console.log(`     ✅ Saved: ${outputPath} (${(bytes / 1024).toFixed(0)} KB)\n`);
      seg.mediaSrc = publicPath;
      seg.mediaType = 'image';
      generated++;
    } catch (err) {
      console.error(`     ❌ Failed: ${err.message}\n`);
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 3000));
  }

  if (!dryRun && generated > 0) {
    fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));
    console.log(`\n💾 Updated ${propsPath} with ${generated} new images`);
  }

  console.log(`\n📊 Summary: ${generated} generated, ${skipped} skipped`);
}

main().catch(console.error);
