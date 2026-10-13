import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useStyle, useTheme } from './theme';

/** Stage behind everything; the variant comes from `spec.style.background`. */
export const Background: React.FC = () => {
  const theme = useTheme();
  const { background } = useStyle();
  const frame = useCurrentFrame();

  if (background === 'flat') {
    return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${theme.bg0}, ${theme.bg1})` }} />;
  }

  if (background === 'mesh') {
    // Three soft blobs drifting slowly; the glow colours come from the theme.
    const t = frame / 30;
    const blob = (c: string, x: number, y: number, r: number, k: number) =>
      `radial-gradient(${r}px ${r * 0.8}px at ${x + Math.sin(t * 0.21 + k) * 7}% ${y + Math.cos(t * 0.17 + k) * 6}%, ${c} 0%, transparent 70%)`;
    return (
      <AbsoluteFill style={{ background: `${blob(theme.glowA, 22, 18, 900, 0)}, ${blob(theme.glowB, 80, 76, 820, 2)}, ${blob(theme.glowA, 60, 30, 600, 4)}, linear-gradient(180deg, ${theme.bg0}, ${theme.bg1})` }} />
    );
  }

  if (background === 'paper') {
    // A light, slightly warm sheet with fine grain and a soft edge; pair it with a light theme.
    return (
      <AbsoluteFill style={{ background: `radial-gradient(1200px 800px at 30% 10%, ${theme.glowA} 0%, transparent 65%), radial-gradient(900px 700px at 85% 90%, ${theme.glowB} 0%, transparent 60%), linear-gradient(180deg, ${theme.bg0}, ${theme.bg1})` }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.16, mixBlendMode: 'multiply' }}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" seed={3} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(60,50,30,.12) 100%)' }} />
      </AbsoluteFill>
    );
  }

  const drift = (frame * 0.12) % 48;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1100px 760px at 18% 8%, ${theme.glowA} 0%, transparent 62%),
          radial-gradient(900px 700px at 86% 94%, ${theme.glowB} 0%, transparent 60%),
          linear-gradient(180deg, ${theme.bg0}, ${theme.bg1})`,
      }}
    >
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse" x={drift} y={drift}>
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke={theme.grid} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.42) 100%)' }} />
    </AbsoluteFill>
  );
};
