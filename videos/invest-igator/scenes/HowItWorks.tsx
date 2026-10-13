import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeInOut, easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

const INPUT = { x: 180, y: 470, w: 380, h: 120 };
const APP = { x: 700, y: 330, w: 520, h: 400 };
const FILES = { x: 1360, y: 330, w: 400 };
const STEPS = [
  { label: 'Verify the listing', detail: 'exchange · currency · what it does' },
  { label: 'Feeds: dated price, filings', detail: 'Tiingo close · SEC EDGAR' },
  { label: 'OpenAI research', detail: 'one rule: cite every claim' },
];
const SLOTS: { name: string; color: (t: ReturnType<typeof useTheme>) => string }[] = [
  { name: 'Watch', color: (t) => t.blue },
  { name: 'Research', color: (t) => t.muted },
  { name: 'Declined', color: (t) => t.muted },
];

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span style={{ fontSize: 13, fontWeight: 650, color, background: `${color}22`, border: `1px solid ${color}55`, borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap' }}>{text}</span>
);

export const HowItWorks: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1, s2, s3, s4] = spansFor(scene, fps);
  const d1 = s1.end - s1.start;
  const d2 = s2.end - s2.start;
  const d3 = s3.end - s3.start;

  // Beats
  const tTop = s0.start;
  const tInput = s1.start;
  const typed = Math.min(1, Math.max(0, (frame - tInput - 4) / (d1 * 0.8)));
  const tApp = s2.start;
  const tSteps = [s2.start + 2, s2.start + d2 * 0.3, s2.start + d2 * 0.58];
  const tFlow = s2.start + 4;
  const tFiles = s3.start;
  const tCard = s3.start + d3 * 0.35;
  const tLock = s4.start;

  const pTop = pop(frame, fps, tTop, { damping: 16 });
  const pInput = pop(frame, fps, tInput, { damping: 16 });
  const pApp = pop(frame, fps, tApp, { damping: 14 });
  const pFiles = pop(frame, fps, tFiles, { damping: 16 });
  const pCard = easeInOut((frame - tCard) / 26);
  const pLock = pop(frame, fps, tLock, { damping: 12, stiffness: 150 });
  const flowOn = frame >= tFlow ? Math.min(1, (frame - tFlow) / 10) : 0;
  const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 1.6);

  const query = 'Helios Transformers';
  const shown = query.slice(0, Math.round(typed * query.length));

  const inputRight = { x: INPUT.x + INPUT.w, y: INPUT.y + INPUT.h / 2 };
  const appLeft = { x: APP.x, y: APP.y + APP.h / 2 };
  const appRight = { x: APP.x + APP.w, y: APP.y + APP.h / 2 };
  const filesLeft = { x: FILES.x, y: APP.y + APP.h / 2 };

  // The filed card flies from the app's right edge into the Watch slot.
  const slotY = (i: number) => FILES.y + 56 + i * 92;
  const cardFrom = { x: APP.x + APP.w - 60, y: APP.y + APP.h / 2 - 28 };
  const cardTo = { x: FILES.x + 16, y: slotY(0) + 10 };

  return (
    <AbsoluteFill>
      {/* Top card: where it runs */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 110,
          display: 'flex',
          justifyContent: 'center',
          opacity: Math.min(1, pTop * 1.5),
          transform: `translateY(${lerp(-30, 0, pTop)}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '18px 30px', borderRadius: 16, background: theme.panel, border: `1px solid ${theme.line}`, boxShadow: '0 20px 50px rgba(0,0,0,.14)' }}>
          <div style={{ width: 54, height: 54, borderRadius: 12, background: theme.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>IG</div>
          <div>
            <div style={{ fontFamily: theme.display, fontSize: 30, fontWeight: 700, color: theme.ink, letterSpacing: -0.5 }}>INVEST-IGATOR</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {['runs on your own machine', 'one SQLite file', 'no account', 'never trades'].map((t) => (
                <Pill key={t} text={t} color={theme.accent} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connectors */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <line x1={inputRight.x + 14} y1={inputRight.y} x2={appLeft.x - 6} y2={appLeft.y} stroke={theme.line} strokeWidth={3} strokeDasharray="6 8" opacity={pInput * 0.9} />
        <line x1={appRight.x + 6} y1={appRight.y} x2={filesLeft.x - 14} y2={filesLeft.y} stroke={theme.line} strokeWidth={3} strokeDasharray="6 8" opacity={pFiles * 0.9} />
        {flowOn > 0 &&
          [0, 1, 2, 3, 4].map((i) => {
            const u = ((frame - tFlow) / 40 + i / 5) % 1;
            return <circle key={i} cx={lerp(inputRight.x + 14, appLeft.x - 6, u)} cy={inputRight.y} r={5} fill={theme.warm} opacity={flowOn * (0.35 + 0.65 * Math.sin(u * Math.PI))} />;
          })}
        {pApp > 0 &&
          [0, 1].map((i) => (
            <rect key={i} x={APP.x - 10 - i * 12 - pulse * 3} y={APP.y - 10 - i * 12 - pulse * 3} width={APP.w + 20 + i * 24 + pulse * 6} height={APP.h + 20 + i * 24 + pulse * 6} rx={26 + i * 8} fill="none" stroke={theme.accent} strokeWidth={1.5} opacity={pApp * (0.3 - i * 0.12) * (1 - pulse * 0.4)} />
          ))}
      </svg>

      {/* Input */}
      <div style={{ position: 'absolute', left: INPUT.x, top: INPUT.y, width: INPUT.w, height: INPUT.h, opacity: Math.min(1, pInput * 1.5), transform: `scale(${lerp(0.85, 1, pInput)})` }}>
        <div style={{ fontSize: 14, letterSpacing: 1.6, color: theme.muted, fontWeight: 650, marginBottom: 10 }}>ADD COMPANIES</div>
        <div style={{ height: 58, borderRadius: 10, background: theme.panel2, border: `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 22, color: theme.ink, boxShadow: '0 20px 50px rgba(0,0,0,.14)' }}>
          {shown}
          <span style={{ width: 2, height: 28, background: theme.accent, marginLeft: 3, opacity: frame % 20 < 12 ? 1 : 0 }} />
        </div>
        <div style={{ marginTop: 10, fontSize: 15, color: theme.muted }}>a name or a ticker · “HLTR” works too</div>
      </div>

      {/* The app: three steps */}
      <div
        style={{
          position: 'absolute',
          left: APP.x,
          top: APP.y,
          width: APP.w,
          height: APP.h,
          borderRadius: 22,
          background: theme.panel,
          border: `1px solid ${theme.line}`,
          boxShadow: `0 24px 60px rgba(0,0,0,.18), 0 0 ${40 + pulse * 20}px ${theme.accent}2e`,
          opacity: Math.min(1, pApp * 1.5),
          transform: `scale(${lerp(0.85, 1, pApp)})`,
          padding: '22px 26px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: theme.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700 }}>IG</div>
          <div style={{ fontSize: 20, fontWeight: 650, color: theme.ink }}>one research run</div>
        </div>
        {STEPS.map((s, i) => {
          const p = pop(frame, fps, tSteps[i], { damping: 15, stiffness: 120 });
          return (
            <div key={s.label} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px', marginBottom: 12, borderRadius: 12, background: theme.panel2, border: `1px solid ${theme.line}`, opacity: Math.min(1, p * 1.5), transform: `translateX(${lerp(40, 0, p)}px)` }}>
              <div style={{ width: 30, height: 30, borderRadius: 15, background: theme.accentDeep, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 650, color: theme.ink }}>{s.label}</div>
                <div style={{ fontSize: 14, color: theme.muted, marginTop: 2 }}>{s.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filing slots */}
      <div style={{ position: 'absolute', left: FILES.x, top: FILES.y, width: FILES.w, opacity: Math.min(1, pFiles * 1.5), transform: `scale(${lerp(0.85, 1, pFiles)})` }}>
        <div style={{ fontSize: 14, letterSpacing: 1.6, color: theme.muted, fontWeight: 650, marginBottom: 10 }}>FILED AS</div>
        {SLOTS.map((s, i) => {
          const color = s.color(theme);
          const lit = i === 0 && pCard > 0.9;
          return (
            <div key={s.name} style={{ position: 'absolute', left: 0, top: 56 + i * 92 - 26, width: FILES.w, height: 76, borderRadius: 12, border: `1px dashed ${lit ? theme.accent : theme.line}`, background: lit ? `${theme.accent}14` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px', transition: 'border-color .2s' }}>
              <Pill text={s.name} color={i === 0 ? color : theme.muted} />
            </div>
          );
        })}
        {/* Invested: locked, yours only */}
        <div style={{ position: 'absolute', left: 0, top: 56 + 3 * 92 - 26 + 18, width: FILES.w, height: 76, borderRadius: 12, border: `1px solid ${theme.violet}66`, background: `${theme.violet}12`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', opacity: Math.min(1, pLock * 1.5), transform: `scale(${lerp(0.9, 1, pLock)})` }}>
          <span style={{ fontSize: 16, color: theme.ink, fontWeight: 650 }}>🔒 only you can set this</span>
          <Pill text="Invested" color={theme.violet} />
        </div>
      </div>

      {/* The company card, filed into Watch */}
      {pCard > 0 && (
        <div
          style={{
            position: 'absolute',
            left: lerp(cardFrom.x, cardTo.x, pCard),
            top: lerp(cardFrom.y, cardTo.y, pCard),
            width: 250,
            height: 56,
            borderRadius: 10,
            background: theme.panel2,
            border: `1px solid ${theme.accent}88`,
            boxShadow: `0 12px 30px rgba(0,0,0,.2), 0 0 ${16 * pCard}px ${theme.accent}59`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            opacity: Math.min(1, pCard * 3),
            transform: `rotate(${lerp(-6, 0, pCard)}deg)`,
          }}
        >
          <span style={{ fontFamily: theme.mono, fontSize: 14, fontWeight: 700, color: theme.accent }}>HLTR</span>
          <span style={{ fontSize: 16, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Helios Transformers</span>
        </div>
      )}

      {/* Caption under the diagram */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 836,
          textAlign: 'center',
          fontFamily: theme.mono,
          fontSize: 20,
          color: theme.accent,
          opacity: fadeIn(frame, tCard + 20, 12),
        }}
      >
        the model reports only what it can cite · the app computes every multiple · every change is logged
      </div>
    </AbsoluteFill>
  );
};
