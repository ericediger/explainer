/**
 * Recorder choreography for the explainer of the pipeline itself: one action per footage scene, keyed by scene id.
 * The page is demo/stage.html#<scene> at 1600x900. Times are seconds since the page was ready; the final cut
 * starts narration at leadInSec (0.6 s), so T(narr, f) is the moment a fraction f of the line has been spoken.
 *
 * The terminal replay in stage.js has fixed pacing (a few hundred ms per line), so each action starts typing
 * its command early enough that the replay finishes under the last sentence.
 *
 * Zoom scale is min(1600 / (w + 2 pad), 900 / (h + 2 pad)); regions around 1000 x 560 give about 1.5x, which
 * reads well without going past the footage's own resolution.
 */
import type { SceneAction, SceneRecorder } from '@explainer/scripts/lib/recorder';

const T = (narr: number, f: number): number => 0.6 + f * narr;

/** Zoom to an arbitrary rectangle of the page (a throw-away invisible element carries it to the recorder). */
async function zoomRect(r: SceneRecorder, x: number, y: number, w: number, h: number, pad = 0): Promise<void> {
  await r.eval(`(() => { let d = document.getElementById('__zr'); if (!d) { d = document.createElement('div'); d.id = '__zr'; d.style.cssText = 'position:fixed;pointer-events:none;visibility:hidden'; document.body.appendChild(d); }
    Object.assign(d.style, { left: '${x}px', top: '${y}px', width: '${w}px', height: '${h}px' }); })()`);
  await r.zoom('#__zr', pad);
}

export const actions: Record<string, SceneAction> = {
  // Scroll to the "home" scene, spot its narration, make a small edit; the rail and the scene card go stale.
  storyboard: async (r, narr) => {
    await r.until(0.25);
    await r.scrollTo('#narr', 'center');
    await r.zoom('.editor', 14);
    await r.moveTo('#narr', { at: [0.35, 0.4] });
    await r.until(T(narr, 0.12));
    await r.spot('#narr', 10);
    await r.until(T(narr, 0.4));
    await r.unspot();
    await r.click('#narr', { at: [0.7, 0.5] });
    await r.eval(`window.demo.caretAfter('#narr', 'next seven days')`);
    await r.p.keyboard.type(', plus anything overdue', { delay: 55 });
    await r.wait(0.25);
    await r.zoomUnion(['.rail', '#sceneList li[data-id="home"]'], 30);
    await r.until(T(narr, 0.66));
    await r.moveTo('.stage[data-stage="narrate"]', { at: [0.5, 0.5] });
    await r.until(T(narr, 0.74));
    await r.moveTo('.stage[data-stage="record"]', { at: [0.5, 0.5], ms: 450 });
    await r.until(T(narr, 0.82));
    await r.moveTo('.stage[data-stage="render"]', { at: [0.5, 0.5], ms: 450 });
    await r.until(T(narr, 0.9));
    await r.moveTo('.stage[data-stage="poster"]', { at: [0.5, 0.5], ms: 450 });
    await r.until(T(narr, 1.0) + 0.2);
    r.zoomReset();
  },

  // Four narrators, then the command; only the edited line regenerates.
  narrate: async (r, narr) => {
    await r.until(0.2);
    await zoomRect(r, 24, 80, 1000, 560);
    await r.moveTo('.voice[data-k="say"]', { at: [0.4, 0.5] });
    await r.until(T(narr, 0.07));
    await r.moveTo('.voice[data-k="elevenlabs"]', { at: [0.4, 0.5], ms: 450 });
    await r.until(T(narr, 0.14));
    await r.moveTo('.voice[data-k="openai"]', { at: [0.4, 0.5], ms: 450 });
    await r.until(T(narr, 0.21));
    await r.moveTo('.voice[data-k="human"]', { at: [0.4, 0.5], ms: 450 });
    await r.until(T(narr, 0.28));
    r.zoomReset();
    await r.type('#cmd', 'npm run narrate', { cps: 40 });
    await r.press('Enter');
    await r.until(T(narr, 0.52));
    await zoomRect(r, 372, 80, 1204, 560);
    await r.until(T(narr, 0.72));
    await r.spot('.clip[data-id="home"]', 6);
    await r.moveTo('.clip[data-id="home"] .chip', { at: [0.5, 0.5] });
    await r.until(T(narr, 1.0) + 0.2);
    await r.unspot();
    r.zoomReset();
  },

  // Run the recorder; the clip plays with its cue box and the computed camera beside it.
  record: async (r, narr) => {
    await r.until(0.2);
    await r.type('#cmd', 'npm run record -- home', { cps: 40 });
    await r.press('Enter');
    await r.zoom('.player', 30);
    await r.moveTo('.vidbox', { at: [0.5, 0.55], ms: 700 });
    await r.until(T(narr, 0.5));
    await r.zoomUnion(['.cam', '#cueList'], 24);
    await r.moveTo('.cam canvas', { at: [0.5, 0.5], ms: 700 });
    await r.until(T(narr, 0.72));
    await r.moveTo('#cueList', { at: [0.4, 0.2], ms: 700 });
    await r.until(T(narr, 0.9));
    await r.moveTo('#cueList', { at: [0.4, 0.8], ms: 800 });
    await r.until(T(narr, 1.0) + 0.2);
    r.zoomReset();
  },

  // The five layers light up in turn while the frames render; the music bed's volume curve closes it.
  render: async (r, narr) => {
    await r.until(0.15);
    await r.type('#cmd', 'npm run render', { cps: 40 });
    await r.press('Enter');
    await zoomRect(r, 24, 80, 1076, 560);
    await r.moveTo('.layer[data-i="0"]', { at: [0.5, 0.5], ms: 600 });
    await r.until(T(narr, 0.3));
    await r.moveTo('.layer[data-i="1"]', { at: [0.5, 0.5], ms: 600 });
    await r.until(T(narr, 0.45));
    await r.moveTo('.layer[data-i="2"]', { at: [0.5, 0.5], ms: 500 });
    await r.until(T(narr, 0.58));
    await r.moveTo('.layer[data-i="4"]', { at: [0.5, 0.5], ms: 700 });
    await r.until(T(narr, 0.68));
    await r.zoom('.duckwrap', 150);
    await r.moveTo('.duckwrap', { at: [0.55, 0.5], ms: 800 });
    await r.until(T(narr, 1.0) + 0.2);
    r.zoomReset();
  },

  // The files land in the app's media folder, the poster appears in the README; then everything re-runs.
  deliver: async (r, narr) => {
    await r.until(0.2);
    await r.type('#cmd', 'npm run deliver', { cps: 40 });
    await r.press('Enter');
    await r.moveTo('#f-video', { at: [0.5, 0.5], ms: 700 });
    await r.until(T(narr, 0.3));
    await r.moveTo('#f-poster', { at: [0.5, 0.5], ms: 500 });
    await r.until(T(narr, 0.42));
    await r.zoom('.readme', 24);
    await r.moveTo('#poster', { at: [0.5, 0.5], ms: 800 });
    await r.until(T(narr, 0.6));
    await r.moveTo('#links', { at: [0.25, 0.5], ms: 700 });
    await r.until(T(narr, 0.68));
    r.zoomReset();
    await r.eval(`window.demo.sweep()`);
    await r.until(T(narr, 1.0) + 0.3);
  },
};
