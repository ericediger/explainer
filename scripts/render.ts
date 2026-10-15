/**
 * Render the finished video.
 *   npm run render                 → build/<id>/<id>.mp4, then copied to <app>/media/<id>-explainer.mp4
 *   npm run render -- --quality    → slower, higher-bitrate encode
 *   VIDEO=<id> npm run render      → name the project (see scripts/lib/project.ts)
 */
import path from 'node:path';
import { loadProject, remotion, show } from './lib/project';
import { deliver } from './lib/deliver';

async function main(): Promise<void> {
  const project = await loadProject();
  const { spec } = project;
  const quality = process.argv.includes('--quality');
  const out = path.join(project.build, `${spec.id}.mp4`);
  remotion(project, ['render', 'src/index.ts', spec.id, out, '--codec=h264', `--crf=${quality ? 15 : 18}`, '--pixel-format=yuv420p', '--audio-codec=aac', '--log=info']);
  console.log(`\n✓ ${show(out)}`);
  deliver(project, 'video');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
