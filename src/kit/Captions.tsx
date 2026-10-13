import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { easeInOut, fadeIn, lerp } from './anim';
import { LAYOUT, useTheme } from './theme';
import { spansFor, type TimelineScene } from '../timeline';

/** One sentence at a time, timed proportionally across the narration window. */
export const Captions: React.FC<{ scene: TimelineScene }> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spans = spansFor(scene, fps);
  const active = [...spans].reverse().find((s) => frame >= s.start);
  if (!active) return null;
  const y = lerp(10, 0, easeInOut((frame - active.start) / 8));
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: LAYOUT.captionY,
        display: 'flex',
        justifyContent: 'center',
        opacity: fadeIn(frame, active.start, 7),
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          padding: '12px 26px',
          borderRadius: 14,
          background: 'rgba(10,14,20,.74)',
          border: `1px solid ${theme.line}`,
          color: theme.ink,
          fontSize: 30,
          lineHeight: 1.3,
          fontWeight: 560,
          textAlign: 'center',
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
