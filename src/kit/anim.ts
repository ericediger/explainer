import { interpolate, spring } from 'remotion';

export const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const fadeIn = (frame: number, start: number, dur = 10): number => interpolate(frame, [start, start + dur], [0, 1], CLAMP);
export const fadeOut = (frame: number, start: number, dur = 10): number => interpolate(frame, [start, start + dur], [1, 0], CLAMP);

/** Spring from 0 to 1 starting at `start`. */
export const pop = (frame: number, fps: number, start: number, cfg: Partial<{ damping: number; stiffness: number; mass: number }> = {}): number =>
  frame < start ? 0 : spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 120, mass: 0.8, ...cfg } });

export const easeInOut = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
