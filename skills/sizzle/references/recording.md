# Recording: `record` in script.ts and `<app>/explainer/record.ts`

`npm --prefix "<engine>" run record` opens the app in headless Chromium, one fresh browser per footage scene, and runs that scene's action from `record.ts`. The action drives the page and leaves camera cues. Each clip is held until the scene's full length.

## Where the recorder points (`spec.record`)

| Field | Use |
|---|---|
| `appDir` + `page` | A static app. `appDir` (relative to `<app>`, e.g. `'.'` or `'dist'`) is served at `http://127.0.0.1:8911+/` with python3's http.server, and `page` is opened. A build step (`npm run build` into `dist/`) must have run first. |
| `url` | An app that is already being served, e.g. a dev server at `http://localhost:5173/`. Start it before recording and stop it after. |
| `viewport` | The page's size in screen pixels, and also the clip's size in video pixels. Keep it 16:9 to match the footage frame. 1600 × 900 is the default; see "Sharp footage" below before choosing another. |
| `dpr` | Device pixel ratio, 2 by default. It does **not** make the clip bigger: Chrome's screencast always delivers the viewport's size, so a 1280 × 720 page with `dpr: 2` records a 1280 × 720 clip. Use 1 with `zoom`. |
| `zoom` | CSS zoom on the page's `<html>`, from its first script (default 1). With a 2560 × 1440 viewport and `zoom: 2`, the app lays out as at 1280 × 720 and is recorded twice as large, so camera zooms stay sharp. See "Sharp footage". |
| `css` | Extra CSS for the page, applied from its first script and moved after the app's own styles once the document has loaded. With `zoom`, it's where full-screen heights are corrected (see "Sharp footage"). |
| `readySelector` | The scene starts once this element has content. Default `#app`. Pick an element that appears only once the page has its data. An app's root (`#root`) has content as soon as a loading spinner draws, so a scene can start on the spinner; its first heading (`#root h1`) or a list that loads is safer. |

Each scene opens `<base>#<route>`, or the page as it is when `route` is `''`. The clip starts when the page is ready, so everything the action does is on camera. A history-based router (React Router's `BrowserRouter` and the like) ignores the hash; see "A stage for an app with a backend" for how a stage page turns it into a path.

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
| `await r.moveTo(target, { ms?, at? })` | Glides the visible cursor to a selector or a `{x, y}` point in screen pixels. `at: [fx, fy]` is the anchor inside the element (default the centre). |
| `await r.click(target, { at? })` | Moves there, shows a ripple and clicks. |
| `await r.type(sel, text, { cps?, replace? })` | Clicks into a field and types like a person (12 characters a second by default). It adds to what is already there; `replace: true` selects the old text first so the new text replaces it, which you want for pre-filled fields. |
| `await r.select(sel, option)` | Picks a `<select>` option by value or label. A native dropdown list never appears in the footage, so this shows a click on the field and the new value. |
| `await r.press(key)` | A key press, e.g. `'Enter'` or `'Escape'`. |
| `await r.scrollTo(sel, block?)` | Smooth-scrolls the element into view (`'center'` by default) and waits until it has stopped moving (0.4 s at least, 3 s at most), so a `zoom` right after it measures the final position. |
| `await r.spot(sel, pad?)` | Dims everything except the element (`pad` in the page's CSS px). |
| `await r.unspot()` | Removes the spotlight. |
| `await r.zoom(sel, pad?)` | Camera cue: from now on, frame this element (with `pad` CSS px around it). |
| `await r.zoomUnion([sels], pad?)` | Camera cue: frame the box around several elements. |
| `r.zoomReset()` | Camera cue: back to the whole page. |
| `await r.eval(fnOrString)` | Runs JavaScript in the page. A function is sent as its source, so it can't use variables from `record.ts`; named inner functions work (the recorder defines the `__name` helper tsx wraps them in). |
| `await r.rect(sel)` | The element's rectangle in screen pixels: CSS px × `record.zoom`. |
| `r.p` | The Playwright `Page`, for anything else (`r.p.keyboard.type(...)`, `r.p.hover(...)`). |

## Selectors

Every `sel` and string `target` above is a CSS selector, matched with `document.querySelector`: the first match wins, and there is no matching by text. Check each one against the page in the state the action reaches, because a wrong one stops the recorder with `no element matches`.

- Prefer ids and `data-*` attributes. Without them, use the page's structure and `:has()`:
  - `main > section:nth-of-type(3)` for the third panel of a page;
  - `button:has(svg.lucide-download)` for an icon button: lucide icons carry a `lucide-<name>` class, but the name differs between lucide versions (`lucide-check-circle` in older ones, `lucide-circle-check` in newer), so read it from the DOM;
  - `form button[type="submit"]`, `[role="dialog"] button:last-child`.
- To match by text, tag the element first and select the tag:

  ```ts
  await r.eval(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Approve'))?.setAttribute('data-rec', 'approve'));
  await r.click('[data-rec="approve"]');
  ```

- Keep full-width boxes (a `header`, a `footer`, a page-wide `section`) out of `zoomUnion`; they widen the box to the whole page. Use the row or field inside them instead (`footer .flex`, `footer textarea`).

## The camera

A zoom cue fits the padded rectangle into the frame, centres it and eases there over 0.8 s. The zoom stays between 1× and 2.4×, and it never shows anything outside the page.

- A region about two thirds of the viewport (around 1000 × 560 on a 1600 × 900 page) gives roughly 1.5×, which reads well.
- Cues are measured when you call them. Call `zoom` after a scroll or layout change has settled, not before.
- Zoom to elements whose box hugs their content. Block elements (a heading, a table, a section) usually span the page's full width, so a zoom or `zoomUnion` that includes one barely zooms. Point at a cell, a card or an inline element instead. You can also make a tighter box: give a wrapper an id, or measure a rectangle with `r.rect`.
- A wide, short target is fitted by its width, which leaves the top and bottom of the frame empty. Include some of what is above or below it.
- One move per idea, with a held frame of at least 1.5 s between moves.
- Don't zoom and spotlight different things at the same time.
- Reset before the scene ends, so the next scene starts wide.

## Pacing

- Hang each beat on the words it illustrates: `T(narr, 0.25)`, `T(narr, 0.5)` and so on.
- Moves take real time, so start them early enough to finish under the sentence that describes them. What each call costs:
  - `moveTo`: 0.4–1 s, depending on the distance in the page's CSS pixels (`ms` overrides it); a zero-length move still takes 0.4 s;
  - `click`: a `moveTo` plus 0.3 s;
  - `type`: a `click` plus about 1/`cps` s per character (12 cps means 1 s for every 12 characters);
  - `scrollTo`: 0.4 s for a short scroll, up to about 1.5 s for a long one.

  Filling four fields of a form takes 5–6 s.
- `record` warns when an `until(t)` is reached more than 0.25 s after `t`: `⚠ 2 beats late, worst 2.0s after t=8.4`. Start the moves before that beat earlier, or give the scene more words.
- Its per-scene line, `target 11.6s … 11.9s`, gives the length the clip needs and the length it got. The second number includes the page-load time before the scene starts, so a bit over the target is normal.
- End the action by about `T(narr, 1.0) + 0.3`. The video shows each clip for `leadIn + narration + tail` seconds, so anything after that never appears. The recorder holds each clip 0.8 s longer than that, as a margin.

## State and data

- Each scene starts in a fresh browser context: empty localStorage, no cookies, and `prefers-color-scheme: light`. Scenes never inherit each other's clicks. An app that follows the system theme is filmed in its light theme; to film its dark theme, switch it the app's own way (a setting, a class on `<html>`) in the action or the stage page.
- If a scene needs data, use the first that fits: the app's built-in sample data or demo mode (a query string or hash in `url`); creating it on camera at the start of the action; or a stage page.
- **A stage page** is a small page in `<app>/explainer/demo/` that loads the app's real components or styles with fictional data. Set `record.appDir: 'explainer/demo'`. The engine's own video does this; see `<engine>/explainer/demo/`.
- **Don't** call `r.p.goto()` or reload inside an action. A full navigation removes the cursor, ripple and spotlight overlays the recorder injected. Navigate with the app's own links, or for history-based routers with `r.eval(() => { history.pushState({}, '', '/settings'); dispatchEvent(new PopStateEvent('popstate')); })`.
- Never film real personal data, keys or internal URLs. Stage what you must, and say so in the scene's `note`.

## A stage for an app with a backend

Some apps only run with their server, a database of real records, an account, or paid API calls (an LLM, a data provider). Don't start those servers to film them. Film the app's real frontend instead, with its API answered by fictional data:

1. **Build the frontend into the stage.** Use the app's own build tool, with its output in `<app>/explainer/demo/stage/` and a `.gitignore` there that lists `stage/`. Keep the build in a small script in `demo/` (for example `build-stage.mjs`) so it can be re-run after a frontend change. A Vite config outside the app's folder can't import packages (Vite resolves a config's imports from the config's own folder), so write it with Node built-ins only, set `root` to the frontend, and start Vite from the frontend's folder so Tailwind finds its content globs.
2. **Mock the API.** Write `demo/mock-api.js`, a plain script that the build copies into the stage and loads in `<head>`, before the app's bundle. It replaces `window.fetch` for the app's API prefix and answers from fictional data held in memory. Add short delays where the app shows a loading or "thinking" state, and never answer a download or export call, because the browser would navigate away from the recorder's overlays.

   ```js
   const realFetch = window.fetch.bind(window);
   window.fetch = async (input, init = {}) => {
     const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
     if (!url.pathname.startsWith('/api/')) return realFetch(input, init);
     const { status = 200, body, delay = 30 } = await handle((init.method || 'GET').toUpperCase(), url.pathname, init.body && JSON.parse(init.body));
     await new Promise((r) => setTimeout(r, delay));
     return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
   };
   ```

3. **Turn the scene's route into a path.** The recorder opens `#<route>`. At the top of the mock, before the app starts, move the hash into the path so a history-based router sees it: `history.replaceState(null, '', location.hash.slice(1) || '/')`. Then `route: '/projects/demo'` opens that page. A suffix such as `@preset` can pick the mock's starting state for a scene (`route: '/projects/demo@approved'`).
4. **Point the recorder at it:** `record: { appDir: 'explainer/demo/stage', page: 'index.html', … }`.

Each scene loads the page afresh, so the mock's data resets between scenes; anything a scene does (create, send, approve) changes the in-memory data for that scene only. Give every footage scene a `note` such as "Sample data. All companies shown are fictional."

## Logins

Prefer a page that needs no login: a demo mode, a stage page, or a local build with auth turned off. If the user insists on filming a logged-in app, ask them how to get a test account. Never use their real credentials in `record.ts`.

## Sharp footage (and narrow UIs)

The clip has one video pixel per CSS pixel of the page. The render draws it into a 1440 × 810 footage frame (1520 × 855 with `frame: 'bare'`), then the camera's zoom enlarges it again. So:

- A 1600 × 900 page is drawn at 0.9×, and stays sharp up to a zoom of about 1.1×.
- A 1280 × 720 page is drawn at 1.125× before any zoom; at a 1.5× zoom its text is enlarged about 1.7× and looks soft.

Changing `viewport` alone doesn't help, because the app's text is the same CSS size at any viewport. To keep zoomed text sharp, draw the page larger with `record.zoom`:

```ts
record: { url: 'http://localhost:5173/', viewport: { width: 2560, height: 1440 }, dpr: 1, zoom: 2, … },
```

The app lays out as it would at 1280 × 720, and each clip is 2560 × 1440 with two video pixels per CSS pixel. 1920 × 1080 with `zoom: 1.5` is the lighter choice, for a slow machine or a 1600-wide layout drawn at 1.2. The recorder adjusts the rest:

- `rect`, `moveTo` points and the camera's cues are in screen pixels (CSS px × `zoom`). Selectors need no change.
- Paddings (`zoom`, `zoomUnion`, `spot`) stay in the page's CSS pixels, so the framing matches the unzoomed page.
- The cursor, ripple and spotlight are drawn at their usual size relative to the page, and glides keep their pace.
- Two things stay with you:
  - **Viewport units ignore CSS zoom.** `100vh` still measures the 1440 px viewport, so a page with a full-screen height (`h-screen`, `min-h-screen`) lays out twice as tall, and a chat page that scrolls to its last message pushes the conversation off the top. Divide those heights in `record.css`, with an `html` in front so the rule outranks the app's own:

    ```ts
    css: 'html .min-h-screen { min-height: calc(100vh / 2); } html .h-screen { height: calc(100vh / 2); }',
    ```

  - **Timing shifts a little.** Re-recorded clips render twice the pixels; check the `record` log for late beats.
- Check in the stills that clicks, the spotlight and the zooms land on their targets.

For a fixed-size stage page, such as a narrow side panel shown inside a mocked browser, you can instead scale a wrapper element (`#stage { zoom: 1.5 }`) in a viewport that much larger, as `FLIGHT DECK/explainer/demo/stage.css` does. Don't combine that with `record.zoom`. Without `record.zoom`, don't put CSS zoom on `<html>` or `<body>` yourself: the recorder's cursor and spotlight would land at twice their positions.

## Re-recording

- `npm --prefix "<engine>" run record -- <scene-id>` re-records one scene and keeps the others.
- Recording needs the narration first (`narrate`), because clip lengths come from it.
- `RECORD_BROWSER=chrome|chromium|/path/to/browser` picks the browser. By default it uses Google Chrome when installed, then Remotion's headless Chrome (installed with the engine), then Playwright's Chromium.
