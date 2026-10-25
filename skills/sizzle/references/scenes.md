# Animated scenes: `<app>/explainer/scenes/*.tsx`

An animated scene is a React component that Remotion renders frame by frame. It draws the middle of the canvas. The kit adds the background, the scene title, the captions, the note and the progress bar around it.

## Contract

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '@explainer/src/kit/types';
import { fadeIn, lerp, pop } from '@explainer/src/kit/anim';
import { useTheme } from '@explainer/src/kit/theme';
import { spansFor } from '@explainer/src/timeline';

export const Problem: React.FC<AnimatedSceneProps> = ({ scene, spec }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();            // frames since this scene started
  const { fps } = useVideoConfig();
  const [s0, s1] = spansFor(scene, fps);     // one { text, start, end } per narration sentence, in frames
  const p = pop(frame, fps, s1?.start ?? 30); // springs 0 → 1 when the second sentence starts
  return <AbsoluteFill>{/* … */}</AbsoluteFill>;
};
```

Register it in `index.ts`, then use `component: 'Problem'` in the scene:

```ts
export const components: Record<string, AnimatedScene> = { Title, Problem, Outro };
```

`react` and `remotion` resolve from the engine, so the app needs no extra packages.

## Helpers

- `@explainer/src/kit/anim`:
  - `fadeIn(frame, start, dur)` and `fadeOut(frame, start, dur)`;
  - `pop(frame, fps, start, springConfig?)`: a spring from 0 to 1;
  - `easeInOut`, `easeOut`, `lerp`, and `CLAMP` for `interpolate`.
- `@explainer/src/kit/theme`:
  - `useTheme()`: colours and fonts;
  - `useStyle()`: the chosen variants;
  - `LAYOUT` and `frameGeom(style.frame)`: where the footage frame sits.
- `@explainer/src/timeline`: `spansFor(scene, fps)` gives the sentence timings.
- `remotion`: `AbsoluteFill`, `Img`, `staticFile`, `interpolate`, `spring`, `Sequence`, `random(seed)`.

## Rules

- **Time beats to sentences.** Start each beat at `spansFor(...)[i].start`, never at a fixed second. The words then land with the voice, whoever narrates.
- **Pure function of `frame`.** No `Date.now()`, no `Math.random()` (use `random('seed')`), no CSS transitions or keyframe animations, no timers or effects that change state. Remotion renders frames out of order.
- **Stay inside the safe area.** The canvas is 1920 × 1080. Keep content between y ≈ 100 and y ≈ 960:
  - when the scene has a `title`, the scene title occupies the top ~80 px;
  - captions sit at y ≈ 988 to 1060 (pill), or in the bottom 92 px (bar);
  - the progress bar is the bottom 4 px.
- **Assets** go in `<app>/explainer/public/` and are drawn with `<Img src={staticFile('logo.svg')} />`. They are copied into the build before each render.
- **Colours come from the theme:** `theme.accent`, `theme.ink`, `theme.panel` and so on. Then a restyle in `script.ts` reaches every scene.
- **Fonts:** `theme.display` and `theme.font` are CSS stacks. For a brand font, put the file in `public/fonts/` (ask the user before downloading one, and keep its licence file next to it), load it once at the top of `index.ts`, and name the family first in the theme:

  ```ts
  import { loadFont } from '@explainer/src/kit/fonts';
  loadFont('Montserrat', 'fonts/Montserrat-wght.ttf', { weight: '100 900' }); // a variable font; a static file takes its one weight, e.g. '700'
  ```

  `loadFont` declares the `@font-face` with `staticFile` and holds rendering until the file has loaded. Don't declare a font in one scene's `<style>`: Remotion renders frames in several tabs and out of order, so frames of other scenes (their captions and titles) would use the fallback, and a frame can be captured before the font arrives. Check the stills to confirm it loaded.

## What makes a good animated scene

- **Show the thing.** Rebuild a real piece of the app, such as its card, its button or its list, in its colours and with its copy. Abstract shapes are filler.
- **One beat per sentence.** If a sentence has nothing new to show, cut the sentence.
- **The opener states the problem or the payoff** within its first sentence. The starter's `ColdOpen.tsx` does the simple version: the problem as a few short lines on the first sentence, the name and tagline on the second. The engine's own video goes further: `<engine>/explainer/scenes/ColdOpen.tsx` shows the problem as a tiny story in three beats.
- **Diagrams build up.** Add parts as the narration names them. See `<engine>/explainer/scenes/HowItWorks.tsx`.
- **The outro is the takeaway.** Three short claims and the name, plus where to get it. See the starter's `Outro.tsx` and `<engine>/explainer/scenes/Outro.tsx`.

## Checking

`npm --prefix "<engine>" run stills -- <scene-id>` renders that scene's midpoint; add `--late` for the 78% point. Each run also refreshes `contact-sheet.png` in the stills folder, with every still of the current cut. `npm --prefix "<engine>" run studio` opens Remotion Studio, which lets you scrub the whole timeline in a browser when the user wants to watch it live.
