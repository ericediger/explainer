import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeInOut, easeOut, fadeIn, fadeOut, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

/**
 * Cold open, one beat per sentence:
 *   s0 "Every app needs a demo video."                       → an app window with a play badge: demo.mp4
 *   s1 "Recording one is the easy part."                     → REC lights, a timer runs, the clip is done ✓
 *   s2 "Then a button moves, a word changes, and you record the whole thing again." → "Save" becomes "Submit",
 *      the clip is stamped out of date, and take 2 and take 3 pile up beside it
 */
const HEAD = ['Every app needs a demo video.', 'Recording is the easy part.', 'Then something changes.'];
const CARD = { x: 410, y: 290, w: 800, h: 470 }; // x is the resting position once the takes pile up beside it

const Headline: React.FC<{ text: string; start: number; end: number; last?: boolean }> = ({ text, start, end, last }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = last ? 1 : fadeOut(frame, end - 8, 8);
  if (frame < start - 2 || out <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 118, textAlign: 'center', opacity: out }}>
      {text.split(' ').map((w, i) => {
        const p = pop(frame, fps, start + i * 4, { damping: 14, stiffness: 150 });
        return (
          <span key={i} style={{ display: 'inline-block', marginRight: '0.26em', fontFamily: theme.display, fontSize: 84, fontWeight: 700, letterSpacing: -2, color: theme.ink, opacity: Math.min(1, p * 1.6), transform: `translateY(${lerp(30, 0, p)}px) scale(${lerp(0.92, 1, p)})` }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const ColdOpen: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1, s2] = spansFor(scene, fps);
  const d2 = s2.end - s2.start;

  const pCard = pop(frame, fps, s0.start - 6, { damping: 16 });
  const pPlay = pop(frame, fps, s0.start + 8, { damping: 13, stiffness: 140 });
  const rec = frame >= s1.start + 2;
  const blink = Math.floor(frame / 8) % 2 === 0 ? 1 : 0.35;
  const timer = Math.max(0, Math.floor(((frame - s1.start) / fps) * 9));
  const done = easeOut((frame - (s1.end - 14)) / 10);

  const tChange = s2.start + d2 * 0.3;
  const changed = frame >= tChange;
  const flash = fadeOut(frame, tChange, 18);
  const stamp = pop(frame, fps, tChange + 10, { damping: 11, stiffness: 150 });
  const label = changed ? 'Submit' : 'Save';
  const cardX = lerp(CARD.x + 160, CARD.x, easeInOut((frame - (tChange + 12)) / 22));
  const takes = [0, 1, 2].map((i) => pop(frame, fps, tChange + 24 + i * 16, { damping: 14 }));

  return (
    <AbsoluteFill>
      <Headline text={HEAD[0]} start={s0.start} end={s0.end} />
      <Headline text={HEAD[1]} start={s1.start} end={s1.end} />
      <Headline text={HEAD[2]} start={s2.start} end={s2.end} last />

      {/* the app */}
      <div
        style={{
          position: 'absolute',
          left: cardX,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 18,
          background: '#fbf7f0',
          boxShadow: `0 40px 90px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.06)`,
          overflow: 'hidden',
          opacity: Math.min(1, pCard * 1.5),
          transform: `translateY(${lerp(40, 0, pCard)}px) scale(${lerp(0.94, 1, pCard)})`,
        }}
      >
        <div style={{ height: 46, background: '#e9e2d4', display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
          ))}
          <div style={{ marginLeft: 16, fontFamily: theme.mono, fontSize: 15, color: '#8a7f70' }}>my-app / settings</div>
        </div>
        <div style={{ padding: '34px 42px' }}>
          <div style={{ fontFamily: theme.display, fontSize: 34, fontWeight: 700, color: '#2a2520' }}>Notifications</div>
          {[0, 1].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
              <div style={{ width: 150, height: 14, borderRadius: 7, background: '#e2d9c8' }} />
              <div style={{ flex: 1, height: 46, borderRadius: 10, border: '2px solid #e2d9c8', background: '#fff' }} />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 38 }}>
            <div
              style={{
                padding: '14px 38px',
                borderRadius: 12,
                background: changed ? theme.accent : '#2a2520',
                color: '#fff',
                fontFamily: theme.font,
                fontSize: 24,
                fontWeight: 700,
                boxShadow: changed ? `0 0 ${34 * flash}px ${theme.accent}` : 'none',
                transform: `scale(${1 + 0.06 * flash})`,
              }}
            >
              {label}
            </div>
            <div style={{ width: 120, height: 14, borderRadius: 7, background: '#e2d9c8' }} />
          </div>
        </div>

        {/* play badge → REC */}
        <div style={{ position: 'absolute', right: 26, bottom: 24, display: 'flex', alignItems: 'center', gap: 14, opacity: Math.min(1, pPlay * 1.6), transform: `scale(${lerp(0.7, 1, pPlay)})`, transformOrigin: '100% 100%' }}>
          {rec ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999, background: 'rgba(24,20,17,.9)', color: '#fff', fontFamily: theme.mono, fontSize: 20, fontWeight: 700 }}>
              {done > 0.5 ? (
                <span style={{ color: '#7ee2a0' }}>✓ recorded</span>
              ) : (
                <>
                  <span style={{ width: 14, height: 14, borderRadius: 7, background: theme.red, opacity: blink }} />
                  REC 0:{String(timer).padStart(2, '0')}
                </>
              )}
            </div>
          ) : (
            <div style={{ width: 84, height: 84, borderRadius: 42, background: 'rgba(24,20,17,.88)', display: 'grid', placeItems: 'center' }}>
              <div style={{ width: 0, height: 0, marginLeft: 8, borderTop: '18px solid transparent', borderBottom: '18px solid transparent', borderLeft: '30px solid #fff' }} />
            </div>
          )}
        </div>
      </div>

      {/* the clip, stamped out of date */}
      <div
        style={{
          position: 'absolute',
          left: cardX + 30,
          top: CARD.y + CARD.h + 26,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 20px',
          borderRadius: 12,
          background: theme.panel,
          border: `1px solid ${theme.line}`,
          fontFamily: theme.mono,
          fontSize: 20,
          color: theme.ink,
          opacity: fadeIn(frame, s0.start + 14, 10),
        }}
      >
        <span style={{ color: theme.accent }}>▶</span> demo.mp4 <span style={{ color: theme.muted }}>· 2:00</span>
        <span
          style={{
            marginLeft: 8,
            padding: '4px 12px',
            border: `3px solid ${theme.red}`,
            color: theme.red,
            borderRadius: 8,
            fontWeight: 800,
            letterSpacing: 2,
            opacity: Math.min(1, stamp * 1.5),
            transform: `rotate(-6deg) scale(${lerp(1.7, 1, stamp)})`,
          }}
        >
          OUT OF DATE
        </span>
      </div>

      {/* take 2, take 3 … */}
      {[2, 3, 4].map((n, i) => (
        <div
          key={n}
          style={{
            position: 'absolute',
            left: CARD.x + CARD.w + 56,
            top: CARD.y + 40 + i * 96,
            width: 300,
            padding: '16px 22px',
            borderRadius: 12,
            background: theme.panel,
            border: `1px solid ${theme.line}`,
            fontFamily: theme.mono,
            fontSize: 20,
            color: theme.ink,
            display: 'flex',
            justifyContent: 'space-between',
            opacity: Math.min(1, takes[i] * 1.5),
            transform: `translateX(${lerp(-40, 0, takes[i])}px)`,
          }}
        >
          <span>
            <span style={{ color: theme.accent }}>↻</span> take {n}
          </span>
          <span style={{ color: theme.muted }}>re-record</span>
        </div>
      ))}
    </AbsoluteFill>
  );
};
