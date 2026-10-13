/** Word-level timestamps for a recorded narration clip, via AssemblyAI. */
import fs from 'node:fs';

export type WordTime = { text: string; start: number; end: number }; // seconds

const API = 'https://api.assemblyai.com/v2';

export async function transcribeWords(file: string, apiKey: string): Promise<{ words: WordTime[]; text: string }> {
  const headers = { authorization: apiKey };
  const up = await fetch(`${API}/upload`, { method: 'POST', headers: { ...headers, 'content-type': 'application/octet-stream' }, body: fs.readFileSync(file) });
  if (!up.ok) throw new Error(`AssemblyAI upload ${up.status}: ${await up.text()}`);
  const { upload_url } = (await up.json()) as { upload_url: string };

  const tr = await fetch(`${API}/transcript`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ audio_url: upload_url }) });
  if (!tr.ok) throw new Error(`AssemblyAI transcript ${tr.status}: ${await tr.text()}`);
  const { id } = (await tr.json()) as { id: string };

  for (;;) {
    await new Promise((r) => setTimeout(r, 2500));
    const res = await fetch(`${API}/transcript/${id}`, { headers });
    const j = (await res.json()) as { status: string; error?: string; text?: string; words?: { text: string; start: number; end: number }[] };
    if (j.status === 'completed') return { text: j.text ?? '', words: (j.words ?? []).map((w) => ({ text: w.text, start: w.start / 1000, end: w.end / 1000 })) };
    if (j.status === 'error') throw new Error(`AssemblyAI: ${j.error}`);
  }
}
