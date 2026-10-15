import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

/**
 * Cold open on a split-flap departures board, one beat per sentence:
 *   s0 "Friday in Austin, back Sunday night."      → the two legs flap into place
 *   s1 "Simple question: what's flying?"           → flight and fare cells flip to "?", the question lands
 *   s2 "Usually that means a fare site, carrier filters and a stack of tabs." → a browser fills with tabs
 *   s3 "Then you jot down flight numbers just to find them again when you book." → a sticky note, then "Book · which one?"
 */
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$';
const COLS = [
  { label: 'DAY', w: 6 },
  { label: 'FROM', w: 3 },
  { label: 'TO', w: 3 },
  { label: 'FLIGHT', w: 6 },
  { label: 'FARE', w: 4 },
];
const LEGS = [
  ['FRI 23', 'PHL', 'AUS'],
  ['SUN 25', 'AUS', 'PHL'],
];
const TILE = 36;
const GAP = 4;

const Tile: React.FC<{ ch: string; color: string; flip: number }> = ({ ch, color, flip }) => (
  <div
    style={{
      width: TILE,
      height: 52,
      borderRadius: 5,
      background: 'linear-gradient(180deg, #0c2a36 0%, #0a2430 49%, #041820 51%, #072029 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06), 0 2px 4px rgba(0,0,0,.35)',
      display: 'grid',
      placeItems: 'center',
      fontFamily: '"SF Mono", Menlo, monospace',
      fontSize: 30,
      fontWeight: 700,
      color,
      position: 'relative',
      transform: `scaleY(${1 - 0.25 * flip})`,
    }}
  >
    {ch.trim() ? ch : ''}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 25, height: 2, background: 'rgba(0,0,0,.55)' }} />
  </div>
);

const Words: React.FC<{ text: string; start: number; per: number; size: number; colors: string[]; font: string }> = ({ text, start, per, size, colors, font }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <span style={{ fontFamily: font, fontSize: size, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
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

const TAB_TITLES = ['Fare search', 'Delta', 'United', 'American', 'Fare search', 'Flight status', 'Seat map', 'Fare search', 'Bag fees', 'Fare search', 'Calendar'];
const NOTE_LINES = ['AA 2154  8:05a  $312?', 'UA via ORD  6:30a  $298', 'DL via ATL  $287 ??'];

export const ColdOpen: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1, s2, s3] = spansFor(scene, fps);
  const d2 = s2.end - s2.start;
  const d3 = s3.end - s3.start;

  // Board
  const pBoard = pop(frame, fps, s0.start - 8, { damping: 18 });
  const dim = 1 - 0.45 * easeOut((frame - s2.start) / 14);
  const qOn = frame >= s1.start + 4;
  const blink = Math.floor(frame / 9) % 2 === 0 ? 1 : 0.45;

  const rows = LEGS.map((leg, r) => {
    const tiles: { ch: string; color: string; settle: number; start: number; seed: number; gap?: boolean }[] = [];
    COLS.forEach((c, ci) => {
      const target = ci < 3 ? leg[ci] : qOn ? (ci === 3 ? '??????' : '$???') : '';
      const isQ = ci >= 3;
      for (let k = 0; k < c.w; k++) {
        const idx = tiles.length;
        const ch = (target[k] ?? ' ').toString();
        const start = isQ ? s1.start + 2 : s0.start + r * 10;
        const settle = isQ ? s1.start + 6 + k * 1.5 + r * 4 : s0.start + 6 + idx * 1.3 + r * 10;
        tiles.push({ ch, color: isQ ? theme.red : theme.ink, settle, start, seed: idx + r * 31 });
      }
      if (ci < COLS.length - 1) tiles.push({ ch: ' ', color: theme.ink, settle: 0, start: 0, seed: 0, gap: true });
    });
    return tiles;
  });

  // Chaos: a browser filling with tabs, flickering carrier filters
  const pBrowser = pop(frame, fps, s2.start + 2, { damping: 16 });
  const nTabs = Math.max(1, Math.min(TAB_TITLES.length, 1 + Math.floor(((frame - s2.start) / (d2 * 0.75)) * (TAB_TITLES.length - 1))));
  const BROWSER = { x: 230, y: 610, w: 800, h: 300 };
  const tabW = Math.min(170, (BROWSER.w - 110) / nTabs);
  const chipsOn = frame >= s2.start + d2 * 0.35;

  // Sticky note, then the booking question
  const pNote = pop(frame, fps, s3.start, { damping: 12, stiffness: 130 });
  const tLightning = s3.start + d3 * 0.6;
  const pLight = pop(frame, fps, tLightning, { damping: 14 });
  const glow = easeOut((frame - (tLightning + 10)) / 16);

  return (
    <AbsoluteFill>
      {/* Departures board */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 560,
          top: 120,
          width: 1120,
          padding: '22px 34px 26px',
          borderRadius: 20,
          background: 'linear-gradient(180deg, #021b25, #011219)',
          border: `1px solid ${theme.line}`,
          boxShadow: '0 30px 80px rgba(0,0,0,.45)',
          opacity: Math.min(1, pBoard * 1.5) * dim,
          transform: `translateY(${lerp(-24, 0, pBoard)}px) scale(${lerp(1, 0.94, (1 - dim) / 0.45)})`,
          transformOrigin: '50% 0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontFamily: theme.display, fontWeight: 700, fontSize: 26, letterSpacing: 6, color: theme.ink }}>DEPARTURES</div>
          <div style={{ fontFamily: '"SF Mono", Menlo, monospace', fontSize: 16, letterSpacing: 3, color: theme.accent }}>THIS WEEKEND</div>
        </div>
        <div style={{ display: 'flex', gap: GAP, marginBottom: 8 }}>
          {COLS.map((c, ci) => (
            <div key={c.label} style={{ width: c.w * (TILE + GAP) - GAP + (ci < COLS.length - 1 ? TILE + GAP : 0), fontFamily: '"SF Mono", Menlo, monospace', fontSize: 14, letterSpacing: 3, color: theme.muted }}>
              {c.label}
            </div>
          ))}
        </div>
        {rows.map((tiles, r) => (
          <div key={r} style={{ display: 'flex', gap: GAP, marginTop: r ? 10 : 0 }}>
            {tiles.map((t, i) => {
              if (t.gap) return <div key={i} style={{ width: TILE }} />;
              const settled = frame >= t.settle;
              const ch = frame < t.start ? ' ' : settled ? t.ch : CHARSET[(Math.floor(frame / 2) * 7 + t.seed * 13) % CHARSET.length];
              const flip = !settled && frame >= t.start ? (frame % 2) * 0.6 : 0;
              const color = t.color === theme.red && settled ? theme.red : t.color === theme.red ? theme.muted : theme.ink;
              return (
                <div key={i} style={{ opacity: t.color === theme.red && settled ? blink : 1 }}>
                  <Tile ch={ch} color={color} flip={flip} />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* The question */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 452, textAlign: 'center', opacity: dim }}>
        <Words text="What's flying?" start={s1.start + Math.round((s1.end - s1.start) * 0.42)} per={6} size={104} colors={[theme.ink, theme.blue]} font={theme.display} />
      </div>

      {/* A browser filling with tabs */}
      <div
        style={{
          position: 'absolute',
          left: BROWSER.x,
          top: BROWSER.y,
          width: BROWSER.w,
          height: BROWSER.h,
          borderRadius: 14,
          overflow: 'hidden',
          background: '#f4f7f9',
          boxShadow: '0 30px 70px rgba(0,0,0,.45)',
          opacity: Math.min(1, pBrowser * 1.5),
          transform: `translateY(${lerp(40, 0, pBrowser)}px) rotate(${lerp(-2, -1, pBrowser)}deg)`,
        }}
      >
        <div style={{ height: 40, background: '#dfe3e8', display: 'flex', alignItems: 'flex-end', padding: '0 10px', gap: 2 }}>
          <div style={{ alignSelf: 'center', display: 'flex', gap: 6, marginRight: 10 }}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c }} />)}
          </div>
          {TAB_TITLES.slice(0, nTabs).map((t, i) => (
            <div key={i} style={{ width: tabW, height: 30, borderRadius: '8px 8px 0 0', background: i === nTabs - 1 ? '#fff' : '#eceff2', padding: '0 8px', display: 'flex', alignItems: 'center', fontFamily: theme.font, fontSize: 13, color: '#3c4043', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tabW > 46 ? t : ''}
            </div>
          ))}
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: theme.font, fontSize: 15, color: '#5f6368' }}>
            <span style={{ fontWeight: 700, color: '#3c4043' }}>Airlines</span>
            {['DL', 'UA', 'AA'].map((c, i) => {
              const on = chipsOn ? (Math.floor(frame / 7) + i) % 3 !== 0 : true;
              return (
                <span key={c} style={{ padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 14, border: `2px solid ${on ? theme.accent : '#c9d1d7'}`, background: on ? theme.accent : '#fff', color: on ? '#fff' : '#9aa3a9' }}>
                  {c}
                </span>
              );
            })}
            <span style={{ marginLeft: 16 }}>Stops ▾</span>
            <span>Times ▾</span>
            <span>Price ▾</span>
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ marginTop: 14, height: 46, borderRadius: 8, background: '#fff', border: '1px solid #e1e7eb', display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px', opacity: fadeIn(frame, s2.start + 10 + i * 6, 8) }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: '#d6dde2' }} />
              <div style={{ width: 160 + i * 30, height: 10, borderRadius: 5, background: '#d6dde2' }} />
              <div style={{ marginLeft: 'auto', width: 60, height: 12, borderRadius: 6, background: '#c7e3b4' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Sticky note */}
      <div
        style={{
          position: 'absolute',
          left: 1110,
          top: 600,
          width: 360,
          height: 290,
          padding: '30px 26px',
          background: 'linear-gradient(180deg, #fff6b8, #fbec8f)',
          boxShadow: '0 24px 50px rgba(0,0,0,.45)',
          borderRadius: 4,
          opacity: Math.min(1, pNote * 2),
          transform: `translateY(${lerp(60, 0, pNote)}px) rotate(${lerp(8, 3, pNote)}deg) scale(${lerp(0.8, 1, pNote)})`,
          fontFamily: 'Noteworthy, "Marker Felt", "Bradley Hand", cursive',
          color: '#2a3340',
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Austin — Fri</div>
        {NOTE_LINES.map((l, i) => {
          const t0 = s3.start + 6 + i * Math.max(5, d3 * 0.12);
          const w = easeOut((frame - t0) / 10);
          return (
            <div key={l} style={{ fontSize: 23, lineHeight: 1.55, whiteSpace: 'nowrap', overflow: 'hidden', width: `${w * 100}%`, position: 'relative' }}>
              {l}
              {i === 2 ? <div style={{ position: 'absolute', left: 0, top: 18, height: 3, borderRadius: 2, background: '#c2453a', width: `${easeOut((frame - t0 - 12) / 8) * 100}%` }} /> : null}
            </div>
          );
        })}
      </div>

      {/* …just to find them again when you book */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <path d="M 1480 745 C 1520 745, 1540 745, 1572 745" stroke={theme.muted} strokeWidth={3} fill="none" strokeDasharray="6 7" opacity={pLight} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 1585,
          top: 712,
          padding: '14px 24px',
          borderRadius: 14,
          border: `2px solid ${glow > 0 ? theme.red : theme.line}`,
          background: glow > 0 ? `rgba(224,50,136,${0.14 * glow})` : 'transparent',
          boxShadow: `0 0 ${36 * glow}px rgba(224,50,136,${0.45 * glow})`,
          fontFamily: theme.display,
          fontSize: 26,
          fontWeight: 700,
          color: theme.ink,
          opacity: Math.min(1, pLight * 1.5),
          transform: `scale(${lerp(0.85, 1, pLight)})`,
          whiteSpace: 'nowrap',
        }}
      >
        Book <span style={{ color: theme.red, opacity: 0.55 + 0.45 * glow }}>· which one?</span>
      </div>
    </AbsoluteFill>
  );
};
