import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

/** Three promise cards in a row (one per sentence), then the name and tagline. */
const CARDS = [
  { glyph: '⌂', title: 'Your own machine', body: 'Runs locally. Your data stays in one SQLite file you can back up.' },
  { glyph: '§', title: 'Dated and sourced', body: 'Every figure carries its date and source. A missing number stays missing.' },
  { glyph: '✎', title: 'Never trades', body: 'It records research and decisions. Only you mark a company Invested.' },
];

export const Outro: React.FC<AnimatedSceneProps> = ({ scene, spec }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spans = spansFor(scene, fps);
  const tMark = spans[3]?.start ?? spans[spans.length - 1].start;
  const tTag = spans[4]?.start ?? tMark + 20;
  const pMark = pop(frame, fps, tMark, { damping: 15, stiffness: 100 });

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 200, right: 200, top: 190, display: 'flex', gap: 28 }}>
        {CARDS.map((c, i) => {
          const start = spans[i]?.start ?? 0;
          const p = pop(frame, fps, start, { damping: 16 });
          return (
            <div key={c.title} style={{ flex: 1, padding: '30px 30px 34px', borderRadius: 18, background: theme.panel, border: `1px solid ${theme.line}`, boxShadow: '0 24px 60px rgba(0,0,0,.14)', opacity: Math.min(1, p * 1.5), transform: `translateY(${lerp(30, 0, p)}px)` }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: theme.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 700 }}>{c.glyph}</div>
              <div style={{ fontFamily: theme.display, fontSize: 38, fontWeight: 600, color: theme.ink, marginTop: 22, letterSpacing: -0.6 }}>{c.title}</div>
              <div style={{ fontSize: 21, color: theme.muted, marginTop: 10, lineHeight: 1.4 }}>{c.body}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: Math.min(1, pMark * 1.5), transform: `translateY(${lerp(30, 0, pMark)}px)` }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 84, height: 84, borderRadius: 20, background: theme.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>IG</div>
          <div style={{ fontFamily: theme.display, fontSize: 96, fontWeight: 700, letterSpacing: -3, color: theme.ink, lineHeight: 1 }}>
            INVEST-<span style={{ color: theme.accent }}>IGATOR</span>
          </div>
        </div>
        <div style={{ margin: '16px auto 0', height: 4, width: lerp(0, 160, easeOut((frame - tMark - 8) / 20)), borderRadius: 2, background: theme.accent }} />
        <div style={{ marginTop: 22, fontFamily: theme.display, fontSize: 30, color: theme.ink, fontStyle: 'italic', opacity: fadeIn(frame, tMark + 14, 12) }}>The research before the decision.</div>
        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center', gap: 22, opacity: fadeIn(frame, tTag, 12) }}>
          {[
            { label: 'Open source', value: spec.repoUrl },
            { label: 'Live demo · sample data', value: spec.demoUrl },
          ].map((l) => (
            <div key={l.label} style={{ padding: '14px 24px', borderRadius: 14, background: theme.panel, border: `1px solid ${theme.line}`, boxShadow: '0 16px 40px rgba(0,0,0,.12)', textAlign: 'left' }}>
              <div style={{ fontSize: 14, letterSpacing: 2, color: theme.accent, fontWeight: 700, textTransform: 'uppercase' }}>{l.label}</div>
              <div style={{ fontFamily: theme.mono, fontSize: 24, color: theme.ink, marginTop: 4 }}>{l.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 17, color: theme.muted, opacity: fadeIn(frame, tTag + 14, 12) }}>Node · Express · SQLite · OpenAI research with citations · Tiingo and SEC EDGAR feeds</div>
      </div>
    </AbsoluteFill>
  );
};
