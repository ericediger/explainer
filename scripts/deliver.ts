/**
 * Copy the finished video and poster from build/<id>/ into the app's media/ folder again, without re-rendering.
 * render and poster already do this after every run.
 *   npm run deliver
 *   VIDEO=<id> npm run deliver
 */
import fs from 'node:fs';
import { loadProject, show } from './lib/project';
import { deliver, deliveryPaths, type Deliverable } from './lib/deliver';

async function main(): Promise<void> {
  const project = await loadProject();
  for (const kind of ['video', 'poster'] as Deliverable[]) {
    const { built } = deliveryPaths(project, kind);
    if (!fs.existsSync(built)) throw new Error(`No ${show(built)} yet: run npm run ${kind === 'video' ? 'render' : 'poster'} first`);
    deliver(project, kind);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
