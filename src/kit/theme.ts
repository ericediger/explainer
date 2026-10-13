import { createContext, useContext } from 'react';

/**
 * Default palette: a dark, neutral stage with one accent. A video overrides any key through
 * `spec.theme` so the motion graphics echo that app's own look; components read it with useTheme().
 */
export const defaultTheme = {
  bg0: '#0b0f17',
  bg1: '#101722',
  panel: '#161d29',
  panel2: '#1c2431',
  line: '#243040',
  ink: '#e8ecf2',
  muted: '#8d99a8',
  accent: '#5fb385',
  accentDeep: '#2f6f4f',
  blue: '#82b3e8',
  warm: '#e3b44f',
  red: '#f2807a',
  violet: '#b58cf0',
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  /** Background glow colours (top-left, bottom-right) and the faint grid. */
  glowA: '#16233a',
  glowB: '#13261f',
  grid: '#1b2533',
};

export type Theme = typeof defaultTheme;

export const ThemeContext = createContext<Theme>(defaultTheme);
/** The active video's theme (defaults merged with `spec.theme`). */
export const useTheme = (): Theme => useContext(ThemeContext);
export const resolveTheme = (overrides?: Partial<Theme>): Theme => ({ ...defaultTheme, ...(overrides ?? {}) });

/** Canvas geometry (1920x1080). */
export const LAYOUT = {
  frame: { x: 240, y: 92, w: 1440, h: 810, chrome: 40 },
  captionY: 988,
  lowerThirdY: 26,
};
