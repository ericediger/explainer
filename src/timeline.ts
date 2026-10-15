import type { CuesFile, Footage, NarrationManifest, SceneSpec, VideoSpec, WordTime } from './spec';

export type TimelineScene = {
  spec: SceneSpec;
  index: number;
  from: number;
  durationInFrames: number;
  leadFrames: number;
  narrFrames: number;
  tailFrames: number;
  /** staticFile() path of the narration clip, or null before `npm run narrate`. */
  narrationFile: string | null;
  /** Word timestamps from a transcribed human recording, if any. */
  words: WordTime[] | null;
  footage: Footage | null;
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  scenes: TimelineScene[];
  hasNarration: boolean;
  hasFootage: boolean;
};

/** Rough reading speed used before narration exists, so Studio can preview the cut. */
export function estimateNarrationSec(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words / 2.75 + 0.5;
}

export function buildTimeline(spec: VideoSpec, manifest: NarrationManifest | null, cues: CuesFile | null): Timeline {
  const fps = spec.fps;
  let cursor = 0;
  const scenes: TimelineScene[] = spec.scenes.map((sc, index) => {
    const m = manifest?.scenes.find((s) => s.id === sc.id) ?? null;
    const narrSec = m?.durationSec ?? estimateNarrationSec(sc.spoken ?? sc.narration);
    const leadFrames = Math.round((sc.leadInSec ?? 0.6) * fps);
    const narrFrames = Math.ceil(narrSec * fps);
    const tailFrames = Math.round((sc.tailSec ?? 0.9) * fps);
    const durationInFrames = leadFrames + narrFrames + tailFrames;
    const footage = sc.kind === 'footage' ? (cues?.scenes[sc.id] ?? null) : null;
    const scene: TimelineScene = {
      spec: sc,
      index,
      from: cursor,
      durationInFrames,
      leadFrames,
      narrFrames,
      tailFrames,
      narrationFile: m ? m.file : null,
      words: m?.words?.length ? m.words : null,
      footage,
    };
    cursor += durationInFrames;
    return scene;
  });
  return { fps, width: spec.width, height: spec.height, durationInFrames: cursor, scenes, hasNarration: !!manifest, hasFootage: !!cues };
}

export type Span = { text: string; start: number; end: number };

const splitSentences = (text: string): string[] =>
  text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z"\u201C\u2018'(])/)
    .filter(Boolean);

/** Sentence timing for a scene: from word timestamps when a human recording was transcribed, else proportional. */
export function spansFor(scene: TimelineScene, fps: number): Span[] {
  if (scene.words) return sentenceSpansFromWords(scene.spec.narration, scene.leadFrames, scene.narrFrames, scene.words, fps);
  return sentenceSpans(scene.spec.narration, scene.leadFrames, scene.narrFrames);
}

/** Walk the transcript's words sentence by sentence; each sentence spans its first word's start to its last word's end. */
export function sentenceSpansFromWords(text: string, startFrame: number, durFrames: number, words: WordTime[], fps: number): Span[] {
  const parts = splitSentences(text);
  const counts = parts.map((p) => p.split(/\s+/).filter(Boolean).length);
  const spans: Span[] = [];
  let i = 0;
  for (let k = 0; k < parts.length; k++) {
    const first = words[Math.min(i, words.length - 1)];
    const last = words[Math.min(i + counts[k] - 1, words.length - 1)];
    const prevEnd = spans[k - 1]?.end ?? startFrame;
    const start = Math.max(first ? startFrame + Math.round(first.start * fps) : prevEnd, prevEnd);
    const end = Math.max(last ? startFrame + Math.round(last.end * fps) : startFrame + durFrames, start + 1);
    spans.push({ text: parts[k], start, end });
    i += counts[k];
  }
  if (spans.length) spans[spans.length - 1].end = Math.max(spans[spans.length - 1].end, startFrame + durFrames);
  return spans;
}

/** Split narration into sentences and spread them over the narration window, weighted by length. */
export function sentenceSpans(text: string, startFrame: number, durFrames: number): Span[] {
  const parts = splitSentences(text);
  const weights = parts.map((p) => p.length + 14);
  const total = weights.reduce((a, b) => a + b, 0);
  let cursor = startFrame;
  return parts.map((p, i) => {
    const len = (durFrames * weights[i]) / total;
    const span = { text: p, start: Math.round(cursor), end: Math.round(cursor + len) };
    cursor += len;
    return span;
  });
}
