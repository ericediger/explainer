---
name: sizzle
description: Make a narrated, captioned explainer video of the web app in the current project. Real footage of the running app is recorded with Playwright (visible cursor, clicks, spotlight, computed camera zooms). Narration comes from ElevenLabs, OpenAI, the macOS voice or the user's own recordings. Remotion adds animated title and outro scenes in the app's colours, then renders the video and a README poster. The video is code in <app>/explainer/, so an edited line and a re-run make a new video. Use when someone says "/sizzle", "make an explainer video", "make a demo video of this app", "make a sizzle reel", "record a walkthrough", or asks to update or re-render an existing explainer/ video.
---

# /sizzle

Turn the web app in this project into a one-to-two-minute explainer video: real footage of the running app, a narrator, captions, animated scenes in the app's colours, and a poster image for the README.

The video's source is plain TypeScript in `<app>/explainer/` and is committed with the app. A shared engine, which lives outside the app, narrates, records and renders it.

- `<skill-dir>`: the folder holding this file. Claude Code prints it as "Base directory for this skill"; elsewhere it is wherever the skill was installed. Don't guess it.
- `<app>`: the root of the project the video is about.
- `<engine>`: the SIZZLE engine folder from step 1.

**New video or an edit?** If `<app>/explainer/script.ts` already exists, this is an edit. Read `script.ts`, `record.ts` and `scenes/`, change only what was asked, then re-run what the change touches (the table in step 7). Otherwise do steps 1 to 8.

## 1. Find the engine

From `<app>`, run:

```bash
node "<skill-dir>/scripts/engine.mjs"
```

It prints the engine folder. If it finds none, tell the user what installing does and ask before running it: it clones github.com/ericediger/sizzle to `~/.sizzle` and installs its packages and browsers (several hundred MB, a few minutes). On a yes:

```bash
node "<skill-dir>/scripts/engine.mjs" --install            # or --dir="<path>" for a location they choose
```

If they choose a location, tell them to set `SIZZLE_HOME` to it so later runs find it. When it says packages aren't installed, run it again with `--setup`.

Every engine command in this skill runs **from `<app>`**, in this form:

```bash
npm --prefix "<engine>" run <script>
```

The engine finds `<app>/explainer/` from the folder the command is started in. Don't `cd` into the engine to run them. App and engine paths often contain spaces, so always quote them.

## 2. Settle the voice (ask once)

Read `<engine>/.env`, if it exists, to see which keys are set. Check for names only; never print or repeat a key's value.

| Voice | What it needs |
|---|---|
| ElevenLabs | `ELEVENLABS_API_KEY` in `<engine>/.env`; optional `ELEVENLABS_VOICE_ID` sets their default voice |
| OpenAI | `OPENAI_API_KEY`; optional `OPENAI_TTS_VOICE` |
| macOS voice | A Mac. Free and offline, but robotic: fine for drafts |
| Their own recordings | One file per scene at `<app>/explainer/voice/<scene-id>.wav` (or mp3/m4a), read from the narration. An optional `ASSEMBLYAI_API_KEY` times captions to the words they actually said |

The engine picks the first available, in this order: own recordings, ElevenLabs key, OpenAI key, macOS voice. `TTS_PROVIDER` in `.env` forces one.

- **Keys:** they go in `<engine>/.env` only, never in the app's repo. If the user pastes a key into the chat, write it to that file and don't repeat it.
- **No voice available:** off a Mac, with no key and no recordings, there is nothing to narrate with. Ask for a key or recordings before going on.
- **Default voice:** without a voice id set, the engine narrates with its author's voice, which is shared in the ElevenLabs Voice Library. If `narrate` fails on it with a voice error, the user's account can't reach it yet. They can add it from the Voice Library, or set `ELEVENLABS_VOICE_ID` to one of their own voices.
- **Voice ids:** never copy an ElevenLabs voice id from another project. Most cloned voices are private to the account that made them. Set `voice.elevenlabs` only to an id the user gives you.
- **Own recordings:** they come after the narration is signed off (step 4) and before `narrate`. Give the user the exact lines to read, one file per scene. A line changed later means re-recording that scene's file.

## 3. Inspect the app

Read the project before writing anything:

- **How it runs.** A static page (an `index.html`) is served by the engine itself: set `record.appDir` and `record.page`. An app behind a dev server (`npm run dev` and the like) needs the server running during `record`: set `record.url`, then start it yourself in the background or ask the user to.
- **Its screens.** Hash routes map straight to a scene's `route`. For other routing, get there in `record.ts` by clicking the app's own navigation.
- **The happy path:** entry, then the key action, then the result. That is the spine of the video.
- **Its look:** the exact colours (CSS variables, the theme file) and fonts. They become `spec.theme`.
- **Selectors** for everything you will click, spotlight or zoom to: ids, `data-*` attributes, stable class names.
- **What's on screen.** Never film secrets, API keys, real customer names, emails or other personal data. Use the app's demo or sample data, or create fictional data on camera, and add a scene `note` whenever something is staged.

Then answer these before planning. What is it, in one sentence? Who is it for? What is the one thing it does best? Which three or four moments show that? What should a viewer do after watching?

## 4. Write the storyboard

If `<app>/explainer/` doesn't exist yet, copy the starter:

```bash
cp -r "<skill-dir>/assets/starter" "<app>/explainer"
```

Then edit `<app>/explainer/script.ts`. Every field is described in [references/storyboard.md](references/storyboard.md).

- **Shape:** an animated opener, then 3–6 footage scenes along the happy path (one idea each), then an animated outro. Aim for 60–120 seconds. With each scene's lead-in and hold counted, the finished video runs about 2 words a second, so that is roughly 120–240 words in total.
- **Narration:** 1–3 short sentences per scene, each under about 15 words, so a caption fits on one or two lines. Say what the viewer is seeing, in the app's own words. No generic SaaS phrasing ("streamline your workflow" is banned).
- **The hook:** the opener's first sentence decides whether anyone keeps watching. It should name the problem or the payoff, not the tech stack.
- **Captions** show `narration` word for word. Put pronunciation fixes in `spoken` (for example "Type Script").
- **Staged content:** anything staged gets a `note` (a fake reply, seeded data, a mocked service).
- **Fixed fields:** keep `width: 1920, height: 1080`; the kit is laid out for that size. `id` is a short slug.
- **Theme:** take `theme.accent` and `theme.accentDeep` from the app's colours. For a light app, consider the `paper` background with a light theme (see the reference).

Show the user the scene list with each scene's narration and get a yes before recording. The words set the timing of everything after them.

## 5. Choreograph the footage

Write one action per footage scene in `<app>/explainer/record.ts`. The recorder's API and the camera rules are in [references/recording.md](references/recording.md).

- **Pace each beat to its words:** `await r.until(T(narr, 0.4))` waits until 40% of the line has been spoken.
- **Move the camera with the narration.** Zoom to the region the sentence talks about, and `zoomReset()` before moving on.
- **Spotlight** the thing the sentence names. Click and type like a person would.
- **Every selector must exist** on that page in that state, otherwise the recorder stops with `no element matches`.
- **Scenes don't share state.** Each one starts in a fresh browser, so a scene that needs data creates it on camera, or the page provides it (see the reference).

## 6. Animated scenes

The starter's `Title` and `Outro` work once their constants are filled in (`TAGLINE`, `POINTS`). Replace or add scenes where the app deserves more, such as a cold open that shows the problem it solves, or a diagram of how it works. The rules for writing them are in [references/scenes.md](references/scenes.md). Register every component in `index.ts` under the name the scene's `component` uses.

## 7. Build, look, fix

Run these in order from `<app>`:

1. `npm --prefix "<engine>" run check`: a type-check. Fix every error before anything slow.
2. `npm --prefix "<engine>" run narrate`: one clip per scene, with measured lengths. Only changed lines are regenerated.
3. `npm --prefix "<engine>" run record`. To redo one scene: `run record -- <scene-id>`. If it reports beats running late, the moves before them take longer than the words allow. Start those moves earlier in `record.ts` and re-record the scene.
4. `npm --prefix "<engine>" run stills` writes `<nn>-<scene>.png` at each scene's midpoint. `run stills -- --late` writes `<nn>-<scene>-late.png` at 78% through. Put scene ids after `--` to render only those scenes. Look at every PNG in `<engine>/build/<id>/stills/`. Check for:
   - text that overflows or collides with the captions or the scene title;
   - a zoom that lands on the wrong thing;
   - footage showing "not recorded yet";
   - a blank page, or an unreadable colour.

   Fix the problem and re-run the step that produces it.
5. Show the user the stills and get a go-ahead. The full render takes minutes.
6. `npm --prefix "<engine>" run render`, then `run poster`. `run build` does narrate, record, render and poster in one go.

After an edit, re-run only what the change touches:

| Changed | Re-run |
|---|---|
| A scene's narration or `spoken` | With own recordings, re-record that scene's file first. Then narrate, record (footage follows the narration's length), render, poster |
| `record.ts` | record (`-- <scene-id>`), render, poster |
| `scenes/`, `theme`, `style`, titles | stills to check, then render, poster |
| `music` | render |
| `poster.atSec` | poster |

## 8. Deliver

The engine copies the results into the app:

- `<app>/media/<id>-explainer.mp4`: the video.
- `<app>/media/explainer-poster.jpg`: the poster, with a play badge.

If the app is a git repo, commit `<app>/explainer/` and `<app>/media/` (ask first if the user hasn't asked you to commit). If it isn't, tell the user these two folders are the ones to keep. The engine's `build/<id>/` is a cache and never goes in git.

If the app has a tsconfig, linter or test runner that covers the whole repo, exclude `explainer/` from it. Its imports (`@explainer/…`, `remotion`) resolve only inside the engine.

Tell the user:
- where the video and poster are;
- how long the video runs;
- which voice narrated it;
- that they can change any line, re-record one scene, or restyle it.

Offer a README snippet:

```md
[![Watch the explainer](media/explainer-poster.jpg)](media/<id>-explainer.mp4)
```

Setup details, platform notes and fixes for known errors are in [references/setup.md](references/setup.md).
