import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, fadeOut, lerp, pop } from '../../../src/kit/anim';
import { useTheme, type Theme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

type Kind = 'txt' | 'eml' | 'png' | 'pdf';
const kindColor = (t: Theme, k: Kind): string => ({ txt: t.blue, eml: t.warm, png: t.violet, pdf: t.red })[k];

/** Scattered files: where each one lands (top-left), its tilt, and where it flies in from. */
const FILES: { name: string; kind: Kind; x: number; y: number; r: number; from: [number, number]; lines: number[] }[] = [
  { name: 'monday-team-sync.txt', kind: 'txt', x: 230, y: 200, r: -7, from: [-600, 80], lines: [78, 92, 60, 85] },
  { name: 'acme-legal-thread.eml', kind: 'eml', x: 690, y: 135, r: 4, from: [0, -520], lines: [88, 70, 94, 55] },
  { name: 'onboarding-review.eml', kind: 'eml', x: 1150, y: 190, r: -3, from: [560, -260], lines: [64, 90, 72, 88] },
  { name: 'Screenshot 2026-08-03 at 23.14.png', kind: 'png', x: 400, y: 525, r: 6, from: [-500, 520], lines: [90, 90, 90, 40] },
  { name: 'vendor-questionnaire.pdf', kind: 'pdf', x: 870, y: 560, r: -5, from: [0, 640], lines: [82, 76, 96, 66] },
  { name: 'Re: Re: Re: pricing.eml', kind: 'eml', x: 1330, y: 540, r: 7, from: [640, 420], lines: [70, 86, 58, 92] },
  { name: 'standup-notes.txt', kind: 'txt', x: 1540, y: 170, r: 9, from: [620, -320], lines: [84, 62, 90, 70] },
];

/** The buried action items that light up: file index → highlighted phrase, replacing one skeleton line. */
const HIGHLIGHTS: Record<number, { line: number; text: string }> = {
  0: { line: 1, text: 'deck to leadership before Thursday' },
  1: { line: 2, text: 'redlines still with legal · Aug 14' },
  4: { line: 1, text: 'cover Sam’s vendor call on Tuesday' },
};

const Card: React.FC<{ f: (typeof FILES)[number]; p: number; dim: number; hl?: { text: string; line: number; p: number } }> = ({ f, p, dim, hl }) => {
  const theme = useTheme();
  const x = lerp(f.x + f.from[0], f.x, p);
  const y = lerp(f.y + f.from[1], f.y, p);
  const rot = lerp(f.r + (f.from[0] >= 0 ? 22 : -22), f.r, p);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 320,
        height: 176,
        borderRadius: 14,
        background: theme.panel,
        border: `1px solid ${theme.line}`,
        boxShadow: '0 24px 60px rgba(0,0,0,.45)',
        transform: `rotate(${rot}deg)`,
        opacity: Math.min(1, p * 1.6) * lerp(1, 0.28, dim),
        filter: `blur(${dim * 2}px)`,
        overflow: 'hidden',
      }}
    >
      <div style={{ height: 10, background: kindColor(theme, f.kind) }} />
      <div style={{ padding: '16px 18px 0' }}>
        {f.lines.map((w, i) => {
          if (hl && hl.line === i) {
            return (
              <div key={i} style={{ height: 14, margin: '0 0 12px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: -4, height: 22, width: `${w}%`, borderRadius: 4, background: '#2a3244' }} />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: -5,
                    height: 24,
                    padding: '0 8px',
                    borderRadius: 5,
                    background: theme.warm,
                    color: '#1c1a12',
                    fontSize: 15,
                    fontWeight: 650,
                    lineHeight: '24px',
                    whiteSpace: 'nowrap',
                    clipPath: `inset(0 ${(1 - hl.p) * 100}% 0 0 round 5px)`,
                    boxShadow: `0 0 ${18 * hl.p}px rgba(227,180,79,.55)`,
                  }}
                >
                  {hl.text}
                </div>
              </div>
            );
          }
          return <div key={i} style={{ height: 14, width: `${w}%`, borderRadius: 4, background: '#2a3244', margin: '0 0 12px' }} />;
        })}
      </div>
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: theme.mono, fontSize: 14, color: theme.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
        <div style={{ fontFamily: theme.mono, fontSize: 11, color: kindColor(theme, f.kind), letterSpacing: 1.5, marginLeft: 10 }}>{f.kind.toUpperCase()}</div>
      </div>
    </div>
  );
};

export const ColdOpen: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s0, s1, s2, s3] = spansFor(scene, fps);

  // Sentence 1: files fly in, staggered across most of the sentence.
  const stagger = ((s1.end - s1.start) * 0.78) / FILES.length;
  // Sentence 2: three action items light up.
  const hlKeys = Object.keys(HIGHLIGHTS).map(Number);
  // Sentence 3: everything dims and the headline lands.
  const dim = easeOut((frame - (s3.start - 4)) / 16);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 430,
          textAlign: 'center',
          fontSize: 44,
          fontWeight: 500,
          color: theme.muted,
          letterSpacing: 1,
          opacity: fadeIn(frame, s0.start, 12) * fadeOut(frame, s1.start + 4, 14),
        }}
      >
        Monday · 7:58 AM
      </div>

      {FILES.map((f, i) => {
        const p = pop(frame, fps, s1.start + i * stagger, { damping: 15, stiffness: 95, mass: 0.9 });
        const h = HIGHLIGHTS[i];
        const hlStart = s2.start + hlKeys.indexOf(i) * 11;
        const hl = h && frame >= hlStart ? { ...h, p: easeOut((frame - hlStart) / 14) } : undefined;
        return <Card key={f.name} f={f} p={p} dim={dim} hl={hl} />;
      })}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 420,
          textAlign: 'center',
          opacity: fadeIn(frame, s3.start, 10),
          transform: `translateY(${lerp(18, 0, easeOut((frame - s3.start) / 18))}px)`,
        }}
      >
        <div style={{ fontSize: 68, fontWeight: 720, letterSpacing: -1.2, color: theme.ink, textShadow: '0 10px 40px rgba(0,0,0,.6)' }}>
          Finding them is the job <span style={{ color: theme.accent }}>before</span> the job.
        </div>
        <div style={{ margin: '22px auto 0', height: 4, width: lerp(0, 220, easeOut((frame - s3.start - 6) / 20)), borderRadius: 2, background: theme.accent }} />
      </div>
    </AbsoluteFill>
  );
};
