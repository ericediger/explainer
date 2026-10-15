/**
 * Render the finished video.
 *   npm run render                 → out/<id>.mp4, then copied to <appFolder>/media/<id>-explainer.mp4
 *   npm run render -- --quality    → slower, higher-bitrate encode
 *   VIDEO=<id> npm run render      → pick a video when several are registered
 */
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from './lib/env';
import { pickVideo } from './lib/video';
import { deliver } from './lib/deliver';

async function main(): Promise<void> {
  const spec = await pickVideo();
  const quality = process.argv.includes('--quality');
  const out = path.join(root, 'out', `${spec.id}.mp4`);
  const bin = path.join(root, 'node_modules', '.bin', 'remotion');
  execFileSync(
    bin,
    ['render', 'src/index.ts', spec.id, out, '--codec=h264', `--crf=${quality ? 15 : 18}`, '--pixel-format=yuv420p', '--audio-codec=aac', '--log=info'],
    { stdio: 'inherit', cwd: root },
  );
  console.log(`\n✓ ${path.relative(root, out)}`);
  deliver(spec, 'video');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
