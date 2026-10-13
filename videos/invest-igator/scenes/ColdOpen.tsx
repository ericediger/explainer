import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, fadeOut, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

/**
 * Kinetic-typography cold open: the narration's own words land on the beats.
 *   s0  "You hear about a company."                 → the sentence, word by word
 *   s1  "A ticker on a podcast, a name in a newsletter." → two sources slide in
 *   s2  "Then the research starts: filings, prices, estimates, twelve tabs deep." → stamps, then twelve tabs
 *   s3  "And none of it gets written down."         → everything greys out; the headline lands
 */
const Words: React.FC<{ text: string; start: number; per: number; size: number; color: string; font: string; weight?: number; italic?: boolean }> = ({ text, start, per, size, color, font, weight = 600, italic }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <span style={{ fontFamily: font, fontSize: size, fontWeight: weight, color, letterSpacing: -1, fontStyle: italic ? 'italic' : 'normal', lineHeight: 1.1 }}>
      {text.split(' ').map((w, i) => {
        const p = pop(frame, fps, start + i * per, { damping: 14, stiffness: 150 });
        return (
          <span key={i} style={{ display: 'inline-block', marginRight: '0.26em', opacity: Math.min(1, p * 1.6), transform: `translateY(${lerp(26, 0, p)}px) rotate(${lerp(-2, 0, p)}deg)` }}>
            {w}
          </span>
        );
      })}
    </span>
  );
};

const STAMPS = ['filings', 'prices', 'estimates'];

export const ColdOpen: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1, s2, s3] = spansFor(scene, fps);
  const d2 = s2.end - s2.start;
  const tStamps = s2.start + Math.round(d2 * 0.3);
  const tTabs = s2.start + Math.round(d2 * 0.68);
  const grey = easeOut((frame - (s3.start - 2)) / 14);
  const shrink = easeOut((frame - s1.start) / 16);

  return (
    <AbsoluteFill>
      {/* s0: the sentence, then it shrinks to a header line */}
      <div style={{ position: 'absolute', left: 240, right: 240, top: lerp(430, 150, shrink), textAlign: 'center', opacity: 1 - grey * 0.75, transform: `scale(${lerp(1, 0.5, shrink)})`, transformOrigin: '50% 0' }}>
        <Words text="You hear about a company." start={s0.start + 2} per={5} size={96} color={theme.ink} font={theme.display} />
      </div>

      {/* s1: two sources */}
      {[
        { x: 300, text: 'a ticker on a podcast', sub: 'episode 212 · 41:30', start: s1.start + 2, from: -120 },
        { x: 1020, text: 'a name in a newsletter', sub: 'Sunday · one line, no numbers', start: s1.start + Math.round((s1.end - s1.start) * 0.45), from: 120 },
      ].map((c) => {
        const p = pop(frame, fps, c.start, { damping: 16 });
        return (
          <div key={c.text} style={{ position: 'absolute', left: c.x, top: 300, width: 600, opacity: Math.min(1, p * 1.5) * (1 - grey * 0.75), transform: `translateX(${lerp(c.from, 0, p)}px)` }}>
            <div style={{ fontFamily: theme.display, fontSize: 46, fontWeight: 600, color: theme.ink, letterSpacing: -0.8 }}>{c.text}</div>
            <div style={{ fontFamily: theme.mono, fontSize: 18, color: theme.muted, marginTop: 8, letterSpacing: 1 }}>{c.sub}</div>
            <div style={{ marginTop: 14, height: 2, width: lerp(0, 120, easeOut((frame - c.start - 6) / 16)), background: theme.accent }} />
          </div>
        );
      })}

      {/* s2: "Then the research starts" + stamps + twelve tabs */}
      <div style={{ position: 'absolute', left: 300, top: 480, opacity: 1 - grey * 0.75 }}>
        <Words text="Then the research starts:" start={s2.start + 2} per={4} size={54} color={theme.muted} font={theme.display} weight={500} italic />
      </div>
      <div style={{ position: 'absolute', left: 300, top: 560, display: 'flex', gap: 18, opacity: 1 - grey * 0.75 }}>
        {STAMPS.map((s, i) => {
          const p = pop(frame, fps, tStamps + i * 7, { damping: 11, stiffness: 220 });
          return (
            <div key={s} style={{ padding: '10px 22px', border: `3px solid ${theme.accent}`, borderRadius: 8, fontFamily: theme.mono, fontSize: 30, fontWeight: 700, letterSpacing: 2, color: theme.accent, textTransform: 'uppercase', opacity: Math.min(1, p * 2), transform: `scale(${lerp(1.6, 1, p)}) rotate(${(i % 2 ? 1 : -1) * lerp(6, 2, p)}deg)` }}>
              {s}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 300, top: 660, display: 'flex', gap: 10, alignItems: 'flex-end', opacity: 1 - grey * 0.75 }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const p = pop(frame, fps, tTabs + i * 2, { damping: 14, stiffness: 200 });
          return <div key={i} style={{ width: 96, height: 34, borderRadius: '8px 8px 0 0', background: theme.panel, border: `1px solid ${theme.line}`, borderBottom: `3px solid ${theme.line}`, opacity: Math.min(1, p * 2), transform: `translateY(${lerp(20, 0, p)}px)` }} />;
        })}
        <div style={{ fontFamily: theme.display, fontSize: 34, color: theme.muted, marginLeft: 10, opacity: fadeIn(frame, tTabs + 26, 8) }}>twelve tabs deep.</div>
      </div>

      {/* s3: the headline */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 770, textAlign: 'center', opacity: fadeIn(frame, s3.start, 8) }}>
        <Words text="And none of it gets written down." start={s3.start} per={4} size={76} color={theme.ink} font={theme.display} weight={700} />
        <div style={{ margin: '16px auto 0', height: 5, width: lerp(0, 300, easeOut((frame - s3.start - 16) / 18)), borderRadius: 3, background: theme.accent }} />
      </div>
      <AbsoluteFill style={{ opacity: fadeOut(frame, s3.start + 40, 1) * 0 }} />
    </AbsoluteFill>
  );
};
