/**
 * Record one clip per footage scene by driving the app in a headless browser.
 *
 *   npm run record                    # all footage scenes of the (only) video
 *   npm run record -- home            # just one scene (re-record after a tweak)
 *   VIDEO=<id> npm run record         # pick a video when several are registered
 *
 * Needs `npm run narrate` first: clip lengths follow the narration. The choreography
 * (what to click, spotlight and zoom) lives in videos/<id>/record.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { root, readJson, writeJson } from './lib/env';
import { ensurePlaywrightFfmpeg, SceneRecorder, serveStatic } from './lib/recorder';
import type { CuesFile, NarrationManifest } from '../src/spec';
import { loadActions, pickVideo } from './lib/video';

/**
 * Prefer the installed Google Chrome (it has every codec and font the app expects), then Remotion's
 * headless shell, then Playwright's own Chromium. Override with RECORD_BROWSER=chrome|chromium|/path/to/binary.
 */
async function launchBrowser() {
  const pref = process.env.RECORD_BROWSER;
  const arch = process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
  const shell = path.join(root, 'node_modules', '.remotion', 'chrome-headless-shell', arch, `chrome-headless-shell-${arch}`, 'chrome-headless-shell');
  const attempts: { label: string; opts: Parameters<typeof chromium.launch>[0] }[] = pref
    ? [pref === 'chrome' || pref === 'chromium' ? { label: pref, opts: pref === 'chrome' ? { channel: 'chrome' } : {} } : { label: pref, opts: { executablePath: pref } }]
    : [
        { label: 'Google Chrome', opts: { channel: 'chrome' } },
        ...(fs.existsSync(shell) ? [{ label: 'Remotion headless shell', opts: { executablePath: shell } }] : []),
        { label: 'Playwright Chromium', opts: {} },
      ];
  let lastErr: unknown;
  for (const a of attempts) {
    try {
      const b = await chromium.launch({ headless: true, ...a.opts });
      console.log(`Recording with ${a.label} (${b.version()})`);
      return b;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function main(): Promise<void> {
  const spec = await pickVideo();
  const actions = await loadActions(spec.id);
  const manifest = readJson<NarrationManifest>(path.join(root, 'public', spec.id, 'narration', 'manifest.json'));
  if (!manifest) throw new Error('No narration manifest. Run `npm run narrate` first.');
  const durById = new Map(manifest.scenes.map((s) => [s.id, s.durationSec]));

  // Either serve a static folder ourselves or attach to a page the user already has running.
  let baseUrl: string;
  let stop: () => void = () => {};
  if (spec.record.url) {
    baseUrl = spec.record.url;
  } else {
    if (!spec.record.appDir || !spec.record.page) throw new Error('record needs either `url` or `appDir` + `page`');
    const appDir = path.resolve(root, spec.record.appDir);
    if (!fs.existsSync(path.join(appDir, spec.record.page))) throw new Error(`Cannot find ${spec.record.page} in ${appDir}`);
    const port = 8911;
    stop = await serveStatic(appDir, port);
    baseUrl = `http://127.0.0.1:${port}/${spec.record.page}`;
  }

  const outDir = path.join(root, 'public', spec.id, 'footage');
  fs.mkdirSync(outDir, { recursive: true });
  const cuesPath = path.join(outDir, 'cues.json');
  const prev = readJson<CuesFile>(cuesPath);
  const result: CuesFile = { video: spec.id, generatedAt: new Date().toISOString(), viewport: spec.record.viewport, scenes: { ...(prev?.scenes ?? {}) } };

  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  ensurePlaywrightFfmpeg();
  const browser = await launchBrowser();
  const rec = new SceneRecorder(browser, { baseUrl, outDir, viewport: spec.record.viewport, dpr: 2 });

  try {
    for (const sc of spec.scenes) {
      if (sc.kind !== 'footage') continue;
      if (only.length && !only.includes(sc.id)) continue;
      const action = actions[sc.id];
      if (!action) throw new Error(`No recorder action for scene "${sc.id}" in videos/${spec.id}/record.ts`);
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
    }
  } finally {
    await browser.close();
    stop();
    fs.rmSync(path.join(outDir, '.raw'), { recursive: true, force: true });
  }
  console.log(`Cues → ${path.relative(root, cuesPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
