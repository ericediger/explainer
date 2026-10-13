import React from 'react';
import { useCurrentFrame } from 'remotion';
import { useTheme } from './theme';

export const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const w = Math.min(1, frame / Math.max(1, total - 1)) * 1920;
  return (
    <div style={{ position: 'absolute', left: 0, bottom: 0, height: 4, width: w, background: `linear-gradient(90deg, ${theme.accentDeep}, ${theme.accent})` }} />
  );
};
