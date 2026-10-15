import fs from 'node:fs';
import path from 'node:path';
import { root } from './env';
import type { VideoSpec } from '../../src/spec';

export type Deliverable = 'video' | 'poster';

/** Where a finished file is built (out/) and where it belongs in the app folder (media/). */
export function deliveryPaths(spec: VideoSpec, kind: Deliverable): { built: string; target: string | null } {
  const built = path.join(root, 'out', kind === 'video' ? `${spec.id}.mp4` : `${spec.id}-poster.jpg`);
  if (!spec.appFolder) return { built, target: null };
  const name = kind === 'video' ? `${spec.id}-explainer.mp4` : 'explainer-poster.jpg';
  return { built, target: path.join(path.resolve(root, spec.appFolder), 'media', name) };
}

/** Copy a finished file into the app's media/ folder. The app folder must already exist; media/ is created. */
export function deliver(spec: VideoSpec, kind: Deliverable): void {
  const { built, target } = deliveryPaths(spec, kind);
  if (!target) {
    console.log(`  (no appFolder in videos/${spec.id}/script.ts: ${path.relative(root, built)} stays in out/)`);
    return;
  }
  const appDir = path.resolve(root, spec.appFolder!);
  if (!fs.existsSync(appDir)) throw new Error(`appFolder ${spec.appFolder} does not exist (resolved to ${appDir})`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(built, target);
  console.log(`→ ${target}`);
}
