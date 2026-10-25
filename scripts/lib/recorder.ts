/**
 * Scripted screen recording with Playwright.
 *
 * One SceneRecorder records one clip per scene: a fresh browser context with
 * video capture, a visible synthetic cursor, click ripples, a "spotlight" that
 * dims everything except one element, and zoom cues (element rectangles with
 * timestamps) that Remotion later turns into smooth camera moves.
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { type Browser, type BrowserContext, type Page } from 'playwright';
import { getVideoMetadata } from '@remotion/renderer';
import type { Cue, Footage, Rect } from '../../src/spec';
import { root } from './env';

const HELPERS = `(() => {
  if (window.__rec) return;
  const css = document.createElement('style');
  css.textContent = \`
    #__cursor{position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;
      transform:translate(-100px,-100px);transition:transform .5s cubic-bezier(.22,.8,.2,1);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
    #__ripple{position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;
      border:3px solid var(--accent,#2f6f4f);opacity:0;z-index:2147483646;pointer-events:none}
    #__ripple.go{animation:__rip .55s ease-out}
    @keyframes __rip{0%{opacity:.9;transform:scale(.25)}100%{opacity:0;transform:scale(1.6)}}
    #__spot{position:fixed;left:0;top:0;width:0;height:0;border-radius:10px;box-shadow:0 0 0 200vmax rgba(8,10,14,.55);
      outline:2px solid var(--accent,#2f6f4f);opacity:0;z-index:2147483640;pointer-events:none;
      transition:left .45s cubic-bezier(.2,.8,.2,1),top .45s cubic-bezier(.2,.8,.2,1),width .45s cubic-bezier(.2,.8,.2,1),height .45s cubic-bezier(.2,.8,.2,1),opacity .35s}
    #__spot.on{opacity:1}
  \`;
  document.head.appendChild(css);
  const cur = document.createElement('div'); cur.id = '__cursor';
  cur.innerHTML = '<svg viewBox="0 0 28 28" width="28" height="28"><path d="M6 3 L6 23 L11.2 18.3 L14.6 25.5 L17.6 24.2 L14.3 17 L21.5 17 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const rip = document.createElement('div'); rip.id = '__ripple';
  const spot = document.createElement('div'); spot.id = '__spot';
  document.body.append(spot, rip, cur);
  window.__rec = {
    move(x, y, ms) { cur.style.transitionDuration = ms + 'ms'; cur.style.transform = 'translate(' + (x - 6) + 'px,' + (y - 3) + 'px)'; },
    ripple(x, y) { rip.style.left = x + 'px'; rip.style.top = y + 'px'; rip.classList.remove('go'); void rip.offsetWidth; rip.classList.add('go'); },
    spot(r, pad) {
      // A first spotlight appears in place and fades in; only moves between targets glide (else it swoops in from 0,0).
      const first = !spot.classList.contains('on');
      if (first) spot.style.transition = 'opacity .35s';
      spot.style.left = (r.x - pad) + 'px'; spot.style.top = (r.y - pad) + 'px'; spot.style.width = (r.w + 2 * pad) + 'px'; spot.style.height = (r.h + 2 * pad) + 'px';
      if (first) { void spot.offsetWidth; spot.style.transition = ''; }
      spot.classList.add('on');
    },
    unspot() { spot.classList.remove('on'); },
    rect(sel) { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; },
  };
})();`;

/** One footage scene's choreography: drive the page, leave cues; `narrationSec` is how long the voice line runs. */
export type SceneAction = (r: SceneRecorder, narrationSec: number) => Promise<void>;

export type RecorderOptions = {
  baseUrl: string;
  outDir: string;
  viewport: { width: number; height: number };
  /** Device pixel ratio; 2 gives crisp text when Remotion zooms in. */
  dpr: number;
  /** Element that must have rendered content before a scene starts (default `#app`). */
  readySelector?: string;
};

export class SceneRecorder {
  private ctx!: BrowserContext;
  private page!: Page;
  private id = '';
  private readyWall = 0;
  private cues: Cue[] = [];
  private mouse = { x: 0, y: 0 };

  constructor(private browser: Browser, private opts: RecorderOptions) {}

  /** Open a fresh recording context, navigate, wait for the app to paint, inject helpers. */
  async start(id: string, hash: string): Promise<void> {
    this.id = id;
    this.cues = [];
    const { viewport, dpr } = this.opts;
    this.ctx = await this.browser.newContext({
      viewport,
      deviceScaleFactor: dpr,
      colorScheme: 'light',
      permissions: ['clipboard-read', 'clipboard-write'],
      // Chrome's screencast delivers frames at the CSS viewport size regardless of deviceScaleFactor,
      // and Playwright pads (not scales) frames smaller than `size`, so the video must match the viewport.
      recordVideo: { dir: path.join(this.opts.outDir, '.raw'), size: { width: viewport.width, height: viewport.height } },
    });
    this.page = await this.ctx.newPage();
    await this.page.goto(this.opts.baseUrl + hash, { waitUntil: 'load' });
    await this.page.waitForFunction((sel) => {
      const a = document.querySelector(sel);
      return !!a && a.innerHTML.trim().length > 0;
    }, this.opts.readySelector ?? '#app');
    await this.page.evaluate(() => (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready);
    await this.page.evaluate(HELPERS);
    this.mouse = { x: Math.round(viewport.width * 0.62), y: Math.round(viewport.height * 0.58) };
    await this.page.evaluate(([x, y]) => (window as any).__rec.move(x, y, 0), [this.mouse.x, this.mouse.y]);
    await this.page.mouse.move(this.mouse.x, this.mouse.y);
    await this.page.waitForTimeout(300);
    this.readyWall = Date.now();
  }

  /** Seconds since the page was ready (scene time). */
  now(): number {
    return (Date.now() - this.readyWall) / 1000;
  }

  /** Wait until scene time t. */
  async until(t: number): Promise<void> {
    const ms = t * 1000 - (Date.now() - this.readyWall);
    if (ms > 0) await this.page.waitForTimeout(ms);
  }

  async wait(sec: number): Promise<void> {
    await this.page.waitForTimeout(sec * 1000);
  }

  async rect(sel: string): Promise<Rect> {
    const r = (await this.page.evaluate((s) => (window as any).__rec.rect(s), sel)) as Rect | null;
    if (!r) throw new Error(`[${this.id}] no element matches ${sel}`);
    return r;
  }

  /** Glide the cursor to an element (or point). `at` is the fractional anchor inside the element. */
  async moveTo(target: string | { x: number; y: number }, opts: { ms?: number; at?: [number, number] } = {}): Promise<{ x: number; y: number }> {
    let pt: { x: number; y: number };
    if (typeof target === 'string') {
      const r = await this.rect(target);
      const [fx, fy] = opts.at ?? [0.5, 0.5];
      pt = { x: r.x + r.w * fx, y: r.y + r.h * fy };
    } else pt = target;
    const dist = Math.hypot(pt.x - this.mouse.x, pt.y - this.mouse.y);
    const ms = opts.ms ?? Math.min(900, Math.max(320, dist * 0.9));
    await this.page.evaluate(([x, y, d]) => (window as any).__rec.move(x, y, d), [pt.x, pt.y, ms]);
    await this.page.mouse.move(pt.x, pt.y, { steps: 10 });
    await this.page.waitForTimeout(ms + 60);
    this.mouse = pt;
    return pt;
  }

  async click(target: string | { x: number; y: number }, opts: { at?: [number, number] } = {}): Promise<void> {
    const p = await this.moveTo(target, opts);
    await this.page.evaluate(([x, y]) => (window as any).__rec.ripple(x, y), [p.x, p.y]);
    await this.page.mouse.down();
    await this.page.waitForTimeout(90);
    await this.page.mouse.up();
    await this.page.waitForTimeout(220);
  }

  /** Click into a field and type like a person. */
  async type(sel: string, text: string, opts: { cps?: number } = {}): Promise<void> {
    const cps = opts.cps ?? 12;
    await this.click(sel);
    for (const ch of text) {
      await this.page.keyboard.type(ch);
      await this.page.waitForTimeout((1000 / cps) * (0.65 + Math.random() * 0.7));
    }
  }

  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /** Smooth-scroll an element to the middle of the viewport and wait for the scroll to settle. */
  async scrollTo(sel: string, block: ScrollLogicalPosition = 'center'): Promise<void> {
    await this.page.evaluate(([s, b]) => document.querySelector(s as string)?.scrollIntoView({ block: b as ScrollLogicalPosition, behavior: 'smooth' }), [sel, block]);
    await this.page.waitForTimeout(650);
  }

  /** Dim everything except one element. */
  async spot(sel: string, pad = 8): Promise<void> {
    const r = await this.rect(sel);
    await this.page.evaluate(([rr, p]) => (window as any).__rec.spot(rr, p), [r, pad] as const);
  }

  async unspot(): Promise<void> {
    await this.page.evaluate(() => (window as any).__rec.unspot());
  }

  /** Record a camera cue: Remotion will zoom to this element's rectangle from now on. */
  async zoom(sel: string, pad = 24): Promise<void> {
    const r = await this.rect(sel);
    this.cues.push({ t: round(this.now()), kind: 'zoom', rect: roundRect(r), pad });
  }

  async zoomUnion(sels: string[], pad = 24): Promise<void> {
    const rs = await Promise.all(sels.map((s) => this.rect(s)));
    const x = Math.min(...rs.map((r) => r.x));
    const y = Math.min(...rs.map((r) => r.y));
    const x2 = Math.max(...rs.map((r) => r.x + r.w));
    const y2 = Math.max(...rs.map((r) => r.y + r.h));
    this.cues.push({ t: round(this.now()), kind: 'zoom', rect: roundRect({ x, y, w: x2 - x, h: y2 - y }), pad });
  }

  zoomReset(): void {
    this.cues.push({ t: round(this.now()), kind: 'reset' });
  }

  /** Run JavaScript in the page (string or function). */
  async eval<T = unknown>(script: string | (() => T)): Promise<T> {
    return (await this.page.evaluate(script as any)) as T;
  }

  get p(): Page {
    return this.page;
  }

  /** Hold until the clip is at least `minDurationSec` long, then close and finalize. */
  async finish(minDurationSec: number): Promise<Footage> {
    await this.until(minDurationSec);
    const video = this.page.video();
    const closeWall = Date.now();
    await this.ctx.close();
    if (!video) throw new Error('No video was recorded');
    const rawPath = await video.path();
    const webm = path.join(this.opts.outDir, `${this.id}.webm`);
    fs.renameSync(rawPath, webm);
    let file = webm;
    try {
      const mp4 = path.join(this.opts.outDir, `${this.id}.mp4`);
      transcode(webm, mp4);
      fs.unlinkSync(webm);
      file = mp4;
    } catch (e) {
      console.warn(`  (keeping webm; transcode failed: ${(e as Error).message.split('\n')[0]})`);
    }
    const meta = await getVideoMetadata(file);
    const durationSec = meta.durationInSeconds ?? (closeWall - this.readyWall) / 1000 + 1;
    const videoStartWall = closeWall - durationSec * 1000;
    const readyAt = Math.max(0, round((this.readyWall - videoStartWall) / 1000));
    const { viewport } = this.opts;
    return {
      id: this.id,
      file: `footage/${path.basename(file)}`,
      durationSec: round(durationSec),
      readyAt,
      width: meta.width,
      height: meta.height,
      cssWidth: viewport.width,
      cssHeight: viewport.height,
      cues: this.cues,
    };
  }
}

/** Re-encode Playwright's VP8 webm to H.264 so Remotion seeks fast and durations are exact. Uses Remotion's bundled ffmpeg. */
function transcode(input: string, output: string): void {
  const bin = path.join(root, 'node_modules', '.bin', 'remotion');
  execFileSync(
    bin,
    ['ffmpeg', '-y', '-i', input, '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', output],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

/**
 * Playwright records video through its own ffmpeg download, which is not offered for every macOS.
 * Stand in Remotion's bundled ffmpeg (same machine-compatible build we render with) at the path
 * Playwright expects, via a tiny wrapper that sets the library path. Idempotent. Elsewhere,
 * `npx playwright install ffmpeg` provides it.
 */
export function ensurePlaywrightFfmpeg(): void {
  if (process.platform !== 'darwin') return;
  const pwCore = path.dirname(require.resolve('playwright-core/package.json'));
  const browsers = JSON.parse(fs.readFileSync(path.join(pwCore, 'browsers.json'), 'utf8')) as { browsers: { name: string; revision: string }[] };
  const rev = browsers.browsers.find((b) => b.name === 'ffmpeg')?.revision;
  if (!rev) return;
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(process.env.HOME || '', 'Library', 'Caches', 'ms-playwright');
  const target = path.join(cache, `ffmpeg-${rev}`, 'ffmpeg-mac');
  const MARK = 'EXPLAINER-ffmpeg-bridge';
  if (fs.existsSync(target) && !fs.readFileSync(target, 'latin1').slice(0, 400).includes(MARK)) return; // a real Playwright ffmpeg
  const compositorDir = path.dirname(require.resolve(`@remotion/compositor-darwin-${process.arch}/package.json`));
  const ffmpeg = path.join(compositorDir, 'ffmpeg');
  if (!fs.existsSync(ffmpeg)) throw new Error(`Playwright needs ffmpeg at ${target} and Remotion's ffmpeg was not found at ${ffmpeg}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // Remotion's ffmpeg is a slim build without the `pad` filter Playwright uses; frames from a fixed
  // viewport are already the right size, so swap pad=W:H:... for scale=W:H.
  const script = `#!/usr/bin/env python3
# ${MARK}: written by EXPLAINER/scripts/lib/recorder.ts so Playwright can capture video with Remotion's ffmpeg.
import os, re, sys
d = ${JSON.stringify(compositorDir)}
args = sys.argv[1:]
for i, a in enumerate(args):
    if a == '-vf' and i + 1 < len(args) and 'pad=' in args[i + 1]:
        m = re.search(r'pad=(\\d+):(\\d+)', args[i + 1])
        args[i + 1] = 'scale=%s:%s' % (m.group(1), m.group(2)) if m else 'null'
os.environ['DYLD_LIBRARY_PATH'] = d
os.chdir(d)
os.execv(os.path.join(d, 'ffmpeg'), ['ffmpeg'] + args)
`;
  fs.writeFileSync(target, script, { mode: 0o755 });
  console.log(`Bridged Playwright's ffmpeg to Remotion's build → ${target}`);
}

/** The first port from `from` up that nothing is listening on, so two recordings at once never share a server. */
export async function freePort(from: number): Promise<number> {
  for (let port = from; port < from + 50; port++) {
    const free = await new Promise<boolean>((resolve) => {
      const probe = net.createServer();
      probe.once('error', () => resolve(false));
      probe.once('listening', () => probe.close(() => resolve(true)));
      probe.listen(port, '127.0.0.1');
    });
    if (free) return port;
  }
  throw new Error(`No free port between ${from} and ${from + 49}`);
}

/** Serve a folder over http so the app runs with a real origin (localStorage, clipboard). */
export async function serveStatic(dir: string, port: number): Promise<() => void> {
  const proc = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dir], { stdio: 'ignore' });
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return () => proc.kill();
}

const round = (n: number) => Math.round(n * 1000) / 1000;
const roundRect = (r: Rect): Rect => ({ x: round(r.x), y: round(r.y), w: round(r.w), h: round(r.h) });
