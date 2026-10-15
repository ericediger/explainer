/**
 * List the explainer projects next to this folder (<app>/explainer/), with the id VIDEO=<id> picks them by.
 *   npm run projects
 */
import { discoverProjects, show } from './lib/project';

const all = discoverProjects();
if (!all.length) console.log('No <app>/explainer/ projects next to this folder.');
for (const p of all) console.log(`${p.id.padEnd(16)} ${show(p.dir)}`);
