import fs from 'node:fs';
import path from 'node:path';
import { root } from './env';
import type { VideoSpec } from '../../src/spec';
import type { SceneAction } from './recorder';

/** Every folder under videos/ that has a storyboard. */
export function videoIds(): string[] {
  const dir = path.join(root, 'videos');
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'script.ts')))
    .map((d) => d.name)
    .sort();
}

/**
 * Which video a script works on: `--video=<id>` on the command line, else the VIDEO env var,
 * else the only video in the project. Scripts stay generic; the storyboard lives in videos/<id>/.
 */
export async function pickVideo(argv: string[] = process.argv.slice(2)): Promise<VideoSpec> {
  const ids = videoIds();
  const flag = argv.find((a) => a.startsWith('--video='))?.slice('--video='.length);
  const want = flag ?? process.env.VIDEO;
  let id: string;
  if (want) {
    if (!ids.includes(want)) throw new Error(`No videos/${want}/script.ts. Available: ${ids.join(', ')}`);
    id = want;
  } else if (ids.length === 1) {
    id = ids[0];
  } else {
    throw new Error(`Several videos here (${ids.join(', ')}). Choose one with VIDEO=<id> npm run … or --video=<id>.`);
  }
  const mod = (await import(path.join(root, 'videos', id, 'script.ts'))) as { spec?: VideoSpec };
  if (!mod.spec) throw new Error(`videos/${id}/script.ts must export \`spec\``);
  return mod.spec;
}

/** The recorder choreography for a video: videos/<id>/record.ts exports `actions`, one per footage scene. */
export async function loadActions(id: string): Promise<Record<string, SceneAction>> {
  const file = path.join(root, 'videos', id, 'record.ts');
  if (!fs.existsSync(file)) throw new Error(`No ${path.relative(root, file)}: write the per-scene recorder actions there (see videos/week-prep/record.ts).`);
  const mod = (await import(file)) as { actions?: Record<string, SceneAction> };
  if (!mod.actions) throw new Error(`${path.relative(root, file)} must export \`actions\``);
  return mod.actions;
}
