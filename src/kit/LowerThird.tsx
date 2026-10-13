import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { fadeIn, lerp, pop } from './anim';
import { LAYOUT, useTheme } from './theme';

export const LowerThird: React.FC<{ index: number; title: string; subtitle?: string }> = ({ index, title, subtitle }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, 6, { damping: 18 });
  return (
    <div
      style={{
        position: 'absolute',
        left: LAYOUT.frame.x,
        top: LAYOUT.lowerThirdY,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        opacity: fadeIn(frame, 6, 8),
        transform: `translateX(${lerp(-40, 0, p)}px)`,
      }}
    >
      <div style={{ width: 6, height: 40, borderRadius: 3, background: theme.accent }} />
      <div style={{ fontFamily: theme.mono, fontSize: 18, color: theme.accent, letterSpacing: 2 }}>{String(index + 1).padStart(2, '0')}</div>
      <div style={{ fontSize: 28, fontWeight: 650, color: theme.ink, letterSpacing: -0.3 }}>{title}</div>
      {subtitle ? (
        <div style={{ fontSize: 20, color: theme.muted, marginLeft: 6, paddingLeft: 16, borderLeft: `1px solid ${theme.line}` }}>{subtitle}</div>
      ) : null}
    </div>
  );
};
