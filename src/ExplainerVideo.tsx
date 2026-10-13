import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { VideoSpec } from './spec';
import type { Timeline, TimelineScene } from './timeline';
import { videos } from '../videos';
import { Background } from './kit/Background';
import { Captions } from './kit/Captions';
import { FootageScene } from './kit/FootageScene';
import { LowerThird } from './kit/LowerThird';
import { NoteChip } from './kit/NoteChip';
import { ProgressBar } from './kit/ProgressBar';
import { CLAMP, fadeIn, fadeOut, lerp } from './kit/anim';
import { ThemeContext, resolveTheme, useTheme } from './kit/theme';
import type { AnimatedScene } from './kit/types';

export type ExplainerProps = { spec: VideoSpec; timeline: Timeline };

const MissingScene: React.FC<{ id?: string }> = ({ id }) => {
  const theme = useTheme();
  return <AbsoluteFill style={{ display: 'grid', placeItems: 'center', color: theme.red, fontSize: 32 }}>No animated component registered as “{id}”</AbsoluteFill>;
};

const SceneView: React.FC<{ scene: TimelineScene; spec: VideoSpec; components: Record<string, AnimatedScene> }> = ({ scene, spec, components }) => {
  const frame = useCurrentFrame();
  const Anim = scene.spec.component ? components[scene.spec.component] : undefined;
  return (
    <>
      <AbsoluteFill style={{ opacity: fadeIn(frame, 0, 8) }}>
        {scene.spec.kind === 'footage' ? (
          <FootageScene footage={scene.footage} videoId={spec.id} demoUrl={spec.demoUrl} />
        ) : Anim ? (
          <Anim scene={scene} spec={spec} />
        ) : (
          <MissingScene id={scene.spec.component} />
        )}
      </AbsoluteFill>
      {scene.spec.title ? <LowerThird index={scene.index} title={scene.spec.title} subtitle={scene.spec.subtitle} /> : null}
      <Captions scene={scene} />
      {scene.spec.note ? <NoteChip text={scene.spec.note} /> : null}
      {scene.narrationFile ? (
        <Sequence from={scene.leadFrames} name="narration">
          <Audio src={staticFile(scene.narrationFile)} />
        </Sequence>
      ) : null}
    </>
  );
};

/**
 * Music bed for the whole video. Volume is a function of the frame: it sits at `volume`
 * between narration lines, ducks to `duckTo` while a line plays (ramped over `duckRampSec`
 * either side), fades in at the start and out at the end.
 */
const Music: React.FC<{ spec: VideoSpec; timeline: Timeline }> = ({ spec, timeline }) => {
  const m = spec.music;
  if (!m) return null;
  const { fps, durationInFrames } = timeline;
  const full = m.volume ?? 0.3;
  const ducked = m.duckTo ?? full * 0.35;
  const ramp = Math.max(1, Math.round((m.duckRampSec ?? 0.6) * fps));
  const inF = Math.round((m.fadeInSec ?? 1.5) * fps);
  const outF = Math.round((m.fadeOutSec ?? 3) * fps);
  const lines = timeline.scenes.map((s) => [s.from + s.leadFrames, s.from + s.leadFrames + s.narrFrames] as const);
  const volume = (f: number): number => {
    let speaking = 0;
    for (const [a, b] of lines) {
      const enter = interpolate(f, [a - ramp, a], [0, 1], CLAMP);
      const exit = interpolate(f, [b, b + ramp], [1, 0], CLAMP);
      speaking = Math.max(speaking, Math.min(enter, exit));
    }
    return lerp(full, ducked, speaking) * fadeIn(f, 0, inF) * fadeOut(f, durationInFrames - outF, outF);
  };
  return <Audio name="music" src={staticFile(`${spec.id}/${m.file}`)} startFrom={Math.round((m.startAtSec ?? 0) * fps)} volume={volume} />;
};

/** Generic explainer: background, one Sequence per scene, progress bar. Everything specific lives in the spec and registry. */
export const ExplainerVideo: React.FC<ExplainerProps> = ({ spec, timeline }) => {
  const components = videos.find((v) => v.spec.id === spec.id)?.components ?? {};
  const theme = resolveTheme(spec.theme);
  return (
    <ThemeContext.Provider value={theme}>
      <AbsoluteFill style={{ background: theme.bg0, fontFamily: theme.font, color: theme.ink }}>
        <Background />
        {timeline.scenes.map((s) => (
          <Sequence key={s.spec.id} from={s.from} durationInFrames={s.durationInFrames} name={`${String(s.index + 1).padStart(2, '0')} ${s.spec.id}`}>
            <SceneView scene={s} spec={spec} components={components} />
          </Sequence>
        ))}
        <Music spec={spec} timeline={timeline} />
        <ProgressBar total={timeline.durationInFrames} />
      </AbsoluteFill>
    </ThemeContext.Provider>
  );
};

/**
 * One frame of the video with a play badge: the README poster image. Rendered by `npm run poster`
 * from the `<id>-poster` composition; `spec.poster.atSec` picks the moment.
 */
export const PosterFrame: React.FC<ExplainerProps> = ({ spec, timeline }) => {
  const at = Math.min(timeline.durationInFrames - 1, Math.max(0, Math.round((spec.poster?.atSec ?? 0) * timeline.fps)));
  const r = 110;
  return (
    <AbsoluteFill>
      <Sequence from={-at} durationInFrames={at + 1}>
        <ExplainerVideo spec={spec} timeline={timeline} />
      </Sequence>
      <AbsoluteFill style={{ background: 'rgba(0,0,0,.28)' }} />
      <div
        style={{
          position: 'absolute',
          left: 960 - r,
          top: 540 - r,
          width: 2 * r,
          height: 2 * r,
          borderRadius: r,
          background: 'rgba(16,20,28,.84)',
          border: '6px solid rgba(255,255,255,.92)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div style={{ width: 0, height: 0, marginLeft: 16, borderTop: '56px solid transparent', borderBottom: '56px solid transparent', borderLeft: '96px solid rgba(255,255,255,.96)' }} />
      </div>
    </AbsoluteFill>
  );
};
