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
  /** Headline face for titles and animated scenes; defaults to `font`. */
  display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  /** Caption box colours (kept separate so a light stage can still use a dark caption). */
  captionBg: 'rgba(10,14,20,.74)',
  captionInk: '#e8ecf2',
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

/** Kit variants (see StyleSpec in src/spec.ts). Defaults are the original look. */
export const defaultStyle = { frame: 'mac', captions: 'pill', lowerThird: 'bar', background: 'glow-grid', transition: 'fade' } as const;
export type Style = { frame: 'mac' | 'bare' | 'window'; captions: 'pill' | 'bar' | 'none'; lowerThird: 'bar' | 'chapter-card' | 'none'; background: 'glow-grid' | 'flat' | 'mesh' | 'paper'; transition: 'fade' | 'slide' | 'zoom-through' };
export const StyleContext = createContext<Style>(defaultStyle);
export const useStyle = (): Style => useContext(StyleContext);
export const resolveStyle = (overrides?: Partial<Style>): Style => ({ ...defaultStyle, ...(overrides ?? {}) });

/** Footage frame geometry for a frame style; `chrome` is the title-bar height (0 when there is none). */
export const frameGeom = (frame: Style['frame']): { x: number; y: number; w: number; h: number; chrome: number } =>
  frame === 'bare' ? { x: 200, y: 84, w: 1520, h: 855, chrome: 0 } : LAYOUT.frame;

/** Canvas geometry (1920x1080). */
export const LAYOUT = {
  frame: { x: 240, y: 92, w: 1440, h: 810, chrome: 40 },
  captionY: 988,
  lowerThirdY: 26,
};
