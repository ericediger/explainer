/**
 * Render one PNG per scene (at its midpoint) for a quick visual check.
 *   npm run stills                 → out/stills/<nn>-<scene>.png
 *   npm run stills -- home polish  → only those scenes
 *   npm run stills -- --late       → at 78% through each scene instead of the midpoint
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, readJson } from './lib/env';
import { buildTimeline } from '../src/timeline';
import type { CuesFile, NarrationManifest } from '../src/spec';
import { pickVideo } from './lib/video';

async function main(): Promise<void> {
const spec = await pickVideo();
const manifest = readJson<NarrationManifest>(path.join(root, 'public', spec.id, 'narration', 'manifest.json'));
const cues = readJson<CuesFile>(path.join(root, 'public', spec.id, 'footage', 'cues.json'));
const tl = buildTimeline(spec, manifest, cues);
const dir = path.join(root, 'out', 'stills');
fs.mkdirSync(dir, { recursive: true });
const bin = path.join(root, 'node_modules', '.bin', 'remotion');
const at = process.argv.includes('--late') ? 0.78 : 0.5;
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
tl.scenes.forEach((s, i) => {
  if (only.length && !only.includes(s.spec.id)) return;
  const frame = s.from + Math.floor(s.durationInFrames * at);
  const out = path.join(dir, `${String(i + 1).padStart(2, '0')}-${s.spec.id}.png`);
  execFileSync(bin, ['still', 'src/index.ts', spec.id, out, `--frame=${frame}`, '--log=error'], { stdio: 'inherit', cwd: root });
  console.log(`✓ ${path.relative(root, out)} (frame ${frame})`);
});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
