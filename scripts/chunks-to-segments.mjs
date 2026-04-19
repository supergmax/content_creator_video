/**
 * chunks-to-segments.mjs V5 — Architecture media/captions séparés
 *
 * Usage:
 *   node scripts/chunks-to-segments.mjs <transcription.json> <props.json> [audioSrc]
 *
 * V5 logic:
 * 1. Corrige les erreurs Whisper (dictionnaire)
 * 2. Merge les patterns spéciaux (35%, contractions n'existez, etc.)
 * 3. Détecte les PHRASES par gaps audio > 0.45s (+ fallback sur longueur)
 * 4. Pour chaque phrase: génère 1 segment long avec:
 *    - Son média (mappé par keyword)
 *    - Ses captions imbriquées (2-3 mots, timings word-level)
 * 5. Output props.json dans la nouvelle structure
 *
 * Résultat: 1 segment = 1 phrase cohérente, 1 média stable, captions qui changent
 * au-dessus au rythme de la voix off.
 */

import fs from 'node:fs';
import path from 'node:path';

// ─────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────

const WORD_CORRECTIONS = [
  { from: ['Citrapide'], to: ['Site', 'rapide'] },
  { from: ['Fichegou', 'Google'], to: ['fiche', 'Google'] },
  { from: ['photomise', 'en', 'valeur'], to: ['photos', 'mises', 'en', 'valeur'] },
  { from: ['Resultat'], to: ['Résultat'] },
  { from: ['est', 'tap'], to: ['tape'] },
  { from: ['ils', 'tombent'], to: ['il', 'tombe'] },
  { from: ['qui', 'est', 'incite'], to: ['qui', 'a', 'un', 'site'] },
];

// Mots à highlighter (dans les captions finales)
const HIGHLIGHT_WORDS = ['35%', '2026'];
// Phrases à highlighter (traitement spécial)
const HIGHLIGHT_PHRASES = ['Tous les jours'];

// Mapping media par keyword — DÉSACTIVÉ par défaut pour éviter les faux matches
// entre vidéos différentes (ex: pain-rassis.jpeg qui apparaît dans une vidéo plombier).
// Pour activer: passer --mapping en CLI ou créer un fichier mapping.json par vidéo.
const ENABLE_MEDIA_MAPPING = process.argv.includes('--with-mapping');
const MEDIA_MAPPING = !ENABLE_MEDIA_MAPPING ? [] : [
  {
    keywords: ['boulangerie', 'quartier'],
    firstMatchOnly: true,
    media: { src: '/images/boulangerie.png', type: 'image' },
  },
  {
    keywords: ['mauvais'], // unique à "son pain est mauvais"
    firstMatchOnly: true,
    media: { src: '/images/pain-rassis.jpeg', type: 'image' },
  },
  {
    keywords: ['tape'], // unique à "tape boulangerie sur Google"
    firstMatchOnly: true,
    media: { src: '/images/telephone.mp4', type: 'video' },
  },
  {
    keywords: ['vitrine'], // unique à "votre vitrine n'est plus dans la rue"
    firstMatchOnly: true,
    media: { src: '/images/rue-passante.mp4', type: 'video' },
  },
  {
    keywords: ['rapide', 'fiche'], // unique à "Site rapide, fiche Google..."
    firstMatchOnly: true,
    media: { src: '/images/SiteRapide.png', type: 'image' },
  },
];

// Phrases "dark impact" — fond noir pur #000000 sans média (pulse viewfinder)
// V8: réduit à 2 max — les autres passent en bg normal #0a0a0f
const DARK_IMPACT_KEYWORDS_ANY = [
  ['écran', 'vide'], // "Et si votre écran est vide" → impact climax
  ['existez'], // "vous n'existez pas" → impact climax final
];

// Paramètres de découpage
const SENTENCE_GAP_THRESHOLD_SEC = 0.45;
const MAX_SENTENCE_DURATION_SEC = 6.0;
const CAPTION_GAP_THRESHOLD_SEC = 0.18;
const MAX_WORDS_PER_CAPTION = 3;
const MIN_CAPTION_DURATION_SEC = 0.3;
const COMFORTABLE_MIN_CAPTION_DURATION_SEC = 0.5; // durée minimum confortable pour lire 2-3 mots

// V8: décalages manuels pour certains captions où Whisper se plante
// Si un caption contient ces keywords, appliquer l'offset en secondes
const MANUAL_TIMING_OFFSETS = [
  { keywords: ['Résultat'], offset: 0.15 },
  { keywords: ['Son', 'téléphone'], offset: 0.12 },
  { keywords: ['Tous', 'jours'], offset: 0.2 },
];

// ─────────────────────────────────────────────────
// CLI args
// ─────────────────────────────────────────────────
const transcriptionPath = process.argv[2];
const propsOutputPath = process.argv[3];
const audioSrc = process.argv[4] || '/audio/odune-boulangerie.mp3';

if (!transcriptionPath || !propsOutputPath) {
  console.error('Usage: node scripts/chunks-to-segments.mjs <transcription.json> <props.json> [audioSrc]');
  process.exit(1);
}

const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf-8'));
const chunks = transcription.chunks;
console.log(`📖 Read ${chunks.length} word chunks from Whisper`);

// ─────────────────────────────────────────────────
// Step 1: Nettoyer les chunks — ON GARDE la ponctuation comme flag séparé
// Whisper met la ponctuation attachée au mot (ex: " ville."), on l'utilise
// comme signal de fin de phrase.
// ─────────────────────────────────────────────────
const cleanChunks = chunks.map((c) => {
  const raw = c.text.trim();
  const punctMatch = raw.match(/([.,!?;:])+$/);
  const endPunct = punctMatch ? punctMatch[0] : '';
  const textClean = endPunct ? raw.slice(0, -endPunct.length) : raw;
  return {
    text: textClean,
    endPunct,
    start: c.timestamp[0],
    end: c.timestamp[1],
  };
});

// ─────────────────────────────────────────────────
// Step 2: Corrections dictionnaire
// ─────────────────────────────────────────────────
let correctedChunks = [...cleanChunks];
for (const correction of WORD_CORRECTIONS) {
  const { from, to } = correction;
  for (let i = 0; i <= correctedChunks.length - from.length; i++) {
    const slice = correctedChunks.slice(i, i + from.length);
    const matches = slice.every(
      (c, j) => c.text.toLowerCase() === from[j].toLowerCase(),
    );
    if (matches) {
      const startTime = slice[0].start;
      const endTime = slice[slice.length - 1].end;
      const duration = endTime - startTime;
      // Préserver le endPunct de la dernière chunk (pour garder les fins de phrase)
      const lastEndPunct = slice[slice.length - 1].endPunct || '';
      const newChunks = to.map((word, j) => ({
        text: word,
        endPunct: j === to.length - 1 ? lastEndPunct : '',
        start: startTime + (duration * j) / to.length,
        end: startTime + (duration * (j + 1)) / to.length,
      }));
      correctedChunks.splice(i, from.length, ...newChunks);
      i += newChunks.length - 1;
      console.log(`   🔧 ${from.join(' ')} → ${to.join(' ')}`);
    }
  }
}

// ─────────────────────────────────────────────────
// Step 3: Merge patterns spéciaux (35%, contractions)
// ─────────────────────────────────────────────────
const mergedChunks = [];
for (let i = 0; i < correctedChunks.length; i++) {
  const cur = correctedChunks[i];
  const next = correctedChunks[i + 1];
  const nextNext = correctedChunks[i + 2];

  // Pattern: "n" + "'" + "existez" → "n'existez"
  if (next && nextNext && next.text === "'") {
    mergedChunks.push({
      text: `${cur.text}'${nextNext.text}`,
      endPunct: nextNext.endPunct || '',
      start: cur.start,
      end: nextNext.end,
    });
    i += 2;
    continue;
  }
  // Pattern: "n" + "'existez" → "n'existez"
  if (next && /^'/.test(next.text) && cur.text.length <= 2) {
    mergedChunks.push({
      text: `${cur.text}${next.text}`,
      endPunct: next.endPunct || '',
      start: cur.start,
      end: next.end,
    });
    i += 1;
    continue;
  }
  // Pattern: chiffre + "%" → "N%"
  if (next && next.text === '%' && /^\d+$/.test(cur.text)) {
    mergedChunks.push({
      text: `${cur.text}%`,
      endPunct: next.endPunct || '',
      start: cur.start,
      end: next.end,
    });
    i += 1;
    continue;
  }
  mergedChunks.push(cur);
}
correctedChunks = mergedChunks;
console.log(`\n✏️  After corrections+merges: ${correctedChunks.length} words`);

// ─────────────────────────────────────────────────
// Step 4: Détecter les PHRASES via la ponctuation DES CHUNKS Whisper directement
//
// Les chunks Whisper contiennent la ponctuation attachée au mot (ex: "ville." ou "potentiels,").
// On utilise ces marqueurs pour détecter les fins de phrases de manière exacte.
// Split fort sur . ! ? → nouvelles phrases
// Split soft sur , → nouvelles phrases aussi (pour plus de granularité style @odune)
// ─────────────────────────────────────────────────
const sentences = [];
let currentSentence = { words: [], start: 0, end: 0 };

for (const chunk of correctedChunks) {
  if (currentSentence.words.length === 0) {
    currentSentence.start = chunk.start;
  }
  currentSentence.words.push(chunk);
  currentSentence.end = chunk.end;

  // Si le chunk se termine par une ponctuation forte, flush la phrase
  if (chunk.endPunct && /[.!?,]/.test(chunk.endPunct)) {
    sentences.push({ ...currentSentence });
    currentSentence = { words: [], start: 0, end: 0 };
  }
}
// Flush le dernier segment si non terminé par ponctuation
if (currentSentence.words.length > 0) {
  sentences.push({ ...currentSentence });
}

// Post-process: merger les segments ultra-courts (< 0.5s) dans leur voisin
const MIN_SENTENCE_DURATION_SEC = 0.5;
const mergedSentences = [];
for (const sent of sentences) {
  const dur = sent.end - sent.start;
  if (dur < MIN_SENTENCE_DURATION_SEC && mergedSentences.length > 0) {
    const prev = mergedSentences[mergedSentences.length - 1];
    prev.words.push(...sent.words);
    prev.end = sent.end;
    prev.sentenceText = `${prev.sentenceText} ${sent.sentenceText}`;
  } else {
    mergedSentences.push(sent);
  }
}

// Clamp les overlaps: garantir que sentences[i].end <= sentences[i+1].start
for (let i = 0; i < mergedSentences.length - 1; i++) {
  const next = mergedSentences[i + 1];
  if (mergedSentences[i].end > next.start) {
    mergedSentences[i].end = Math.max(next.start - 0.02, mergedSentences[i].start + 0.1);
  }
}

sentences.length = 0;
sentences.push(...mergedSentences);

console.log(`✅ Created ${sentences.length} sentences (after merging shorts + clamping overlaps)`);

// ─────────────────────────────────────────────────
// Step 5: Pour chaque phrase, générer les CAPTIONS (2-3 mots)
// ─────────────────────────────────────────────────
// V7: mots et patterns qui doivent avoir leur PROPRE caption (effet "wow")
const ISOLATE_WORDS_REGEX = /^(\d+%?|\d{4})$/; // 35%, 2026, 100, etc.

function shouldIsolate(wordText) {
  return ISOLATE_WORDS_REGEX.test(wordText);
}

function groupWordsIntoCaptions(words) {
  const captions = [];
  let current = { words: [], start: 0, end: 0 };

  function flush() {
    if (current.words.length > 0) captions.push({ ...current });
    current = { words: [], start: 0, end: 0 };
  }

  for (const w of words) {
    // V7: si le mot doit être isolé (ex: 35%), flush la caption courante,
    // mettre le mot dans sa propre caption, puis flush à nouveau
    if (shouldIsolate(w.text)) {
      flush();
      current.words.push(w);
      current.start = w.start;
      current.end = w.end;
      flush();
      continue;
    }

    if (current.words.length === 0) {
      current.words.push(w);
      current.start = w.start;
      current.end = w.end;
      continue;
    }
    const prevEnd = current.words[current.words.length - 1].end;
    const gap = w.start - prevEnd;
    const tooMany = current.words.length >= MAX_WORDS_PER_CAPTION;

    if (gap >= CAPTION_GAP_THRESHOLD_SEC || tooMany) {
      flush();
      current.words.push(w);
      current.start = w.start;
      current.end = w.end;
    } else {
      current.words.push(w);
      current.end = w.end;
    }
  }
  flush();

  // V7: merge les captions ULTRA courtes (<0.2s = illisibles) avec voisin
  // Stratégie:
  //  - Si prev existe et peut accueillir → merge dans prev
  //  - Sinon si next existe → merge dans next (caption absorbée au début du next)
  // Le merge est autorisé même si le next est "isolé" (ex: "En" + "{{2026}}" = "En {{2026}}")
  const ULTRA_SHORT_THRESHOLD = 0.22;
  let final = [];
  let i = 0;
  while (i < captions.length) {
    const cap = captions[i];
    const dur = cap.end - cap.start;

    if (dur < ULTRA_SHORT_THRESHOLD) {
      // Préfère merger dans prev
      if (
        final.length > 0 &&
        final[final.length - 1].words.length + cap.words.length <= MAX_WORDS_PER_CAPTION + 1
      ) {
        const prev = final[final.length - 1];
        prev.words.push(...cap.words);
        prev.end = cap.end;
        i++;
        continue;
      }
      // Sinon merger dans next (caption absorbée au début du next)
      if (i + 1 < captions.length) {
        const next = captions[i + 1];
        next.words = [...cap.words, ...next.words];
        next.start = cap.start;
        i++;
        continue;
      }
    }

    final.push(cap);
    i++;
  }

  // Étendre chaque caption jusqu'au DÉBUT du caption suivant
  for (let j = 0; j < final.length - 1; j++) {
    final[j].end = final[j + 1].start;
  }

  return final;
}

// Fonction de highlight markup
function applyHighlights(text) {
  let result = text;
  for (const phrase of HIGHLIGHT_PHRASES) {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, `{{${phrase}}}`);
  }
  for (const word of HIGHLIGHT_WORDS) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    result = result.replace(regex, `{{${word}}}`);
  }
  return result;
}

// ─────────────────────────────────────────────────
// Step 6: Construire les segments finaux avec captions + media
// ─────────────────────────────────────────────────
const usedMedia = new Set();
const segments = sentences.map((sentence) => {
  // Génère les captions pour cette phrase
  const captionGroups = groupWordsIntoCaptions(sentence.words);

  // V6 fix: la dernière caption s'étend jusqu'à la fin de la phrase
  if (captionGroups.length > 0) {
    captionGroups[captionGroups.length - 1].end = sentence.end;
  }

  // V8 fix: rééquilibrer les captions trop courtes (<0.5s illisible) en empruntant
  // du temps au caption suivant. Garantit que chaque caption reste lisible.
  for (let i = 0; i < captionGroups.length - 1; i++) {
    const cur = captionGroups[i];
    const next = captionGroups[i + 1];
    const curDur = cur.end - cur.start;
    const nextDur = next.end - next.start;

    if (curDur < COMFORTABLE_MIN_CAPTION_DURATION_SEC) {
      const deficit = COMFORTABLE_MIN_CAPTION_DURATION_SEC - curDur;
      // Ne jamais réduire next sous 0.35s
      const canTake = Math.max(0, nextDur - 0.35);
      const transfer = Math.min(deficit, canTake);
      cur.end += transfer;
      next.start += transfer;
    }
  }

  // V8 fix: appliquer les décalages manuels aux captions qui matchent les keywords
  for (const cap of captionGroups) {
    const capText = cap.words.map((w) => w.text).join(' ').toLowerCase();
    for (const { keywords, offset } of MANUAL_TIMING_OFFSETS) {
      const matches = keywords.every((kw) => capText.includes(kw.toLowerCase()));
      if (matches) {
        cap.start += offset;
        cap.end += offset;
        break;
      }
    }
  }

  const captions = captionGroups.map((cap) => {
    const rawText = cap.words.map((w) => w.text).join(' ');
    return {
      startSec: Number(cap.start.toFixed(3)),
      endSec: Number(cap.end.toFixed(3)),
      text: applyHighlights(rawText),
    };
  });

  // Texte combiné de la phrase pour le mapping média
  const fullSentenceText = sentence.words.map((w) => w.text).join(' ').toLowerCase();

  // Détection "dark impact"
  const isDarkImpact = DARK_IMPACT_KEYWORDS_ANY.some((kwSet) =>
    kwSet.every((kw) => fullSentenceText.includes(kw.toLowerCase())),
  );

  // Trouver un média via keywords
  let media = null;
  for (const mapping of MEDIA_MAPPING) {
    if (mapping.firstMatchOnly && usedMedia.has(mapping.media.src)) continue;
    const hasKeyword = mapping.keywords.some((kw) =>
      fullSentenceText.includes(kw.toLowerCase()),
    );
    if (hasKeyword) {
      media = mapping.media;
      if (mapping.firstMatchOnly) usedMedia.add(mapping.media.src);
      break;
    }
  }

  const segment = {
    startSec: Number(sentence.start.toFixed(3)),
    endSec: Number(sentence.end.toFixed(3)),
    textColor: '#ffffff',
    textPosition: 'center',
    viewfinderAnim: 'auto',
    captions,
  };

  if (media) {
    segment.mediaSrc = media.src;
    segment.mediaType = media.type;
  } else if (isDarkImpact) {
    segment.backgroundColor = '#000000';
    segment.viewfinderAnim = 'pulse';
    segment.mediaType = 'none';
  } else {
    segment.backgroundColor = '#0a0a0f';
    segment.mediaType = 'none';
  }

  return segment;
});

// ─────────────────────────────────────────────────
// Step 6.5: Propagation des médias sur segment bg suivant
// Un média ORIGINAL (assigné par keyword) peut s'étendre sur LE segment suivant
// si celui-ci est bg normal (pas dark impact, pas déjà un média).
// Pour éviter les cascades, on utilise un flag _originalMedia pour tracer
// les médias assignés vs propagés.
// ─────────────────────────────────────────────────
// Marquer les médias originaux
for (const seg of segments) {
  if (seg.mediaSrc) seg._originalMedia = true;
}

// Propagation: seulement depuis un segment avec média ORIGINAL, et seulement
// sur LE segment suivant (1 saut max).
for (let i = 0; i < segments.length - 1; i++) {
  const cur = segments[i];
  const next = segments[i + 1];
  if (
    cur._originalMedia &&
    cur.mediaSrc &&
    !next.mediaSrc &&
    next.backgroundColor !== '#000000'
  ) {
    next.mediaSrc = cur.mediaSrc;
    next.mediaType = cur.mediaType;
    delete next.backgroundColor;
    // next._originalMedia reste undefined → pas de propagation depuis next
  }
}

// Nettoyer les flags internes avant export
for (const seg of segments) {
  delete seg._originalMedia;
}

// ─────────────────────────────────────────────────
// Step 7: Write props.json
// ─────────────────────────────────────────────────
// Calculer la durée audio RÉELLE via ffmpeg (pas depuis Whisper qui peut couper court)
let audioDurationSec;
try {
  const ffmpegPath = path.resolve('node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
  const { spawnSync } = await import('node:child_process');
  const probe = spawnSync(ffmpegPath, ['-i', audioSrc.replace(/^\//, 'public/'), '-hide_banner'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stderr = probe.stderr.toString();
  const durMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (durMatch) {
    audioDurationSec = Number(durMatch[1]) * 3600 + Number(durMatch[2]) * 60 + Number(durMatch[3]);
    console.log(`🎵 Real audio duration from ffmpeg: ${audioDurationSec.toFixed(2)}s`);
  } else {
    audioDurationSec = Number((correctedChunks[correctedChunks.length - 1]?.end ?? 30).toFixed(2));
    console.log(`⚠️  Could not read audio duration, using Whisper end: ${audioDurationSec}s`);
  }
} catch {
  audioDurationSec = Number((correctedChunks[correctedChunks.length - 1]?.end ?? 30).toFixed(2));
}

const props = {
  audioSrc,
  audioDurationSec,
  segments,
  viewfinderColor: '#ffffff',
  viewfinderOpacity: 0.85,
  fontFamily: '"JetBrains Mono", "IBM Plex Mono", "Courier New", monospace',
};

fs.mkdirSync(path.dirname(propsOutputPath), { recursive: true });
fs.writeFileSync(propsOutputPath, JSON.stringify(props, null, 2));

// ─────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────
console.log(`\n💾 Wrote ${segments.length} segments to ${propsOutputPath}`);
console.log(`   Audio duration: ${audioDurationSec}s`);
console.log(`   Media assigned: ${usedMedia.size}/${MEDIA_MAPPING.length}`);

console.log('\n📝 Segments preview:');
segments.forEach((s, i) => {
  const mediaInfo = s.mediaSrc
    ? ` [${s.mediaType}: ${path.basename(s.mediaSrc)}]`
    : s.backgroundColor === '#000000'
      ? ' [DARK]'
      : ' [bg]';
  const captionsInfo = `${s.captions.length} captions`;
  console.log(
    `  ${i + 1}. ${s.startSec}s-${s.endSec}s${mediaInfo} → ${captionsInfo}:`,
  );
  s.captions.forEach((c) => {
    console.log(`      ${c.startSec}s-${c.endSec}s: "${c.text}"`);
  });
});

console.log('\n✅ Done.');
