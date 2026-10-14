/**
 * Shared types for an explainer video. A video is described declaratively in
 * `videos/<id>/script.ts`; the narrate/record/render scripts and the Remotion
 * compositions all read the same spec.
 */
import type { Theme } from './kit/theme';

export type SceneKind = 'animated' | 'footage';

export type SceneSpec = {
  id: string;
  kind: SceneKind;
  /** Registry key of the React component that draws an animated scene. */
  component?: string;
  /** Hash route to open in the recorded app (footage scenes). */
  route?: string;
  /** Lower-third text. */
  title: string;
  subtitle?: string;
  /** Narration as shown in captions. */
  narration: string;
  /** Alternate text handed to the TTS engine (pronunciation fixes). */
  spoken?: string;
  /** Small caveat chip, e.g. when a reply on screen is staged. */
  note?: string;
  /** Seconds of visuals before narration starts (default 0.6). */
  leadInSec?: number;
  /** Seconds to hold after narration ends (default 0.9). */
  tailSec?: number;
};

export type VideoSpec = {
  id: string;
  name: string;
  fps: number;
  width: number;
  height: number;
  repoUrl: string;
  demoUrl: string;
  record: {
    /** Folder served to the recorder over http, relative to the EXPLAINER project root. */
    appDir?: string;
    /** Page inside appDir to open. */
    page?: string;
    /** Instead of appDir/page: a page that is already being served (a dev server you started), e.g. http://localhost:5173/demo. */
    url?: string;
    viewport: { width: number; height: number };
    /** Device pixel ratio while recording (default 2). Use 1 for an oversized viewport (e.g. a 2400x1350 page drawn with CSS zoom). */
    dpr?: number;
    /** CSS selector of the element that must have rendered content before a scene starts (default `#app`). */
    readySelector?: string;
  };
  voice: {
    /** macOS `say` voice and words-per-minute (the free, offline fallback). */
    say: string;
    rate: number;
    /** ElevenLabs voice id for this video; falls back to ELEVENLABS_VOICE_ID in .env. */
    elevenlabs?: string;
    /** OpenAI TTS voice name; falls back to OPENAI_TTS_VOICE in .env. */
    openai?: string;
  };
  /** Palette overrides for the motion graphics (see src/kit/theme.ts for the keys). */
  theme?: Partial<Theme>;
  /** Look of the shared kit pieces (frame, captions, titles, background, transitions). Defaults reproduce the original look. */
  style?: StyleSpec;
  /** Which moment `npm run poster` freezes for the README poster frame. */
  poster?: { atSec: number };
  /** Optional music bed under the whole video, ducked while narration plays. */
  music?: MusicSpec;
  scenes: SceneSpec[];
};

/** Each key picks a variant of one kit component; omit a key to keep the default. */
export type StyleSpec = {
  /** How footage is framed: a Mac-style browser window, full-bleed with a hairline, or a floating tilted window. */
  frame?: 'mac' | 'bare' | 'window';
  /** Caption treatment: a centred pill, a full-width strip, or none. */
  captions?: 'pill' | 'bar' | 'none';
  /** Scene titles: the numbered bar top-left, a centred chapter card that settles into a small label, or none. */
  lowerThird?: 'bar' | 'chapter-card' | 'none';
  /** Stage behind everything. */
  background?: 'glow-grid' | 'flat' | 'mesh' | 'paper';
  /** How scenes hand over. */
  transition?: 'fade' | 'slide' | 'zoom-through';
};

export type MusicSpec = {
  /** Path under public/<video>/, e.g. 'music/track.wav'. Must be at least as long as the video. */
  file: string;
  /** Level between narration lines, 0..1 (default 0.3). */
  volume?: number;
  /** Level while narration plays (default volume * 0.35). */
  duckTo?: number;
  /** Seconds to ramp between the two levels (default 0.6). */
  duckRampSec?: number;
  /** Fade in at the start / out at the end, seconds (defaults 1.5 / 3). */
  fadeInSec?: number;
  fadeOutSec?: number;
  /** Seconds into the track to begin (default 0). */
  startAtSec?: number;
};

export type WordTime = { text: string; start: number; end: number }; // seconds from clip start

export type NarrationManifest = {
  video: string;
  provider: string;
  voice: string;
  generatedAt: string;
  scenes: { id: string; file: string; durationSec: number; text: string; spoken: string; hash: string; words?: WordTime[] }[];
};

export type Rect = { x: number; y: number; w: number; h: number };
export type Cue = { t: number; kind: 'zoom' | 'reset'; rect?: Rect; pad?: number };

export type Footage = {
  id: string;
  /** Path under public/<video>/ */
  file: string;
  durationSec: number;
  /** Seconds into the clip at which the page was ready; scene time 0. */
  readyAt: number;
  width: number;
  height: number;
  /** CSS pixel size of the recorded viewport (cue rects are in these units). */
  cssWidth: number;
  cssHeight: number;
  cues: Cue[];
};

export type CuesFile = {
  video: string;
  generatedAt: string;
  viewport: { width: number; height: number };
  scenes: Record<string, Footage>;
};
