import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

/**
 * The pipeline, one stage per sentence:
 *   s0 "SpeakEasy lives in Chrome's side panel."                                  → the product card
 *   s1 "It lifts the text off the page, asks OpenAI for a summary …, and has it read aloud …" → ARTICLE → SUMMARY → NARRATION
 *   s2 "Each segment is checked against the text before you hear it."            → CHECK: segment scores, one retried
 *   s3 "Your key, your account, nothing in between."                              → the trust line
 */
const NODE_W = 370;
const NODE_H = 330;
const NODE_Y = 396;
const GAP = 66;
const X0 = (1920 - (4 * NODE_W + 3 * GAP)) / 2;
const nodeX = (i: number) => X0 + i * (NODE_W + GAP);

const LENGTHS = [
  { name: 'TL;DR', est: '~2 min', words: '300 words' },
  { name: 'Medium', est: '~5 min', words: '750 words' },
  { name: 'Full', est: 'as written', words: 'every word' },
];
const VOICES = ['Marin', 'Cedar', 'Alloy', 'Coral', 'Sage', '+5'];
const SEGMENTS = [
  { n: 1, score: '0.99', retry: false },
  { n: 2, score: '0.98', retry: false },
  { n: 3, score: '0.86', retry: true, after: '0.97' },
  { n: 4, score: '0.99', retry: false },
];

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span style={{ fontSize: 16, fontWeight: 700, color, background: `${color}22`, border: `1px solid ${color}66`, borderRadius: 999, padding: '4px 12px', whiteSpace: 'nowrap' }}>{text}</span>
);

const Speaker: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#060810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#060810" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

export const HowItWorks: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1, s2, s3] = spansFor(scene, fps);
  const d1 = s1.end - s1.start;
  const d2 = s2.end - s2.start;

  const starts = [s1.start, s1.start + d1 * 0.36, s1.start + d1 * 0.68, s2.start];
  const p = starts.map((s) => pop(frame, fps, s, { damping: 15 }));
  const pTop = pop(frame, fps, s0.start, { damping: 16 });
  const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2);

  const NODES = [
    { label: 'ARTICLE', title: 'Text, lifted off the page', color: theme.blue },
    { label: 'SUMMARY', title: 'At the length you choose', color: theme.accent },
    { label: 'NARRATION', title: 'In a voice you pick', color: theme.violet },
    { label: 'CHECK', title: 'Every segment, against the text', color: theme.warm },
  ];

  const lift = easeOut((frame - starts[0] - 8) / 18);
  const tTrust = s3.start;

  return (
    <AbsoluteFill>
      {/* Product card */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 118, display: 'flex', justifyContent: 'center', opacity: Math.min(1, pTop * 1.5), transform: `translateY(${lerp(-30, 0, pTop)}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30, padding: '22px 34px', borderRadius: 18, background: theme.panel, border: `1px solid ${theme.line}`, boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>
          <div style={{ width: 62, height: 62, borderRadius: 16, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDeep})`, display: 'grid', placeItems: 'center', boxShadow: `0 0 30px ${theme.accent}55` }}>
            <Speaker size={34} />
          </div>
          <div style={{ fontFamily: theme.display, fontSize: 44, fontWeight: 800, color: theme.ink, letterSpacing: -1.5 }}>SpeakEasy</div>
          <div style={{ width: 1, height: 54, background: theme.line, margin: '0 4px' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            {['Chrome side panel', 'your OpenAI key', 'no server'].map((t, i) => (
              <span key={t} style={{ opacity: fadeIn(frame, s0.start + 10 + i * 5, 8) }}>
                <Pill text={t} color={theme.accent} />
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
          const t0 = starts[i + 1];
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
            <div style={{ fontFamily: theme.mono, fontSize: 15, letterSpacing: 3, color: n.color, fontWeight: 700 }}>{n.label}</div>
            <div style={{ fontFamily: theme.display, fontSize: 25, fontWeight: 700, color: theme.ink, marginTop: 6, letterSpacing: -0.3, lineHeight: 1.15 }}>{n.title}</div>
            <div style={{ marginTop: 18 }}>
              {i === 0 && (
                <div style={{ position: 'relative', height: 200 }}>
                  {/* A page: headline, picture, lines; the lines lift out and turn mint */}
                  <div style={{ position: 'absolute', left: 0, top: 0, width: 200, height: 200, borderRadius: 10, background: '#f8f7f3', padding: '14px 14px' }}>
                    <div style={{ height: 10, width: '72%', borderRadius: 5, background: '#111827' }} />
                    <div style={{ height: 10, width: '50%', borderRadius: 5, background: '#111827', marginTop: 6 }} />
                    <div style={{ height: 44, borderRadius: 6, background: 'linear-gradient(135deg,#16285a,#0b1630)', marginTop: 12 }} />
                    {[0.95, 0.9, 0.93, 0.6, 0.92, 0.88].map((w, k) => (
                      <div key={k} style={{ height: 6, width: `${w * 100}%`, borderRadius: 3, background: lift > k / 6 ? `${theme.blue}` : '#d7dbe2', marginTop: 8, transform: `translateX(${lift > k / 6 ? lerp(0, 96, Math.min(1, (lift - k / 6) * 3)) : 0}px)`, opacity: lift > k / 6 ? 1 - 0.3 * Math.min(1, (lift - k / 6) * 3) : 1 }} />
                    ))}
                  </div>
                  {/* Top right of the node, above the path of the lifted lines */}
                  <div style={{ position: 'absolute', left: 216, top: 6, width: 110, fontFamily: theme.mono, fontSize: 14, color: theme.muted, lineHeight: 1.5, opacity: fadeIn(frame, starts[0] + 16, 10) }}>
                    1,092 words<br />no ads<br />no nav
                  </div>
                </div>
              )}
              {i === 1 && (
                <>
                  {LENGTHS.map((l, k) => {
                    const pk = pop(frame, fps, starts[1] + 6 + k * 6, { damping: 14, stiffness: 160 });
                    const active = k === 0;
                    return (
                      <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 9, borderRadius: 10, background: active ? `${theme.accent}1f` : theme.panel2, border: `1px solid ${active ? theme.accent : theme.line}`, opacity: Math.min(1, pk * 1.5), transform: `translateX(${lerp(-30, 0, pk)}px)` }}>
                        <span style={{ fontSize: 19, fontWeight: 800, color: active ? theme.accent : theme.ink, width: 86 }}>{l.name}</span>
                        <span style={{ fontFamily: theme.mono, fontSize: 15, color: theme.muted }}>{l.est}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 14, color: theme.muted }}>{l.words}</span>
                      </div>
                    );
                  })}
                  <div style={{ fontFamily: theme.mono, fontSize: 14, color: theme.muted, marginTop: 10, opacity: fadeIn(frame, starts[1] + 26, 10) }}>gpt-6-luna · your OpenAI account</div>
                </>
              )}
              {i === 2 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 70, padding: '0 4px', opacity: fadeIn(frame, starts[2] + 4, 8) }}>
                    {Array.from({ length: 30 }).map((_, k) => {
                      const h = 10 + 58 * Math.abs(Math.sin(frame / 4 + k * 0.6) * Math.cos(frame / 9 + k * 0.35));
                      return <div key={k} style={{ width: 6, height: h, borderRadius: 3, background: k % 2 ? theme.violet : `${theme.violet}99` }} />;
                    })}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                    {VOICES.map((v, k) => {
                      const pk = pop(frame, fps, starts[2] + 10 + k * 3, { damping: 14, stiffness: 180 });
                      return (
                        <span key={v} style={{ padding: '6px 13px', borderRadius: 999, fontSize: 15, fontWeight: 700, color: k === 0 ? '#060810' : theme.ink, background: k === 0 ? theme.violet : theme.panel2, border: `1px solid ${k === 0 ? theme.violet : theme.line}`, opacity: Math.min(1, pk * 1.5), transform: `scale(${lerp(0.7, 1, pk)})` }}>
                          {v}
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ fontFamily: theme.mono, fontSize: 14, color: theme.muted, marginTop: 14, opacity: fadeIn(frame, starts[2] + 24, 10) }}>gpt-realtime-2.1-mini · 6 styles · 0.5–2×</div>
                </>
              )}
              {i === 3 &&
                SEGMENTS.map((s, k) => {
                  const t0 = starts[3] + 6 + k * Math.max(4, (d2 * 0.55) / SEGMENTS.length);
                  const pk = pop(frame, fps, t0, { damping: 14, stiffness: 160 });
                  const retried = s.retry && frame >= t0 + 14;
                  const ok = !s.retry || retried;
                  return (
                    <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', marginBottom: 9, borderRadius: 10, background: theme.panel2, border: `1px solid ${ok ? `${theme.accent}66` : `${theme.warm}88`}`, opacity: Math.min(1, pk * 1.5), transform: `translateY(${lerp(20, 0, pk)}px)` }}>
                      <span style={{ fontFamily: theme.mono, fontSize: 15, color: theme.muted }}>segment {s.n}/4</span>
                      <span style={{ marginLeft: 'auto', fontFamily: theme.mono, fontSize: 16, fontWeight: 700, color: ok ? theme.accent : theme.warm }}>
                        {s.retry && !retried ? `${s.score} ↻ again` : `match ${retried ? s.after : s.score}`}
                      </span>
                      <span style={{ width: 22, height: 22, borderRadius: 11, background: ok ? theme.accent : theme.warm, color: '#060810', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 900 }}>{ok ? '✓' : '!'}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}

      {/* Then it plays, in the side panel */}
      <div style={{ position: 'absolute', left: nodeX(3), width: NODE_W, top: NODE_Y + NODE_H + 30, display: 'flex', justifyContent: 'center', opacity: fadeIn(frame, starts[3] + 24, 10), transform: `translateY(${lerp(14, 0, easeOut((frame - starts[3] - 24) / 12))}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 12, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDeep})`, color: '#060810', fontWeight: 800, fontSize: 20, boxShadow: '0 14px 30px rgba(0,0,0,.35)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#060810"><polygon points="6,4 20,12 6,20" /></svg>
          plays in the side panel
        </div>
      </div>
      <div style={{ position: 'absolute', left: nodeX(0), width: 3 * NODE_W + 2 * GAP, top: NODE_Y + NODE_H + 44, fontFamily: theme.mono, fontSize: 19, color: theme.ink, opacity: fadeIn(frame, tTrust, 10), transform: `translateY(${lerp(10, 0, easeOut((frame - tTrust) / 12))}px)` }}>
        <span style={{ color: theme.accent }}>your key stays in your browser</span> · calls go straight to api.openai.com · <span style={{ color: theme.accent }}>no SpeakEasy server</span>
      </div>
    </AbsoluteFill>
  );
};
