import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { easeInOut, fadeIn, lerp } from './anim';
import { LAYOUT, useStyle, useTheme } from './theme';
import { spansFor, type TimelineScene } from '../timeline';

/** One sentence at a time, timed across the narration window; the box style comes from `spec.style.captions`. */
export const Captions: React.FC<{ scene: TimelineScene }> = ({ scene }) => {
  const theme = useTheme();
  const style = useStyle();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (style.captions === 'none') return null;
  const spans = spansFor(scene, fps);
  const active = [...spans].reverse().find((s) => frame >= s.start);
  if (!active) return null;
  const y = lerp(10, 0, easeInOut((frame - active.start) / 8));

  if (style.captions === 'bar') {
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4, height: 92, background: theme.captionBg, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: fadeIn(frame, active.start, 7) }}>
        <div style={{ maxWidth: 1500, padding: '0 40px', color: theme.captionInk, fontSize: 30, lineHeight: 1.25, fontWeight: 560, textAlign: 'center', transform: `translateY(${y}px)` }}>{active.text}</div>
      </div>
    );
  }

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
          background: theme.captionBg,
          border: `1px solid ${theme.line}`,
          color: theme.captionInk,
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
