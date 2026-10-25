# SIZZLE — automated explainer videos for your apps

[![Watch the 90-second explainer video](media/explainer-poster.jpg)](https://ericediger.github.io/sizzle/media/pipeline-explainer.mp4)

**[▶ Watch the 90-second explainer](https://ericediger.github.io/sizzle/media/pipeline-explainer.mp4)** · made with the pipeline itself: [`explainer/`](explainer/)

One command, run from an app's folder, turns its storyboard into a narrated, captioned product video plus a README poster:

```bash
cd "../FLIGHT DECK"
npm --prefix ../SIZZLE run build   # narrate → record → render → poster   ⇒ media/<id>-explainer.mp4, media/explainer-poster.jpg
```

## Or ask your coding agent: `/sizzle`

This repo is also a Claude Code plugin with one skill, `/sizzle`. In any web app's folder, ask your agent to
"make an explainer video of this app". It then:
- reads the app;
- writes `<app>/explainer/`: the storyboard, the recorder's moves and the animated scenes;
- shows you the narration and then the stills before rendering;
- delivers the video and poster to `<app>/media/`.

It finds this engine next to your apps or at `$SIZZLE_HOME`; if there is none, it offers to clone one to `~/.sizzle`.

```bash
/plugin install sizzle --marketplace ericediger/sizzle   # Claude Code 2.1.275 or later

/plugin marketplace add ericediger/sizzle                 # older Claude Code
/plugin install sizzle@sizzle

npx skills add https://github.com/ericediger/sizzle --skill sizzle   # Codex, Cursor, Copilot, Gemini CLI, opencode …
```

The skill only holds the instructions; the engine still runs on your machine. That needs:
- Node 20+ and python3, on macOS or Linux;
- a few hundred MB for packages and browsers;
- a narrator: an ElevenLabs or OpenAI key in the engine's `.env`, the Mac voice, or your own recordings.

Sessions opened in this repo pick the skill up from `.claude/skills/` and `.agents/skills/` without installing it.
The skill's source is [`skills/sizzle/`](skills/sizzle/); its starter project is
[`skills/sizzle/assets/starter/`](skills/sizzle/assets/starter/).

## The engine

This folder is the engine. It lives next to the apps it films (the examples call it `SIZZLE`; any name works),
and holds nothing that belongs to them. Each video's source lives with its app and is committed to the app's repo:

| What | Where | In git |
|------|-------|--------|
| The engine: `scripts/`, `src/` (the kit), `node_modules`, `.env` | `SIZZLE/` | this repo (not `.env`) |
| A video's source: storyboard, recorder choreography, scenes, music | `<app>/explainer/` | the app's repo |
| Narration clips, recorded footage, renders, stills | `SIZZLE/build/<id>/` | never: a cache, delete it to start over |
| The finished MP4 and poster | `<app>/media/` | the app's repo |

`render` and `poster` copy their result into the `media/` folder next to `explainer/`;
`npm run deliver` copies them again without re-rendering.

SIZZLE was called EXPLAINER before. Inside the apps the old names stay: the `explainer/` folder, the `@explainer/…`
imports, `EXPLAINER_PROJECT` and the `media/<id>-explainer.mp4` files. That's what they hold, and it keeps
existing videos working.

Which video a command works on: the app folder you ran it from (it finds `explainer/` there or above);
otherwise `--project=<app folder>` (or `EXPLAINER_PROJECT`), or `VIDEO=<id>` / `--video=<id>`, which looks the
id up among the apps next to this folder. `npm run projects` lists them. This folder's own video is the
`explainer/` project here (`VIDEO=pipeline`).

Everything is code. Change a line of narration, re-run, and the voiceover,
the footage pacing, the captions and the camera moves all follow.

## How it works

```
<app>/explainer/script.ts      the storyboard: scenes, narration, routes, caveats
        │
        ├─ npm run narrate     scripts/narrate.ts  → build/<id>/public/narration/*.mp3 + manifest.json
        │                      TTS: macOS `say` by default; ElevenLabs or OpenAI if a key is in .env.
        │                      Clips are cached by text hash, so only edited lines regenerate.
        │
        ├─ npm run record      scripts/record.ts   → build/<id>/public/footage/*.mp4 + cues.json
        │                      Playwright drives the real app (served locally) with a visible
        │                      cursor, click ripples and a spotlight, one clip per scene, paced to
        │                      the narration. Zoom "cues" (element rectangles + timestamps) are
        │                      written alongside so the camera moves are computed, not hand-keyed.
        │
        ├─ npm run render      scripts/render.ts   → build/<id>/<id>.mp4 → <app>/media/<id>-explainer.mp4
        │                      Remotion composes: themed motion-graphics background, the video's own
        │                      animated scenes (cold open, how-it-works diagram, outro), footage in
        │                      a browser frame with smooth zooms, lower-thirds, sentence captions,
        │                      narration audio, music bed ducked under the voice, progress bar.
        │
        └─ npm run poster      scripts/poster.ts   → build/<id>/<id>-poster.jpg → <app>/media/explainer-poster.jpg
                               One frame (spec.poster.atSec) with a play badge, for the README.

<app> is the folder that holds explainer/. Remotion bundles one project per run: remotion.config.ts maps
'@project' to <app>/explainer and '@explainer/…' to this folder, and serves build/<id>/public/ (the project's
own public/ plus the generated narration/ and footage/).
```

Useful extras:

```bash
npm run studio                 # Remotion Studio: live preview, scrub the timeline
npm run check                  # type-check the engine with this project before a long render
npm run record -- assistant    # re-record just one scene
npm run stills                 # one PNG per scene in build/<id>/stills/ for a quick visual check
npm run render -- --quality    # slower, higher-bitrate encode
npm run projects               # every <app>/explainer/ next to this folder, by id
```

From an app's folder, each is `npm --prefix ../SIZZLE run <script>`.

## Narration voices

| Provider       | How to enable                                                  | Quality                         |
|----------------|----------------------------------------------------------------|---------------------------------|
| macOS say      | default, offline, free                                         | fine for cutting; robotic       |
| ElevenLabs     | `ELEVENLABS_API_KEY` (+ optional `ELEVENLABS_VOICE_ID`)        | broadcast-grade                 |
| OpenAI         | `OPENAI_API_KEY` (+ optional `OPENAI_TTS_VOICE`)               | very good                       |
| Your own voice | put `<app>/explainer/voice/<scene-id>.wav` (or mp3/m4a) files | you                             |

Copy `.env.example` to `.env`, add a key, run `npm run narrate`. `TTS_PROVIDER` forces a choice.
The voice is per video: `voice.elevenlabs` (or `voice.openai`) in `script.ts` wins over the `.env` default.

**Recording it yourself.** Read each scene's narration from `script.ts` into one file per scene,
named by scene id (`cold-open.wav`, `home.wav`, …). With `ASSEMBLYAI_API_KEY` set, `npm run narrate`
transcribes each clip and stores word timestamps in the manifest, so captions and the animated
beats land on the words you actually said instead of a proportional estimate.

Pronunciation fixes go in a scene's `spoken` field; `narration` is what the captions show.

## Background music

Drop a track under `<app>/explainer/public/music/` and point the storyboard at it:

```ts
music: { file: 'music/ready-to-move.wav', volume: 0.22, duckTo: 0.07, fadeOutSec: 3 },
```

`volume` is the level between narration lines and `duckTo` the level while a line plays
(ramped over `duckRampSec`, default 0.6 s); the bed fades in at the start and out at the end.
The track must be at least as long as the video. Only the render step reads it, so
`npm run render` is enough after changing the track or the levels.

## Adding another app

Everything app-specific lives in one folder inside the app:

```
<app>/explainer/
├── script.ts      the storyboard: scenes, narration, routes, voice, theme, music, poster moment
├── record.ts      recorder choreography: one action per footage scene (click, spotlight, zoom cues)
├── scenes/        the animated scenes as React components (cold open, diagram, outro …)
├── index.ts       exports { spec, components } for Remotion
├── public/        files the video reads with staticFile(): music/, logos …
├── voice/         optional: your own narration, one file per scene
└── demo/          optional: a stage page for the recorder to film
```

1. Copy the starter, [`skills/sizzle/assets/starter/`](skills/sizzle/assets/starter/), into `<app>/explainer/`.
   Or copy the closest existing project instead (`npm run projects` lists them; week-prep's is the web-app
   example). Then set `id`, `name`, `repoUrl`, `demoUrl`, and `record`: a folder + page to serve
   (`appDir` is relative to the app folder, so `'.'` for a `demo.html` at the root), or `url` of a dev server
   you already started, plus the viewport, and `readySelector`: an element that appears once the page has its
   data (the app's root also holds its loading spinner).
   The clip is always the viewport's size, whatever `dpr` is, so zooms enlarge it. To keep zoomed text sharp, set
   `record: { viewport: { width: 2560, height: 1440 }, dpr: 1, zoom: 2 }`: the app lays out as at 1280×720 and is
   drawn twice as large (full-screen heights need dividing in `record.css`). A fixed-size stage can instead scale a
   wrapper with CSS `zoom`, as the Flight Deck stage (`FLIGHT DECK/explainer/demo/stage.html`) does, loading the
   extension's own files from the repo root. An app that needs its backend or real data is
   filmed from its own frontend built into a stage with a mocked API; see "A stage for an app with a backend" in
   [`skills/sizzle/references/recording.md`](skills/sizzle/references/recording.md).
2. Write the scenes in `script.ts`: `kind: 'animated'` scenes name a component; `kind: 'footage'`
   scenes name a hash route in the app. Narration is what the captions show; `spoken` fixes pronunciation.
3. Restyle: `theme` overrides any palette key (see `src/kit/theme.ts`) so the motion graphics echo
   the app; `style` picks a variant of each shared kit piece (see "Style presets" below);
   `voice.elevenlabs` picks the narrator; `music` adds a bed; `poster.atSec` picks the still.
4. Write `record.ts`: for each footage scene, drive the page with the `SceneRecorder` (`until`,
   `moveTo`, `click`, `type`, `select`, `spot`, `zoom`, `zoomUnion`, `eval`) paced to the narration length.
5. Rewrite or replace the components in `scenes/` and register them in `index.ts`. They import the kit as
   `@explainer/src/kit/…` and resolve `react` and `remotion` from this folder, so the app needs no packages.
   If the app has its own `tsconfig.json` or linter that covers the whole repo, exclude `explainer/` there.
6. From the app's folder: `npm --prefix "<engine>" run check`, then `run build` (`<engine>` is this folder).

Footage scenes are generic: anything the app can be driven to in a browser can be recorded.
For a native app, swap the Playwright recorder for a screen capture and hand-write the cues.

`explainer/` in this folder is the worked example of a project with no UI of its own (this pipeline): its
footage comes from a small stage page, `explainer/demo/stage.html`, that lays the real artifacts of another
video's run (storyboard, narration clips, recorded footage and cues, a rendered excerpt) next to a terminal;
that snapshot is not kept in the repo (`explainer/demo/assets/` and the outro's `explainer/public/posters/` are
gitignored), so snapshot a run there before re-recording. The terminal output is replayed, not re-run, and
each scene carries an on-screen note saying so.

## Style presets

Two videos on the same kit look like siblings unless the kit itself changes shape. `style` in the storyboard
picks a variant of each shared piece; every key is optional and the defaults reproduce the original look:

```ts
style: { frame: 'bare', captions: 'bar', lowerThird: 'chapter-card', background: 'paper', transition: 'slide' },
```

| Key          | Variants                                   | What changes                                                        |
|--------------|--------------------------------------------|---------------------------------------------------------------------|
| `frame`      | `mac` · `bare` · `window`                  | browser window with traffic lights · full-bleed hairline frame · floating tilted window |
| `captions`   | `pill` · `bar` · `none`                    | centred rounded box · full-width strip at the bottom · off          |
| `lowerThird` | `bar` · `chapter-card` · `none`            | numbered bar top-left · centred title card that settles into a label · off |
| `background` | `glow-grid` · `flat` · `mesh` · `paper`    | drifting grid with glows · plain gradient · slow gradient blobs · light sheet with grain |
| `transition` | `fade` · `slide` · `zoom-through`          | how one scene hands over to the next                                |

Pair `paper` with a light theme (`bg0`, `ink`, `muted`, `captionBg`, `captionInk` …) and `theme.display`
for a headline face; the INVEST-IGATOR video is the worked example of the inverse of week-prep's dark stage.

## Honesty notes baked into the week-prep video

- The public demo page has no API key, so the assistant's reply in the "Assistant" scene is a
  scripted stand-in injected by the recorder. The drawer, proposal cards and Apply logic are the
  app's real code, and the scene carries an on-screen note saying so.
- All data shown is the demo page's fictional sample week.

## Requirements

- Node 20+ and python3 (it serves static apps to the recorder). macOS or Linux; Windows is untested.
- `npm install`, then `npx playwright install chromium ffmpeg` once per machine. On a bare Linux machine,
  `npx playwright install-deps chromium` adds the system libraries Chromium needs.
- Google Chrome installed is preferred for recording (`RECORD_BROWSER=chrome|chromium|/path` overrides).
- On macOS without Playwright's own ffmpeg, `record` writes a small wrapper that runs Remotion's ffmpeg into
  Playwright's browser folder (`~/Library/Caches/ms-playwright/`, or `$PLAYWRIGHT_BROWSERS_PATH`). Set
  `PLAYWRIGHT_BROWSERS_PATH="<engine>/build/ms-playwright"` to keep it inside this folder.

Setting up on a new machine: bump every `remotion` / `@remotion/*` entry in `package.json` to the
current release before `npm install`; they must all match.

### Things that bit once

- Forcing `TTS_PROVIDER=elevenlabs` without a key makes `narrate` fail; leave it unset to auto-pick.
- A long render can occasionally time out with "waiting for the page to render ... frame N"; it is
  not deterministic. Re-run `npm run render` (narration and footage are cached).
- Remotion's bundled ffmpeg is a slim build without `volumedetect`, but it has `loudnorm`: `render` uses it to
  print the finished video's loudness, and to normalize it when the storyboard sets `loudness: { lufs: -16 }`.
- A failed `stills` or `render` can leave Remotion's headless Chrome running, and the next run then times out
  "trying to connect to the browser". Stop the leftover `chrome-headless-shell` processes under
  `node_modules/.remotion/` and run it again.

## License and credits

MIT, see [LICENSE](LICENSE). Videos are rendered with [Remotion](https://www.remotion.dev), which has its own
license. It is free for individuals, companies of up to three people and non-profits; larger companies need a
[company license](https://www.remotion.dev/license).

- **The music bed** in this repo's own video (`explainer/public/music/product-groove.mp3`) was generated with
  ElevenLabs by the author. You're welcome to use it under your own explainers.
- **The narrator** of that video is the author's own voice, cloned in ElevenLabs and shared in its Voice Library.
  It is the engine's default ElevenLabs voice. To use another, set `ELEVENLABS_VOICE_ID` in `.env` (or
  `voice.elevenlabs` per video). If your account can't reach it, add it from the Voice Library.
