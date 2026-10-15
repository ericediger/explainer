/* EXPLAINER workbench: the recording stage for the pipeline's own explainer.
 * Everything it shows is read from assets/, a snapshot of one real run (the week-prep video): its storyboard,
 * narration clips + manifest, recorded footage + cues, a rendered excerpt, and the README it was published in.
 * The terminal replays each command's real console format with the real numbers; nothing is re-run. */
(async () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const A = 'assets/';
  const route = (location.hash || '#storyboard').slice(1);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  // ── the real data ────────────────────────────────────────────────────────────────────────────────────────
  const [scriptText, manifest, cuesFile, readmeText] = await Promise.all([
    fetch(A + 'script.ts.txt').then((r) => r.text()),
    fetch(A + 'manifest.json').then((r) => r.json()),
    fetch(A + 'cues.json').then((r) => r.json()),
    fetch(A + 'README.md').then((r) => r.text()),
  ]);
  // The storyboard is a TypeScript object literal; strip the import and the type annotation and evaluate it.
  const spec = new Function(scriptText.replace(/^import .*$/m, '').replace(/export const spec:\s*VideoSpec\s*=/, 'return '))();
  const dur = (id) => manifest.scenes.find((s) => s.id === id)?.durationSec ?? 0;
  const hashOf = (id) => manifest.scenes.find((s) => s.id === id)?.hash ?? '';

  // ── pipeline rail ────────────────────────────────────────────────────────────────────────────────────────
  const ORDER = ['script', 'narrate', 'record', 'render', 'poster', 'media'];
  const ACTIVE = { storyboard: 'script', narrate: 'narrate', record: 'record', render: 'render', deliver: 'poster' }[route] ?? 'script';
  const stageEl = (s) => $(`.stage[data-stage="${s}"]`);
  ORDER.forEach((s, i) => {
    const el = stageEl(s);
    el.classList.toggle('done', i < ORDER.indexOf(ACTIVE));
    el.classList.toggle('active', s === ACTIVE);
  });

  // ── terminal ─────────────────────────────────────────────────────────────────────────────────────────────
  const out = $('#out');
  const cmd = $('#cmd');
  const print = (text, cls = '') => {
    const d = document.createElement('div');
    d.textContent = text;
    if (cls) d.className = cls;
    out.appendChild(d);
    while (out.children.length > 7) out.firstChild.remove();
  };
  const f1 = (n) => n.toFixed(1);

  // ── waveforms: decode the real narration clips ──────────────────────────────────────────────────────────
  let actx = null;
  async function peaksFor(file, n) {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const buf = await (await fetch(A + 'audio/' + file)).arrayBuffer();
    const audio = await actx.decodeAudioData(buf);
    const data = audio.getChannelData(0);
    const step = Math.floor(data.length / n);
    const peaks = [];
    for (let i = 0; i < n; i++) {
      let m = 0;
      for (let j = i * step; j < (i + 1) * step; j += 8) m = Math.max(m, Math.abs(data[j] || 0));
      peaks.push(m);
    }
    const top = Math.max(...peaks) || 1;
    return peaks.map((p) => p / top);
  }
  function paintWave(canvas, peaks, upTo, color) {
    const W = (canvas.width = canvas.clientWidth * 2);
    const H = (canvas.height = canvas.clientHeight * 2);
    const g = canvas.getContext('2d');
    g.clearRect(0, 0, W, H);
    const bw = W / peaks.length;
    peaks.forEach((p, i) => {
      const h = Math.max(3, p * H * 0.9);
      g.fillStyle = i / peaks.length <= upTo ? color : '#ddd3c1';
      g.fillRect(i * bw + bw * 0.18, (H - h) / 2, bw * 0.64, h);
    });
  }

  const pane = $('#pane');
  const RUN = {};

  // ═════════ storyboard ══════════════════════════════════════════════════════════════════════════════════════
  if (route === 'storyboard') {
    pane.innerHTML = `
      <section class="split" id="p-storyboard">
        <div class="card editor">
          <div class="tab">script.ts <span class="path">week-prep/explainer/</span><span class="saved" id="saved">● saved</span></div>
          <div id="code"></div>
        </div>
        <aside class="card scenes">
          <h3>Scenes <em>${spec.scenes.length}</em></h3>
          <ol id="sceneList"></ol>
        </aside>
      </section>`;

    const TOK = /(\/\/.*$)|('(?:\\.|[^'\\])*')|\b(export|const|import|type|from|true|false)\b|\b([A-Za-z_]\w*)(?=\s*:)|(\b\d+(?:\.\d+)?\b)/g;
    const hl = (line) => {
      if (/^\s*(\/\*\*?|\*\/?)/.test(line)) return `<span class="c">${esc(line)}</span>`;
      let o = '';
      let last = 0;
      let m;
      TOK.lastIndex = 0;
      while ((m = TOK.exec(line))) {
        o += esc(line.slice(last, m.index));
        if (m[2] && m[2].includes('Here is the result.')) {
          o += `<span class="s">'<span id="narr" contenteditable="true" spellcheck="false">${esc(m[2].slice(1, -1))}</span>'</span>`;
        } else {
          const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'p' : 'n';
          o += `<span class="${cls}">${esc(m[0])}</span>`;
        }
        last = m.index + m[0].length;
      }
      return o + esc(line.slice(last));
    };
    $('#code').innerHTML = scriptText
      .replace(/\n$/, '')
      .split('\n')
      .map((l, i) => `<div class="ln${l.includes('Here is the result.') ? ' hot' : ''}"><b>${i + 1}</b><code>${hl(l) || ' '}</code></div>`)
      .join('');

    $('#sceneList').innerHTML = spec.scenes
      .map(
        (s) => `<li class="${s.kind}" data-id="${s.id}"><i>${s.kind === 'footage' ? '▶' : '✦'}</i><b>${s.id}</b><em>${f1(dur(s.id))}s</em><span>${esc(s.title)}</span></li>`,
      )
      .join('');

    const narr = $('#narr');
    narr.addEventListener('focus', () => narr.classList.add('typing'));
    narr.addEventListener('blur', () => narr.classList.remove('typing'));
    narr.addEventListener('input', () => {
      $('#saved').textContent = '● edited';
      $('#saved').classList.add('dirty');
      const card = $('#sceneList li[data-id="home"]');
      card.classList.add('stale');
      $('em', card).textContent = '↻ stale';
      ['narrate', 'record', 'render', 'poster'].forEach((s) => stageEl(s).classList.add('stale'));
    });

    // The tail of the last full build, so the terminal is not empty.
    print('EXPLAINER ❯ VIDEO=week-prep npm run build', 'cmd');
    print(`Narration total ${f1(manifest.scenes.reduce((a, s) => a + s.durationSec, 0))}s → build/week-prep/public/narration/manifest.json`, 'dim');
    const pol = cuesFile.scenes.polish;
    print(`▶ polish       target ${f1(0.6 + dur('polish') + 0.9 + 0.8)}s … ${f1(pol.durationSec)}s, ${pol.cues.length} cues → footage/polish.mp4`, 'dim');
    print('✓ build/week-prep/week-prep.mp4', 'ok');
    print(`✓ build/week-prep/week-prep-poster.jpg (frame at ${spec.poster.atSec}s)`, 'ok');
  }

  // ═════════ narrate ═════════════════════════════════════════════════════════════════════════════════════════
  if (route === 'narrate') {
    const voices = [
      { k: 'say', name: 'macOS say', sub: 'default · offline · free' },
      { k: 'elevenlabs', name: 'ElevenLabs', sub: 'ELEVENLABS_API_KEY' },
      { k: 'openai', name: 'OpenAI', sub: 'OPENAI_API_KEY' },
      { k: 'human', name: 'Your own voice', sub: 'voice/&lt;scene-id&gt;.wav' },
    ];
    pane.innerHTML = `
      <section class="split" id="p-narrate">
        <div class="card">
          <h3>Narrator <em>${esc(manifest.provider)}</em></h3>
          <div class="voices">${voices.map((v) => `<div class="voice${v.k === manifest.provider ? ' on' : ''}" data-k="${v.k}"><b>${v.name}</b><span>${v.sub}</span></div>`).join('')}</div>
        </div>
        <div class="card">
          <h3>Clips · cached by text hash <em>${manifest.scenes.length}</em></h3>
          <div class="clips" id="clips">${manifest.scenes
            .map(
              (s) => `<div class="clip" data-id="${s.id}"><span class="id">${s.id}</span><canvas></canvas><span class="dur">${f1(s.durationSec)}s</span><span class="hash">#${s.hash.slice(0, 7)}</span><span class="chip">queued</span></div>`,
            )
            .join('')}</div>
        </div>
      </section>`;
    const clipPeaks = {};
    await Promise.all(
      manifest.scenes.map(async (s) => {
        const c = $(`.clip[data-id="${s.id}"] canvas`);
        clipPeaks[s.id] = await peaksFor(s.file.replace('narration/', ''), 110);
        paintWave(c, clipPeaks[s.id], 1, '#b9ad98');
      }),
    );
    RUN.narrate = async () => {
      print(`Narrating "${spec.name}" with ${manifest.provider} (${manifest.voice})`);
      await sleep(350);
      for (const s of manifest.scenes) {
        const fresh = s.id === 'home';
        print(`  ${fresh ? '+' : '='} ${s.id.padEnd(14)} ${f1(s.durationSec)}s${fresh ? '' : ' (cached)'}`, fresh ? 'acc' : 'dim');
        const row = $(`.clip[data-id="${s.id}"]`);
        const chip = $('.chip', row);
        chip.textContent = fresh ? 'regenerated' : 'cached';
        chip.className = 'chip ' + (fresh ? 'fresh' : 'cached');
        const c = $('canvas', row);
        const color = fresh ? '#e8590c' : '#7a6f5f';
        const t0 = performance.now();
        const grow = () => {
          const p = clamp((performance.now() - t0) / (fresh ? 500 : 200));
          paintWave(c, clipPeaks[s.id], p, color);
          if (p < 1) requestAnimationFrame(grow);
        };
        grow();
        await sleep(fresh ? 520 : 230);
      }
      const total = manifest.scenes.reduce((a, s) => a + s.durationSec, 0);
      print(`Narration total ${f1(total)}s → build/week-prep/public/narration/manifest.json`, 'ok');
    };
  }

  // ═════════ record ══════════════════════════════════════════════════════════════════════════════════════════
  if (route === 'record') {
    const home = cuesFile.scenes.home;
    const VW = cuesFile.viewport.width;
    const VH = cuesFile.viewport.height;
    pane.innerHTML = `
      <section class="split" id="p-record">
        <div class="card player">
          <h3>footage/home.mp4 <em>${home.width}×${home.height} · ${f1(home.durationSec)}s</em></h3>
          <div class="vidwrap"><div class="vidbox"><video id="clip" muted playsinline preload="auto" src="${A}footage/home.mp4"></video><div id="cueBox"><span id="cueLabel"></span></div></div></div>
          <div class="timeline" id="tl"><div class="fill" id="tlFill"></div></div>
        </div>
        <div class="side">
          <div class="card cam"><canvas id="cam" width="960" height="540"></canvas></div>
          <div class="card">
            <h3>cues.json <em>${home.cues.length} cues</em></h3>
            <div class="cuelist" id="cueList">${home.cues
              .map((c, i) =>
                c.kind === 'reset'
                  ? `<div class="cue" data-i="${i}"><b>${c.t.toFixed(2)}s</b><span>reset</span><span>camera back to full frame</span></div>`
                  : `<div class="cue" data-i="${i}"><b>${c.t.toFixed(2)}s</b><span>zoom</span><span>x ${Math.round(c.rect.x)} · y ${Math.round(c.rect.y)} · ${Math.round(c.rect.w)}×${Math.round(c.rect.h)}</span></div>`,
              )
              .join('')}</div>
          </div>
        </div>
      </section>`;
    const clip = $('#clip');
    await new Promise((res) => {
      if (clip.readyState >= 2) return res();
      clip.addEventListener('loadeddata', res, { once: true });
      setTimeout(res, 4000);
    });
    const box = $('#cueBox');
    const label = $('#cueLabel');
    const cam = $('#cam');
    const cg = cam.getContext('2d');
    const CW = cam.width;
    const CH = cam.height;
    const IDENT = { scale: 1, tx: 0, ty: 0 };
    const targetFor = (c) => {
      if (c.kind === 'reset' || !c.rect) return IDENT;
      const s0 = CW / VW;
      const pad = c.pad ?? 24;
      const r = { w: (c.rect.w + 2 * pad) * s0, h: (c.rect.h + 2 * pad) * s0, x: (c.rect.x - pad) * s0, y: (c.rect.y - pad) * s0 };
      const scale = Math.min(2.4, Math.max(1, Math.min(CW / r.w, CH / r.h)));
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      return { scale, tx: Math.min(0, Math.max(CW - CW * scale, CW / 2 - cx * scale)), ty: Math.min(0, Math.max(CH - CH * scale, CH / 2 - cy * scale)) };
    };
    const cameraAt = (t) => {
      let prev = IDENT;
      let st = IDENT;
      for (const c of home.cues) {
        if (c.t > t) break;
        const tg = targetFor(c);
        const p = easeInOut((t - c.t) / 0.8);
        st = { scale: lerp(prev.scale, tg.scale, p), tx: lerp(prev.tx, tg.tx, p), ty: lerp(prev.ty, tg.ty, p) };
        prev = tg;
      }
      return st;
    };
    // cue ticks on the timeline
    const dur0 = home.durationSec;
    $('#tl').insertAdjacentHTML(
      'beforeend',
      home.cues.map((c) => `<span class="tick${c.kind === 'reset' ? ' reset' : ''}" style="left:${((c.t + home.readyAt) / dur0) * 100}%"></span>`).join(''),
    );
    const frame = () => {
      const t = clip.currentTime - home.readyAt;
      const wrap = $('.vidbox');
      const k = wrap.clientWidth / VW;
      let idx = -1;
      home.cues.forEach((c, i) => {
        if (c.t <= t) idx = i;
      });
      $$('.cue').forEach((el) => el.classList.toggle('on', Number(el.dataset.i) === idx));
      const c = home.cues[idx];
      if (c && c.kind === 'zoom') {
        const pad = c.pad ?? 24;
        box.style.left = (c.rect.x - pad) * k + 'px';
        box.style.top = (c.rect.y - pad) * k + 'px';
        box.style.width = (c.rect.w + 2 * pad) * k + 'px';
        box.style.height = (c.rect.h + 2 * pad) * k + 'px';
        label.textContent = `zoom · ${c.t.toFixed(2)}s`;
        box.classList.add('on');
      } else box.classList.remove('on');
      const cm = cameraAt(Math.max(0, t));
      cg.setTransform(1, 0, 0, 1, 0, 0);
      cg.clearRect(0, 0, CW, CH);
      cg.setTransform(cm.scale, 0, 0, cm.scale, cm.tx, cm.ty);
      cg.drawImage(clip, 0, 0, CW, CH);
      $('#tlFill').style.width = (clip.currentTime / (clip.duration || dur0)) * 100 + '%';
      requestAnimationFrame(frame);
    };
    frame();
    RUN.record = async () => {
      print('Recording with Google Chrome');
      await sleep(500);
      clip.currentTime = 0;
      clip.playbackRate = 1.5; // preview speed, so all four cues land inside the scene
      clip.play();
      await sleep(900);
      print(`▶ home         target ${f1(0.6 + dur('home') + 0.9 + 0.8)}s … ${f1(home.durationSec)}s, ${home.cues.length} cues → ${home.file}`, 'acc');
      await sleep(900);
      print('Cues → build/week-prep/public/footage/cues.json', 'ok');
    };
  }

  // ═════════ render ══════════════════════════════════════════════════════════════════════════════════════════
  if (route === 'render') {
    // The music bed's volume curve, from the real narration windows and the spec's levels (0.22 → 0.07, 0.6 s ramps).
    let t = 0;
    const wins = [];
    for (const sc of spec.scenes) {
      const lead = sc.leadInSec ?? 0.6;
      const tail = sc.tailSec ?? 0.9;
      wins.push([t + lead, t + lead + dur(sc.id)]);
      t += lead + dur(sc.id) + tail;
    }
    const total = t;
    const M = spec.music;
    const vol = (x) => {
      let amt = 0;
      for (const [a, b] of wins) amt = Math.max(amt, Math.min(clamp((x - (a - 0.6)) / 0.6), clamp(1 - (x - b) / 0.6)));
      return lerp(M.volume, M.duckTo, amt) * clamp(x / 1.5) * clamp((total - x) / (M.fadeOutSec ?? 3));
    };
    const frames = Math.round(total * spec.fps);
    pane.innerHTML = `
      <section class="split" id="p-render">
        <div class="card">
          <h3>Composition <em>${spec.id}</em></h3>
          <div class="layers">
            <div class="layer" data-i="0"><div class="sw bg"></div><div><b>Stage</b><span>Motion-graphics background and the animated scenes, in your app's colors</span></div></div>
            <div class="layer" data-i="1"><div class="sw foot"></div><div><b>Footage</b><span>The recorded clips in a browser frame; camera moves computed from cues.json</span></div></div>
            <div class="layer" data-i="2"><div class="sw cap"></div><div><b>Captions</b><span>One sentence at a time, timed to the voice</span></div></div>
            <div class="layer" data-i="3"><div class="sw"><canvas id="wavesw"></canvas></div><div><b>Narration</b><span>Every clip, back to back</span></div></div>
            <div class="layer" data-i="4"><div class="sw"><canvas id="ducksw"></canvas></div><div><b>Music bed</b><span>${M.volume} between lines, ${M.duckTo} under the voice</span></div></div>
          </div>
        </div>
        <div class="card final">
          <h3>build/${spec.id}/${spec.id}.mp4 <em>rendered frames</em></h3>
          <div class="vidwrap"><div class="vidbox"><video id="final" muted loop playsinline preload="auto" src="${A}week-prep-excerpt.mp4"></video></div></div>
          <div class="meta"><span>${spec.width}×${spec.height}</span><span>${spec.fps} fps</span><span>h264 + aac</span><span>${f1(total)} s</span><span class="hot">${frames} frames</span></div>
          <div class="duckwrap"><canvas id="duck"></canvas><small>music volume across the whole video; shaded where the narrator speaks</small></div>
        </div>
      </section>`;
    // big duck plot
    const drawDuck = (cv, color, shade) => {
      const W = (cv.width = cv.clientWidth * 2);
      const H = (cv.height = cv.clientHeight * 2);
      const g = cv.getContext('2d');
      g.clearRect(0, 0, W, H);
      if (shade) {
        g.fillStyle = 'rgba(232,89,12,.14)';
        wins.forEach(([a, b]) => g.fillRect((a / total) * W, 0, ((b - a) / total) * W, H));
      }
      g.beginPath();
      g.moveTo(0, H);
      for (let x = 0; x <= W; x += 2) g.lineTo(x, H - (vol((x / W) * total) / (M.volume * 1.05)) * H * 0.9);
      g.lineTo(W, H);
      g.closePath();
      g.fillStyle = color;
      g.fill();
    };
    // thumbnail waveform: all narration windows as bars
    const drawNarr = (cv) => {
      const W = (cv.width = cv.clientWidth * 2);
      const H = (cv.height = cv.clientHeight * 2);
      const g = cv.getContext('2d');
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#7a6f5f';
      wins.forEach(([a, b]) => {
        for (let x = (a / total) * W; x < (b / total) * W; x += 5) g.fillRect(x, H / 2 - (4 + ((x * 7) % 21)) / 2, 3, 4 + ((x * 7) % 21));
      });
    };
    drawDuck($('#duck'), '#e8590c', true);
    drawDuck($('#ducksw'), '#e8590c', false);
    drawNarr($('#wavesw'));
    const fin = $('#final');
    await new Promise((res) => {
      if (fin.readyState >= 2) return res();
      fin.addEventListener('loadeddata', res, { once: true });
      setTimeout(res, 4000);
    });
    RUN.render = async () => {
      print(`Rendering ${spec.id}  ${spec.width}×${spec.height} · ${spec.fps} fps · h264`);
      fin.play();
      await sleep(400);
      // paced so each layer lights as the narration names it
      const marks = [0.12, 0.37, 0.61, 0.84, 1];
      const gaps = [1100, 1100, 600, 700, 500];
      for (let i = 0; i < 5; i++) {
        $(`.layer[data-i="${i}"]`).classList.add('on');
        const n = Math.round(frames * marks[i]);
        print(`Rendered ${String(n).padStart(String(frames).length)}/${frames}`, i === 4 ? 'ok' : 'dim');
        await sleep(gaps[i]);
      }
      print(`Encoded ${frames}/${frames}`, 'ok');
      await sleep(350);
      print(`✓ build/${spec.id}/${spec.id}.mp4`, 'ok');
    };
  }

  // ═════════ deliver ═════════════════════════════════════════════════════════════════════════════════════════
  if (route === 'deliver') {
    const blocks = readmeText.trim().split(/\n\s*\n/);
    const inline = (s) =>
      esc(s)
        .replace(/\*\*\[([^\]]+)\]\(([^)]+)\)\*\*/g, '<a>$1</a>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a>$1</a>');
    const title = blocks[0].replace(/^#\s*/, '');
    const body = blocks.slice(3).join(' ');
    pane.innerHTML = `
      <section class="split" id="p-deliver">
        <div class="card">
          <h3>week-prep/ <em>the app's own folder</em></h3>
          <div class="tree">
            <div class="row dim">├─ Home.html</div>
            <div class="row dim">├─ demo.html</div>
            <div class="row dim">├─ README.md</div>
            <div class="row">└─ media/</div>
            <div class="row land" id="f-video">   ├─ ${spec.id}-explainer.mp4<span class="sz">26.1 MB</span></div>
            <div class="row land" id="f-poster">   └─ explainer-poster.jpg<span class="sz">99 KB</span></div>
          </div>
        </div>
        <div class="card readme">
          <div class="gh">README.md</div>
          <h1>${esc(title)}</h1>
          <div class="poster" id="poster" style="opacity:0"><img src="${A}media/explainer-poster.jpg" alt=""></div>
          <p class="links" id="links" style="opacity:0">${inline('**[▶ Watch the 2-minute explainer](#)** · **[Try the live demo](#)**')}</p>
          <p>${inline(body)}</p>
        </div>
      </section>`;
    RUN.deliver = async () => {
      await sleep(500);
      const dir = '/Volumes/Backup/_LOCAL APP DEVELOPMENT/WEEK PREP/week-prep/media/';
      print(`→ ${dir}${spec.id}-explainer.mp4`, 'ok');
      $('#f-video').classList.add('on');
      await sleep(900);
      print(`→ ${dir}explainer-poster.jpg`, 'ok');
      $('#f-poster').classList.add('on');
      stageEl('media').classList.add('lit');
      await sleep(500);
      $('#poster').style.transition = 'opacity .6s';
      $('#poster').style.opacity = 1;
      await sleep(700);
      $('#links').style.transition = 'opacity .6s';
      $('#links').style.opacity = 1;
    };
  }

  // ── terminal input → run the route's replay ──────────────────────────────────────────────────────────────
  let ran = false;
  cmd.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter' || ran) return;
    ran = true;
    const text = cmd.value;
    cmd.value = '';
    print('EXPLAINER ❯ ' + text, 'cmd');
    cmd.disabled = true;
    await RUN[route]?.();
  });

  // ── helpers the recorder calls ───────────────────────────────────────────────────────────────────────────
  window.demo = {
    // run the whole pipeline strip once, stage by stage ("edit a line, run it again")
    async sweep() {
      for (const st of ORDER) {
        const el = stageEl(st);
        el.classList.add('pulse');
        await sleep(300);
        el.classList.remove('pulse');
      }
    },
    caretAfter(sel, text) {
      const el = $(sel);
      el.focus();
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const i = n.data.indexOf(text);
        if (i >= 0) {
          const r = document.createRange();
          r.setStart(n, i + text.length);
          r.collapse(true);
          const s = getSelection();
          s.removeAllRanges();
          s.addRange(r);
          return true;
        }
      }
      return false;
    },
  };

  $('#stageReady').textContent = 'ready';
})();
