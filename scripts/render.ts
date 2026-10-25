/**
 * Render the finished video.
 *   npm run render                 → build/<id>/<id>.mp4, then copied to <app>/media/<id>-explainer.mp4
 *   npm run render -- --quality    → slower, higher-bitrate encode
 *   VIDEO=<id> npm run render      → name the project (see scripts/lib/project.ts)
 */
import path from 'node:path';
import { getVideoMetadata } from '@remotion/renderer';
import { loadProject, remotion, show } from './lib/project';
import { deliver } from './lib/deliver';
import { measureLoudness, normalizeLoudness } from './lib/loudness';

async function main(): Promise<void> {
  const project = await loadProject();
  const { spec } = project;
  const quality = process.argv.includes('--quality');
  const out = path.join(project.build, `${spec.id}.mp4`);
  remotion(project, ['render', 'src/index.ts', spec.id, out, '--codec=h264', `--crf=${quality ? 15 : 18}`, '--pixel-format=yuv420p', '--audio-codec=aac', '--log=info']);
  const target = spec.loudness ? { lufs: spec.loudness.lufs ?? -16, truePeak: spec.loudness.truePeak ?? -1.5 } : null;
  const normalized = target ? normalizeLoudness(out, target.lufs, target.truePeak) : null;
  // The length the user is told about; macOS has no ffprobe of its own to measure it with.
  const meta = await getVideoMetadata(out);
  const length = meta.durationInSeconds == null ? '' : ` · ${meta.durationInSeconds.toFixed(1)} s, ${meta.width}×${meta.height}`;
  console.log(`\n✓ ${show(out)}${length}`);
  try {
    const l = measureLoudness(out);
    console.log(`  loudness ${l.i.toFixed(1)} LUFS integrated, true peak ${l.tp.toFixed(1)} dBTP`);
    if (!target || !normalized) console.log('  (not normalized: web players expect about -14 to -16 LUFS; set spec.loudness to normalize)');
    else if (normalized.mode === 'linear') console.log(`  normalized to ${target.lufs} LUFS with one gain (linear): voice and music keep their balance`);
    else
      console.log(
        `  normalized to ${target.lufs} LUFS with its peaks limited (dynamic): one gain would have put the true peak at ` +
          `${normalized.linearPeak.toFixed(1)} dBTP, above ${target.truePeak}. To keep one gain, lower spec.loudness.lufs ` +
          `to about ${(target.lufs - (normalized.linearPeak - target.truePeak)).toFixed(1)}, or lower the music's volume if the bed makes the peaks.`,
      );
  } catch (e) {
    console.warn(`  (loudness not measured: ${(e as Error).message})`);
  }
  deliver(project, 'video');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
