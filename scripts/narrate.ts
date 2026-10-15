/**
 * Generate one narration clip per scene and a manifest with measured durations.
 *
 *   npm run narrate                 # the project of the folder you ran npm from
 *   VIDEO=<id> npm run narrate      # or name one (see scripts/lib/project.ts)
 *
 * Provider is chosen from TTS_PROVIDER, else by which API key is present, else
 * the built-in macOS `say` voice (free, offline, good enough to cut to).
 * Clips are cached by a hash of provider + voice + text, so editing one line
 * only regenerates that scene.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { loadEnv, readJson, writeJson } from './lib/env';
import { audioDurationSec } from './lib/audio';
import type { NarrationManifest, VideoSpec } from '../src/spec';
import { transcribeWords } from './lib/assemblyai';
import { loadProject, show, type Project } from './lib/project';

type Provider = 'say' | 'elevenlabs' | 'openai' | 'human';
const DEFAULT_ELEVEN_VOICE = '21m00Tcm4TlvDq8ikWAM';
/** Per-video voice from the storyboard wins; .env is the machine-wide default. */
const elevenVoice = (spec: VideoSpec) => spec.voice.elevenlabs ?? process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_ELEVEN_VOICE;
const openaiVoice = (spec: VideoSpec) => spec.voice.openai ?? process.env.OPENAI_TTS_VOICE ?? 'onyx';
const VOICE_EXTS = ['wav', 'mp3', 'm4a', 'aiff', 'aif'];

/** Folder where a person's own recordings go, one file per scene: <project>/voice/<scene-id>.<wav|mp3|m4a|aiff>. */
const voiceDir = (p: Project) => path.join(p.dir, 'voice');

function humanFile(p: Project, sceneId: string): string | null {
  for (const ext of VOICE_EXTS) {
    const f = path.join(voiceDir(p), `${sceneId}.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

function pickProvider(p: Project): Provider {
  const forced = process.env.TTS_PROVIDER as Provider | undefined;
  if (forced) return forced;
  if (fs.existsSync(voiceDir(p)) && p.spec.scenes.some((sc) => humanFile(p, sc.id))) return 'human';
  if (process.env.ELEVENLABS_API_KEY) return 'elevenlabs';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'say';
}

function voiceLabel(provider: Provider, spec: VideoSpec): string {
  if (provider === 'say') return `${spec.voice.say}@${spec.voice.rate}`;
  if (provider === 'elevenlabs') return elevenVoice(spec);
  if (provider === 'human') return 'your recording';
  return openaiVoice(spec);
}

async function synth(provider: Provider, text: string, out: string, spec: VideoSpec): Promise<void> {
  if (provider === 'say') {
    execFileSync('say', ['-v', spec.voice.say, '-r', String(spec.voice.rate), '-o', out, '--file-format=WAVE', '--data-format=LEI16@44100', text], {
      stdio: 'inherit',
    });
    return;
  }
  if (provider === 'elevenlabs') {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error('ELEVENLABS_API_KEY is not set');
    const voice = elevenVoice(spec);
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2 } }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    return;
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: openaiVoice(spec), input: text, response_format: 'mp3' }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
}

async function main(p: Project): Promise<void> {
  loadEnv();
  const { spec } = p;
  const provider = pickProvider(p);
  const voice = voiceLabel(provider, spec);
  const outDir = path.join(p.publicDir, 'narration');
  fs.mkdirSync(outDir, { recursive: true });
  const manifestPath = path.join(outDir, 'manifest.json');
  const prev = readJson<NarrationManifest>(manifestPath);
  const prevById = new Map((prev?.scenes ?? []).map((s) => [s.id, s]));

  console.log(`Narrating "${spec.name}" with ${provider} (${voice})`);
  const scenes: NarrationManifest['scenes'] = [];
  const aaiKey = process.env.ASSEMBLYAI_API_KEY;
  if (provider === 'human' && !aaiKey) console.log('  (no ASSEMBLYAI_API_KEY: captions will be timed proportionally rather than to your words)');
  for (const sc of spec.scenes) {
    const text = sc.spoken ?? sc.narration;
    let hash: string;
    let file: string;
    let source: string | null = null;
    if (provider === 'human') {
      source = humanFile(p, sc.id);
      if (!source) throw new Error(`No recording for scene "${sc.id}". Expected ${show(voiceDir(p))}/${sc.id}.{${VOICE_EXTS.join(',')}}`);
      hash = crypto.createHash('sha1').update(fs.readFileSync(source)).update(aaiKey ? 'aai' : '').digest('hex').slice(0, 12);
      file = `${sc.id}${path.extname(source)}`;
    } else {
      hash = crypto.createHash('sha1').update(`${provider}|${voice}|${text}`).digest('hex').slice(0, 12);
      file = `${sc.id}.${provider === 'say' ? 'wav' : 'mp3'}`;
    }
    const abs = path.join(outDir, file);
    const cached = prevById.get(sc.id);
    if (cached && cached.hash === hash && fs.existsSync(abs)) {
      scenes.push({ ...cached, text: sc.narration });
      console.log(`  = ${sc.id.padEnd(14)} ${cached.durationSec.toFixed(1)}s (cached)`);
      continue;
    }
    if (source) fs.copyFileSync(source, abs);
    else await synth(provider, text, abs, spec);
    const durationSec = audioDurationSec(abs);
    const entry: NarrationManifest['scenes'][number] = { id: sc.id, file: `narration/${file}`, durationSec, text: sc.narration, spoken: text, hash };
    if (source && aaiKey) {
      const { words } = await transcribeWords(abs, aaiKey);
      entry.words = words;
    }
    scenes.push(entry);
    console.log(`  + ${sc.id.padEnd(14)} ${durationSec.toFixed(1)}s${entry.words ? ` · ${entry.words.length} words aligned` : ''}`);
  }
  const total = scenes.reduce((a, s) => a + s.durationSec, 0);
  writeJson(manifestPath, { video: spec.id, provider, voice, generatedAt: new Date().toISOString(), scenes } satisfies NarrationManifest);
  console.log(`Narration total ${total.toFixed(1)}s → ${show(manifestPath)}`);
}

loadProject()
  .then(main)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
