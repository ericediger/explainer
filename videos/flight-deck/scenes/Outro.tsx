import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimatedSceneProps } from '../../../src/kit/types';
import { easeOut, fadeIn, lerp, pop } from '../../../src/kit/anim';
import { useTheme } from '../../../src/kit/theme';
import { spansFor } from '../../../src/timeline';

/**
 * Three promise cards in the app's three colours (one per sentence), then the lockup and the repo:
 *   s3 "Flight Deck: open source on GitHub." → plane mark, name, repo card
 *   s4 "Bring your own keys."                → the three keys it needs
 */
export const Outro: React.FC<AnimatedSceneProps> = ({ scene, spec }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spans = spansFor(scene, fps);
  const tMark = spans[3]?.start ?? spans[spans.length - 1].start;
  const tKeys = spans[4]?.start ?? tMark + 40;
  const pMark = pop(frame, fps, tMark, { damping: 15, stiffness: 100 });

  const CARDS = [
    { glyph: '“ ”', color: theme.blue, title: 'Plain English or your voice', body: 'Type it or say it. One question back, only if something’s missing.' },
    { glyph: '✈', color: theme.warm, title: 'Live fares on DL · UA · AA', body: 'Google Flights data, ranked, with a quick take on the pick.' },
    { glyph: '⚡', color: theme.red, title: 'Picks stay in view', body: 'Your trip summary stays pinned while you book on Google Flights.' },
  ];
  const KEYS = [
    { name: 'Anthropic', what: 'parsing + the take', color: theme.accent },
    { name: 'SerpApi', what: 'flight data · free tier', color: theme.warm },
    { name: 'OpenAI', what: 'voice · optional', color: theme.red },
  ];

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 170, right: 170, top: 130, display: 'flex', gap: 30 }}>
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

      <div style={{ position: 'absolute', left: 0, right: 0, top: 530, textAlign: 'center', opacity: Math.min(1, pMark * 1.5), transform: `translateY(${lerp(30, 0, pMark)}px)` }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 30 }}>
          <div style={{ width: 112, height: 112, borderRadius: 28, background: theme.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 64, boxShadow: `0 0 50px ${theme.accent}66` }}>✈</div>
          <div style={{ fontFamily: theme.display, fontSize: 108, fontWeight: 700, letterSpacing: -3, color: theme.ink, lineHeight: 1 }}>Flight Deck</div>
        </div>
        <div style={{ margin: '20px auto 0', display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[theme.accent, theme.warm, theme.red].map((c, i) => (
            <div key={c} style={{ height: 5, width: lerp(0, 90, easeOut((frame - tMark - 8 - i * 4) / 18)), borderRadius: 3, background: c }} />
          ))}
        </div>
        <div style={{ marginTop: 26, display: 'inline-block', padding: '14px 26px', borderRadius: 14, background: theme.panel, border: `1px solid ${theme.line}`, boxShadow: '0 16px 40px rgba(0,0,0,.35)', textAlign: 'left', opacity: fadeIn(frame, tMark + 14, 12) }}>
          <div style={{ fontSize: 14, letterSpacing: 2, color: theme.blue, fontWeight: 700, textTransform: 'uppercase' }}>Open source · MIT licensed</div>
          <div style={{ fontFamily: '"SF Mono", Menlo, monospace', fontSize: 28, color: theme.ink, marginTop: 4 }}>{spec.repoUrl}</div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
          {KEYS.map((k, i) => {
            const p = pop(frame, fps, tKeys + i * 5, { damping: 15 });
            return (
              <div key={k.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${k.color}66`, opacity: Math.min(1, p * 1.5), transform: `translateY(${lerp(16, 0, p)}px)` }}>
                <svg width="26" height="26" viewBox="0 0 24 24">
                  <circle cx="8" cy="12" r="4.5" stroke={k.color} strokeWidth="2.2" fill="none" />
                  <path d="M12.5 12H21M18 12v3.5M21 12v2.5" stroke={k.color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
                </svg>
                <span style={{ fontSize: 21, fontWeight: 700, color: theme.ink }}>{k.name}</span>
                <span style={{ fontSize: 17, color: theme.muted }}>{k.what}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
