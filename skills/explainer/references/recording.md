# Recording: `record` in script.ts and `<app>/explainer/record.ts`

`npm --prefix "<engine>" run record` opens the app in headless Chromium, one fresh browser per footage scene, and runs that scene's action from `record.ts`. The action drives the page and leaves camera cues. Each clip is held until the scene's full length.

## Where the recorder points (`spec.record`)

| Field | Use |
|---|---|
| `appDir` + `page` | A static app. `appDir` (relative to `<app>`, e.g. `'.'` or `'dist'`) is served at `http://127.0.0.1:8911+/` with python3's http.server, and `page` is opened. A build step (`npm run build` into `dist/`) must have run first. |
| `url` | An app that is already being served, e.g. a dev server at `http://localhost:5173/`. Start it before recording and stop it after. |
| `viewport` | The page size in CSS pixels. Keep it 16:9 (1600 × 900 is the default; 1280 × 720 for small layouts) to match the footage frame. |
| `dpr` | Device pixel ratio, 2 by default, which keeps zooms sharp. Use 1 with an oversized viewport (see "Narrow UIs" below). |
| `readySelector` | The scene starts once this element has content. Default `#app`; set it to the app's root (`#root`, `main`, …). |

Each scene opens `<base>#<route>`, or the page as it is when `route` is `''`. The clip starts when the page is ready, so everything the action does is on camera.

## The action

```ts
import type { SceneAction } from '@explainer/scripts/lib/recorder';

const T = (narr: number, f: number): number => 0.6 + f * narr; // 0.6 = the scene's leadInSec

export const actions: Record<string, SceneAction> = {
  'add-habit': async (r, narr) => {
    await r.until(0.3);
    await r.zoom('#today', 24);
    await r.type('#new', 'Stretch for five minutes');
    await r.press('Enter');
    await r.until(T(narr, 0.6));
    await r.spot('#stats', 8);
    await r.until(T(narr, 1.0));
    await r.unspot();
    r.zoomReset();
  },
};
```

`narr` is the length of the scene's narration in seconds. Times are seconds since the page was ready. If a scene sets its own `leadInSec`, use that value in `T` instead of 0.6.

## SceneRecorder API (`r`)

| Call | Does |
|---|---|
| `await r.until(t)` | Waits until scene time `t`. If `t` has already passed, it returns at once. |
| `await r.wait(sec)` | Waits `sec` seconds. |
| `r.now()` | Seconds since the page was ready. |
| `await r.moveTo(target, { ms?, at? })` | Glides the visible cursor to a selector or a `{x, y}` point. `at: [fx, fy]` is the anchor inside the element (default the centre). |
| `await r.click(target, { at? })` | Moves there, shows a ripple and clicks. |
| `await r.type(sel, text, { cps? })` | Clicks into a field and types like a person (12 characters a second by default). |
| `await r.press(key)` | A key press, e.g. `'Enter'` or `'Escape'`. |
| `await r.scrollTo(sel, block?)` | Smooth-scrolls the element into view (`'center'` by default) and waits for it to settle. |
| `await r.spot(sel, pad?)` | Dims everything except the element. |
| `await r.unspot()` | Removes the spotlight. |
| `await r.zoom(sel, pad?)` | Camera cue: from now on, frame this element (with `pad` CSS px around it). |
| `await r.zoomUnion([sels], pad?)` | Camera cue: frame the box around several elements. |
| `r.zoomReset()` | Camera cue: back to the whole page. |
| `await r.eval(fnOrString)` | Runs JavaScript in the page. |
| `await r.rect(sel)` | The element's rectangle, in CSS px. |
| `r.p` | The Playwright `Page`, for anything else (`r.p.keyboard.type(...)`, `r.p.hover(...)`). |

## The camera

A zoom cue fits the padded rectangle into the frame, centres it and eases there over 0.8 s. The zoom stays between 1× and 2.4×, and it never shows anything outside the page.

- A region about two thirds of the viewport (around 1000 × 560 on a 1600 × 900 page) gives roughly 1.5×, which reads well.
- Cues are measured when you call them. Call `zoom` after a scroll or layout change has settled, not before.
- One move per idea, with a held frame of at least 1.5 s between moves.
- Don't zoom and spotlight different things at the same time.
- Reset before the scene ends, so the next scene starts wide.

## Pacing

- Hang each beat on the words it illustrates: `T(narr, 0.25)`, `T(narr, 0.5)` and so on.
- Typing and cursor glides take real time. Start them early enough to finish under the sentence that describes them.
- End the action by about `T(narr, 1.0) + 0.3`. The video shows each clip for `leadIn + narration + tail` seconds, so anything after that never appears. The recorder holds each clip 0.8 s longer than that, as a margin.

## State and data

- Each scene starts in a fresh browser context: empty localStorage, no cookies. Scenes never inherit each other's clicks.
- If a scene needs data, use the first that fits: the app's built-in sample data or demo mode (a query string or hash in `url`); creating it on camera at the start of the action; or a stage page.
- **A stage page** is a small page in `<app>/explainer/demo/` that loads the app's real components or styles with fictional data. Set `record.appDir: 'explainer/demo'`. The engine's own video does this; see `<engine>/explainer/demo/`.
- **Don't** call `r.p.goto()` or reload inside an action. A full navigation removes the cursor, ripple and spotlight overlays the recorder injected. Navigate with the app's own links, or for history-based routers with `r.eval(() => { history.pushState({}, '', '/settings'); dispatchEvent(new PopStateEvent('popstate')); })`.
- Never film real personal data, keys or internal URLs. Stage what you must, and say so in the scene's `note`.

## Logins

Prefer a page that needs no login: a demo mode, a stage page, or a local build with auth turned off. If the user insists on filming a logged-in app, ask them how to get a test account. Never use their real credentials in `record.ts`.

## Narrow UIs (side panels, mobile layouts)

Lay the page out at its natural size and draw it larger with CSS `zoom` inside a wrapper page in `explainer/demo/`. For example, a 400 px panel scaled up in a 2400 × 1350 viewport with `dpr: 1`. The camera then zooms in without blurring.

## Re-recording

- `npm --prefix "<engine>" run record -- <scene-id>` re-records one scene and keeps the others.
- Recording needs the narration first (`narrate`), because clip lengths come from it.
- `RECORD_BROWSER=chrome|chromium|/path/to/browser` picks the browser. By default it uses Google Chrome when installed, then Playwright's Chromium.
