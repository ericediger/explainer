import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

const LINES = ['One HTML file.', 'Your files stay in your folder.', 'The only network call goes to Claude — and only when you ask.'];

export const Outro: React.FC<AnimatedSceneProps> = ({ scene, spec }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spans = spansFor(scene, fps);
  const tMark = spans[3]?.start ?? spans[spans.length - 1].start;
  const pMark = pop(frame, fps, tMark, { damping: 15, stiffness: 100 });

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
        {LINES.map((line, i) => {
          const start = spans[i]?.start ?? 0;
          const p = pop(frame, fps, start, { damping: 16 });
          return (
            <div
              key={line}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                fontSize: 44,
                fontWeight: 600,
                color: theme.ink,
                letterSpacing: -0.4,
                opacity: Math.min(1, p * 1.5),
                transform: `translateY(${lerp(22, 0, p)}px)`,
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 6, background: theme.accent, boxShadow: `0 0 16px rgba(95,179,133,.6)` }} />
              {line}
            </div>
          );
        })}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', opacity: Math.min(1, pMark * 1.5), transform: `translateY(${lerp(30, 0, pMark)}px)` }}>
        <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: -3, color: theme.ink, lineHeight: 1 }}>
          Week <span style={{ color: theme.accent }}>Prep</span>
        </div>
        <div style={{ margin: '18px auto 0', height: 4, width: lerp(0, 160, easeOut((frame - tMark - 8) / 20)), borderRadius: 2, background: theme.accent }} />
        <div style={{ marginTop: 34, fontFamily: theme.mono, fontSize: 30, color: theme.ink, opacity: fadeIn(frame, tMark + 10, 12) }}>{spec.repoUrl}</div>
        <div style={{ marginTop: 12, fontSize: 22, color: theme.muted, opacity: fadeIn(frame, tMark + 18, 12) }}>
          Live demo with sample data · <span style={{ fontFamily: theme.mono }}>{spec.demoUrl}</span>
        </div>
        <div style={{ marginTop: 14, fontSize: 18, color: theme.muted, opacity: fadeIn(frame, tMark + 26, 12) }}>MIT licensed · Chrome or Edge</div>
      </div>
    </AbsoluteFill>
  );
};
