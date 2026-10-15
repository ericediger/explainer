import type { VideoSpec } from '../../src/spec';

/**
 * Storyboard for the SpeakEasy explainer (github.com/ericediger/SPEAKEASY): a free Chrome extension that summarizes
 * an article and reads it aloud in the side panel with the user's own OpenAI key.
 * Footage comes from the app's own demo page, ../SPEAKEASY/demo/index.html: a Chrome-style window with a fictional
 * magazine article and the extension's REAL side panel and settings page (demo/app/ is a copy of the build, refreshed
 * with `npm run demo` in the app). demo/mocks.js stands in for chrome.* and the service worker and plays narration that
 * was pre-generated with SpeakEasy itself (demo/audio/). Edit the narration here and re-run `VIDEO=speakeasy npm run build`;
 * render and poster copy the finished MP4 and poster into ../SPEAKEASY/media/ (appFolder below).
 */
export const spec: VideoSpec = {
  id: 'speakeasy',
  name: 'SpeakEasy',
  fps: 30,
  width: 1920,
  height: 1080,
  repoUrl: 'github.com/ericediger/SPEAKEASY',
  demoUrl: 'ericediger.github.io/SPEAKEASY/demo/',
  appFolder: '../SPEAKEASY',
  record: {
    appDir: '../SPEAKEASY/demo',
    page: 'index.html',
    // The demo window is laid out at 1600x900 and drawn at 1.5x, so zooms into the side panel stay sharp.
    viewport: { width: 2400, height: 1350 },
    dpr: 1,
    readySelector: '#stageReady',
  },
  voice: { say: 'Samantha', rate: 172, elevenlabs: 'G3qIj1Lb0GkRqMWsPD2C' },
  // The side panel's own palette (near-black blues, mint accent, amber "generating" dot), with a full-width caption
  // bar, chapter cards and zoom-through transitions to set it apart from the other videos on this kit.
  style: { frame: 'bare', captions: 'bar', lowerThird: 'chapter-card', background: 'glow-grid', transition: 'zoom-through' },
  theme: {
    bg0: '#060810',
    bg1: '#0B0E14',
    panel: '#151A23',
    panel2: '#1C2230',
    line: '#252D3D',
    ink: '#EEF0F4',
    muted: '#8B93A5',
    accent: '#34D9A5',
    accentDeep: '#2BB88A',
    blue: '#7FB4F0',
    warm: '#F0C050',
    red: '#F87171',
    violet: '#B58CF0',
    glowA: '#0c2a26',
    glowB: '#0f1a33',
    grid: '#141b27',
    font: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    display: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
    mono: '"Geist Mono", "SF Mono", Menlo, Consolas, monospace',
    captionBg: 'rgba(6,8,16,.86)',
    captionInk: '#EEF0F4',
  },
  poster: { atSec: 53 },
  music: { file: 'music/feature-in-motion.mp3', volume: 0.22, duckTo: 0.07, fadeOutSec: 3 },
  scenes: [
    {
      id: 'cold-open',
      kind: 'animated',
      component: 'ColdOpen',
      title: 'The long read',
      narration:
        "Another long read you meant to get to. It's good. It's also two thousand words, and the afternoon is already spoken for. You could skim it. Or you could just press play.",
      leadInSec: 0.8,
      tailSec: 1.0,
    },
    {
      id: 'how-it-works',
      kind: 'animated',
      component: 'HowItWorks',
      title: 'How it works',
      narration:
        "SpeakEasy lives in Chrome's side panel. It lifts the text off the page, asks OpenAI for a summary at the length you choose, and has it read aloud in a voice you pick. Each segment is checked against the text before you hear it. Your key, your account, nothing in between.",
      tailSec: 1.1,
    },
    {
      id: 'open',
      kind: 'footage',
      route: 'open',
      title: 'Open it on any article',
      subtitle: 'Side panel',
      narration:
        "Here's an article. Click the SpeakEasy icon, and the side panel opens next to it: the title, the site, and how long each version would take to hear.",
      note: 'Demo page: a fictional article. The side panel is the extension’s real code.',
    },
    {
      id: 'listen',
      kind: 'footage',
      route: 'listen',
      title: 'Press play',
      subtitle: 'TL;DR',
      narration:
        'Pick TL;DR and press play. The summary is written, narrated and checked, usually in about fifteen seconds. Then it reads to you, with a timeline you can scrub and fifteen-second skips.',
      spoken:
        'Pick T L D R and press play. The summary is written, narrated and checked, usually in about fifteen seconds. Then it reads to you, with a timeline you can scrub and fifteen-second skips.',
      note: 'Demo page: the narration was pre-generated with SpeakEasy from this article; the wait is simulated.',
    },
    {
      id: 'modes',
      kind: 'footage',
      route: 'modes',
      title: 'Three lengths',
      subtitle: 'TL;DR · Medium · Full',
      narration:
        'Three lengths. TL;DR is about two minutes. Medium is about five. Full reads the whole article, word for word. Switch any time; each one is cached for a week.',
      spoken:
        'Three lengths. T L D R is about two minutes. Medium is about five. Full reads the whole article, word for word. Switch any time; each one is cached for a week.',
      note: 'Demo page: only the TL;DR narration is pre-generated.',
    },
    {
      id: 'voice',
      kind: 'footage',
      route: 'voice',
      title: 'Ten voices, six styles',
      subtitle: 'Voice · Style · Speed',
      narration:
        'Ten voices and six speaking styles, and you can change them mid-article. Pick Cedar, or a storytelling delivery, and the audio regenerates and keeps going. Speed runs from half to double.',
      note: 'Demo page: Marin and Cedar are pre-generated; other voices and styles are not available here.',
    },
    {
      id: 'persist',
      kind: 'footage',
      route: 'persist',
      title: 'Keeps playing while you browse',
      subtitle: 'Side panel',
      narration:
        "Because it's a side panel, the audio keeps playing while you browse. Open another tab, and SpeakEasy offers the new page instead of interrupting. One click, and it's reading that instead.",
      note: 'Demo page: two fictional articles; the wait is simulated.',
      tailSec: 1.1,
    },
    {
      id: 'setup',
      kind: 'footage',
      route: 'setup',
      title: 'Setup is one field',
      subtitle: 'Your OpenAI key',
      narration:
        'Setup is one field. Paste your OpenAI API key, validate, save. SpeakEasy talks to OpenAI directly from your browser, and a typical listen costs a few cents on your own account.',
      note: 'Demo page: the key is fictional and validation is simulated.',
    },
    {
      id: 'outro',
      kind: 'animated',
      component: 'Outro',
      title: '',
      narration:
        'Any article, read aloud, at the length you want. Ten voices, six styles, any speed. Your own OpenAI key, no account, no server. SpeakEasy. Free, on GitHub.',
      leadInSec: 0.8,
      tailSec: 2.6,
    },
  ],
};
