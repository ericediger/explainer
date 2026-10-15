import fs from 'node:fs';
import path from 'node:path';
import type { Project } from './project';

export type Deliverable = 'video' | 'poster';

/** Where a finished file is built (build/<id>/) and where it belongs in the app folder (<app>/media/). */
export function deliveryPaths(p: Project, kind: Deliverable): { built: string; target: string } {
  const built = path.join(p.build, kind === 'video' ? `${p.spec.id}.mp4` : `${p.spec.id}-poster.jpg`);
  const name = kind === 'video' ? `${p.spec.id}-explainer.mp4` : 'explainer-poster.jpg';
  return { built, target: path.join(p.app, 'media', name) };
}

/** Copy a finished file into the app's media/ folder (created if missing). */
export function deliver(p: Project, kind: Deliverable): void {
  const { built, target } = deliveryPaths(p, kind);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(built, target);
  console.log(`→ ${target}`);
}
