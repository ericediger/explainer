import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '@explainer/src/kit/types';
import { easeOut, fadeOut, lerp, pop } from '@explainer/src/kit/anim';
import { useTheme } from '@explainer/src/kit/theme';
import { spansFor } from '@explainer/src/timeline';

/**
 * Opening card in two beats, one per sentence of the narration:
 * 1. the problem: HEADLINE, then the PROBLEMS one by one, while the first sentence names it;
 * 2. the payoff: the problem clears, and the app's name lands with TAGLINE on the second sentence.
 * Write the PROBLEMS as the viewer would say them: what goes wrong today without the app. Three to five lines.
 * To use the app's logo, put it in explainer/public/ and draw it with <Img src={staticFile('logo.svg')} /> in place
 * of the accent tile.
 */
const HEADLINE = 'The problem, in a few words.';
const PROBLEMS = ['One thing that goes wrong today', 'Another, as the viewer would say it', 'A third, small and concrete'];
const TAGLINE = 'One line on what it does, in the app’s own words.';

export const ColdOpen: React.FC<AnimatedSceneProps> = ({ scene, spec }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1] = spansFor(scene, fps);
  const t0 = s0?.start ?? 0;
  const span0 = s0 ? s0.end - s0.start : 90;
  const t1 = s1?.start ?? t0 + span0;
  const problemOut = fadeOut(frame, t1 - 4, 12);
  const pHead = pop(frame, fps, Math.max(0, t0 - 4), { damping: 16 });
  const pName = pop(frame, fps, t1 + 6, { damping: 15, stiffness: 110 });
  const pTag = pop(frame, fps, t1 + 18, { damping: 16 });

  return (
    <AbsoluteFill>
      {/* Beat 1: the problem */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', opacity: Math.min(1, pHead * 1.5) * problemOut }}>
        <div style={{ fontFamily: theme.display, fontSize: 72, fontWeight: 700, letterSpacing: -1.5, color: theme.ink }}>{HEADLINE}</div>
      </div>
      <div style={{ position: 'absolute', left: 460, width: 1000, top: 330, display: 'flex', flexDirection: 'column', gap: 18, opacity: problemOut }}>
        {PROBLEMS.map((line, i) => {
          const p = pop(frame, fps, t0 + 8 + Math.round((span0 * 0.7 * i) / PROBLEMS.length), { damping: 16 });
          return (
            <div
              key={line}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                padding: '22px 28px',
                borderRadius: 16,
                background: theme.panel,
                border: `1px solid ${theme.line}`,
                boxShadow: '0 18px 40px rgba(0,0,0,.35)',
                opacity: Math.min(1, p * 1.5),
                transform: `translateX(${lerp(i % 2 ? 60 : -60, 0, p)}px)`,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 7, background: theme.red, flexShrink: 0 }} />
              <div style={{ fontSize: 32, color: theme.ink }}>{line}</div>
            </div>
          );
        })}
      </div>

      {/* Beat 2: the payoff */}
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
          <div style={{ margin: '28px auto 0', height: 5, width: lerp(0, 240, easeOut((frame - t1 - 16) / 20)), borderRadius: 3, background: theme.accent }} />
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
    </AbsoluteFill>
  );
};
