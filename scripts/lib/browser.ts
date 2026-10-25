import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser } from 'playwright';
import { root } from './env';

/**
 * A headless browser for the recorder and the stills contact sheet. Prefers the installed Google Chrome (it has
 * every codec and font the app expects), then Remotion's headless shell, then Playwright's own Chromium.
 * Override with RECORD_BROWSER=chrome|chromium|/path/to/binary.
 */
export async function launchBrowser(): Promise<{ browser: Browser; label: string }> {
  const pref = process.env.RECORD_BROWSER;
  const arch = process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
  const shell = path.join(root, 'node_modules', '.remotion', 'chrome-headless-shell', arch, `chrome-headless-shell-${arch}`, 'chrome-headless-shell');
  const attempts: { label: string; opts: Parameters<typeof chromium.launch>[0] }[] = pref
    ? [pref === 'chrome' || pref === 'chromium' ? { label: pref, opts: pref === 'chrome' ? { channel: 'chrome' } : {} } : { label: pref, opts: { executablePath: pref } }]
    : [
        { label: 'Google Chrome', opts: { channel: 'chrome' } },
        ...(fs.existsSync(shell) ? [{ label: 'Remotion headless shell', opts: { executablePath: shell } }] : []),
        { label: 'Playwright Chromium', opts: {} },
      ];
  let lastErr: unknown;
  for (const a of attempts) {
    try {
      return { browser: await chromium.launch({ headless: true, ...a.opts }), label: a.label };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
