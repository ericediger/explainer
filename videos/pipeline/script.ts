import type { VideoSpec } from '../../src/spec';

/**
 * Storyboard for the explainer of the EXPLAINER pipeline itself.
 *
 * The pipeline has no UI, so the footage comes from videos/pipeline/demo/stage.html: a small workbench page
 * that lays the real artifacts of one finished run (the week-prep video: its storyboard, narration clips and
 * manifest, recorded footage and cues, a rendered excerpt, the README it was published in) next to a terminal.
 * demo/assets/ is a committed snapshot of those files from 2026-10-13 (script.ts.txt keeps tsc away from it). The terminal replays each command's
 * real console format with the real numbers; nothing is re-run on camera, and every footage scene says so.
 *
 * The finished video lands in ../EXPLAINER/media/ (appFolder '.'), next to this project's README.
 * Edit the narration here and re-run `VIDEO=pipeline npm run build`.
 */
export const spec: VideoSpec = {
  id: 'pipeline',
  name: 'Explainer',
  fps: 30,
  width: 1920,
  height: 1080,
  // Private repo: no URLs on screen.
  repoUrl: '',
  // Shown in the browser frame's address bar: this is the page the recorder really serves.
  demoUrl: 'localhost:8911/stage.html',
  appFolder: '.',
  record: {
    appDir: 'videos/pipeline/demo',
    page: 'stage.html',
    viewport: { width: 1600, height: 900 },
    readySelector: '#stageReady',
  },
  voice: { say: 'Samantha', rate: 172, elevenlabs: 'G3qIj1Lb0GkRqMWsPD2C' },
  // A warm film-studio stage under a light workbench: vermilion accent, amber and blue as the supporting hues.
  // Told apart from its siblings by the floating window frame, chapter cards and the zoom-through transition.
  style: { frame: 'window', captions: 'bar', lowerThird: 'chapter-card', background: 'flat', transition: 'zoom-through' },
  theme: {
    bg0: '#100d0b',
    bg1: '#1d1713',
    panel: '#251e19',
    panel2: '#2f2620',
    line: '#40352b',
    ink: '#f7f1e7',
    muted: '#b3a798',
    accent: '#ff7a3d',
    accentDeep: '#d9561a',
    blue: '#86b6ff',
    warm: '#ffcf5c',
    red: '#ff6b81',
    violet: '#b9a0ff',
    glowA: '#4d2411',
    glowB: '#1a2a4d',
    grid: '#2c231c',
    display: '"SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif',
    captionBg: 'rgba(16,13,11,.86)',
    captionInk: '#fbf6ee',
  },
  poster: { atSec: 22 },
  music: { file: 'music/product-groove.mp3', volume: 0.22, duckTo: 0.07, fadeOutSec: 3 },
  scenes: [
    {
      id: 'cold-open',
      kind: 'animated',
      component: 'ColdOpen',
      title: 'The problem',
      narration:
        'Every app needs a demo video. Recording one is the easy part. Then a button moves, a word changes, and you record the whole thing again.',
      leadInSec: 0.8,
      tailSec: 1.0,
    },
    {
      id: 'how-it-works',
      kind: 'animated',
      component: 'HowItWorks',
      title: 'How it works',
      narration:
        'Explainer turns a storyboard into a finished video. One command, four steps: narrate, record, render, poster. The storyboard is a plain TypeScript file.',
      spoken:
        'Explainer turns a storyboard into a finished video. One command, four steps: narrate, record, render, poster. The storyboard is a plain Type Script file.',
      tailSec: 1.0,
    },
    {
      id: 'storyboard',
      kind: 'footage',
      route: 'storyboard',
      title: 'The storyboard',
      subtitle: 'script.ts',
      narration:
        'Each scene is a few lines: the words, the page to open, a caption. Change a sentence and the voice, the pacing, the captions and the camera moves all follow.',
      note: 'Workbench page built from the week-prep video’s real files. The terminal output is replayed, not re-run.',
    },
    {
      id: 'narrate',
      kind: 'footage',
      route: 'narrate',
      title: 'Narrate',
      subtitle: 'Step 1',
      narration:
        'Narration comes from ElevenLabs, OpenAI, the Mac voice, or your own recordings. Clips are cached by text, so only the lines you edit are generated again.',
      note: 'Workbench page built from the week-prep video’s real files. The terminal output is replayed, not re-run.',
    },
    {
      id: 'record',
      kind: 'footage',
      route: 'record',
      title: 'Record',
      subtitle: 'Step 2',
      narration:
        'Playwright drives the real app with a visible cursor and a spotlight. It notes where each zoom should land, so camera moves are computed, not keyframed.',
      note: 'Workbench page built from the week-prep video’s real files. The terminal output is replayed, not re-run.',
    },
    {
      id: 'render',
      kind: 'footage',
      route: 'render',
      title: 'Render',
      subtitle: 'Step 3',
      narration:
        'Remotion composes it: motion graphics in your app’s colors, footage in a browser frame, captions, and a music bed that ducks under the voice.',
      note: 'Workbench page built from the week-prep video’s real files. The terminal output is replayed, not re-run.',
    },
    {
      id: 'deliver',
      kind: 'footage',
      route: 'deliver',
      title: 'Deliver',
      subtitle: 'Step 4',
      narration:
        'The video and a poster frame land in the app’s own media folder, ready for the README. Edit a line, run it again, and the whole video is new.',
      note: 'Workbench page built from the week-prep video’s real files. The terminal output is replayed, not re-run.',
      tailSec: 1.1,
    },
    {
      id: 'outro',
      kind: 'animated',
      component: 'Outro',
      title: '',
      narration: 'Everything is code. Real footage of your real app. One command to redo it. And this video was made the same way.',
      leadInSec: 0.8,
      tailSec: 2.6,
    },
  ],
};
