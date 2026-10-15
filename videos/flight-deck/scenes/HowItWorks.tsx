import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

/**
 * The pipeline, one stage per sentence:
 *   s0 "Flight Deck lives in Chrome's side panel."              → the product card
 *   s1 "Type or say what you need."                             → your words (typed, mic pulsing)
 *   s2 "Claude turns it into a precise search."                 → the parsed fields
 *   s3 "Live Google Flights fares come back for Delta, United and American." → fares
 *   s4 "And a quick take tells you which one to pick."          → the take, read aloud, then Google Flights
 */
const NODE_W = 370;
const NODE_H = 330;
const NODE_Y = 396;
const GAP = 66;
const X0 = (1920 - (4 * NODE_W + 3 * GAP)) / 2;
const nodeX = (i: number) => X0 + i * (NODE_W + GAP);

const FIELDS = ['PHL → AUS', 'Fri Oct 23 – Sun Oct 25', 'Round trip · Economy', 'Carriers: DL · UA · AA'];
const FARES = [
  { code: 'AA', bg: '#36495A', time: '8:05 AM  nonstop', price: '$312' },
  { code: 'UA', bg: '#1B3F8F', time: '6:30 AM  via ORD', price: '$298' },
  { code: 'DL', bg: '#7A2533', time: '7:15 AM  via ATL', price: '$287' },
];
const TAKE = 'American’s 8:05 AM nonstop is the pick: under four hours, and only $25 over the cheapest fare.';

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span style={{ fontSize: 16, fontWeight: 700, color, background: `${color}22`, border: `1px solid ${color}66`, borderRadius: 999, padding: '4px 12px', whiteSpace: 'nowrap' }}>{text}</span>
);

const Mic: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill={color} />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M12 18v3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const HowItWorks: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1, s2, s3, s4] = spansFor(scene, fps);
  const dur = (s: { start: number; end: number }) => s.end - s.start;

  const p = [s1, s2, s3, s4].map((s) => pop(frame, fps, s.start, { damping: 15 }));
  const pTop = pop(frame, fps, s0.start, { damping: 16 });
  const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2);

  const NODES = [
    { label: 'YOUR WORDS', title: 'Typed or spoken', color: theme.blue },
    { label: 'CLAUDE', title: 'Parses the request', color: theme.accent },
    { label: 'GOOGLE FLIGHTS', title: 'Live fares via SerpApi', color: theme.warm },
    { label: 'QUICK TAKE', title: 'The pick, in plain words', color: theme.red },
  ];

  const query = 'Philly to Austin Fri, back Sun';
  const typed = Math.max(0, Math.min(1, (frame - s1.start - 4) / (dur(s1) * 0.75)));
  const takeChars = Math.round(Math.max(0, Math.min(1, (frame - s4.start - 6) / (dur(s4) * 0.85))) * TAKE.length);
  const tBook = s4.start + dur(s4) * 0.7;

  return (
    <AbsoluteFill>
      {/* Product card */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 118, display: 'flex', justifyContent: 'center', opacity: Math.min(1, pTop * 1.5), transform: `translateY(${lerp(-30, 0, pTop)}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30, padding: '22px 34px', borderRadius: 18, background: '#003043', border: `1px solid ${theme.line}`, boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>
          <div style={{ width: 62, height: 62, borderRadius: 16, background: theme.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 36, boxShadow: `0 0 30px ${theme.accent}55` }}>✈</div>
          <div style={{ fontFamily: theme.display, fontSize: 44, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>Flight Deck</div>
          <div style={{ width: 1, height: 54, background: theme.line, margin: '0 4px' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            {['Chrome side panel', 'no server', 'open source'].map((t, i) => (
              <span key={t} style={{ opacity: fadeIn(frame, s0.start + 10 + i * 5, 8) }}>
                <Pill text={t} color={theme.blue} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Connectors with travelling dots */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {[0, 1, 2].map((i) => {
          const x1 = nodeX(i) + NODE_W + 8;
          const x2 = nodeX(i + 1) - 8;
          const y = NODE_Y + NODE_H / 2;
          const on = p[i + 1];
          const t0 = [s2, s3, s4][i].start;
          return (
            <g key={i} opacity={Math.min(1, on * 1.4)}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={theme.line} strokeWidth={3} strokeDasharray="5 7" />
              <path d={`M ${x2 - 12} ${y - 8} L ${x2} ${y} L ${x2 - 12} ${y + 8}`} stroke={theme.muted} strokeWidth={3} fill="none" strokeLinecap="round" />
              {frame >= t0 &&
                [0, 1, 2].map((k) => {
                  const u = ((frame - t0) / 26 + k / 3) % 1;
                  return <circle key={k} cx={lerp(x1, x2 - 14, u)} cy={y} r={5} fill={NODES[i + 1].color} opacity={0.3 + 0.7 * Math.sin(u * Math.PI)} />;
                })}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {NODES.map((n, i) => {
        const pi = p[i];
        const lit = i === 3 ? 0.5 + 0.5 * pulse : 0;
        return (
          <div
            key={n.label}
            style={{
              position: 'absolute',
              left: nodeX(i),
              top: NODE_Y,
              width: NODE_W,
              height: NODE_H,
              borderRadius: 20,
              background: theme.panel,
              border: `1px solid ${theme.line}`,
              borderTop: `4px solid ${n.color}`,
              boxShadow: `0 26px 60px rgba(0,0,0,.4)${i === 3 ? `, 0 0 ${30 + lit * 20}px ${n.color}33` : ''}`,
              padding: '20px 22px',
              opacity: Math.min(1, pi * 1.5),
              transform: `translateY(${lerp(36, 0, pi)}px) scale(${lerp(0.92, 1, pi)})`,
            }}
          >
            <div style={{ fontFamily: '"SF Mono", Menlo, monospace', fontSize: 15, letterSpacing: 3, color: n.color, fontWeight: 700 }}>{n.label}</div>
            <div style={{ fontFamily: theme.display, fontSize: 26, fontWeight: 700, color: theme.ink, marginTop: 6, letterSpacing: -0.3 }}>{n.title}</div>
            <div style={{ marginTop: 18 }}>
              {i === 0 && (
                <>
                  <div style={{ height: 60, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 19, color: '#3A3D3F', fontFamily: theme.font }}>
                    {query.slice(0, Math.round(typed * query.length))}
                    <span style={{ width: 2, height: 24, background: theme.accent, marginLeft: 2, opacity: frame % 20 < 12 ? 1 : 0 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22 }}>
                    <div style={{ width: 54, height: 54, borderRadius: 27, background: theme.red, display: 'grid', placeItems: 'center', boxShadow: `0 0 0 ${pulse * 12}px rgba(224,50,136,${0.35 * (1 - pulse)})` }}>
                      <Mic color="#fff" size={28} />
                    </div>
                    <div style={{ fontSize: 18, color: theme.muted, lineHeight: 1.35 }}>or tap the mic<br />and say it</div>
                  </div>
                </>
              )}
              {i === 1 &&
                FIELDS.map((f, k) => {
                  const pk = pop(frame, fps, s2.start + 6 + k * Math.max(4, dur(s2) * 0.14), { damping: 14, stiffness: 160 });
                  return (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', marginBottom: 9, borderRadius: 9, background: '#e8f4fa', borderLeft: `3px solid ${theme.accent}`, color: '#003043', fontSize: 18, fontWeight: 600, opacity: Math.min(1, pk * 1.5), transform: `translateX(${lerp(-30, 0, pk)}px)` }}>
                      {f}
                    </div>
                  );
                })}
              {i === 2 &&
                FARES.map((f, k) => {
                  const pk = pop(frame, fps, s3.start + 6 + k * Math.max(4, dur(s3) * 0.12), { damping: 14, stiffness: 160 });
                  return (
                    <div key={f.code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 10, borderRadius: 10, background: '#fff', border: '1px solid #dde5ea', opacity: Math.min(1, pk * 1.5), transform: `translateY(${lerp(20, 0, pk)}px)` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: f.bg, color: '#fff', fontWeight: 700, fontSize: 14, display: 'grid', placeItems: 'center' }}>{f.code}</div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: '#003043', whiteSpace: 'pre' }}>{f.time}</div>
                      <div style={{ marginLeft: 'auto', fontSize: 19, fontWeight: 700, color: '#75C044' }}>{f.price}</div>
                    </div>
                  );
                })}
              {i === 3 && (
                <>
                  <div style={{ minHeight: 132, padding: '12px 14px', borderRadius: 8, background: '#fff', borderLeft: `4px solid ${theme.red}`, fontSize: 18, lineHeight: 1.45, color: '#3A3D3F' }}>
                    {TAKE.slice(0, takeChars)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, color: theme.muted, fontSize: 17, opacity: fadeIn(frame, s4.start + 14, 10) }}>
                    <svg width="30" height="24" viewBox="0 0 30 24">
                      <path d="M3 9h5l6-5v16l-6-5H3z" fill={theme.ink} />
                      {[0, 1, 2].map((k) => (
                        <path key={k} d={`M ${18 + k * 4} ${8 - k * 2} q ${3 + k} ${4 + k * 2} 0 ${8 + k * 4}`} stroke={theme.red} strokeWidth={2} fill="none" strokeLinecap="round" opacity={(Math.sin(frame / 4 - k) + 1) / 2} />
                      ))}
                    </svg>
                    read aloud, if you like
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* …and on to Google Flights to book */}
      <div style={{ position: 'absolute', left: nodeX(3), width: NODE_W, top: NODE_Y + NODE_H + 30, display: 'flex', justifyContent: 'center', opacity: fadeIn(frame, tBook, 10), transform: `translateY(${lerp(14, 0, easeOut((frame - tBook) / 12))}px)` }}>
        <div style={{ padding: '12px 26px', borderRadius: 10, background: '#75C044', color: '#fff', fontWeight: 700, fontSize: 21, boxShadow: '0 14px 30px rgba(0,0,0,.35)' }}>Book This Trip ⚡ → Google Flights</div>
      </div>
      <div style={{ position: 'absolute', left: nodeX(0), width: 3 * NODE_W + 2 * GAP, top: NODE_Y + NODE_H + 44, fontFamily: '"SF Mono", Menlo, monospace', fontSize: 18, color: theme.muted, opacity: fadeIn(frame, tBook + 8, 12) }}>
        keys stay in your browser · calls go straight to Anthropic, SerpApi and OpenAI
      </div>
    </AbsoluteFill>
  );
};
