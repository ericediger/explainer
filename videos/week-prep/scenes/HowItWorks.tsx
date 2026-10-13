import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeInOut, easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme, type Theme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

const FOLDER = { x: 300, y: 430, w: 320, h: 220 };
const CLAUDE = { cx: 960, cy: 540, r: 76 };
const LIST = { x: 1290, y: 400, w: 360, h: 290 };

const INGEST_FILES = ['monday-team-sync.txt', 'acme-legal-thread.eml', 'onboarding-review.eml', 'screenshot.png'];
const ITEMS: { prio: 'High' | 'Medium' | 'Low'; text: string; tag: string; carry?: boolean }[] = [
  { prio: 'High', text: 'Chase legal for Acme redline date', tag: 'ACME-RENEWAL' },
  { prio: 'High', text: 'Circulate Q3 roadmap deck', tag: 'PROD' },
  { prio: 'Medium', text: 'Review onboarding copy for Priya', tag: 'ONBOARD-V2' },
  { prio: 'Medium', text: 'Finalize vendor security questionnaire', tag: 'VENDOR-AI', carry: true },
];
const prioColor = (t: Theme, p: 'High' | 'Medium' | 'Low'): string => ({ High: t.red, Medium: t.warm, Low: t.blue })[p];

const Pill: React.FC<{ text: string; color: string; bg?: string }> = ({ text, color, bg }) => (
  <span style={{ fontSize: 13, fontWeight: 650, color, background: bg ?? `${color}22`, border: `1px solid ${color}55`, borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap' }}>{text}</span>
);

export const HowItWorks: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1, s2] = spansFor(scene, fps);
  const d1 = s1.end - s1.start;
  const d2 = s2.end - s2.start;

  // Beats
  const tTop = s0.start;
  const tFolder = s1.start;
  const tFiles = s1.start + 8;
  const tIngest = s1.start + d1 * 0.7;
  const tFlow = s2.start;
  const tClaude = s2.start + 4;
  const tList = s2.start + d2 * 0.3;
  const tItems = s2.start + d2 * 0.36;
  const tBack = s2.start + d2 * 0.72;

  const pTop = pop(frame, fps, tTop, { damping: 16 });
  const pFolder = pop(frame, fps, tFolder, { damping: 16 });
  const pIngest = pop(frame, fps, tIngest, { damping: 12, stiffness: 160 });
  const pClaude = pop(frame, fps, tClaude, { damping: 13 });
  const pList = pop(frame, fps, tList, { damping: 16 });
  const pBack = easeInOut((frame - tBack) / 34);
  const flowOn = frame >= tFlow ? Math.min(1, (frame - tFlow) / 10) : 0;
  const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 1.6);

  const folderRight = { x: FOLDER.x + FOLDER.w, y: FOLDER.y + FOLDER.h / 2 };
  const claudeLeft = { x: CLAUDE.cx - CLAUDE.r - 10, y: CLAUDE.cy };
  const claudeRight = { x: CLAUDE.cx + CLAUDE.r + 10, y: CLAUDE.cy };
  const listLeft = { x: LIST.x, y: LIST.y + LIST.h / 2 };

  return (
    <AbsoluteFill>
      {/* Top card: the one file */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 118,
          display: 'flex',
          justifyContent: 'center',
          opacity: Math.min(1, pTop * 1.5),
          transform: `translateY(${lerp(-30, 0, pTop)}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '18px 30px', borderRadius: 16, background: theme.panel, border: `1px solid ${theme.line}`, boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
          <div style={{ width: 44, height: 56, borderRadius: 6, background: theme.panel2, border: `1px solid ${theme.line}`, position: 'relative' }}>
            <div style={{ position: 'absolute', right: -1, top: -1, width: 14, height: 14, background: theme.bg1, borderLeft: `1px solid ${theme.line}`, borderBottom: `1px solid ${theme.line}` }} />
            <div style={{ position: 'absolute', left: 8, right: 8, top: 22, height: 3, background: theme.accent, borderRadius: 2 }} />
            <div style={{ position: 'absolute', left: 8, right: 14, top: 31, height: 3, background: theme.line, borderRadius: 2 }} />
            <div style={{ position: 'absolute', left: 8, right: 18, top: 40, height: 3, background: theme.line, borderRadius: 2 }} />
          </div>
          <div>
            <div style={{ fontFamily: theme.mono, fontSize: 30, fontWeight: 650, color: theme.ink }}>Home.html</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {['no server', 'no build step', 'no account', 'no database'].map((t) => (
                <Pill key={t} text={t} color={theme.accent} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connectors */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.accent} />
          </marker>
        </defs>
        {/* folder → Claude */}
        <line x1={folderRight.x + 14} y1={folderRight.y} x2={claudeLeft.x} y2={claudeLeft.y} stroke={theme.line} strokeWidth={3} strokeDasharray="6 8" opacity={pFolder * 0.9} />
        {/* Claude → list */}
        <line x1={claudeRight.x} y1={claudeRight.y} x2={listLeft.x - 14} y2={listLeft.y} stroke={theme.line} strokeWidth={3} strokeDasharray="6 8" opacity={pList * 0.9} />
        {/* particles */}
        {flowOn > 0 &&
          [0, 1, 2, 3, 4, 5].map((i) => {
            const u = ((frame - tFlow) / 42 + i / 6) % 1;
            const seg = u < 0.5 ? 0 : 1;
            const v = (u % 0.5) / 0.5;
            const a = seg === 0 ? folderRight : claudeRight;
            const b = seg === 0 ? claudeLeft : listLeft;
            if (seg === 1 && pList < 0.2) return null;
            return <circle key={i} cx={lerp(a.x + 14, b.x - 14, v)} cy={lerp(a.y, b.y, v)} r={5} fill={seg === 0 ? theme.warm : theme.accent} opacity={flowOn * (0.35 + 0.65 * Math.sin(v * Math.PI))} />;
          })}
        {/* list → folder (writes todo-state.json back) */}
        {pBack > 0 && (
          <path
            d={`M ${LIST.x + LIST.w / 2} ${LIST.y + LIST.h + 16} C ${LIST.x + LIST.w / 2} 820, ${FOLDER.x + FOLDER.w / 2} 820, ${FOLDER.x + FOLDER.w / 2} ${FOLDER.y + FOLDER.h + 22}`}
            fill="none"
            stroke={theme.accent}
            strokeWidth={3.5}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - pBack}
            markerEnd={pBack > 0.98 ? 'url(#arrow)' : undefined}
          />
        )}
        {/* Claude rings */}
        {pClaude > 0 &&
          [0, 1].map((i) => (
            <circle key={i} cx={CLAUDE.cx} cy={CLAUDE.cy} r={CLAUDE.r + 14 + i * 16 + pulse * 6} fill="none" stroke={theme.accent} strokeWidth={1.5} opacity={pClaude * (0.35 - i * 0.15) * (1 - pulse * 0.4)} />
          ))}
      </svg>

      {/* Folder */}
      <div style={{ position: 'absolute', left: FOLDER.x, top: FOLDER.y, width: FOLDER.w, height: FOLDER.h, opacity: Math.min(1, pFolder * 1.5), transform: `scale(${lerp(0.85, 1, pFolder)})` }}>
        <div style={{ position: 'absolute', left: 0, top: -22, width: 130, height: 30, borderRadius: '10px 10px 0 0', background: '#2a3a52' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '0 14px 14px 14px', background: '#2a3a52', boxShadow: '0 24px 60px rgba(0,0,0,.45)' }} />
        <div style={{ position: 'absolute', left: 18, top: 14, fontFamily: theme.mono, fontSize: 20, fontWeight: 650, color: theme.ink }}>WO-260803/</div>
        {INGEST_FILES.map((name, i) => {
          const p = pop(frame, fps, tFiles + i * 7, { damping: 16, stiffness: 110 });
          return (
            <div
              key={name}
              style={{
                position: 'absolute',
                left: 18,
                top: 56 + i * 36,
                width: 284,
                height: 30,
                borderRadius: 7,
                background: theme.panel,
                border: `1px solid ${theme.line}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                fontFamily: theme.mono,
                fontSize: 14,
                color: theme.muted,
                opacity: Math.min(1, p * 1.5),
                transform: `translate(${lerp(-260, 0, p)}px, ${lerp(-180, 0, p)}px) rotate(${lerp(-12, 0, p)}deg)`,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 4, background: name.endsWith('.eml') ? theme.warm : name.endsWith('.png') ? theme.violet : theme.blue, marginRight: 10 }} />
              {name}
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute',
            left: FOLDER.w / 2 - 80,
            top: FOLDER.h + 26,
            width: 160,
            height: 44,
            borderRadius: 10,
            background: theme.accentDeep,
            color: '#fff',
            fontSize: 20,
            fontWeight: 650,
            display: 'grid',
            placeItems: 'center',
            opacity: Math.min(1, pIngest * 1.5),
            transform: `scale(${lerp(0.6, 1, pIngest)})`,
            boxShadow: `0 0 ${24 * pIngest}px rgba(95,179,133,.45)`,
          }}
        >
          Ingest →
        </div>
      </div>

      {/* Claude */}
      <div style={{ position: 'absolute', left: CLAUDE.cx - CLAUDE.r, top: CLAUDE.cy - CLAUDE.r, width: CLAUDE.r * 2, height: CLAUDE.r * 2, opacity: Math.min(1, pClaude * 1.5), transform: `scale(${lerp(0.6, 1, pClaude)})` }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #2a4a3a, ${theme.accentDeep})`, boxShadow: `0 0 ${40 + pulse * 20}px rgba(95,179,133,.35)` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 64, color: '#fff', lineHeight: 1 }}>✦</div>
        <div style={{ position: 'absolute', left: -60, right: -60, top: CLAUDE.r * 2 + 16, textAlign: 'center', fontSize: 24, fontWeight: 650, color: theme.ink }}>Claude</div>
        <div style={{ position: 'absolute', left: -120, right: -120, top: CLAUDE.r * 2 + 48, textAlign: 'center', fontSize: 16, color: theme.muted }}>only when you click Ingest</div>
      </div>

      {/* List */}
      <div
        style={{
          position: 'absolute',
          left: LIST.x,
          top: LIST.y,
          width: LIST.w,
          height: LIST.h,
          borderRadius: 14,
          background: theme.panel,
          border: `1px solid ${theme.line}`,
          boxShadow: '0 24px 60px rgba(0,0,0,.45)',
          opacity: Math.min(1, pList * 1.5),
          transform: `scale(${lerp(0.85, 1, pList)})`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 18px 10px', fontFamily: theme.mono, fontSize: 17, color: theme.accent, borderBottom: `1px solid ${theme.line}` }}>todo-state.json</div>
        {ITEMS.map((it, i) => {
          const p = pop(frame, fps, tItems + i * 8, { damping: 15, stiffness: 130 });
          return (
            <div key={it.text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', borderBottom: `1px solid ${theme.line}`, opacity: Math.min(1, p * 1.5), transform: `translateX(${lerp(40, 0, p)}px)` }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${theme.muted}` }} />
              <span style={{ flex: 1, fontSize: 15.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.text}</span>
              {it.carry ? <Pill text="↩" color={theme.warm} /> : null}
              <Pill text={it.prio} color={prioColor(theme, it.prio)} />
            </div>
          );
        })}
        <div style={{ padding: '10px 18px', display: 'flex', gap: 8, opacity: pop(frame, fps, tItems + ITEMS.length * 8, { damping: 16 }) }}>
          {['PROD', 'LEGAL', 'OPS'].map((t) => (
            <Pill key={t} text={t} color={theme.blue} />
          ))}
          <span style={{ fontSize: 13, color: theme.muted, alignSelf: 'center' }}>themes · projects</span>
        </div>
      </div>

      {/* Label on the return path */}
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
          opacity: fadeIn(frame, tBack + 14, 12),
        }}
      >
        written back into the folder · plain JSON · syncs with the folder
      </div>
    </AbsoluteFill>
  );
};
