import { continueRender, delayRender, staticFile } from 'remotion';

const FORMATS: Record<string, string> = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };

/**
 * Use a font file from the project's public/ folder in the whole video, and hold rendering until it has loaded.
 * Call it at the top of the project's index.ts, once per file:
 *
 *   loadFont('Montserrat', 'fonts/Montserrat-wght.ttf', { weight: '100 900' });   // a variable font
 *   loadFont('Inter', 'fonts/Inter-Bold.woff2', { weight: '700' });                // one static weight
 *
 * Then name the family first in theme.font / theme.display. Declaring it here rather than in one scene's <style>
 * matters: Remotion renders frames in several tabs and out of order, so a tab drawing a footage frame never mounts
 * the opener, and its captions and titles would fall back to another font; and a frame can be captured before a
 * font declared mid-render has loaded.
 */
export function loadFont(family: string, file: string, opts: { weight?: string; style?: 'normal' | 'italic' } = {}): void {
  if (typeof document === 'undefined') return;
  const weight = opts.weight ?? '400';
  const style = opts.style ?? 'normal';
  const format = FORMATS[file.split('.').pop()?.toLowerCase() ?? ''];
  const face = document.createElement('style');
  face.textContent = `@font-face { font-family: '${family}'; src: url('${staticFile(file)}')${format ? ` format('${format}')` : ''}; font-weight: ${weight}; font-style: ${style}; }`;
  document.head.appendChild(face);

  const handle = delayRender(`Loading font ${family} (${file})`);
  // Loading one weight inside the declared range loads the file.
  document.fonts
    .load(`${style === 'italic' ? 'italic ' : ''}${weight.split(' ')[0]} 32px '${family}'`)
    .then((faces) => {
      if (faces.length === 0) console.warn(`Font ${family} (${file}) did not load; the next font in the stack is used.`);
      continueRender(handle);
    })
    .catch((err) => {
      console.warn(`Font ${family} (${file}) failed to load: ${err}`);
      continueRender(handle);
    });
}
