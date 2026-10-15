import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '@explainer/src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '@explainer/src/kit/anim';
import { useTheme } from '@explainer/src/kit/theme';
import { spansFor } from '@explainer/src/timeline';

/**
 * Three promise cards (one per sentence), then the lockup and the proof:
 *   s3 "And this video was made the same way." → the wordmark, this video's own storyboard, and three finished posters
 */
const POSTERS = [
  { file: 'posters/week-prep.jpg', name: 'Week Prep' },
  { file: 'posters/invest-igator.jpg', name: 'INVEST-IGATOR' },
  { file: 'posters/flight-deck.jpg', name: 'Flight Deck' },
];

export const Outro: React.FC<AnimatedSceneProps> = ({ scene, spec }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spans = spansFor(scene, fps);
  const tMark = spans[3]?.start ?? spans[spans.length - 1].start;
  const pMark = pop(frame, fps, tMark, { damping: 15, stiffness: 100 });

  const CARDS = [
    { glyph: '{ }', color: theme.blue, title: 'Everything is code', body: 'A storyboard, a few scenes and a choreography file per video.' },
    { glyph: '▶', color: theme.accent, title: 'Your real app, on camera', body: 'Playwright records the running page, not a mock-up.' },
    { glyph: '↻', color: theme.warm, title: 'One command to redo it', body: 'Edit a line and run npm run build. Voice, footage and captions follow.' },
  ];

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 170, right: 170, top: 96, display: 'flex', gap: 30 }}>
        {CARDS.map((c, i) => {
          const start = spans[i]?.start ?? 0;
          const p = pop(frame, fps, start, { damping: 16 });
          return (
            <div key={c.title} style={{ flex: 1, padding: '26px 30px 28px', borderRadius: 20, background: theme.panel, border: `1px solid ${theme.line}`, borderTop: `5px solid ${c.color}`, boxShadow: '0 26px 60px rgba(0,0,0,.4)', opacity: Math.min(1, p * 1.5), transform: `translateY(${lerp(36, 0, p)}px)` }}>
              <div style={{ width: 58, height: 58, borderRadius: 15, background: c.color, color: '#1a1410', display: 'grid', placeItems: 'center', fontFamily: theme.mono, fontSize: 26, fontWeight: 800 }}>{c.glyph}</div>
              <div style={{ fontFamily: theme.display, fontSize: 34, fontWeight: 700, color: theme.ink, marginTop: 18, letterSpacing: -0.5 }}>{c.title}</div>
              <div style={{ fontSize: 21, color: theme.muted, marginTop: 10, lineHeight: 1.42 }}>{c.body}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', opacity: Math.min(1, pMark * 1.5), transform: `translateY(${lerp(30, 0, pMark)}px)` }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 28 }}>
          <div style={{ width: 104, height: 104, borderRadius: 26, background: theme.accent, display: 'grid', placeItems: 'center', boxShadow: `0 0 50px ${theme.accent}66` }}>
            <div style={{ width: 0, height: 0, marginLeft: 9, borderTop: '24px solid transparent', borderBottom: '24px solid transparent', borderLeft: '40px solid #fff' }} />
          </div>
          <div style={{ fontFamily: theme.display, fontSize: 104, fontWeight: 700, letterSpacing: -3, color: theme.ink, lineHeight: 1 }}>{spec.name}</div>
        </div>
        <div style={{ margin: '18px auto 0', display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[theme.blue, theme.accent, theme.warm].map((c, i) => (
            <div key={c} style={{ height: 5, width: lerp(0, 90, easeOut((frame - tMark - 8 - i * 4) / 18)), borderRadius: 3, background: c }} />
          ))}
        </div>
        <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 16, padding: '12px 24px', borderRadius: 14, background: theme.panel, border: `1px solid ${theme.line}`, fontFamily: theme.mono, fontSize: 24, color: theme.ink, opacity: fadeIn(frame, tMark + 14, 12) }}>
          <span style={{ color: theme.accent }}>explainer/script.ts</span>
          <span style={{ color: theme.muted }}>→</span>
          <span>this video</span>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 706, display: 'flex', justifyContent: 'center', gap: 28 }}>
        {POSTERS.map((po, i) => {
          const p = pop(frame, fps, tMark + 24 + i * 7, { damping: 15 });
          return (
            <div key={po.name} style={{ width: 300, opacity: Math.min(1, p * 1.5), transform: `translateY(${lerp(26, 0, p)}px)` }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 44px rgba(0,0,0,.45)', border: `1px solid ${theme.line}` }}>
                <Img src={staticFile(po.file)} style={{ display: 'block', width: '100%' }} />
              </div>
              <div style={{ marginTop: 8, textAlign: 'center', fontFamily: theme.mono, fontSize: 16, letterSpacing: 1, color: theme.muted }}>{po.name}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
