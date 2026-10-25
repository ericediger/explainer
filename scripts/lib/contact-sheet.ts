import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from './browser';

const CSS =
  'body{margin:0;padding:16px;background:#0b1118;color:#cfd8e3;font:600 18px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
  '.row{display:flex;gap:16px;margin-bottom:16px}figure{margin:0}img{display:block;width:800px;height:450px;border-radius:6px}' +
  'figcaption{padding:6px 2px 0}';

/**
 * One image with every still of the current cut: a row per scene, its midpoint and its 78% still side by side.
 * `names` are the stills' base names in scene order (`01-intro`, …); stills that don't exist are left out.
 * The stills are drawn into a page and screenshotted, since Remotion's ffmpeg has no tiling filters.
 */
export async function writeContactSheet(dir: string, names: string[]): Promise<string | null> {
  const rows = names
    .map((name) => [`${name}.png`, `${name}-late.png`].filter((f) => fs.existsSync(path.join(dir, f))))
    .filter((files) => files.length);
  if (!rows.length) return null;
  const figure = (f: string) =>
    `<figure><img src="${pathToFileURL(path.join(dir, f)).href}"><figcaption>${f.replace(/-late\.png$/, ' · 78%').replace(/\.png$/, ' · midpoint')}</figcaption></figure>`;
  const page = path.join(dir, 'contact-sheet.html');
  fs.writeFileSync(page, `<!doctype html><meta charset="utf-8"><style>${CSS}</style>${rows.map((files) => `<div class="row">${files.map(figure).join('')}</div>`).join('')}`);
  const out = path.join(dir, 'contact-sheet.png');
  const { browser } = await launchBrowser();
  try {
    // A short viewport, so the full-page screenshot is exactly as tall as the rows.
    const tab = await browser.newPage({ viewport: { width: 1648, height: 100 } });
    await tab.goto(pathToFileURL(page).href, { waitUntil: 'load' });
    await tab.screenshot({ path: out, fullPage: true });
  } finally {
    await browser.close();
    fs.rmSync(page, { force: true });
  }
  return out;
}
