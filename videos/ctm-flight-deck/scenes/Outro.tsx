import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

/** Three promise cards in CTM's three colours (one per sentence), then the logo lockup and the line. */
export const Outro: React.FC<AnimatedSceneProps> = ({ scene }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spans = spansFor(scene, fps);
  const tMark = spans[3]?.start ?? spans[spans.length - 1].start;
  const pMark = pop(frame, fps, tMark, { damping: 15, stiffness: 100 });
  const tLine = tMark + Math.round((spans[3] ? spans[3].end - spans[3].start : 40) * 0.35);

  const CARDS = [
    { glyph: '“ ”', color: theme.blue, title: 'Plain English or your voice', body: 'Type it or say it. One question back, only if something’s missing.' },
    { glyph: '✈', color: theme.warm, title: 'Live fares on DL · UA · AA', body: 'Google Flights data, ranked, with CTM’s take on the pick.' },
    { glyph: '⚡', color: theme.red, title: 'Picks stay in view', body: 'Your trip summary stays pinned while you book in Lightning.' },
  ];

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 170, right: 170, top: 150, display: 'flex', gap: 30 }}>
        {CARDS.map((c, i) => {
          const start = spans[i]?.start ?? 0;
          const p = pop(frame, fps, start, { damping: 16 });
          return (
            <div key={c.title} style={{ flex: 1, padding: '30px 32px 34px', borderRadius: 20, background: theme.panel, border: `1px solid ${theme.line}`, borderTop: `5px solid ${c.color}`, boxShadow: '0 26px 60px rgba(0,0,0,.4)', opacity: Math.min(1, p * 1.5), transform: `translateY(${lerp(36, 0, p)}px)` }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: c.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 700 }}>{c.glyph}</div>
              <div style={{ fontFamily: theme.display, fontSize: 36, fontWeight: 700, color: theme.ink, marginTop: 22, letterSpacing: -0.5 }}>{c.title}</div>
              <div style={{ fontSize: 22, color: theme.muted, marginTop: 12, lineHeight: 1.42 }}>{c.body}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 590, textAlign: 'center', opacity: Math.min(1, pMark * 1.5), transform: `translateY(${lerp(30, 0, pMark)}px)` }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 34 }}>
          <Img src={staticFile('ctm-flight-deck/brand/ctm-logo-white.png')} style={{ height: 112 }} />
          <div style={{ fontFamily: theme.display, fontSize: 104, fontWeight: 700, letterSpacing: -3, color: theme.ink, lineHeight: 1 }}>Flight Deck</div>
        </div>
        <div style={{ margin: '20px auto 0', display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[theme.accent, theme.warm, theme.red].map((c, i) => (
            <div key={c} style={{ height: 5, width: lerp(0, 90, easeOut((frame - tMark - 8 - i * 4) / 18)), borderRadius: 3, background: c }} />
          ))}
        </div>
        <div style={{ marginTop: 26, fontFamily: theme.display, fontSize: 36, color: theme.ink, opacity: fadeIn(frame, tLine, 12) }}>
          Ask and compare without leaving the page you’re on.
        </div>
        <div style={{ marginTop: 20, fontSize: 19, color: theme.muted, letterSpacing: 0.3, opacity: fadeIn(frame, tLine + 18, 12) }}>
          Chrome side-panel extension · Claude · Google Flights via SerpApi · OpenAI voice · keys stay in your browser
        </div>
      </div>
    </AbsoluteFill>
  );
};
