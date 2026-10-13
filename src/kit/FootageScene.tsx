import React from 'react';
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Cue, Footage } from '../spec';
import { easeInOut, lerp } from './anim';
import { frameGeom, useStyle, useTheme } from './theme';

type Zoom = { scale: number; tx: number; ty: number };
const IDENTITY: Zoom = { scale: 1, tx: 0, ty: 0 };

/** Camera target for a cue: fit the (padded) element rectangle into the frame, centred, never showing outside the footage. */
function targetFor(cue: Cue, s0: number, W: number, H: number): Zoom {
  if (cue.kind === 'reset' || !cue.rect) return IDENTITY;
  const pad = cue.pad ?? 24;
  const r = { x: (cue.rect.x - pad) * s0, y: (cue.rect.y - pad) * s0, w: (cue.rect.w + 2 * pad) * s0, h: (cue.rect.h + 2 * pad) * s0 };
  const scale = Math.min(2.4, Math.max(1, Math.min(W / r.w, H / r.h)));
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const tx = Math.min(0, Math.max(W - W * scale, W / 2 - cx * scale));
  const ty = Math.min(0, Math.max(H - H * scale, H / 2 - cy * scale));
  return { scale, tx, ty };
}

/** Camera state at scene time t: each cue eases from the previous target over `ease` seconds. */
export function cameraAt(cues: Cue[], t: number, s0: number, W: number, H: number, ease = 0.8): Zoom {
  let prev = IDENTITY;
  let state = IDENTITY;
  for (const c of cues) {
    if (c.t > t) break;
    const target = targetFor(c, s0, W, H);
    const p = easeInOut((t - c.t) / ease);
    state = { scale: lerp(prev.scale, target.scale, p), tx: lerp(prev.tx, target.tx, p), ty: lerp(prev.ty, target.ty, p) };
    prev = target;
  }
  return state;
}

const Chrome: React.FC<{ url: string }> = ({ url }) => {
  const theme = useTheme();
  return (
    <div
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 16px',
        background: theme.panel2,
        borderBottom: `1px solid ${theme.line}`,
      }}
    >
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c, opacity: 0.9 }} />
      ))}
      <div
        style={{
          marginLeft: 18,
          flex: 1,
          maxWidth: 620,
          height: 26,
          borderRadius: 8,
          background: theme.panel,
          border: `1px solid ${theme.line}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontFamily: theme.mono,
          fontSize: 14,
          color: theme.muted,
        }}
      >
        {url}
      </div>
    </div>
  );
};

const Placeholder: React.FC = () => {
  const theme = useTheme();
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: theme.panel, color: theme.muted, fontSize: 26, textAlign: 'center' }}>
      <div>
        Footage not recorded yet.
        <div style={{ fontFamily: theme.mono, fontSize: 20, marginTop: 10, color: theme.accent }}>npm run record</div>
      </div>
    </div>
  );
};

export const FootageScene: React.FC<{ footage: Footage | null; videoId: string; demoUrl: string }> = ({ footage, videoId, demoUrl }) => {
  const theme = useTheme();
  const style = useStyle();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const F = frameGeom(style.frame);
  const cam = footage ? cameraAt(footage.cues, frame / fps, F.w / footage.cssWidth, F.w, F.h) : IDENTITY;
  // Frame variants: 'mac' is the browser window, 'bare' a hairline full-bleed frame, 'window' a floating, slightly tilted window.
  const shell: React.CSSProperties =
    style.frame === 'bare'
      ? { borderRadius: 10, boxShadow: `0 24px 70px rgba(0,0,0,.35), 0 0 0 1px ${theme.line}` }
      : style.frame === 'window'
        ? { borderRadius: 16, boxShadow: '0 50px 120px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.08)', transform: 'perspective(2600px) rotateY(-5deg) rotateX(2deg)', transformOrigin: '50% 50%' }
        : { borderRadius: 14, boxShadow: '0 30px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.07)' };
  return (
    <div
      style={{
        position: 'absolute',
        left: F.x,
        top: F.y,
        width: F.w,
        height: F.h + F.chrome,
        overflow: 'hidden',
        background: theme.panel,
        ...shell,
      }}
    >
      {F.chrome ? <Chrome url={demoUrl} /> : null}
      <div style={{ position: 'absolute', top: F.chrome, left: 0, width: F.w, height: F.h, overflow: 'hidden', background: theme.panel }}>
        {footage ? (
          <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.scale})` }}>
            <OffthreadVideo
              src={staticFile(`${videoId}/${footage.file}`)}
              startFrom={Math.round(footage.readyAt * fps)}
              muted
              style={{ width: F.w, height: F.h, display: 'block' }}
            />
          </div>
        ) : (
          <Placeholder />
        )}
      </div>
    </div>
  );
};
