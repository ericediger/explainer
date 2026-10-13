import React from 'react';
import { useCurrentFrame } from 'remotion';
import { fadeIn } from './anim';
import { frameGeom, useStyle, useTheme } from './theme';

/** Small caveat line under the frame, right-aligned. */
export const NoteChip: React.FC<{ text: string }> = ({ text }) => {
  const theme = useTheme();
  const style = useStyle();
  const frame = useCurrentFrame();
  const F = frameGeom(style.frame);
  return (
    <div
      style={{
        position: 'absolute',
        left: F.x,
        width: F.w,
        top: F.y + F.chrome + F.h + 8,
        textAlign: 'right',
        fontSize: 16,
        color: theme.muted,
        fontStyle: 'italic',
        opacity: fadeIn(frame, 20, 12) * 0.9,
      }}
    >
      {text}
    </div>
  );
};
