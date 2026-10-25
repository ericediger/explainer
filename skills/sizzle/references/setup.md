# Engine setup and troubleshooting

## Requirements

- Node 20 or newer, git, and python3. python3 serves static apps to the recorder, and on macOS `record` can also need it for its ffmpeg wrapper (see "Playwright's ffmpeg on macOS"). On a Mac without the Command Line Tools, `python3` is only a stub that offers to install them.
- macOS or Linux. Windows is untested.
- Several hundred MB of disk for the engine's packages and browsers.
- A narration source (see SKILL.md step 2).

## Installing

`node "<skill-dir>/scripts/engine.mjs" --install` does the following:

1. Clones `https://github.com/ericediger/sizzle` to `$SIZZLE_HOME`, or `~/.sizzle` when that isn't set.
2. Runs `npm ci` there.
3. Runs `npx playwright install chromium ffmpeg`: the browser and encoder the recorder uses.
4. Runs `npx remotion browser ensure`: the headless Chrome that renders.

To do it by hand, run the same four steps.

On a bare Linux machine, Chromium may also need system libraries. Running `npx playwright install-deps chromium` (with sudo) in the engine installs them. Ask the user before running anything with sudo.

For an engine that is already there, such as a clone the user made themselves:
- `node "<skill-dir>/scripts/engine.mjs" --setup` runs steps 2–4 in it.
- `--update` first pulls the latest engine, then does the same.

### Playwright's ffmpeg on macOS

Playwright records video with its own ffmpeg, which step 3 installs into Playwright's browser folder: `~/Library/Caches/ms-playwright/` on macOS, or `$PLAYWRIGHT_BROWSERS_PATH` when that is set. That folder is outside the engine.

On macOS, when that ffmpeg is missing (Playwright doesn't offer it for every macOS version, or step 3 never ran), `record` writes a small python3 wrapper at `<browsers folder>/ffmpeg-<rev>/ffmpeg-mac` that runs Remotion's bundled ffmpeg instead, and says so: `Bridged Playwright's ffmpeg to Remotion's build → <path>`. It writes it once and leaves a real Playwright ffmpeg alone. Every recording then runs that wrapper, so `python3` must be on the PATH.

To keep it inside the engine, for example when the user has asked that nothing be written outside the engine and the app, run `record` with `PLAYWRIGHT_BROWSERS_PATH="<engine>/build/ms-playwright"`. The wrapper then lands in the engine's cache. Recording still works with Google Chrome or Remotion's headless Chrome; only Playwright's own Chromium, the last fallback, would have to be installed in that folder too.

## Where things live

| Path | What | In git |
|---|---|---|
| `<engine>/` | The engine: `scripts/`, `src/` (the kit) | the engine's repo |
| `<engine>/.env` | Narration keys | never |
| `<engine>/build/<id>/` | Narration clips, footage, cues, stills (and their contact sheet), renders: a cache you can delete to start over | never |
| `<app>/explainer/` | The video's source: script.ts, record.ts, index.ts, scenes/, public/, voice/, demo/ | the app's repo |
| `<app>/explainer/demo/stage/` | A stage built from the app's frontend, when there is one | never: gitignore it |
| `<app>/media/` | The finished video and poster | the app's repo |
| `~/Library/Caches/ms-playwright/` (macOS) | Playwright's browsers and ffmpeg, or the engine's ffmpeg wrapper (see above) | never |

`.env` keys (see `<engine>/.env.example`):
- `TTS_PROVIDER`
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- `OPENAI_API_KEY`, `OPENAI_TTS_VOICE`
- `ASSEMBLYAI_API_KEY`

Variables already set in the shell win over the file.

Shell variables the engine reads (its folder was first called EXPLAINER, so some names still say so):
- `VIDEO=<id>` or `--video=<id>`: work on the project with that storyboard id, found next to the engine.
- `EXPLAINER_PROJECT=<path>` or `--project=<path>`: work on the project in that app folder.
- `EXPLAINER_APPS=<folder>`: where `projects` and `VIDEO` look for apps (default: the folder that holds the engine).
- `RECORD_BROWSER=chrome|chromium|<path>`: the browser `record` films with.
- `PLAYWRIGHT_BROWSERS_PATH=<folder>`: Playwright's browser folder (see "Playwright's ffmpeg on macOS").

## Other commands

Run each from `<app>` as `npm --prefix "<engine>" run <script>`:

| Script | Does |
|---|---|
| `studio` | Remotion Studio: live preview and a scrubbable timeline in the browser. |
| `deliver` | Copies the last render and poster into `<app>/media/` again. |
| `projects` | Lists `explainer/` projects in folders next to the engine. |
| `render -- --quality` | A slower, higher-bitrate encode. |

`render` prints the finished video's length, resolution and loudness. To measure anything else, use Remotion's bundled ffprobe, since macOS has no `ffprobe` of its own. Run it from the engine folder; from anywhere else it prints a warning about the project's root directory:

```bash
cd "<engine>" && ./node_modules/.bin/remotion ffprobe -v error -show_entries format=duration -of csv=p=0 "<app>/media/<id>-explainer.mp4"
```

Its ffmpeg is a slim build: no `volumedetect`, no raw video or PCM muxers, but it has `loudnorm` (loudness), `scale`, the `avi` and `wav` muxers, and the `rawvideo` and `pcm_s16le` encoders. To read audio samples, decode to a WAV (`-c:a pcm_s16le out.wav`); to read frames, encode to an uncompressed AVI (`-c:v rawvideo -pix_fmt gray out.avi`).

Recorded clips are always 25 frames a second: Playwright repeats the last frame when Chrome sends none, so a clip's frame count can't show dropped frames. To compare two recordings, count how many frames are unchanged from the one before; a much higher share in the new one means Chrome is skipping frames (for example with a viewport too large for the machine).

## When something fails

| Symptom | Fix |
|---|---|
| `Which video? …` | The command didn't start in `<app>`, or `<app>/explainer/` lacks `script.ts` or `index.ts`. Run it from `<app>`, or add `-- --project=<app>`. |
| `No narration manifest` | Run `narrate` before `record`. |
| `No element matches <sel>` | The selector doesn't exist on that page in that state. Check the route, what earlier steps of the action did, and that the app rendered. Icon classes change between versions of an icon set (`lucide-check-circle` vs `lucide-circle-check`): read them from the DOM. Scenes recorded before the failing one are kept; re-record from the failing one on. |
| A scene times out after 30 s in `waitForFunction`, right at its start | `readySelector` never got content. Set it to the app's real root element. |
| `Cannot find <page> in <dir>` | `record.appDir` is relative to `<app>`. The page may need a build step first. |
| Building a stage from the app's frontend fails with `Cannot find module @rollup/rollup-darwin-arm64` (or another platform's native module) | The app's `node_modules` was installed on another CPU, e.g. an Intel install on an Apple Silicon Mac. Reinstalling the app's packages fixes it (ask the user first). Without a reinstall, a universal Node runs the build as Intel under Rosetta: `arch -x86_64 node <app>/frontend/node_modules/.bin/vite build …` (check with `file "$(which node)"`). |
| `stills` or `render` stops with `delayRender() "Waiting for root component to load …" was called but not cleared after 28000ms` | Seen once on macOS, with the engine on an external disk, on the first Remotion run of the session; the cause wasn't pinned down. Run the command again. If the next run can't connect to the browser, see the next row. |
| `Timed out after 25000 ms while trying to connect to the browser!` | Headless Chrome processes left over from a failed run. List them with `pgrep -fl chrome-headless-shell`, stop the ones under `<engine>/node_modules/.remotion/` (`kill <pid> …`), then run the command again. Leave the user's own Chrome and other tools' browsers alone. |
| Playwright: `Executable doesn't exist … ffmpeg` or `… chromium` | Run `npx playwright install chromium ffmpeg` in the engine. |
| Remotion can't download its browser | Run `npx remotion browser ensure` in the engine on a network that reaches remotion.media or storage.googleapis.com. |
| `ElevenLabs 401` | Wrong key. |
| `ElevenLabs 404`, or voice not found | The voice id isn't on this account. Remove `voice.elevenlabs` or use one of the user's voices. |
| Forcing `TTS_PROVIDER=elevenlabs` fails | The key is missing. Leave `TTS_PROVIDER` unset to auto-pick. |
| `say: command not found` | Not a Mac, and there's no key or recording. Pick another voice. |
| A render times out "waiting for the page to render … frame N" | Not deterministic. Run `render` again; narration and footage are cached. |
| Type errors in `explainer/` from the app's own tooling | Exclude `explainer/` there. Only the engine's `check` should type-check it. |
| A scene shows "Footage not recorded yet" | Run `record -- <scene-id>`. A new footage scene has no clip until it's recorded. |

## Licenses

The engine is MIT. It renders with Remotion, which is free for individuals, for-profit companies with up to 3 employees, and non-profits. Larger companies need a Remotion company license (remotion.dev/license). Mention this when a user says they're making the video for a company.
