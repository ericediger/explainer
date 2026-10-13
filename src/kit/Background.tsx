import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useTheme } from './theme';

export const Background: React.FC = () => {
  const theme = useTheme();
  const frame = useCurrentFrame();
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
