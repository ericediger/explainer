/**
 * Recorder choreography for the CTM Flight Deck explainer: one action per footage scene, keyed by scene id.
 * The page is demo/stage.html#<scene> at 2400x1350 (a 1600x900 stage drawn at 1.5x), so every rectangle
 * and cursor position here is in those viewport pixels. Times are seconds since the page was ready; the
 * narration starts at leadInSec (0.6 s), so T(narr, f) is the moment a fraction f of the line has been spoken.
 *
 * Zoom scale is roughly 2400 / (width + 2 * pad) for the wide side-panel regions, so pads of 110-150 keep
 * the camera near 1.8-1.9x: close enough to read, never past the footage's own resolution by much.
 */
import type { SceneAction, SceneRecorder } from '../../scripts/lib/recorder';

const T = (narr: number, f: number): number => 0.6 + f * narr;
const PAD = 130;

/** Glide to a <select> and change it programmatically: a real click would open a native popup the screencast never shows. */
async function choose(r: SceneRecorder, sel: string, value: string): Promise<void> {
  const p = await r.moveTo(sel, { at: [0.35, 0.5] });
  await r.eval(`window.__rec.ripple(${p.x}, ${p.y})`);
  await r.p.selectOption(sel, value);
}

const visible = (r: SceneRecorder, sel: string, timeout = 10000) => r.p.waitForSelector(`${sel}:not(.hidden)`, { timeout });

/** Spotlight that keeps following its element (stage.js re-measures it every frame): the app's status line
 *  comes and goes above the results, so a fixed rectangle would drift off its target. */
async function spot(r: SceneRecorder, sel: string, pad = 8): Promise<void> {
  await r.spot(sel, pad);
  await r.eval(`window.__follow = ${JSON.stringify({ sel, pad })}`);
}
async function unspot(r: SceneRecorder): Promise<void> {
  await r.eval('window.__follow = null');
  await r.unspot();
}

export const actions: Record<string, SceneAction> = {
  // Inbox in view; open the side panel from the toolbar, type a request, show the parse, then the results.
  ask: async (r, narr) => {
    await r.until(0.2);
    await r.click('#extBtn');
    await r.wait(0.55);
    await r.zoomUnion(['.app-header', '#searchBtn'], PAD);
    await r.type('#queryInput', 'Philly to Austin Friday the 23rd, back Sunday evening', { cps: 40 });
    await r.wait(0.15);
    await r.press('Enter');
    await visible(r, '#parsedBar');
    await r.wait(0.15);
    await r.zoomUnion(['#queryInput', '#parsedBar'], PAD);
    await spot(r, '#parsedBar', 8);
    await r.moveTo('#parsedBar', { at: [0.12, 0.5] });
    await r.until(T(narr, 0.62));
    await r.moveTo('#parsedBar', { at: [0.42, 0.5], ms: 900 });
    await r.until(T(narr, 0.78));
    await r.moveTo('#parsedBar', { at: [0.66, 0.5], ms: 700 });
    await r.p.waitForSelector('.flight-card');
    await r.until(T(narr, 0.86));
    await unspot(r);
    await r.zoomUnion(['#parsedBar', '#resultsPanel .flight-card:nth-child(2)'], 70);
    await r.moveTo('#resultsPanel .flight-card', { at: [0.6, 0.45] });
    await r.until(T(narr, 1.0) + 0.2);
    r.zoomReset();
  },

  // Search runs; the take streams in; price insight, the take, then sort by cheapest and fastest.
  take: async (r, narr) => {
    await r.until(0.2);
    await r.zoomUnion(['.app-header', '#searchBtn'], PAD);
    await r.click('#searchBtn');
    await r.p.waitForSelector('.flight-card');
    await r.zoomUnion(['#parsedBar', '#resultsPanel .flight-card'], 90);
    await r.moveTo('#resultsPanel .flight-card', { at: [0.5, 0.5] });
    await visible(r, '#summaryBox');
    await r.until(T(narr, 0.2));
    await spot(r, '#insightsBar', 6);
    await r.moveTo('#insightsBar', { at: [0.3, 0.5] });
    await r.until(T(narr, 0.36));
    await r.zoom('#summaryBox', PAD);
    await spot(r, '#summaryBox', 8);
    await r.moveTo('#summaryBox', { at: [0.2, 0.55] });
    await r.until(T(narr, 0.5));
    await r.moveTo('#summaryBox', { at: [0.55, 0.62], ms: 1000 });
    await r.until(T(narr, 0.68));
    await unspot(r);
    await r.zoomUnion(['.results-header', '#resultsPanel .flight-card:nth-child(3)'], 80);
    await choose(r, '#sortSelect', 'price');
    await r.until(T(narr, 0.86));
    await choose(r, '#sortSelect', 'duration');
    await r.until(T(narr, 1.0) + 0.2);
    r.zoomReset();
  },

  // Mic on, mic off, the transcript lands, the airline chips follow, the take streams (and would be spoken).
  voice: async (r, narr) => {
    await r.until(0.3);
    await r.zoomUnion(['.app-header', '#searchBtn'], PAD);
    await r.moveTo('#micBtn');
    await r.until(T(narr, 0.12));
    await r.click('#micBtn');
    await r.until(T(narr, 0.27));
    await r.click('#micBtn');
    await r.p.waitForFunction(() => (document.getElementById('queryInput') as HTMLTextAreaElement).value.length > 0);
    await visible(r, '#parsedBar');
    await r.wait(0.1);
    await r.zoomUnion(['#queryInput', '#parsedBar'], PAD);
    await spot(r, '#airlineChips', 10);
    await r.moveTo('#airlineChips .chip[data-code="UA"]');
    await visible(r, '#summaryBox');
    await r.until(T(narr, 0.64));
    await unspot(r);
    await r.zoom('#summaryBox', PAD);
    await spot(r, '#summaryBox', 8);
    await r.moveTo('#summaryBox', { at: [0.25, 0.5] });
    await r.until(T(narr, 0.85));
    await r.moveTo('#summaryBox', { at: [0.6, 0.6], ms: 900 });
    await r.until(T(narr, 1.0) + 0.1);
    await unspot(r);
    r.zoomReset();
  },

  // An incomplete request gets one question; the answer merges with the original; reset clears it all.
  clarify: async (r, narr) => {
    await r.until(0.2);
    await r.zoomUnion(['.app-header', '#searchBtn'], PAD);
    await r.type('#queryInput', 'Philly to Orlando November 5', { cps: 40 });
    await r.wait(0.15);
    await r.press('Enter');
    await visible(r, '#askBar');
    await r.wait(0.1);
    await r.zoomUnion(['#queryInput', '#askBar'], PAD);
    await spot(r, '#askBar', 8);
    await r.moveTo('#askBar', { at: [0.3, 0.5] });
    await r.until(T(narr, 0.33));
    await unspot(r);
    await r.type('#queryInput', 'back the following Thursday', { cps: 40 });
    await r.wait(0.15);
    await r.press('Enter');
    await visible(r, '#parsedBar');
    await r.wait(0.1);
    await r.zoomUnion(['#queryInput', '#parsedBar'], PAD);
    await spot(r, '#parsedBar', 8);
    await r.moveTo('#parsedBar', { at: [0.45, 0.5] });
    await r.p.waitForSelector('.flight-card');
    await r.until(T(narr, 0.74));
    await unspot(r);
    await r.zoomUnion(['.app-header', '#parsedBar'], PAD);
    await spot(r, '#resetBtn', 10);
    await r.moveTo('#resetBtn');
    await r.until(T(narr, 0.93));
    await unspot(r);
    await r.click('#resetBtn');
    await r.until(T(narr, 1.0) + 0.3);
    r.zoomReset();
  },

  // An open-dated route question: probe days are checked, the assessment streams, the days expand.
  explore: async (r, narr) => {
    await r.until(0.3);
    await r.zoomUnion(['.app-header', '#searchBtn'], PAD);
    await r.until(T(narr, 0.08));
    await r.type('#queryInput', 'Are there daily nonstops between Philly and London next month?', { cps: 32 });
    await r.until(T(narr, 0.27));
    await r.press('Enter');
    await visible(r, '#parsedBar');
    await r.wait(0.15);
    await r.zoomUnion(['#queryInput', '#parsedBar'], PAD);
    await spot(r, '#parsedBar', 8);
    await r.moveTo('#parsedBar', { at: [0.55, 0.5] });
    await r.p.waitForFunction(() => /Checking/.test(document.getElementById('statusText')?.textContent || ''));
    await r.wait(0.5);
    await unspot(r);
    await spot(r, '#statusBar', 8);
    await r.moveTo('#statusBar', { at: [0.35, 0.5] });
    await visible(r, '#summaryBox', 15000);
    await unspot(r);
    await r.zoom('#summaryBox', PAD);
    await spot(r, '#summaryBox', 8);
    await r.moveTo('#summaryBox', { at: [0.3, 0.5] });
    await r.until(T(narr, 0.66));
    await r.moveTo('#summaryBox', { at: [0.6, 0.6], ms: 900 });
    await r.until(T(narr, 0.8));
    // The status line above the results hides when the assessment finishes; click only after the layout settles.
    await r.p.waitForSelector('#statusBar.hidden', { state: 'attached', timeout: 15000 });
    await unspot(r);
    await r.click('#resultsTitle', { at: [0.3, 0.5] });
    await r.wait(0.25);
    await r.zoomUnion(['#resultsTitle', '#resultsList .flight-card:nth-of-type(2)'], 80);
    await r.moveTo('.probe-heading', { at: [0.4, 0.5] });
    await r.until(T(narr, 1.0) + 0.3);
    r.zoomReset();
  },

  // Results are already on screen: pick outbound, pick return, the summary pins, Book This Trip opens a tab.
  book: async (r, narr) => {
    await r.p.waitForSelector('.flight-card');
    await r.until(0.3);
    await r.zoomUnion(['.results-header', '#resultsPanel .flight-card:nth-child(3)'], 70);
    await r.moveTo('#resultsPanel .flight-card', { at: [0.55, 0.45] });
    await r.until(T(narr, 0.1));
    await r.click('#resultsPanel .flight-card', { at: [0.55, 0.45] });
    await visible(r, '#backBtn');
    await r.wait(0.2);
    await r.zoomUnion(['.results-header', '#resultsPanel .flight-card:nth-child(2)'], 70);
    await r.until(T(narr, 0.24));
    await r.click('#resultsPanel .flight-card', { at: [0.55, 0.45] });
    await visible(r, '#bookTripBtn');
    await r.until(T(narr, 0.32));
    await r.zoom('#tripSummary', PAD);
    await spot(r, '#tripSummary', 8);
    await r.moveTo('#tripLines', { at: [0.3, 0.3] });
    await r.until(T(narr, 0.45));
    await r.moveTo('.trip-total', { at: [0.3, 0.5], ms: 700 });
    await r.until(T(narr, 0.56));
    await unspot(r);
    await r.click('#bookTripBtn', { at: [0.5, 0.5] });
    await r.wait(0.3);
    r.zoomReset();
    await r.moveTo('#tabBook', { at: [0.4, 0.5] });
    await r.until(T(narr, 0.78));
    await spot(r, '#tripSummary', 8);
    await r.moveTo('#tripLines', { at: [0.4, 0.5] });
    await r.until(T(narr, 1.0) + 0.2);
    await unspot(r);
  },
};
