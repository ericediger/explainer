/**
 * Remotion Studio on one project: live preview, scrub the timeline.
 *   npm run studio
 *   VIDEO=<id> npm run studio
 */
import { loadProject, remotion } from './lib/project';

loadProject()
  .then((project) => remotion(project, ['studio', 'src/index.ts']))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
