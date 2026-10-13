import type { VideoSpec } from '../../src/spec';

/**
 * Storyboard for the INVEST-IGATOR explainer. The footage is recorded from a disposable demo server
 * (videos/invest-igator/demo/server.mjs) running the real app code on fictional companies with a
 * scripted stand-in for the OpenAI provider. Edit the narration here and re-run `VIDEO=invest-igator npm run build`.
 */
export const spec: VideoSpec = {
  id: 'invest-igator',
  name: 'INVEST-IGATOR',
  fps: 30,
  width: 1920,
  height: 1080,
  repoUrl: 'github.com/ericediger/INVEST-IGATOR',
  demoUrl: 'ericediger.github.io/INVEST-IGATOR/demo',
  record: {
    url: 'http://127.0.0.1:5198/',
    viewport: { width: 1600, height: 900 },
    readySelector: '#main',
  },
  voice: { say: 'Samantha', rate: 172, elevenlabs: 'G3qIj1Lb0GkRqMWsPD2C' },
  // The app's UI is dark, so the stage is the inverse: a warm paper sheet with the app's green, deepened for contrast,
  // and serif headlines. Footage runs full-bleed; titles are chapter cards; scenes slide.
  style: { frame: 'bare', captions: 'bar', lowerThird: 'chapter-card', background: 'paper', transition: 'slide' },
  theme: {
    bg0: '#f4f0e7',
    bg1: '#ebe6da',
    panel: '#fffdf8',
    panel2: '#f3efe6',
    line: '#d8d0bf',
    ink: '#16211b',
    muted: '#5e6a62',
    accent: '#1f8a57',
    accentDeep: '#145c3a',
    blue: '#2d6cb0',
    warm: '#b7791f',
    red: '#c2453a',
    violet: '#6b4fbb',
    glowA: '#e3ead9',
    glowB: '#e8e2d4',
    grid: '#e3ddd0',
    display: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    captionBg: 'rgba(22,33,27,.9)',
    captionInk: '#f4f0e7',
  },
  poster: { atSec: 44 },
  music: { file: 'music/product-groove.mp3', volume: 0.22, duckTo: 0.07, fadeOutSec: 3 },
  scenes: [
    {
      id: 'cold-open',
      kind: 'animated',
      component: 'ColdOpen',
      title: 'The problem',
      narration:
        'You hear about a company. A ticker on a podcast, a name in a newsletter. Then the research starts: filings, prices, estimates, twelve tabs deep. And none of it gets written down.',
      leadInSec: 0.8,
      tailSec: 1.2,
    },
    {
      id: 'how-it-works',
      kind: 'animated',
      component: 'HowItWorks',
      title: 'How it works',
      narration:
        'INVEST-IGATOR runs on your own machine. Type a name or a ticker. The app verifies the listing, pulls a dated price from the feeds, and sends the research to OpenAI with one rule: cite every claim. The company comes back filed as Watch, Research or Declined. Only you can mark it Invested.',
      spoken:
        'Invest-igator runs on your own machine. Type a name or a ticker. The app verifies the listing, pulls a dated price from the feeds, and sends the research to Open A I with one rule: cite every claim. The company comes back filed as Watch, Research or Declined. Only you can mark it Invested.',
      tailSec: 1.0,
    },
    {
      id: 'home',
      kind: 'footage',
      route: 'home',
      title: 'Built for scanning',
      subtitle: 'Home',
      narration:
        'Home is built for scanning. Invested and Watch are separate sections. Each row says what the company does, how it was filed and by whom, the line that supports it, and what would move it.',
      note: 'Fictional sample companies on a demo server; the research shown is a scripted stand-in for the OpenAI replies.',
    },
    {
      id: 'intake',
      kind: 'footage',
      route: 'home',
      title: 'Add a company by name or ticker',
      subtitle: 'Intake',
      narration:
        'Add a company by name or ticker. The assistant verifies the primary listing, adds it with a provenance note, and queues the research. When a name could mean two listed companies, it asks you instead of guessing.',
      note: 'Demo server: the listing checks and research replies are scripted. The intake, filing and queue are the real app code.',
      tailSec: 1.2,
    },
    {
      id: 'details',
      kind: 'footage',
      route: 'home',
      title: 'Dated figures, app-computed multiples',
      subtitle: 'Details',
      narration:
        'Open Details and the figures are there: the dated price with its source, the multiples the app computed itself, why the rating, and the triggers from the stored research. Nothing is invented. A number that was not found stays missing.',
      note: 'Fictional figures for demo companies.',
    },
    {
      id: 'assessment',
      kind: 'footage',
      route: 'home',
      title: 'Every claim cited',
      subtitle: 'Full research',
      narration:
        'Open the full research for the assessment itself: the recommendation, the evidence behind it, what challenges the case, and every source it cited. The model reports only what it can cite. The app does the arithmetic.',
      note: 'Scripted assessment with placeholder sources; the layout, citation checks and saving flow are the real app.',
      tailSec: 1.2,
    },
    {
      id: 'decide',
      kind: 'footage',
      route: 'home',
      title: 'The app files. You decide.',
      subtitle: 'Dispositions',
      narration:
        'The app files; you decide. Set a disposition yourself and it stays set. A newer assessment that disagrees is shown as a notice, never applied. Invested is yours alone: it records your entry date and price. It never places a trade.',
      note: 'Demo entry on a fictional company. Marking Invested records a decision; the app has no brokerage connection.',
      tailSec: 1.4,
    },
    {
      id: 'sector',
      kind: 'footage',
      route: 'analysis',
      title: 'A whole sector in one request',
      subtitle: 'Sector analysis',
      narration:
        'For a whole sector, one request discovers the listed companies, researches each one, collects a dated snapshot, and ranks them: thesis, valuation, risks, and comparison charts, all from the same cited figures.',
      note: 'Fictional sector with scripted research; the ranking and charts are computed by the app from the stored snapshots.',
      tailSec: 1.2,
    },
    {
      id: 'outro',
      kind: 'animated',
      component: 'Outro',
      title: '',
      narration:
        'Runs on your own machine; your data stays in one file. Every figure is dated and sourced, nothing is invented. It never trades, and only you mark a company Invested. INVEST-IGATOR. Open source on GitHub, with a live demo you can click through right now.',
      spoken:
        'Runs on your own machine; your data stays in one file. Every figure is dated and sourced, nothing is invented. It never trades, and only you mark a company Invested. Invest-igator. Open source on GitHub, with a live demo you can click through right now.',
      leadInSec: 0.8,
      tailSec: 2.5,
    },
  ],
};
