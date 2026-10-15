import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from './env';
import type { VideoSpec } from '../../src/spec';
import type { SceneAction } from './recorder';

/**
 * A video's source lives with the app it is for, in <app>/explainer/:
 *   script.ts   the storyboard (exports `spec`)
 *   record.ts   recorder choreography (exports `actions`)
 *   index.ts    exports { spec, components } for Remotion
 *   scenes/     the animated scenes
 *   public/     files the video reads with staticFile(): music/, logos …
 *   voice/      optional: your own narration, one file per scene
 *   demo/       optional: a stage page for the recorder to film
 * Everything the pipeline generates for it goes to build/<id>/ in this folder (gitignored); the finished MP4 and
 * poster are copied to <app>/media/.
 */
export const PROJECT_FOLDER = 'explainer';

export type Project = {
  /** <app>/explainer */
  dir: string;
  /** The app the video is for: the folder that holds `dir`. */
  app: string;
  spec: VideoSpec;
  /** build/<id>: everything regenerable for this video. */
  build: string;
  /** build/<id>/public: Remotion's public dir, the project's public/ plus the generated narration/ and footage/. */
  publicDir: string;
};

/** A path for log lines: relative to the engine, so `build/<id>/…` and `../<app>/explainer/…` read naturally. */
export const show = (p: string): string => path.relative(root, p) || '.';

const hasStoryboard = (dir: string): boolean => fs.existsSync(path.join(dir, 'script.ts')) && fs.existsSync(path.join(dir, 'index.ts'));

/** `dir` names a project if it is one, or if it is an app with an explainer/ folder. */
function projectAt(dir: string): string | null {
  const inner = path.join(dir, PROJECT_FOLDER);
  if (hasStoryboard(inner)) return inner;
  return hasStoryboard(dir) ? dir : null;
}

const readId = (dir: string): string | null =>
  /\bid:\s*['"]([^'"]+)['"]/.exec(fs.readFileSync(path.join(dir, 'script.ts'), 'utf8'))?.[1] ?? null;

function subdirs(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules')
      .map((d) => path.join(dir, d.name));
  } catch {
    return [];
  }
}

/**
 * Projects next to the engine: this folder's own explainer/, then <apps>/<app>/explainer and <apps>/<group>/<app>/explainer,
 * where <apps> is the folder holding EXPLAINER (EXPLAINER_APPS overrides it).
 */
export function discoverProjects(): { id: string; dir: string }[] {
  const apps = process.env.EXPLAINER_APPS ? path.resolve(process.env.EXPLAINER_APPS) : path.dirname(root);
  const found = new Set<string>();
  const consider = (app: string) => {
    const dir = path.join(app, PROJECT_FOLDER);
    if (hasStoryboard(dir)) found.add(dir);
  };
  consider(root);
  for (const app of subdirs(apps)) {
    if (app === root) continue;
    consider(app);
    for (const nested of subdirs(app)) consider(nested);
  }
  return [...found].map((dir) => ({ id: readId(dir) ?? path.basename(path.dirname(dir)), dir }));
}

const listing = (all: { id: string; dir: string }[]): string =>
  all.length ? all.map((p) => `\n  ${p.id.padEnd(16)} ${show(p.dir)}`).join('') : ' none found next to this folder';

/** Where the command was started: npm sets INIT_CWD, also for `npm --prefix <EXPLAINER> run …` from an app folder. */
const invokedFrom = (): string => process.env.INIT_CWD || process.cwd();

/**
 * Which project a command works on, first match wins:
 *   --project=<path> or EXPLAINER_PROJECT   an app folder or its explainer/ folder (relative to where you ran npm), or an id
 *   --video=<id> or VIDEO                    a project found next to this folder, by its storyboard id
 *   the folder you ran npm from              when it is (inside) an app with an explainer/ folder
 */
export function resolveProjectDir(argv: string[] = process.argv.slice(2)): string {
  const flag = (name: string) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  const want = flag('project') ?? process.env.EXPLAINER_PROJECT;
  if (want) {
    const at = path.resolve(invokedFrom(), want);
    const dir = fs.existsSync(at) ? projectAt(at) : null;
    if (dir) return dir;
    const byId = discoverProjects().find((p) => p.id === want);
    if (byId) return byId.dir;
    throw new Error(`No explainer project at ${at} (looked for script.ts + index.ts there and in its ${PROJECT_FOLDER}/ folder).`);
  }
  const id = flag('video') ?? process.env.VIDEO;
  if (id) {
    const all = discoverProjects();
    const hit = all.find((p) => p.id === id);
    if (!hit) throw new Error(`No explainer project with id "${id}". Projects:${listing(all)}`);
    return hit.dir;
  }
  for (let d = invokedFrom(); d !== root && path.dirname(d) !== d; d = path.dirname(d)) {
    const hit = projectAt(d);
    if (hit) return hit;
  }
  throw new Error(
    `Which video? Run from the app's folder (npm --prefix <EXPLAINER> run build), or pass --project=<app folder> or VIDEO=<id>. Projects:${listing(discoverProjects())}`,
  );
}

export async function loadProject(argv?: string[]): Promise<Project> {
  const dir = resolveProjectDir(argv);
  const mod = (await import(path.join(dir, 'script.ts'))) as { spec?: VideoSpec };
  if (!mod.spec) throw new Error(`${show(path.join(dir, 'script.ts'))} must export \`spec\``);
  const build = path.join(root, 'build', mod.spec.id);
  return { dir, app: path.dirname(dir), spec: mod.spec, build, publicDir: path.join(build, 'public') };
}

/** The recorder choreography: <project>/record.ts exports `actions`, one per footage scene. */
export async function loadActions(p: Project): Promise<Record<string, SceneAction>> {
  const file = path.join(p.dir, 'record.ts');
  if (!fs.existsSync(file)) throw new Error(`No ${show(file)}: write the per-scene recorder actions there.`);
  const mod = (await import(file)) as { actions?: Record<string, SceneAction> };
  if (!mod.actions) throw new Error(`${show(file)} must export \`actions\``);
  return mod.actions;
}

/** Copy the project's public/ (music, logos …) into the build's public dir, skipping files that are already there. */
export function syncPublic(p: Project): void {
  fs.mkdirSync(p.publicDir, { recursive: true });
  const src = path.join(p.dir, 'public');
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, p.publicDir, {
    recursive: true,
    preserveTimestamps: true,
    filter: (from, to) => {
      const a = fs.statSync(from);
      if (a.isDirectory() || !fs.existsSync(to)) return true;
      const b = fs.statSync(to);
      return a.size !== b.size || a.mtimeMs !== b.mtimeMs;
    },
  });
}

/** Run the Remotion CLI on a project: remotion.config.ts maps '@project' to it, and the build's public dir is served. */
export function remotion(p: Project, args: string[]): void {
  syncPublic(p);
  execFileSync(path.join(root, 'node_modules', '.bin', 'remotion'), [...args, `--public-dir=${p.publicDir}`], {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, EXPLAINER_PROJECT: p.dir },
  });
}
