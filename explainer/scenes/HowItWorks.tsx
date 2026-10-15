import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '@explainer/src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '@explainer/src/kit/anim';
import { useTheme } from '@explainer/src/kit/theme';
import { spansFor } from '@explainer/src/timeline';

/**
 * The pipeline, one beat per sentence:
 *   s0 "Explainer turns a storyboard into a finished video."          → script.ts on the left, the finished video on the right
 *   s1 "One command, four steps: narrate, record, render, poster."    → `npm run build` and the four stages, in order
 *   s2 "The storyboard is a plain TypeScript file."                   → script.ts lights up and a scene is typed into it
 */
const NODE_W = 232;
const NODE_H = 250;
const GAP = 34;
const NODE_Y = 400;
const FILE = { x: 96, w: 330 };
const NODES_X = FILE.x + FILE.w + 44;
const OUT_X = NODES_X + 4 * NODE_W + 3 * GAP + 44;
const nodeX = (i: number) => NODES_X + i * (NODE_W + GAP);

const SNIPPET = ['{', "  id: 'home',", "  kind: 'footage',", "  title: 'At a glance',", "  narration: 'Here is…',", '}'];

export const HowItWorks: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1, s2] = spansFor(scene, fps);
  const d1 = s1.end - s1.start;
  const d2 = s2.end - s2.start;

  const pFile = pop(frame, fps, s0.start - 4, { damping: 16 });
  const pOut = pop(frame, fps, s0.start + 14, { damping: 15 });
  const pBar = pop(frame, fps, s1.start, { damping: 17 });
  const nodeStart = [0, 1, 2, 3].map((i) => s1.start + 6 + i * (d1 * 0.2));
  const p = nodeStart.map((s) => pop(frame, fps, s, { damping: 15 }));

  const NODES = [
    { n: '1', name: 'narrate', out: 'voice clips', file: 'manifest.json', color: theme.blue },
    { n: '2', name: 'record', out: 'footage', file: 'cues.json', color: theme.accent },
    { n: '3', name: 'render', out: 'video.mp4', file: 'captions, camera, music', color: theme.warm },
    { n: '4', name: 'poster', out: 'poster.jpg', file: 'for the README', color: theme.violet },
  ];

  // s2: type the scene snippet into the file card
  const totalChars = SNIPPET.join('\n').length;
  const typed = Math.round(Math.min(1, Math.max(0, (frame - s2.start - 6) / (d2 * 0.7))) * totalChars);
  const lit = easeOut((frame - s2.start) / 14);
  let left = typed;
  const shown = SNIPPET.map((l) => {
    const take = Math.max(0, Math.min(l.length, left));
    left -= l.length + 1;
    return l.slice(0, take);
  });

  return (
    <AbsoluteFill>
      {/* script.ts */}
      <div
        style={{
          position: 'absolute',
          left: FILE.x,
          top: NODE_Y - 38,
          width: FILE.w,
          height: NODE_H + 76,
          borderRadius: 18,
          background: '#fbf7f0',
          border: `3px solid ${lit > 0 ? theme.accent : 'transparent'}`,
          boxShadow: `0 30px 70px rgba(0,0,0,.45), 0 0 ${40 * lit}px ${theme.accent}55`,
          opacity: Math.min(1, pFile * 1.5),
          transform: `translateY(${lerp(36, 0, pFile)}px)`,
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 40, background: '#e9e2d4', display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: theme.mono, fontSize: 16, fontWeight: 700, color: '#2a2520' }}>script.ts</div>
        <div style={{ padding: '16px 18px', fontFamily: theme.mono, fontSize: 17, lineHeight: 1.6, color: '#2a2520', whiteSpace: 'pre' }}>
          {frame < s2.start ? (
            <>
              <span style={{ color: '#8a3ffc' }}>export const</span> spec = {'{'}
              {'\n'}  scenes: [{'\n'}
              <span style={{ color: '#9a8f7e' }}>    // cold-open</span>
              {'\n'}
              <span style={{ color: '#9a8f7e' }}>    // how-it-works</span>
              {'\n'}
              <span style={{ color: '#9a8f7e' }}>    // …</span>
              {'\n'}  ]{'\n'}
              {'}'}
            </>
          ) : (
            shown.map((l, i) => (
              <div key={i} style={{ minHeight: 27 }}>
                {l}
                {i === shown.findIndex((x, k) => x.length < SNIPPET[k].length) ? <span style={{ background: theme.accent, width: 9, height: 20, display: 'inline-block', verticalAlign: -3 }} /> : null}
              </div>
            ))
          )}
        </div>
        <div style={{ position: 'absolute', left: 18, bottom: 14, fontFamily: theme.mono, fontSize: 14, color: '#8a7f70', opacity: fadeIn(frame, s2.start + 4, 10) }}>plain TypeScript · no timeline editor</div>
      </div>

      {/* npm run build bracket */}
      <div style={{ position: 'absolute', left: NODES_X, width: 4 * NODE_W + 3 * GAP, top: NODE_Y - 92, opacity: Math.min(1, pBar * 1.5), transform: `translateY(${lerp(16, 0, pBar)}px)` }}>
        <div style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 12, background: theme.panel, border: `1px solid ${theme.line}`, fontFamily: theme.mono, fontSize: 24, fontWeight: 700, color: theme.ink }}>
          <span style={{ color: theme.accent }}>$</span> npm run build
        </div>
        <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: theme.line }}>
          <div style={{ height: 3, borderRadius: 2, background: theme.accent, width: `${Math.min(1, Math.max(0, (frame - s1.start) / (d1 * 0.9))) * 100}%` }} />
        </div>
      </div>

      {/* connectors: script → narrate */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {[
          { x1: FILE.x + FILE.w + 6, x2: nodeX(0) - 6, on: p[0] },
          { x1: nodeX(0) + NODE_W + 4, x2: nodeX(1) - 4, on: p[1] },
          { x1: nodeX(1) + NODE_W + 4, x2: nodeX(2) - 4, on: p[2] },
          { x1: nodeX(2) + NODE_W + 4, x2: nodeX(3) - 4, on: p[3] },
          { x1: nodeX(3) + NODE_W + 6, x2: OUT_X - 6, on: pOut },
        ].map((c, i) => {
          const y = NODE_Y + NODE_H / 2;
          return (
            <g key={i} opacity={Math.min(1, c.on * 1.4)}>
              <line x1={c.x1} y1={y} x2={c.x2} y2={y} stroke={theme.line} strokeWidth={3} strokeDasharray="5 7" />
              <path d={`M ${c.x2 - 10} ${y - 8} L ${c.x2} ${y} L ${c.x2 - 10} ${y + 8}`} stroke={theme.muted} strokeWidth={3} fill="none" strokeLinecap="round" />
            </g>
          );
        })}
      </svg>

      {/* four stages */}
      {NODES.map((n, i) => (
        <div
          key={n.name}
          style={{
            position: 'absolute',
            left: nodeX(i),
            top: NODE_Y,
            width: NODE_W,
            height: NODE_H,
            borderRadius: 18,
            background: theme.panel,
            border: `1px solid ${theme.line}`,
            borderTop: `5px solid ${n.color}`,
            boxShadow: '0 26px 60px rgba(0,0,0,.4)',
            padding: '20px 20px',
            opacity: Math.min(1, p[i] * 1.5),
            transform: `translateY(${lerp(34, 0, p[i])}px) scale(${lerp(0.92, 1, p[i])})`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: n.color, color: '#1a1410', display: 'grid', placeItems: 'center', fontFamily: theme.mono, fontWeight: 800, fontSize: 18 }}>{n.n}</div>
            <div style={{ fontFamily: theme.display, fontSize: 32, fontWeight: 700, color: theme.ink, letterSpacing: -0.5 }}>{n.name}</div>
          </div>
          <div style={{ marginTop: 26, fontFamily: theme.mono, fontSize: 14, letterSpacing: 2, color: theme.muted }}>MAKES</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 600, color: theme.ink }}>{n.out}</div>
          <div style={{ marginTop: 4, fontSize: 18, color: theme.muted }}>{n.file}</div>
          {frame >= nodeStart[i] + 8 ? (
            <div style={{ position: 'absolute', left: 20, bottom: 18, height: 6, width: NODE_W - 40, borderRadius: 3, background: theme.line }}>
              <div style={{ height: 6, borderRadius: 3, background: n.color, width: `${easeOut((frame - nodeStart[i] - 8) / Math.max(10, d1 * 0.18)) * 100}%` }} />
            </div>
          ) : null}
        </div>
      ))}

      {/* the finished video */}
      <div
        style={{
          position: 'absolute',
          left: OUT_X,
          top: NODE_Y + 20,
          width: 1920 - OUT_X - 70,
          height: NODE_H - 40,
          borderRadius: 16,
          background: theme.panel2,
          border: `1px solid ${theme.line}`,
          boxShadow: '0 26px 60px rgba(0,0,0,.4)',
          display: 'grid',
          placeItems: 'center',
          opacity: Math.min(1, pOut * 1.5),
          transform: `translateY(${lerp(30, 0, pOut)}px) scale(${lerp(0.92, 1, pOut)})`,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 70, height: 70, margin: '0 auto', borderRadius: 35, background: theme.accent, display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 0, height: 0, marginLeft: 6, borderTop: '15px solid transparent', borderBottom: '15px solid transparent', borderLeft: '25px solid #fff' }} />
          </div>
          <div style={{ marginTop: 14, fontFamily: theme.mono, fontSize: 18, color: theme.ink, fontWeight: 700 }}>video.mp4</div>
          <div style={{ fontSize: 15, color: theme.muted }}>in the app's media/</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
