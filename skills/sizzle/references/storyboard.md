# The storyboard: `<app>/explainer/script.ts`

`script.ts` exports `spec`, a `VideoSpec`. The types are defined in `<engine>/src/spec.ts`; this page explains how each field is used.

## VideoSpec

| Field | What it does |
|---|---|
| `id` | Short slug. Names the build folder (`<engine>/build/<id>/`), the video (`media/<id>-explainer.mp4`) and the Remotion composition. |
| `name` | The app's name. The starter's Title and Outro show it. |
| `fps` | 30. |
| `width`, `height` | Keep 1920 × 1080. The kit's layout is fixed to that size. |
| `repoUrl` | Not used by the kit. The starter's outro shows it when it's set. |
| `demoUrl` | Text in the browser frame's address bar on footage scenes. |
| `record` | How the recorder opens the app; see [recording.md](recording.md). |
| `voice` | `say` and `rate` are the macOS voice and its words per minute. `elevenlabs` is an ElevenLabs voice id and `openai` an OpenAI voice name; both are optional and win over `.env`. |
| `theme` | Overrides for the palette (below). |
| `style` | Which variant each kit piece uses (below). |
| `poster` | `{ atSec }`: the moment frozen as the README poster. |
| `music` | An optional music bed (below). |
| `scenes` | The scenes in order. |

## SceneSpec

| Field | What it does |
|---|---|
| `id` | Unique slug. Keys the narration clip, `record.ts`'s action and the stills' file names. |
| `kind` | `'animated'` draws a React component; `'footage'` films the app. |
| `component` | For animated scenes: a key in `index.ts`'s `components`. |
| `route` | For footage scenes: opened as `#<route>` on the record page. Use `''` to open the page as it is. |
| `title`, `subtitle` | The scene's on-screen title (the lower third). `title: ''` hides it, which suits openers and outros. |
| `narration` | What the voice says and the captions show. |
| `spoken` | Optional text for the voice instead of `narration`, for pronunciation fixes. Captions still show `narration`. |
| `note` | A small italic caveat under the footage frame, e.g. "Sample data. The reply is scripted." |
| `leadInSec` | Seconds of picture before the voice starts (default 0.6). |
| `tailSec` | Seconds held after the voice ends (default 0.9). Use 2–3 on the outro. |

## Timing

A scene's length is `leadInSec` + the length of its narration clip + `tailSec`. Nothing else sets it. The footage is recorded to that length, and the music ducks under each line.

Before `narrate` has run, the length is estimated at 2.75 words a second + 0.5 s, which is how `stills` and Studio preview an unvoiced cut.

## Captions

The narration is split into sentences: at `.`, `!` or `?` followed by a capital letter or an opening quote. Each sentence is shown on its own, timed by its share of the clip, or to the spoken words when a transcribed recording exists.

The pill caption is 1380 px wide at 30 px, about 80 characters a line. Keep sentences short enough for one or two lines.

`style.captions: 'none'` turns captions off. Leave them on: most people watch muted.

## Style presets (`style`)

| Key | Variants | Default |
|---|---|---|
| `frame` | `mac` (browser window), `bare` (full-bleed, hairline), `window` (floating, tilted) | `mac` |
| `captions` | `pill`, `bar` (full-width strip), `none` | `pill` |
| `lowerThird` | `bar` (numbered, top left), `chapter-card` (centred card that settles into a label), `none` | `bar` |
| `background` | `glow-grid`, `flat`, `mesh` (drifting blobs), `paper` (light sheet with grain) | `glow-grid` |
| `transition` | `fade`, `slide`, `zoom-through` | `fade` |

Two videos with the same style look like siblings, so vary it per app.

## Theme keys (`theme`)

| Keys | What they colour |
|---|---|
| `bg0`, `bg1` | The stage's gradient |
| `panel`, `panel2`, `line` | Cards, window chrome and hairlines |
| `ink`, `muted` | Text |
| `accent`, `accentDeep` | The app's brand colour: titles, the progress bar, the recorder's ripple |
| `blue`, `warm`, `red`, `violet` | Supporting colours |
| `glowA`, `glowB`, `grid` | The background's glows and grid |
| `captionBg`, `captionInk` | The caption box |
| `font`, `display`, `mono` | CSS font-family stacks; `display` is for headlines |

The defaults are a dark, neutral stage, so most apps only need `accent` and `accentDeep`.

A light look needs `background: 'paper'` plus light values for `bg0`, `bg1`, `panel`, `panel2`, `line`, `ink`, `muted`, `glowA` and `glowB`. Keep `captionBg` dark and `captionInk` light so captions stay readable.

Use colours as hex (`#rrggbb`): the starter scenes append alpha digits to `accent` for glows.

## Music (`music`)

Put a track in `<app>/explainer/public/music/` and point at it:

```ts
music: { file: 'music/bed.mp3', volume: 0.22, duckTo: 0.07, fadeOutSec: 3 },
```

- `volume` is the level between narration lines.
- `duckTo` is the level while a line plays, ramped over `duckRampSec` (default 0.6).
- `fadeInSec` and `fadeOutSec` default to 1.5 and 3.
- `startAtSec` skips into the track.
- The track must be at least as long as the video.

The engine ships one bed you may use: `<engine>/explainer/public/music/product-groove.mp3`, four minutes, generated with ElevenLabs and covered by the repo's MIT license. Copy it into the app's `public/music/`.

Leave music out when the user doesn't want it. Ask, rather than adding a track nobody chose.

## Poster (`poster.atSec`)

Pick a moment when a footage scene shows the app clearly: text settled, not mid-zoom, and no spotlight. The poster darkens the frame by about a quarter and puts a large play badge in the dead centre, so a spotlight frame comes out too dark. Choose a moment whose key content sits away from the centre.

Each still is taken at its scene's midpoint; `--late` at 78%. Use them to find scene times, then look at the result of `run poster`.

## Writing the narration

- Say what is on screen as it appears. Footage and words have to agree, because `record.ts` is paced to the words.
- Use the app's own names for things: its buttons, its sections, its nouns.
- One idea per scene; the title names it in two or three words.
- Use concrete verbs: "Type a habit and press Enter", not "Easily manage your habits".
- Don't use these: "seamless", "powerful", "streamline", "leverage", "unlock", "supercharge", "elevate".
- End on what the viewer can do next, or the app's one-line promise.
