import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

/** Duration of a wav/mp3 file in seconds. Uses macOS afinfo, falls back to parsing the WAV header. */
export function audioDurationSec(file: string): number {
  try {
    const out = execFileSync('afinfo', [file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const m = out.match(/estimated duration:\s*([\d.]+)/);
    if (m) return parseFloat(m[1]);
  } catch {
    /* not macOS or afinfo missing */
  }
  if (file.toLowerCase().endsWith('.wav')) return wavDurationSec(file);
  throw new Error(`Cannot measure duration of ${file} (install afinfo-compatible tooling or use wav output)`);
}

function wavDurationSec(file: string): number {
  const buf = fs.readFileSync(file);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`${file} is not a RIFF/WAVE file`);
  let off = 12;
  let byteRate = 0;
  let dataSize = 0;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') byteRate = buf.readUInt32LE(off + 16);
    if (id === 'data') {
      dataSize = size;
      break;
    }
    off += 8 + size + (size % 2);
  }
  if (!byteRate || !dataSize) throw new Error(`Malformed WAV: ${file}`);
  return dataSize / byteRate;
}
