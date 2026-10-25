/**
 * Render one PNG per scene (at its midpoint) for a quick visual check.
 *   npm run stills                 → build/<id>/stills/<nn>-<scene>.png
 *   npm run stills -- home polish  → only those scenes
 *   npm run stills -- --late       → at 78% through each scene instead of the midpoint, as <nn>-<scene>-late.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { readJson } from './lib/env';
import { buildTimeline } from '../src/timeline';
import type { CuesFile, NarrationManifest } from '../src/spec';
import { loadProject, remotion, show } from './lib/project';

async function main(): Promise<void> {
const project = await loadProject();
const { spec } = project;
const manifest = readJson<NarrationManifest>(path.join(project.publicDir, 'narration', 'manifest.json'));
const cues = readJson<CuesFile>(path.join(project.publicDir, 'footage', 'cues.json'));
const tl = buildTimeline(spec, manifest, cues);
const dir = path.join(project.build, 'stills');
fs.mkdirSync(dir, { recursive: true });
const late = process.argv.includes('--late');
const at = late ? 0.78 : 0.5;
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
tl.scenes.forEach((s, i) => {
  if (only.length && !only.includes(s.spec.id)) return;
  const frame = s.from + Math.floor(s.durationInFrames * at);
  const out = path.join(dir, `${String(i + 1).padStart(2, '0')}-${s.spec.id}${late ? '-late' : ''}.png`);
  remotion(project, ['still', 'src/index.ts', spec.id, out, `--frame=${frame}`, '--log=error']);
  console.log(`✓ ${show(out)} (frame ${frame})`);
});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
