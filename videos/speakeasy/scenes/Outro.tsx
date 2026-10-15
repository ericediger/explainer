import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

/**
 * Three promise cards (one per sentence), then the lockup and the repo:
 *   s3 "SpeakEasy."        → speaker mark and name
 *   s4 "Free, on GitHub."  → repo card and what a listen costs
 */
const Speaker: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#060810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#060810" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const Outro: React.FC<AnimatedSceneProps> = ({ scene, spec }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spans = spansFor(scene, fps);
  const tMark = spans[3]?.start ?? spans[spans.length - 1].start;
  const tRepo = spans[4]?.start ?? tMark + 40;
  const pMark = pop(frame, fps, tMark, { damping: 15, stiffness: 100 });

  const CARDS = [
    { glyph: '≡', color: theme.blue, title: 'Any article, three lengths', body: 'TL;DR in two minutes, Medium in five, or the whole thing word for word.' },
    { glyph: '♪', color: theme.violet, title: 'Ten voices, six styles', body: 'Change voice, style or speed mid-article; it regenerates and keeps going.' },
    { glyph: '⚿', color: theme.accent, title: 'Your key, no server', body: 'Calls go from your browser to OpenAI. No account, nothing in between.' },
  ];
  const COSTS = [
    { name: 'TL;DR', cost: '≈ 5¢' },
    { name: 'Medium', cost: '≈ 12¢' },
    { name: 'Full', cost: '≈ 22¢' },
  ];

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 170, right: 170, top: 130, display: 'flex', gap: 30 }}>
        {CARDS.map((c, i) => {
          const start = spans[i]?.start ?? 0;
          const p = pop(frame, fps, start, { damping: 16 });
          return (
            <div key={c.title} style={{ flex: 1, padding: '30px 32px 34px', borderRadius: 20, background: theme.panel, border: `1px solid ${theme.line}`, borderTop: `5px solid ${c.color}`, boxShadow: '0 26px 60px rgba(0,0,0,.4)', opacity: Math.min(1, p * 1.5), transform: `translateY(${lerp(36, 0, p)}px)` }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: c.color, color: '#060810', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 800 }}>{c.glyph}</div>
              <div style={{ fontFamily: theme.display, fontSize: 36, fontWeight: 800, color: theme.ink, marginTop: 22, letterSpacing: -0.8, lineHeight: 1.1 }}>{c.title}</div>
              <div style={{ fontSize: 22, color: theme.muted, marginTop: 12, lineHeight: 1.42 }}>{c.body}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 540, textAlign: 'center', opacity: Math.min(1, pMark * 1.5), transform: `translateY(${lerp(30, 0, pMark)}px)` }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 30 }}>
          <div style={{ width: 112, height: 112, borderRadius: 28, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDeep})`, display: 'grid', placeItems: 'center', boxShadow: `0 0 50px ${theme.accent}66` }}>
            <Speaker size={64} />
          </div>
          <div style={{ fontFamily: theme.display, fontSize: 108, fontWeight: 800, letterSpacing: -4, color: theme.ink, lineHeight: 1 }}>SpeakEasy</div>
        </div>
        <div style={{ margin: '20px auto 0', display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[theme.blue, theme.violet, theme.accent].map((c, i) => (
            <div key={c} style={{ height: 5, width: lerp(0, 90, easeOut((frame - tMark - 8 - i * 4) / 18)), borderRadius: 3, background: c }} />
          ))}
        </div>
        <div style={{ marginTop: 26, display: 'inline-block', padding: '14px 26px', borderRadius: 14, background: theme.panel, border: `1px solid ${theme.line}`, boxShadow: '0 16px 40px rgba(0,0,0,.35)', textAlign: 'left', opacity: fadeIn(frame, tRepo, 12) }}>
          <div style={{ fontSize: 14, letterSpacing: 2, color: theme.accent, fontWeight: 700, textTransform: 'uppercase' }}>Free · open source · Chrome extension</div>
          <div style={{ fontFamily: theme.mono, fontSize: 28, color: theme.ink, marginTop: 4 }}>{spec.repoUrl}</div>
        </div>
        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
          {COSTS.map((k, i) => {
            const p = pop(frame, fps, tRepo + 8 + i * 5, { damping: 15 });
            return (
              <div key={k.name} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 18px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${theme.line}`, opacity: Math.min(1, p * 1.5), transform: `translateY(${lerp(16, 0, p)}px)` }}>
                <span style={{ fontSize: 19, fontWeight: 700, color: theme.ink }}>{k.name}</span>
                <span style={{ fontFamily: theme.mono, fontSize: 18, color: theme.warm }}>{k.cost}</span>
              </div>
            );
          })}
          <span style={{ fontSize: 17, color: theme.muted, opacity: fadeIn(frame, tRepo + 26, 10) }}>per listen, on your own OpenAI account</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
