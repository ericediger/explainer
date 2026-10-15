import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

/**
 * Cold open on a saved article, one beat per sentence:
 *   s0 "Another long read you meant to get to."   → the article card slides up, "Saved for later"
 *   s1 "It's good."                                → a "worth your time" pill
 *   s2 "It's also two thousand words, and the afternoon is already spoken for." → the word count ticks up; the afternoon fills with meetings
 *   s3 "You could skim it."                        → the text races past
 *   s4 "Or you could just press play."             → a play button lands on the card and a waveform starts
 */
const CARD = { x: 250, y: 150, w: 860, h: 700 };
const LINES = [0.96, 0.88, 0.93, 0.6, 0.9, 0.95, 0.85, 0.92, 0.7, 0.94, 0.9, 0.88, 0.5, 0.93, 0.91, 0.86, 0.95, 0.66, 0.9, 0.92, 0.87, 0.4];
const MEETINGS = [
  { t: '1:00', name: 'Roadmap review', len: 2 },
  { t: '2:00', name: 'Hiring sync', len: 1 },
  { t: '3:00', name: 'Design crit', len: 2 },
  { t: '4:30', name: 'One-to-one', len: 1 },
  { t: '5:00', name: 'Planning', len: 2 },
];

const Words: React.FC<{ text: string; start: number; per: number; size: number; colors: string[]; font: string }> = ({ text, start, per, size, colors, font }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <span style={{ fontFamily: font, fontSize: size, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.05 }}>
      {text.split(' ').map((w, i) => {
        const p = pop(frame, fps, start + i * per, { damping: 13, stiffness: 160 });
        return (
          <span key={i} style={{ display: 'inline-block', marginRight: '0.24em', color: colors[i] ?? colors[0], opacity: Math.min(1, p * 1.6), transform: `translateY(${lerp(34, 0, p)}px) scale(${lerp(0.9, 1, p)})` }}>
            {w}
          </span>
        );
      })}
    </span>
  );
};

export const ColdOpen: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1, s2, s3, s4] = spansFor(scene, fps);
  const d2 = s2.end - s2.start;
  const d3 = s3.end - s3.start;

  const pCard = pop(frame, fps, s0.start - 6, { damping: 17 });
  const pGood = pop(frame, fps, s1.start + 2, { damping: 12, stiffness: 150 });

  // Word count ticks up over the first half of s2; the afternoon fills over the second half
  const count = Math.round(2000 * easeOut((frame - s2.start - 2) / (d2 * 0.45)));
  const tCal = s2.start + d2 * 0.42;
  const pCal = pop(frame, fps, tCal, { damping: 16 });

  // Skim: the text races up the card
  const skim = easeOut((frame - s3.start) / d3);
  const scroll = skim * 900;
  const blur = frame >= s3.start && frame < s4.start ? Math.sin(Math.min(1, (frame - s3.start) / d3) * Math.PI) * 3 : 0;

  // Play
  const pPlay = pop(frame, fps, s4.start + 2, { damping: 11, stiffness: 140 });
  const dimCard = 1 - 0.55 * easeOut((frame - s4.start) / 12);
  const calOut = 1 - easeOut((frame - s4.start) / 10);

  return (
    <AbsoluteFill>
      {/* The article card */}
      <div
        style={{
          position: 'absolute',
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 22,
          background: '#f8f7f3',
          boxShadow: '0 40px 90px rgba(0,0,0,.5)',
          overflow: 'hidden',
          opacity: Math.min(1, pCard * 1.5),
          transform: `translateY(${lerp(70, 0, pCard)}px) rotate(${lerp(-1.5, -0.6, pCard)}deg)`,
          filter: `brightness(${dimCard})`,
        }}
      >
        <div style={{ padding: '34px 44px 0' }}>
          <div style={{ fontFamily: theme.mono, fontSize: 15, letterSpacing: 3, color: '#b3261e', fontWeight: 700 }}>THE MERIDIAN REVIEW · CULTURE</div>
          <div style={{ fontFamily: 'Charter, "Iowan Old Style", Georgia, serif', fontSize: 50, lineHeight: 1.08, fontWeight: 700, color: '#111827', marginTop: 14, letterSpacing: -0.6 }}>The Quiet Return of the Night Train</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, fontFamily: theme.font, fontSize: 18, color: '#6b7280' }}>
            <div style={{ width: 30, height: 30, borderRadius: 15, background: '#2f4b7c' }} />
            <span>Imogen Hale</span>
            <span style={{ width: 4, height: 4, borderRadius: 2, background: '#c4c9d2' }} />
            <span>11 min read</span>
            <span style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 999, background: '#fff', border: `2px solid ${theme.accent}`, color: '#0f8a63', fontWeight: 700, fontSize: 16, opacity: Math.min(1, pGood * 1.5), transform: `scale(${lerp(0.6, 1, pGood)}) rotate(${lerp(-10, -3, pGood)}deg)` }}>
              ★ Worth your time
            </span>
          </div>
        </div>
        <div style={{ position: 'relative', height: 480, marginTop: 26, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 44, right: 44, top: 0, transform: `translateY(${-scroll}px)`, filter: blur ? `blur(${blur}px)` : undefined }}>
            {[...LINES, ...LINES, ...LINES].map((w, i) => (
              <div key={i} style={{ height: 13, width: `${w * 100}%`, borderRadius: 7, background: i % 11 === 0 ? '#9aa3af' : '#d7dbe2', marginBottom: 15, marginTop: i % 11 === 0 && i ? 22 : 0 }} />
            ))}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: 'linear-gradient(180deg, rgba(248,247,243,0), #f8f7f3)' }} />
        </div>
        {/* Saved-for-later ribbon */}
        <div style={{ position: 'absolute', right: -42, top: 34, transform: 'rotate(40deg)', width: 220, textAlign: 'center', padding: '7px 0', background: theme.warm, color: '#3d2e06', fontFamily: theme.font, fontWeight: 800, fontSize: 15, letterSpacing: 1.5 }}>SAVED FOR LATER</div>
      </div>

      {/* Word count */}
      <div style={{ position: 'absolute', left: 1200, top: 160, opacity: fadeIn(frame, s2.start, 8) * calOut }}>
        <div style={{ fontFamily: theme.display, fontSize: 136, fontWeight: 800, letterSpacing: -5, color: theme.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString('en-US')}</div>
        <div style={{ fontFamily: theme.mono, fontSize: 22, letterSpacing: 5, color: theme.muted, marginTop: 6 }}>WORDS</div>
      </div>

      {/* The afternoon, filling up */}
      <div style={{ position: 'absolute', left: 1200, top: 380, width: 480, opacity: Math.min(1, pCal * 1.5) * calOut, transform: `translateY(${lerp(30, 0, pCal)}px)` }}>
        <div style={{ fontFamily: theme.mono, fontSize: 16, letterSpacing: 4, color: theme.muted, marginBottom: 12 }}>THIS AFTERNOON</div>
        <div style={{ position: 'relative', height: 420, borderLeft: `2px solid ${theme.line}` }}>
          {['1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'].map((h, i) => (
            <div key={h} style={{ position: 'absolute', left: -2, top: i * 80, width: '100%', borderTop: `1px solid ${theme.line}`, fontFamily: theme.mono, fontSize: 14, color: theme.muted, paddingLeft: 10, paddingTop: 4 }}>{h}</div>
          ))}
          {MEETINGS.map((m, i) => {
            const hour = parseFloat(m.t.replace(':30', '.5').replace(':00', '')) - 1;
            const p = pop(frame, fps, tCal + 6 + i * Math.max(3, (d2 * 0.5) / MEETINGS.length), { damping: 15, stiffness: 170 });
            return (
              <div key={m.name} style={{ position: 'absolute', left: 70, right: 0, top: hour * 80 + 4, height: m.len * 80 * 0.5 - 8 + (m.len - 1) * 40, borderRadius: 10, background: `${theme.blue}26`, borderLeft: `4px solid ${theme.blue}`, padding: '8px 14px', fontFamily: theme.font, fontSize: 18, color: theme.ink, fontWeight: 600, opacity: Math.min(1, p * 1.5), transform: `translateX(${lerp(40, 0, p)}px) scaleY(${lerp(0.4, 1, p)})`, transformOrigin: '0 0' }}>
                {m.name}
                <div style={{ fontSize: 14, color: theme.muted, fontWeight: 500 }}>{m.t}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Press play */}
      <div style={{ position: 'absolute', left: CARD.x + CARD.w / 2 - 110, top: CARD.y + CARD.h / 2 - 110, width: 220, height: 220, borderRadius: 110, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDeep})`, boxShadow: `0 0 ${60 * pPlay}px ${theme.accent}80, 0 30px 70px rgba(0,0,0,.5)`, display: 'grid', placeItems: 'center', opacity: Math.min(1, pPlay * 1.6), transform: `scale(${lerp(0.3, 1, pPlay)})` }}>
        <svg width="96" height="96" viewBox="0 0 24 24" fill="#060810" style={{ marginLeft: 10 }}>
          <polygon points="6,4 20,12 6,20" />
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 1200, top: 300, opacity: fadeIn(frame, s4.start + 4, 8) }}>
        <Words text="Or just listen." start={s4.start + 4} per={5} size={112} colors={[theme.ink, theme.ink, theme.accent]} font={theme.display} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height: 110, marginTop: 36, opacity: Math.min(1, pPlay * 1.4) }}>
          {Array.from({ length: 26 }).map((_, i) => {
            const h = 14 + 86 * Math.abs(Math.sin(frame / 5 + i * 0.7) * Math.cos(frame / 11 + i * 0.3));
            return <div key={i} style={{ width: 11, height: h * Math.min(1, pPlay), borderRadius: 6, background: i % 3 === 0 ? theme.accent : i % 3 === 1 ? theme.blue : theme.accentDeep }} />;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
