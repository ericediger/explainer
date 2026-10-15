// Screenshot the demo stage the way the recorder sees it, for checking layout and selectors.
//   node videos/flight-deck/demo/preview.mjs <outDir> [scene ...] [--do=click|type]
// Serves this folder on :8913, opens stage.html#<scene> at 2400x1350, waits for #stageReady,
// optionally runs a scene's quick interaction, and writes <outDir>/<scene>.png.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const [outDir, ...rest] = process.argv.slice(2);
const scenes = rest.filter((a) => !a.startsWith('--'));
const port = 8913;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', here], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const sc of scenes.length ? scenes : ['ask', 'take', 'voice', 'clarify', 'explore', 'book']) {
    const [id, step] = sc.split(':');
    const ctx = await browser.newContext({ viewport: { width: 2400, height: 1350 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log(`[${sc}] pageerror:`, e.message));
    page.on('console', (m) => m.type() === 'error' && console.log(`[${sc}] console:`, m.text()));
    await page.goto(`http://127.0.0.1:${port}/stage.html#${id}`);
    await page.waitForSelector('#stageReady', { state: 'attached' });
    await page.waitForTimeout(400);
    if (step) {
      // Ad-hoc interactions for checking later states of a scene.
      const run = {
        open: async () => { await page.click('#extBtn'); await page.waitForTimeout(900); },
        search: async () => { await page.click('#searchBtn'); await page.waitForSelector('.flight-card'); await page.waitForTimeout(4500); },
        cheapest: async () => { await page.click('#searchBtn'); await page.waitForSelector('.flight-card'); await page.waitForTimeout(4500); await page.selectOption('#sortSelect', 'price'); await page.waitForTimeout(300); },
        mic: async () => { await page.click('#micBtn'); await page.waitForTimeout(600); },
        voice: async () => { await page.click('#micBtn'); await page.waitForTimeout(500); await page.click('#micBtn'); await page.waitForSelector('.flight-card'); await page.waitForTimeout(4000); },
        ask: async () => { await page.fill('#queryInput', 'Philly to Orlando November 5'); await page.click('#searchBtn'); await page.waitForSelector('#askBar:not(.hidden)'); await page.waitForTimeout(300); },
        answer: async () => { await page.fill('#queryInput', 'Philly to Orlando November 5'); await page.click('#searchBtn'); await page.waitForSelector('#askBar:not(.hidden)'); await page.fill('#queryInput', 'back the following Thursday'); await page.click('#searchBtn'); await page.waitForSelector('.flight-card'); await page.waitForTimeout(3500); },
        explore: async () => { await page.fill('#queryInput', 'Are there daily nonstops between Philly and London next month?'); await page.click('#searchBtn'); await page.waitForSelector('#summaryBox:not(.hidden)'); await page.waitForTimeout(5000); await page.click('#resultsTitle'); await page.waitForTimeout(300); },
        outbound: async () => { await page.click('.flight-card'); await page.waitForSelector('#backBtn:not(.hidden)'); await page.waitForTimeout(300); },
        picked: async () => { await page.click('.flight-card'); await page.waitForSelector('#backBtn:not(.hidden)'); await page.click('.flight-card'); await page.waitForTimeout(300); },
        booked: async () => { await page.click('.flight-card'); await page.waitForSelector('#backBtn:not(.hidden)'); await page.click('.flight-card'); await page.waitForTimeout(300); await page.click('#bookTripBtn'); await page.waitForTimeout(300); },
      }[step];
      if (!run) throw new Error(`unknown step ${step}`);
      await run();
    }
    const rects = await page.evaluate(() => {
      const out = {};
      for (const s of ['#extBtn', '#side', '#panel', '#queryInput', '#searchBtn', '#micBtn', '#summaryBox', '.flight-card', '#tripSummary', '#bookTripBtn']) {
        const e = document.querySelector(s);
        if (!e) continue;
        const b = e.getBoundingClientRect();
        out[s] = [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)];
      }
      return out;
    });
    const box = await page.locator('#searchBtn').boundingBox();
    console.log(sc, JSON.stringify(rects), 'pw#searchBtn', box && [Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)]);
    await page.screenshot({ path: path.join(outDir, `${sc.replace(':', '-')}.png`) });
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
