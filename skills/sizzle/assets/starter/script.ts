import type { VideoSpec } from '@explainer/src/spec';

/**
 * Storyboard for this app's explainer video. Each scene is one idea: its words (`narration`, which the captions
 * show) and either an animated component (`kind: 'animated'`) or a page of the running app to film
 * (`kind: 'footage'`, opened at `#<route>`). A scene lasts leadInSec + its narration + tailSec, so the voice sets
 * the pace and record.ts paces the footage to it.
 *
 * Re-run from the app's folder after any edit: npm --prefix <engine> run build
 */
export const spec: VideoSpec = {
  // Short and unique: the build lands in <engine>/build/<id>/ and the video in media/<id>-explainer.mp4.
  id: 'my-app',
  name: 'My App',
  fps: 30,
  // The kit is laid out for 1920x1080: keep these.
  width: 1920,
  height: 1080,
  // Free for scenes to show (the starter's outro does); leave empty to hide.
  repoUrl: '',
  // Shown in the browser frame's address bar.
  demoUrl: 'localhost',
  record: {
    // Folder served over http, relative to the app folder (the one that holds explainer/), and the page to open.
    // For an app that needs a dev server, start it yourself and set `url` instead of appDir + page.
    appDir: '.',
    page: 'index.html',
    // 16:9, like the footage frame. dpr defaults to 2 so zooms stay sharp.
    viewport: { width: 1600, height: 900 },
    // Each scene starts once this element has content.
    readySelector: '#app',
  },
  // `say` is the free macOS voice. Add `elevenlabs: '<voice id>'` or `openai: '<voice>'` only for a voice the
  // user named; otherwise the engine's .env picks the provider and voice.
  voice: { say: 'Samantha', rate: 175 },
  // Palette overrides in the app's own colours (keys: src/kit/theme.ts in the engine).
  theme: { accent: '#5fb385', accentDeep: '#2f6f4f' },
  style: { frame: 'mac', captions: 'pill', lowerThird: 'bar', background: 'glow-grid', transition: 'fade' },
  // The moment `poster` freezes for the README image: pick a settled frame that shows the app.
  poster: { atSec: 3 },
  scenes: [
    {
      id: 'intro',
      kind: 'animated',
      // The problem on the first sentence, the app's name on the second (scenes/ColdOpen.tsx).
      // To lead with the payoff instead, use 'Title': the name on the first sentence, the tagline on the second.
      component: 'ColdOpen',
      // Empty title: no lower third over the opening card.
      title: '',
      narration: 'Name the problem the viewer has today, in one sentence. My App fixes it: say how in one more.',
      leadInSec: 0.8,
    },
    {
      id: 'first-look',
      kind: 'footage',
      route: '',
      title: 'First look',
      narration: 'Say what the viewer is looking at, in the app’s own words. Then point at the part that matters.',
    },
    {
      id: 'key-action',
      kind: 'footage',
      route: '',
      title: 'The key action',
      narration: 'Show the one thing people come here to do, done for real. Then show the result it leaves behind.',
    },
    {
      id: 'outro',
      kind: 'animated',
      component: 'Outro',
      title: '',
      narration: 'First takeaway. Second takeaway. Third takeaway. That is My App.',
      leadInSec: 0.8,
      tailSec: 2.4,
    },
  ],
};
