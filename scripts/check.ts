/**
 * Type-check the engine together with one project, before spending minutes on a render.
 *   npm run check
 *   VIDEO=<id> npm run check
 * The project lives outside this folder, so the tsconfig is written per project to build/<id>/tsconfig.json:
 * it maps '@project' to the project and resolves packages from this folder's node_modules.
 */
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, writeJson } from './lib/env';
import { loadProject, show } from './lib/project';

async function main(): Promise<void> {
  const project = await loadProject();
  const config = path.join(project.build, 'tsconfig.json');
  writeJson(config, {
    extends: path.join(root, 'tsconfig.json'),
    compilerOptions: {
      paths: {
        '@explainer/*': [path.join(root, '*')],
        '@project': [path.join(project.dir, 'index.ts')],
        // @types first: 'react' has no types of its own, and a bare JS match would win over @types/react.
        '*': [path.join(root, 'node_modules', '@types', '*'), path.join(root, 'node_modules', '*')],
      },
    },
    include: ['src', 'scripts', 'remotion.config.ts'].map((f) => path.join(root, f)).concat(project.dir),
    // demo/ is the plain-browser stage the recorder films, not part of the video's TypeScript.
    exclude: ['**/node_modules', path.join(project.dir, 'demo')],
  });
  console.log(`Type-checking the engine with ${show(project.dir)}`);
  try {
    execFileSync(path.join(root, 'node_modules', '.bin', 'tsc'), ['--noEmit', '-p', config], { stdio: 'inherit', cwd: root });
  } catch {
    process.exit(1);
  }
  console.log('✓ no type errors');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
