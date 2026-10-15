// Screenshot the SpeakEasy demo page the way the recorder sees it, for checking layout and selectors.
//   node videos/speakeasy/preview.mjs <outDir> [scene[:step] ...]
// Serves ../SPEAKEASY/demo on :8914, opens index.html#<scene> at 2400x1350, waits for #stageReady,
// optionally runs a quick interaction, and writes <outDir>/<scene>.png plus the rectangles of key selectors.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(here, '../../../SPEAKEASY/demo');
const [outDir, ...rest] = process.argv.slice(2);
const scenes = rest.filter((a) => !a.startsWith('--'));
const port = 8914;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', demoDir], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const sc of scenes.length ? scenes : ['open', 'listen', 'modes', 'voice', 'persist', 'setup']) {
    const [id, step] = sc.split(':');
    const ctx = await browser.newContext({ viewport: { width: 2400, height: 1350 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log(`[${sc}] pageerror:`, e.message));
    page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && console.log(`[${sc}] console.${m.type()}:`, m.text()));
    await page.goto(`http://127.0.0.1:${port}/index.html#${id}`);
    const ok = await Promise.race([
      page.waitForSelector('#stageReady', { state: 'attached', timeout: 20000 }).then(() => true),
      page.waitForSelector('#stageError', { state: 'attached', timeout: 20000 }).then(async () => { console.log(`[${sc}] stageError:`, await page.textContent('#stageError')); return false; }),
    ]).catch((e) => { console.log(`[${sc}] not ready:`, e.message.split('\n')[0]); return false; });
    await page.waitForTimeout(500);
    if (ok && step) {
      const run = {
        open: async () => { await page.click('#extBtn'); await page.waitForTimeout(900); },
        play: async () => { await page.click('.play-btn'); await page.waitForSelector('.card.playing', { timeout: 15000 }); await page.waitForTimeout(2500); },
        generating: async () => { await page.click('.play-btn'); await page.waitForTimeout(1200); },
        medium: async () => { await page.click('.mode-btn:nth-child(2)'); await page.waitForTimeout(400); },
        full: async () => { await page.click('.mode-btn:nth-child(3)'); await page.waitForTimeout(400); },
        voices: async () => { await page.click('.chip:nth-child(1)'); await page.waitForTimeout(400); },
        cedar: async () => { await page.click('.chip:nth-child(1)'); await page.waitForTimeout(300); await page.click('.chip-option:has-text("Cedar")'); await page.waitForSelector('.card.playing', { timeout: 15000 }); await page.waitForTimeout(1500); },
        styles: async () => { await page.click('.chip:nth-child(2)'); await page.waitForTimeout(400); },
        story: async () => { await page.click('.chip:nth-child(1)'); await page.click('.chip-option:has-text("Cedar")'); await page.waitForSelector('.card.playing', { timeout: 15000 }); await page.click('.chip:nth-child(2)'); await page.click('.chip-option:has-text("Storytelling")'); await page.waitForSelector('.card.playing', { timeout: 15000 }); await page.waitForTimeout(1500); },
        switch: async () => { await page.click('.cx-tab[data-tab="2"]'); await page.waitForSelector('.next-article', { timeout: 5000 }); await page.waitForTimeout(400); },
        switched: async () => { await page.click('.cx-tab[data-tab="2"]'); await page.waitForSelector('.next-article', { timeout: 5000 }); await page.click('.next-article-btn'); await page.waitForSelector('.card.playing', { timeout: 15000 }); await page.waitForTimeout(1500); },
        key: async () => { await page.fill('#api-key', 'sk-proj-demo-key-not-a-real-key'); await page.waitForTimeout(200); },
        valid: async () => { await page.fill('#api-key', 'sk-proj-demo-key-not-a-real-key'); await page.click('.validate-button'); await page.waitForTimeout(1300); },
        saved: async () => { await page.fill('#api-key', 'sk-proj-demo-key-not-a-real-key'); await page.click('.validate-button'); await page.waitForTimeout(1300); await page.click('.primary-button'); await page.waitForTimeout(600); },
      }[step];
      if (!run) throw new Error(`unknown step ${step}`);
      await run().catch((e) => console.log(`[${sc}] step failed:`, e.message.split('\n')[0]));
    }
    const rects = await page.evaluate(() => {
      const out = {};
      for (const s of ['#extBtn', '#side', '#panel', '.card', '.header', '.article-context', '.mode-track', '.player-zone', '.play-btn', '.progress-container', '.controls-bar', '.chip:nth-child(1)', '.status-bar', '.next-article', '.error-banner', '.chip-dropdown.open', '#api-key', '.validate-button', '.primary-button', '.settings-section', '.message', '.cx-tab[data-tab="2"]']) {
        const e = document.querySelector(s);
        if (!e) continue;
        const b = e.getBoundingClientRect();
        out[s] = [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)];
      }
      out.status = document.querySelector('.status span:last-child')?.textContent;
      out.time = document.querySelector('.progress-times')?.textContent;
      out.err = document.querySelector('.error-banner')?.textContent;
      return out;
    });
    console.log(sc, JSON.stringify(rects));
    await page.screenshot({ path: path.join(outDir, `${sc.replace(':', '-')}.png`) });
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
