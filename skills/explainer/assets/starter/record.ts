/**
 * Recorder choreography: one action per footage scene in script.ts, keyed by scene id. Each action drives the
 * running app (glide the cursor, click, type, spotlight) and leaves zoom cues that the render turns into camera moves.
 *
 * Times are seconds since the page was ready. Narration starts at leadInSec (0.6 s unless the scene sets it),
 * so T(narr, f) is the moment a fraction f of the line has been spoken: hang each beat on the words it illustrates.
 * The clip is held until the scene's full length, so an action may end early.
 */
import type { SceneAction } from '@explainer/scripts/lib/recorder';

const T = (narr: number, f: number): number => 0.6 + f * narr;

export const actions: Record<string, SceneAction> = {
  'first-look': async (r, narr) => {
    await r.until(0.3);
    await r.moveTo('h1', { at: [0.5, 0.5] });
    await r.until(T(narr, 0.45));
    await r.spot('main', 10);
    await r.zoom('main', 24);
    await r.until(T(narr, 1.0));
    await r.unspot();
    r.zoomReset();
  },

  'key-action': async (r, narr) => {
    await r.until(0.3);
    await r.click('button', { at: [0.5, 0.5] });
    await r.until(T(narr, 0.6));
    await r.zoom('main', 24);
    await r.until(T(narr, 1.0) + 0.2);
    r.zoomReset();
  },
};
