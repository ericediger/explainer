import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './env';

/** Integrated loudness (LUFS), true peak (dBTP), loudness range (LU), plus the values a second loudnorm pass needs. */
export type Loudness = { i: number; tp: number; lra: number; thresh: number; offset: number };

/** Remotion's bundled ffmpeg, run from the engine folder (it warns when started elsewhere). */
const ffmpeg = (args: string[]) =>
  spawnSync(path.join(root, 'node_modules', '.bin', 'remotion'), ['ffmpeg', '-hide_banner', '-nostats', ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 << 20,
  });

/** The last JSON block loudnorm printed (print_format=json), as strings. */
function loudnormJson(stderr: string): Record<string, string> | null {
  const json = stderr.slice(stderr.lastIndexOf('{'), stderr.lastIndexOf('}') + 1);
  return json ? (JSON.parse(json) as Record<string, string>) : null;
}

/** Measure a file's audio with ffmpeg's loudnorm filter (the slim build has no volumedetect, but it has loudnorm). */
export function measureLoudness(file: string, target = { i: -16, tp: -1.5, lra: 11 }): Loudness {
  const r = ffmpeg(['-i', file, '-vn', '-af', `loudnorm=I=${target.i}:TP=${target.tp}:LRA=${target.lra}:print_format=json`, '-f', 'null', '-']);
  const m = r.status === 0 ? loudnormJson(r.stderr ?? '') : null;
  if (!m) throw new Error(`loudness measurement failed: ${(r.stderr ?? '').trim().split('\n').slice(-2).join(' ')}`);
  return { i: +m.input_i, tp: +m.input_tp, lra: +m.input_lra, thresh: +m.input_thresh, offset: +m.target_offset };
}

/**
 * How loudnorm normalized: `linear` is one gain for the whole mix, so the narration and the music keep their balance;
 * `dynamic` means one gain would have pushed the true peak above the ceiling (`linearPeak`, in dBTP), so loudnorm
 * adjusted the level as it went and limited the loudest peaks instead.
 */
export type Normalization = { mode: 'linear' | 'dynamic'; linearPeak: number };

/**
 * Bring a rendered video's audio to `lufs` integrated with a true peak of at most `truePeak`, in two passes: measure,
 * then normalize. loudnorm uses one linear gain when that keeps the true peak under `truePeak`; when it wouldn't, it
 * falls back to dynamic mode and limits the peaks, which can change the balance between voice and music a little.
 * The video stream is copied untouched; only the audio is re-encoded.
 */
export function normalizeLoudness(file: string, lufs: number, truePeak: number): Normalization {
  // A target range at least as wide as the mix's own keeps the range from forcing dynamic mode.
  const first = measureLoudness(file);
  const target = { i: lufs, tp: truePeak, lra: Math.min(50, Math.max(7, Math.ceil(first.lra))) };
  const m = measureLoudness(file, target);
  const linearPeak = Math.round((m.tp + (target.i - m.i)) * 10) / 10;
  const tmp = file.replace(/\.mp4$/, '.loudnorm.mp4');
  const af =
    `loudnorm=I=${target.i}:TP=${target.tp}:LRA=${target.lra}` +
    `:measured_I=${m.i}:measured_TP=${m.tp}:measured_LRA=${m.lra}:measured_thresh=${m.thresh}:offset=${m.offset}` +
    ':linear=true:print_format=json';
  const r = ffmpeg(['-y', '-i', file, '-c:v', 'copy', '-af', af, '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', tmp]);
  if (r.status !== 0) {
    fs.rmSync(tmp, { force: true });
    throw new Error(`loudness normalization failed: ${(r.stderr ?? '').trim().split('\n').slice(-2).join(' ')}`);
  }
  fs.renameSync(tmp, file);
  // loudnorm reports the mode it used; if that report is missing, the same rule decides: one gain unless it would clip.
  const reported = loudnormJson(r.stderr ?? '')?.normalization_type;
  const mode = reported === 'linear' || reported === 'dynamic' ? reported : linearPeak > target.tp ? 'dynamic' : 'linear';
  return { mode, linearPeak };
}
