/**
 * Recorder choreography for the SpeakEasy explainer: one action per footage scene, keyed by scene id.
 * The page is ../SPEAKEASY/demo/index.html#<scene> at 2400x1350 (a 1600x900 window drawn at 1.5x; the side panel is
 * 420 CSS px drawn at 1.4x inside it), so every rectangle here is in those viewport pixels. Times are seconds since
 * the page was ready; the narration starts at leadInSec (0.6 s), so T(narr, f) is the moment a fraction f of the line
 * has been spoken. Pads of 40-60 around the 880 px wide panel keep the camera near 1.6-1.9x.
 */
import type { SceneAction, SceneRecorder } from '../../scripts/lib/recorder';

const T = (narr: number, f: number): number => 0.6 + f * narr;

/** Spotlight that keeps following its element (stage.js re-measures it every frame): banners above the player
 *  come and go, which would otherwise leave a fixed rectangle off its target. */
async function spot(r: SceneRecorder, sel: string, pad = 10): Promise<void> {
  await r.spot(sel, pad);
  await r.eval(`window.__follow = ${JSON.stringify({ sel, pad })}`);
}
async function unspot(r: SceneRecorder): Promise<void> {
  await r.eval('window.__follow = null');
  await r.unspot();
}
const playing = (r: SceneRecorder, timeout = 20000) => r.p.waitForSelector('.card.playing', { timeout });
const PANEL = ['.header', '.status-bar'];
const PLAYER = ['.article-context', '.status-bar'];

export const actions: Record<string, SceneAction> = {
  // Article in view, panel closed: click the toolbar icon, the panel slides in; title and site, then the three estimates.
  open: async (r, narr) => {
    await r.until(0.3);
    await r.moveTo('#extBtn');
    await r.until(T(narr, 0.14));
    await r.click('#extBtn');
    await r.wait(0.75);
    await r.zoomUnion(PANEL, 50);
    await r.until(T(narr, 0.5));
    await spot(r, '.article-context', 8);
    await r.moveTo('.article-title', { at: [0.3, 0.5] });
    await r.until(T(narr, 0.72));
    await spot(r, '.mode-track', 8);
    await r.moveTo('.mode-btn:nth-child(1) .mode-est');
    await r.until(T(narr, 0.84));
    await r.moveTo('.mode-btn:nth-child(3) .mode-est', { ms: 1100 });
    await r.until(T(narr, 1.0) + 0.3);
    await unspot(r);
    r.zoomReset();
  },

  // Panel open and idle: TL;DR, play, the generating state, then playback with the timeline and a skip.
  listen: async (r, narr) => {
    await r.until(0.3);
    await r.zoomUnion(PLAYER, 50);
    await r.until(T(narr, 0.05));
    await r.click('.mode-btn:nth-child(1)');
    await r.until(T(narr, 0.16));
    await r.click('.play-btn');
    await spot(r, '.player-zone', 6);
    await r.moveTo('.transport-label', { at: [0.5, 0.5] });
    await playing(r);
    await r.until(T(narr, 0.6));
    await spot(r, '.progress-container', 10);
    await r.moveTo('.progress-track', { at: [0.3, 0.5] });
    await r.until(T(narr, 0.8));
    await unspot(r);
    await r.click('.transport-btn:nth-child(3)');
    await r.moveTo('.progress-track', { at: [0.55, 0.5], ms: 900 });
    await r.until(T(narr, 1.0) + 0.3);
    r.zoomReset();
  },

  // TL;DR playing: step through Medium and Full (estimates change, the player resets), back to TL;DR, and the cache answers at once.
  modes: async (r, narr) => {
    await r.until(0.3);
    await r.zoomUnion(PLAYER, 50);
    await r.until(T(narr, 0.06));
    await spot(r, '.mode-track', 8);
    await r.moveTo('.mode-btn:nth-child(1)');
    await r.until(T(narr, 0.3));
    await r.click('.mode-btn:nth-child(2)');
    await r.until(T(narr, 0.5));
    await r.click('.mode-btn:nth-child(3)');
    await r.until(T(narr, 0.72));
    await r.click('.mode-btn:nth-child(1)');
    await r.until(T(narr, 0.8));
    await unspot(r);
    await r.click('.play-btn');
    await playing(r);
    await r.moveTo('.progress-track', { at: [0.2, 0.5] });
    await r.until(T(narr, 1.0) + 0.3);
    r.zoomReset();
  },

  // Playing in Marin: open the voice menu, pick Cedar (regenerates), then a Storytelling style, then nudge the speed.
  // Two regenerations plus two menus in an 11.5 s line: everything starts early and the demo's latency is scaled down for this scene.
  voice: async (r, narr) => {
    await r.until(0.3);
    await r.zoomUnion(['.mode-track', '.status-bar'], 40);
    await r.until(T(narr, 0.04));
    await r.click('.chip:nth-child(1)');
    await r.wait(0.2);
    await r.moveTo('.chip:nth-child(1) .chip-option:nth-child(4)', { ms: 500 });
    await r.until(T(narr, 0.2));
    await r.click('.chip:nth-child(1) .chip-option:nth-child(2)');
    await playing(r);
    await r.until(T(narr, 0.4));
    await r.click('.chip:nth-child(2)');
    await r.wait(0.2);
    await r.moveTo('.chip:nth-child(2) .chip-option:nth-child(4)', { ms: 500 });
    await r.until(T(narr, 0.5));
    await r.click('.chip:nth-child(2) .chip-option:nth-child(6)');
    await playing(r);
    await r.until(T(narr, 0.74));
    await r.click('.speed-step:last-child');
    await r.wait(0.2);
    await r.click('.speed-step:last-child');
    await r.until(T(narr, 1.0) + 0.3);
    r.zoomReset();
  },

  // Playing: switch to the other tab, the panel offers the new page, one click and it reads that instead.
  persist: async (r, narr) => {
    await r.until(0.3);
    await r.moveTo('.ar-nav span:nth-child(2)');
    await r.until(T(narr, 0.2));
    await r.moveTo('.cx-tab[data-tab="2"]', { at: [0.5, 0.5] });
    await r.until(T(narr, 0.3));
    await r.click('.cx-tab[data-tab="2"]', { at: [0.5, 0.5] });
    await r.p.waitForSelector('.next-article');
    await r.wait(0.2);
    await r.zoomUnion(PANEL, 50);
    await spot(r, '.next-article', 8);
    await r.moveTo('.next-article-title', { at: [0.3, 0.5] });
    await r.until(T(narr, 0.66));
    await r.click('.next-article-btn');
    await unspot(r);
    await r.moveTo('.transport-label', { at: [0.5, 0.5] });
    await playing(r);
    await spot(r, '.article-context', 8);
    await r.until(T(narr, 1.0) + 0.4);
    await unspot(r);
    r.zoomReset();
  },

  // Settings tab, no key yet: type a key, Validate turns the field green, Save confirms.
  setup: async (r, narr) => {
    await r.until(0.3);
    await r.zoom('.settings-section', 40);
    await r.until(T(narr, 0.1));
    await r.type('#api-key', 'sk-proj-7Hq2mD4kR9wLx3Nv8TbZ', { cps: 38 });
    await r.until(T(narr, 0.4));
    await r.click('.validate-button');
    await r.wait(1.1);
    await spot(r, '.api-key-input', 10);
    await r.until(T(narr, 0.6));
    await unspot(r);
    r.zoomReset();
    await r.moveTo('.primary-button');
    await r.until(T(narr, 0.68));
    await r.click('.primary-button');
    await r.p.waitForSelector('.message.success');
    await r.zoomUnion(['.message', '.primary-button'], 60);
    await spot(r, '.message', 8);
    await r.until(T(narr, 1.0) + 0.3);
    await unspot(r);
    r.zoomReset();
  },
};
