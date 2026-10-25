/**
 * Record one clip per footage scene by driving the app in a headless browser.
 *
 *   npm run record                    # all footage scenes of the project (see scripts/lib/project.ts)
 *   npm run record -- home            # just one scene (re-record after a tweak)
 *   VIDEO=<id> npm run record         # name the project
 *
 * Needs `npm run narrate` first: clip lengths follow the narration. The choreography
 * (what to click, spotlight and zoom) lives in <app>/explainer/record.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson } from './lib/env';
import { launchBrowser } from './lib/browser';
import { ensurePlaywrightFfmpeg, freePort, SceneRecorder, serveStatic } from './lib/recorder';
import type { CuesFile, NarrationManifest } from '../src/spec';
import { loadActions, loadProject, show } from './lib/project';

async function main(): Promise<void> {
  const project = await loadProject();
  const { spec } = project;
  const actions = await loadActions(project);
  const manifest = readJson<NarrationManifest>(path.join(project.publicDir, 'narration', 'manifest.json'));
  if (!manifest) throw new Error('No narration manifest. Run `npm run narrate` first.');
  const durById = new Map(manifest.scenes.map((s) => [s.id, s.durationSec]));

  // Either serve a static folder ourselves or attach to a page the user already has running.
  let baseUrl: string;
  let stop: () => void = () => {};
  if (spec.record.url) {
    baseUrl = spec.record.url;
  } else {
    if (!spec.record.appDir || !spec.record.page) throw new Error('record needs either `url` or `appDir` + `page`');
    const appDir = path.resolve(project.app, spec.record.appDir);
    if (!fs.existsSync(path.join(appDir, spec.record.page))) throw new Error(`Cannot find ${spec.record.page} in ${appDir}`);
    const port = await freePort(8911);
    stop = await serveStatic(appDir, port);
    baseUrl = `http://127.0.0.1:${port}/${spec.record.page}`;
  }

  const outDir = path.join(project.publicDir, 'footage');
  fs.mkdirSync(outDir, { recursive: true });
  const cuesPath = path.join(outDir, 'cues.json');
  const prev = readJson<CuesFile>(cuesPath);
  const result: CuesFile = { video: spec.id, generatedAt: new Date().toISOString(), viewport: spec.record.viewport, scenes: { ...(prev?.scenes ?? {}) } };

  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  ensurePlaywrightFfmpeg();
  const { browser, label } = await launchBrowser();
  console.log(`Recording with ${label} (${browser.version()})`);
  const rec = new SceneRecorder(browser, {
    baseUrl,
    outDir,
    viewport: spec.record.viewport,
    dpr: spec.record.dpr ?? 2,
    readySelector: spec.record.readySelector,
    zoom: spec.record.zoom,
    css: spec.record.css,
  });

  try {
    for (const sc of spec.scenes) {
      if (sc.kind !== 'footage') continue;
      if (only.length && !only.includes(sc.id)) continue;
      const action = actions[sc.id];
      if (!action) throw new Error(`No recorder action for scene "${sc.id}" in ${show(path.join(project.dir, 'record.ts'))}`);
      const narr = durById.get(sc.id) ?? 10;
      const target = (sc.leadInSec ?? 0.6) + narr + (sc.tailSec ?? 0.9) + 0.8;
      process.stdout.write(`▶ ${sc.id.padEnd(12)} target ${target.toFixed(1)}s … `);
      await rec.start(sc.id, sc.route ? `#${sc.route}` : '');
      await action(rec, narr);
      const footage = await rec.finish(target);
      result.scenes[sc.id] = footage;
      result.generatedAt = new Date().toISOString();
      writeJson(cuesPath, result);
      console.log(`${footage.durationSec.toFixed(1)}s, ${footage.cues.length} cues → ${footage.file}`);
      const late = rec.lateBeats;
      if (late.length) {
        const worst = late.reduce((a, b) => (b.by > a.by ? b : a));
        console.log(`  ⚠ ${late.length} beat${late.length === 1 ? '' : 's'} late, worst ${worst.by.toFixed(1)}s after t=${worst.t}: start the moves before it earlier`);
      }
    }
  } finally {
    await browser.close();
    stop();
    fs.rmSync(path.join(outDir, '.raw'), { recursive: true, force: true });
  }
  console.log(`Cues → ${show(cuesPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
