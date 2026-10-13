import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { easeInOut, fadeIn, fadeOut, lerp, pop } from './anim';
import { LAYOUT, frameGeom, useStyle, useTheme } from './theme';

/** Scene title; the variant comes from `spec.style.lowerThird`. */
export const LowerThird: React.FC<{ index: number; title: string; subtitle?: string }> = ({ index, title, subtitle }) => {
  const theme = useTheme();
  const style = useStyle();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (style.lowerThird === 'none') return null;

  if (style.lowerThird === 'chapter-card') {
    // A centred title card for the first ~1.8 s that fades as a small label settles top-left.
    const pCard = pop(frame, fps, 2, { damping: 16 });
    const cardOut = fadeOut(frame, 42, 14);
    const label = fadeIn(frame, 46, 10);
    const F = frameGeom(style.frame);
    return (
      <>
        {cardOut > 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: `rgba(0,0,0,${0.3 * Math.min(pCard, cardOut)})`, opacity: cardOut, pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', padding: '34px 64px 40px', borderRadius: 22, background: theme.panel, border: `1px solid ${theme.line}`, boxShadow: '0 30px 80px rgba(0,0,0,.35)', transform: `translateY(${lerp(16, 0, pCard)}px) scale(${lerp(0.96, 1, pCard)})`, opacity: Math.min(1, pCard * 1.5) }}>
              <div style={{ fontFamily: theme.mono, fontSize: 18, letterSpacing: 4, color: theme.accent }}>{String(index + 1).padStart(2, '0')}</div>
              <div style={{ fontFamily: theme.display, fontSize: 84, fontWeight: 600, letterSpacing: -1.5, color: theme.ink, marginTop: 10, }}>{title}</div>
              {subtitle ? <div style={{ fontSize: 24, color: theme.muted, marginTop: 10 }}>{subtitle}</div> : null}
              <div style={{ margin: '18px auto 0', height: 3, width: lerp(0, 120, easeInOut((frame - 10) / 18)), background: theme.accent, borderRadius: 2 }} />
            </div>
          </div>
        ) : null}
        <div style={{ position: 'absolute', left: F.x, top: LAYOUT.lowerThirdY + 4, display: 'flex', alignItems: 'baseline', gap: 14, opacity: label }}>
          <span style={{ fontFamily: theme.mono, fontSize: 16, letterSpacing: 3, color: theme.accent }}>{String(index + 1).padStart(2, '0')}</span>
          <span style={{ fontFamily: theme.display, fontSize: 26, fontWeight: 600, color: theme.ink, letterSpacing: -0.3 }}>{title}</span>
          {subtitle ? <span style={{ fontSize: 18, color: theme.muted }}>· {subtitle}</span> : null}
        </div>
      </>
    );
  }

  const p = pop(frame, fps, 6, { damping: 18 });
  return (
    <div
      style={{
        position: 'absolute',
        left: frameGeom(style.frame).x,
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
      <div style={{ fontFamily: theme.display, fontSize: 28, fontWeight: 650, color: theme.ink, letterSpacing: -0.3 }}>{title}</div>
      {subtitle ? (
        <div style={{ fontSize: 20, color: theme.muted, marginLeft: 6, paddingLeft: 16, borderLeft: `1px solid ${theme.line}` }}>{subtitle}</div>
      ) : null}
    </div>
  );
};
