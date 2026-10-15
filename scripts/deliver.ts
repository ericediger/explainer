/**
 * Copy the finished video and poster from out/ into the app's media/ folder (spec.appFolder) again,
 * without re-rendering. render and poster already do this after every run.
 *   npm run deliver
 *   VIDEO=<id> npm run deliver
 */
import fs from 'node:fs';
import path from 'node:path';
import { root } from './lib/env';
import { pickVideo } from './lib/video';
import { deliver, deliveryPaths, type Deliverable } from './lib/deliver';

async function main(): Promise<void> {
  const spec = await pickVideo();
  for (const kind of ['video', 'poster'] as Deliverable[]) {
    const { built } = deliveryPaths(spec, kind);
    if (!fs.existsSync(built)) throw new Error(`No ${path.relative(root, built)} yet: run npm run ${kind === 'video' ? 'render' : 'poster'} first`);
    deliver(spec, kind);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
