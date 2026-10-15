import type { VideoSpec } from '../../src/spec';

/**
 * Storyboard for the Flight Deck explainer (the public, unbranded build: github.com/ericediger/flight-deck).
 * Footage comes from videos/flight-deck/demo/stage.html: a Chrome-style window with a fictional inbox and
 * the extension's real side panel (demo/app/ is gitignored and holds symlinks to sidepanel.* and icons/ in
 * ../FLIGHT DECK, so the footage always films the current build). mocks.js answers the Anthropic, SerpApi
 * and OpenAI calls with fictional PHL trips. Edit the narration here and re-run `VIDEO=flight-deck npm run build`;
 * render and poster copy the finished MP4 and poster into ../FLIGHT DECK/media/ (appFolder below).
 */
export const spec: VideoSpec = {
  id: 'flight-deck',
  name: 'Flight Deck',
  fps: 30,
  width: 1920,
  height: 1080,
  // Public repo, shown in the outro. No hosted demo page (yet).
  repoUrl: 'github.com/ericediger/flight-deck',
  demoUrl: '',
  appFolder: '../FLIGHT DECK',
  record: {
    appDir: 'videos/flight-deck/demo',
    page: 'stage.html',
    // The stage is laid out at 1600x900 and drawn at 1.5x, so zooms into the side panel stay sharp.
    viewport: { width: 2400, height: 1350 },
    dpr: 1,
    readySelector: '#stageReady',
  },
  voice: { say: 'Samantha', rate: 172, elevenlabs: 'G3qIj1Lb0GkRqMWsPD2C' },
  // The app's own palette (dark blue, blue accent, green and magenta from its take and price bars), set apart by the
  // runway grid, full-width caption bar, slide transitions and Avenir headlines.
  style: { frame: 'bare', captions: 'bar', lowerThird: 'bar', background: 'glow-grid', transition: 'slide' },
  theme: {
    bg0: '#00202c',
    bg1: '#003043',
    panel: '#063a50',
    panel2: '#0b4660',
    line: '#1a5873',
    ink: '#f2f8fb',
    muted: '#93b4c4',
    accent: '#008AC9',
    accentDeep: '#006a9c',
    blue: '#4cb7e9',
    warm: '#75C044',
    red: '#E03288',
    violet: '#E03288',
    glowA: '#00577d',
    glowB: '#3d1238',
    grid: '#0e4258',
    font: 'Arial, Helvetica, sans-serif',
    display: '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
    captionBg: 'rgba(0,26,37,.84)',
    captionInk: '#ffffff',
  },
  poster: { atSec: 39.4 },
  music: { file: 'music/product-groove.mp3', volume: 0.22, duckTo: 0.07, fadeOutSec: 3 },
  scenes: [
    {
      id: 'cold-open',
      kind: 'animated',
      component: 'ColdOpen',
      title: 'The question',
      narration:
        "Friday in Austin, back Sunday night. Simple question: what’s flying? Usually that means a fare site, carrier filters and a stack of tabs. Then you jot down flight numbers just to find them again when you book.",
      leadInSec: 0.8,
      tailSec: 1.0,
    },
    {
      id: 'how-it-works',
      kind: 'animated',
      component: 'HowItWorks',
      title: 'How it works',
      narration:
        "Flight Deck lives in Chrome’s side panel. Type or say what you need. Claude turns it into a precise search. Live Google Flights fares come back for Delta, United and American. And a quick take tells you which one to pick.",
      tailSec: 1.1,
    },
    {
      id: 'ask',
      kind: 'footage',
      route: 'ask',
      title: "Ask the way you’d say it",
      subtitle: 'Search',
      narration:
        "Open it next to whatever you’re working on, and ask the way you’d say it. It reads the route, the dates and the class. It shows you exactly what it understood, then searches.",
      note: 'Demo stage: fictional trips, fares and replies. The side panel is the extension’s real code.',
    },
    {
      id: 'take',
      kind: 'footage',
      route: 'take',
      title: 'The quick take',
      subtitle: 'Results',
      narration:
        "Results come back ranked, with Google’s price insight. Then the quick take: the pick, the trade-off, and whether the price is good. Sort by cheapest or fastest in one click.",
      note: 'Demo stage: fictional fares; the take is a scripted stand-in for Claude’s reply.',
    },
    {
      id: 'voice',
      kind: 'footage',
      route: 'voice',
      title: 'Or just say it',
      subtitle: 'Voice',
      narration:
        "Rather talk? Tap the mic and say it. Mention an airline and the filters follow. With voice on, the quick take is read aloud too.",
      note: 'Demo stage: the microphone, transcription and spoken reply are simulated.',
    },
    {
      id: 'clarify',
      kind: 'footage',
      route: 'clarify',
      title: 'One question, only when needed',
      subtitle: 'Follow-ups',
      narration:
        "If something’s missing, it asks just one question. Answer in a few words, typed or spoken. It keeps the rest of the conversation. The reset button starts fresh.",
      note: 'Demo stage: fictional trip; the parses are scripted.',
    },
    {
      id: 'explore',
      kind: 'footage',
      route: 'explore',
      title: 'Questions, not just searches',
      subtitle: 'Explore',
      narration:
        'Not every question is a booking. Ask whether a route runs daily. It samples real days in both directions, then answers in plain English. The days it checked are one click away.',
      note: 'Demo stage: sampled days, fares and the assessment are fictional.',
      tailSec: 1.1,
    },
    {
      id: 'book',
      kind: 'footage',
      route: 'book',
      title: 'Pick, pin, book',
      subtitle: 'Booking',
      narration:
        'When you’re ready, pick an outbound, then a return. Your picks pin to a trip summary with the total. Book This Trip opens the same search on Google Flights. The summary stays put while you book.',
      note: 'Demo stage: the new tab is a placeholder; Google Flights itself is not shown.',
      tailSec: 1.2,
    },
    {
      id: 'outro',
      kind: 'animated',
      component: 'Outro',
      title: '',
      narration:
        "Plain English or your voice. Live fares on Delta, United and American. Picks that stay in view while you book. Flight Deck: open source on GitHub. Bring your own keys.",
      leadInSec: 0.8,
      tailSec: 2.6,
    },
  ],
};
