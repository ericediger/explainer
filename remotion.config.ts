import path from 'node:path';
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// One project per run. scripts/lib/project.ts passes the project folder (<app>/explainer) in EXPLAINER_PROJECT and
// the build's public dir with --public-dir. '@project' is that folder and '@explainer/…' is this one, so scenes that
// live in an app import the kit as '@explainer/src/kit/…'. Packages resolve from this folder's node_modules first,
// including for files outside it. The CLI always runs with this folder as its working directory.
const root = process.cwd();
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias as Record<string, string>),
      '@project': process.env.EXPLAINER_PROJECT ?? path.join(root, 'explainer'),
      '@explainer': root,
    },
    modules: [path.join(root, 'node_modules'), 'node_modules'],
  },
}));
