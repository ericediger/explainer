/**
 * Render the README poster: one frame of the video (spec.poster.atSec) with a play badge.
 *   npm run poster                 → build/<id>/<id>-poster.jpg, then copied to <app>/media/explainer-poster.jpg
 *   VIDEO=<id> npm run poster      → name the project (see scripts/lib/project.ts)
 */
import path from 'node:path';
import { loadProject, remotion, show } from './lib/project';
import { deliver } from './lib/deliver';

async function main(): Promise<void> {
  const project = await loadProject();
  const { spec } = project;
  const out = path.join(project.build, `${spec.id}-poster.jpg`);
  remotion(project, ['still', 'src/index.ts', `${spec.id}-poster`, out, '--frame=0', '--image-format=jpeg', '--jpeg-quality=86', '--log=error']);
  console.log(`✓ ${show(out)} (frame at ${spec.poster?.atSec ?? 0}s)`);
  deliver(project, 'poster');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
