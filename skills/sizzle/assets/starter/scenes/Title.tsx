import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '@explainer/src/kit/types';
import { easeOut, lerp, pop } from '@explainer/src/kit/anim';
import { useTheme } from '@explainer/src/kit/theme';
import { spansFor } from '@explainer/src/timeline';

/**
 * Opening card: the app's name lands with the first sentence of the narration, the tagline with the second.
 * A starting point: the strongest openers show the problem the app solves, or the app itself.
 * To use the app's logo, put it in explainer/public/ and draw it with <Img src={staticFile('logo.svg')} />.
 */
const TAGLINE = 'One line on what it does, in the app’s own words.';

export const Title: React.FC<AnimatedSceneProps> = ({ scene, spec }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spans = spansFor(scene, fps);
  const tName = Math.max(0, (spans[0]?.start ?? 0) - 6);
  const tTag = spans[1]?.start ?? Math.round(((spans[0]?.start ?? 0) + (spans[0]?.end ?? 40)) / 2);
  const pName = pop(frame, fps, tName, { damping: 15, stiffness: 110 });
  const pTag = pop(frame, fps, tTag, { damping: 16 });

  return (
    <AbsoluteFill style={{ display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', marginTop: -70 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 30,
            opacity: Math.min(1, pName * 1.5),
            transform: `translateY(${lerp(34, 0, pName)}px) scale(${lerp(0.94, 1, pName)})`,
          }}
        >
          <div style={{ width: 112, height: 112, borderRadius: 28, background: theme.accent, boxShadow: `0 0 60px ${theme.accent}66` }} />
          <div style={{ fontFamily: theme.display, fontSize: 132, fontWeight: 700, letterSpacing: -4, color: theme.ink, lineHeight: 1 }}>{spec.name}</div>
        </div>
        <div style={{ margin: '28px auto 0', height: 5, width: lerp(0, 240, easeOut((frame - tName - 10) / 20)), borderRadius: 3, background: theme.accent }} />
        <div
          style={{
            margin: '30px auto 0',
            maxWidth: 1300,
            fontSize: 42,
            lineHeight: 1.3,
            color: theme.muted,
            opacity: Math.min(1, pTag * 1.5),
            transform: `translateY(${lerp(20, 0, pTag)}px)`,
          }}
        >
          {TAGLINE}
        </div>
      </div>
    </AbsoluteFill>
  );
};
