import React from 'react';
import { Composition, staticFile } from 'remotion';
import { ExplainerVideo, PosterFrame } from './ExplainerVideo';
import type { CuesFile, NarrationManifest, VideoSpec } from './spec';
import { buildTimeline } from './timeline';
// The project being rendered (<app>/explainer/index.ts); remotion.config.ts points '@project' at it.
import { spec } from '@project';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** The real timeline once narration and footage exist (Studio and renders both read them from the build's public dir). */
async function loadTimeline(spec: VideoSpec) {
  const [manifest, cues] = await Promise.all([
    fetchJson<NarrationManifest>(staticFile('narration/manifest.json')),
    fetchJson<CuesFile>(staticFile('footage/cues.json')),
  ]);
  return buildTimeline(spec, manifest, cues);
}

const draft = buildTimeline(spec, null, null);

export const Root: React.FC = () => (
  <>
    <Composition
      id={spec.id}
      component={ExplainerVideo}
      width={spec.width}
      height={spec.height}
      fps={spec.fps}
      durationInFrames={draft.durationInFrames}
      defaultProps={{ spec, timeline: draft }}
      calculateMetadata={async ({ props }) => {
        const timeline = await loadTimeline(spec);
        return { durationInFrames: timeline.durationInFrames, props: { ...props, timeline } };
      }}
    />
    <Composition
      id={`${spec.id}-poster`}
      component={PosterFrame}
      width={spec.width}
      height={spec.height}
      fps={spec.fps}
      durationInFrames={1}
      defaultProps={{ spec, timeline: draft }}
      calculateMetadata={async ({ props }) => ({ durationInFrames: 1, props: { ...props, timeline: await loadTimeline(spec) } })}
    />
  </>
);
