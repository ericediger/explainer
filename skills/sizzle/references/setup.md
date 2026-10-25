# Engine setup and troubleshooting

## Requirements

- Node 20 or newer, git, and python3. python3 serves static apps to the recorder.
- macOS or Linux. Windows is untested.
- Several hundred MB of disk for the engine's packages and browsers.
- A narration source (see SKILL.md step 2).

## Installing

`node <skill-dir>/scripts/engine.mjs --install` does the following:

1. Clones `https://github.com/ericediger/sizzle` to `$SIZZLE_HOME`, or `~/.sizzle` when that isn't set.
2. Runs `npm ci` there.
3. Runs `npx playwright install chromium ffmpeg`: the browser and encoder the recorder uses.
4. Runs `npx remotion browser ensure`: the headless Chrome that renders.

To do it by hand, run the same four steps.

On a bare Linux machine, Chromium may also need system libraries. Running `npx playwright install-deps chromium` (with sudo) in the engine installs them. Ask the user before running anything with sudo.

For an engine that is already there, such as a clone the user made themselves:
- `node <skill-dir>/scripts/engine.mjs --setup` runs steps 2–4 in it.
- `--update` first pulls the latest engine, then does the same.

## Where things live

| Path | What | In git |
|---|---|---|
| `<engine>/` | The engine: `scripts/`, `src/` (the kit) | the engine's repo |
| `<engine>/.env` | Narration keys | never |
| `<engine>/build/<id>/` | Narration clips, footage, cues, stills, renders: a cache you can delete to start over | never |
| `<app>/explainer/` | The video's source: script.ts, record.ts, index.ts, scenes/, public/, voice/ | the app's repo |
| `<app>/media/` | The finished video and poster | the app's repo |

`.env` keys (see `<engine>/.env.example`):
- `TTS_PROVIDER`
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- `OPENAI_API_KEY`, `OPENAI_TTS_VOICE`
- `ASSEMBLYAI_API_KEY`

Variables already set in the shell win over the file.

## Other commands

Run each from `<app>` as `npm --prefix "<engine>" run <script>`:

| Script | Does |
|---|---|
| `studio` | Remotion Studio: live preview and a scrubbable timeline in the browser. |
| `deliver` | Copies the last render and poster into `<app>/media/` again. |
| `projects` | Lists `explainer/` projects in folders next to the engine. |
| `render -- --quality` | A slower, higher-bitrate encode. |

## When something fails

| Symptom | Fix |
|---|---|
| `Which video? …` | The command didn't start in `<app>`, or `<app>/explainer/` lacks `script.ts` or `index.ts`. Run it from `<app>`, or add `-- --project=<app>`. |
| `No narration manifest` | Run `narrate` before `record`. |
| `No element matches <sel>` | The selector doesn't exist on that page in that state. Check the route, what earlier steps of the action did, and that the app rendered. |
| A scene times out after 30 s in `waitForFunction`, right at its start | `readySelector` never got content. Set it to the app's real root element. |
| `Cannot find <page> in <dir>` | `record.appDir` is relative to `<app>`. The page may need a build step first. |
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
