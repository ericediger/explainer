/**
 * Render the README poster: one frame of the video (spec.poster.atSec) with a play badge.
 *   npm run poster                 → out/<id>-poster.jpg, then copied to <appFolder>/media/explainer-poster.jpg
 *   VIDEO=<id> npm run poster      → pick a video when several are registered
 */
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from './lib/env';
import { pickVideo } from './lib/video';
import { deliver } from './lib/deliver';

async function main(): Promise<void> {
  const spec = await pickVideo();
  const out = path.join(root, 'out', `${spec.id}-poster.jpg`);
  const bin = path.join(root, 'node_modules', '.bin', 'remotion');
  execFileSync(bin, ['still', 'src/index.ts', `${spec.id}-poster`, out, '--frame=0', '--image-format=jpeg', '--jpeg-quality=86', '--log=error'], { stdio: 'inherit', cwd: root });
  console.log(`✓ ${path.relative(root, out)} (frame at ${spec.poster?.atSec ?? 0}s)`);
  deliver(spec, 'poster');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
