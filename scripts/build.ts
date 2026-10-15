/**
 * The whole run for one project: narrate → record → render → poster.
 *   npm --prefix <EXPLAINER> run build      from the app's folder
 *   npm run build -- --project=<app folder>  from here
 *   VIDEO=<id> npm run build                 by storyboard id
 */
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from './lib/env';
import { resolveProjectDir, show } from './lib/project';

const dir = resolveProjectDir();
console.log(`Building ${show(dir)}`);
for (const step of ['narrate', 'record', 'render', 'poster']) {
  console.log(`\n── ${step}`);
  try {
    execFileSync(path.join(root, 'node_modules', '.bin', 'tsx'), [path.join(root, 'scripts', `${step}.ts`)], {
      stdio: 'inherit',
      cwd: root,
      env: { ...process.env, EXPLAINER_PROJECT: dir },
    });
  } catch {
    process.exit(1);
  }
}
