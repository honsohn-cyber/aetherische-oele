// Studio: Backing-Band, Mixer, Gitarren-Aufnahme und Mixdown.
'use strict';

const REC_WORKLET = `
class Rec extends AudioWorkletProcessor {
  constructor() {
    super();
    this.start = -1; this.end = -1; this.buf = null;
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m.cmd === 'rec') { this.start = m.start; this.end = m.end; this.buf = new Float32Array(m.end - m.start); }
      else if (m.cmd === 'cancel') { this.start = this.end = -1; this.buf = null; }
    };
  }
  process(inputs) {
    const inp = inputs[0] && inputs[0][0];
    if (this.buf && inp) {
      const f0 = currentFrame;
      for (let i = 0; i < inp.length; i++) {
        const f = f0 + i;
        if (f >= this.start && f < this.end) this.buf[f - this.start] = inp[i];
      }
      if (f0 + inp.length >= this.end) {
        this.port.postMessage({ samples: this.buf }, [this.buf.buffer]);
        this.buf = null; this.start = this.end = -1;
      }
    }
    return true;
  }
}
registerProcessor('rec', Rec);
`;
const REC_TAIL = 0.4; // Sekunden Reserve hinter der Aufnahme für den Latenz-Ausgleich

const DEFAULT_PAN = { keys: -20, organ: 20, arp: 25, perc: -25 };
const DEFAULT_SEND = { drums: 12, bass: 0, keys: 25, organ: 20, pad: 40, arp: 30, perc: 10 };

const Studio = {
  tracks: [],
  guitar: { vol: 75, pan: 0, mute: false, solo: false, send: 0 },
  masterVol: 75,
  bpm: 100,
  presetId: 'blues',
  song: null, baseBpm: 100, speedPct: 100,
  chordsText: 'E7*4 A7*2 E7*2 B7 A7 E7*2',
  metro: false,
  latencyMs: 80,
  latencyUserSet: false,
  chords: [], bars: [], loopBeats: 16, bad: [],
  playing: false, attached: false, attaching: null,
  mix: null, gStrip: null, recorder: null,
  refTime: 0, refBeat: 0, scheduledBeat: 0, timer: null,
  rec: { state: 'idle' },
  nextId: 1,
  meters: [],
  meterBuf: new Float32Array(512),

  // ------------------------------------------------------------ Zustand
  init() {
    const s = store.get('studio', null);
    if (s) {
      this.bpm = s.bpm || this.bpm;
      this.baseBpm = s.baseBpm || this.bpm;
      this.speedPct = s.speedPct || 100;
      this.song = (typeof SONGS !== 'undefined' && SONGS.find((x) => x.id === s.songId)) || null;
      this.presetId = s.presetId || this.presetId;
      this.chordsText = s.chordsText || this.chordsText;
      this.metro = !!s.metro;
      this.masterVol = s.masterVol == null ? 75 : s.masterVol;
      if (s.guitar) Object.assign(this.guitar, s.guitar);
      if (s.latencyMs != null) { this.latencyMs = s.latencyMs; this.latencyUserSet = true; }
      (s.tracks || []).forEach((t) => { if (INST[t.kind]) this.tracks.push({ ...t, id: 't' + this.nextId++ }); });
    } else {
      this.addTrack('drums', {}, true);
      this.addTrack('bass', {}, true);
    }
    this.parse();
    this.buildToolbar();
    this.renderMixer();
    this.syncToolbar();
    requestAnimationFrame(() => this.uiFrame());
  },

  save() {
    store.set('studio', {
      bpm: this.bpm, baseBpm: this.baseBpm, speedPct: this.speedPct, songId: this.song ? this.song.id : null, presetId: this.presetId, chordsText: this.chordsText, metro: this.metro,
      masterVol: this.masterVol, guitar: this.guitar, latencyMs: this.latencyMs,
      tracks: this.tracks.filter((t) => t.kind !== 'take').map(({ kind, style, vol, pan, mute, solo, send, fill, sec }) =>
        ({ kind, style, vol, pan, mute, solo, send, fill, sec })),
    });
  },

  parse() {
    if (this.song) {
      const sb = songBars(this.song);
      this.bad = [];
      this.chords = [];
      this.bars = sb.bars;
      this.loopBeats = this.bars.length * 4;
      this.chordsText = sb.text;
      this.tracks.forEach((t) => this.rebuildEvents(t));
      return;
    }
    const { chords, bad } = parseChords(this.chordsText);
    this.bad = bad;
    if (chords.length) {
      this.chords = chords;
      this.bars = expandBars(chords);
      this.loopBeats = this.bars.length * 4;
    } else if (!this.chords.length) {
      const p = parseChords('E7*4 A7*2 E7*2 B7 A7 E7*2');
      this.chords = p.chords; this.bars = expandBars(p.chords); this.loopBeats = this.bars.length * 4;
    }
    this.tracks.forEach((t) => this.rebuildEvents(t));
  },

  rebuildEvents(t) {
    if (t.kind === 'take') { t.events = [{ t: 0 }]; return; }
    const spec = INST[t.kind];
    if (!this.song) { t.events = spec.gen(this.bars, t.style, { fill: t.fill }); return; }
    // Song: Abschnitt für Abschnitt, jedes Instrument kann pro Abschnitt eine andere Spielweise haben oder pausieren
    const ev = [];
    let i = 0;
    while (i < this.bars.length) {
      const idx = this.bars[i].secIdx, name = this.bars[i].sec;
      let j = i;
      while (j < this.bars.length && this.bars[j].secIdx === idx) j++;
      const style = t.sec && name in t.sec ? t.sec[name] : t.style;
      if (style && spec.styles[style]) {
        spec.gen(this.bars.slice(i, j), style, { fill: t.fill }).forEach((e) => ev.push({ ...e, t: e.t + i * 4 }));
      }
      i = j;
    }
    t.events = ev;
  },

  /** Song laden: Band, Akkorde, Tempo. Rückgabe false, wenn abgebrochen. */
  loadSong(id) {
    const song = SONGS.find((x) => x.id === id);
    if (!song) return false;
    if (this.takes.length && !confirm('Deine aufgenommenen Gitarren-Takes werden entfernt. Song trotzdem laden?')) return false;
    this.stop();
    this.tracks.forEach((t) => { if (t.strip) t.strip.dispose(); });
    this.tracks = [];
    this.song = song;
    this.presetId = 'custom';
    this.bpm = this.baseBpm = song.bpm;
    this.speedPct = 100;
    this.parse();
    song.band.forEach((b) => this.addTrack(b.kind, { style: b.style, vol: b.vol, pan: b.pan, send: b.send, sec: b.sec }, true));
    this.save();
    this.renderMixer();
    this.syncToolbar();
    this.msg(`Song geladen: ${song.title}. ${song.tip}`);
    return true;
  },

  leaveSong() {
    if (!this.song) return;
    this.song = null;
    this.parse();
  },

  get takes() { return this.tracks.filter((t) => t.kind === 'take'); },

  addTrack(kind, cfg = {}, silent = false) {
    const spec = INST[kind];
    const t = {
      id: 't' + this.nextId++, kind, style: spec.def, vol: spec.vol, pan: DEFAULT_PAN[kind] || 0,
      mute: false, solo: false, send: DEFAULT_SEND[kind] || 0, fill: true, ...cfg,
    };
    this.rebuildEvents(t);
    this.tracks.push(t);
    if (this.attached) this.ensureStrip(t);
    if (!silent) { this.save(); this.renderMixer(); }
    return t;
  },

  removeTrack(id) {
    const i = this.tracks.findIndex((t) => t.id === id);
    if (i < 0) return;
    const [t] = this.tracks.splice(i, 1);
    if (t.strip) t.strip.dispose();
    this.save();
    this.renderMixer();
    this.syncToolbar();
  },

  ensureStrip(t) {
    if (!t.strip) t.strip = createStrip(this.mix);
    this.applyTrack(t);
  },

  anySolo() { return this.guitar.solo || this.tracks.some((t) => t.solo); },

  applyTrack(t) { if (t.strip) applyStrip(t.strip, t, this.anySolo(), engine.ctx, false); },

  applyAll() {
    if (!this.attached) return;
    const solo = this.anySolo();
    applyStrip(this.gStrip, this.guitar, solo, engine.ctx, false);
    this.tracks.forEach((t) => { if (t.strip) applyStrip(t.strip, t, solo, engine.ctx, false); });
    this.mix.master.gain.setTargetAtTime(faderGain(this.masterVol), engine.ctx.currentTime, 0.015);
  },

  // ------------------------------------------------------------ Audio-Anbindung
  attach() {
    if (this.attached) return Promise.resolve();
    if (this.attaching) return this.attaching;
    this.attaching = (async () => {
      const ctx = engine.ctx;
      this.mix = createMixer(ctx, ctx.destination);
      this.gStrip = createStrip(this.mix);
      // Gitarre läuft ab jetzt über den Studio-Mixer statt direkt zum Ausgang
      try { engine.outMeter.disconnect(ctx.destination); } catch (e) { /* egal */ }
      engine.outMeter.connect(this.gStrip.input);

      try {
        const url = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(REC_WORKLET);
        await ctx.audioWorklet.addModule(url);
        this.recorder = new AudioWorkletNode(ctx, 'rec', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
        engine.outMeter.connect(this.recorder);
        const zero = ctx.createGain();
        zero.gain.value = 0;
        this.recorder.connect(zero).connect(ctx.destination);
        this.recorder.port.onmessage = (e) => this.onRecorded(e.data);
      } catch (e) {
        console.warn('Aufnahme nicht verfügbar:', e);
        this.recorder = null;
      }
      if (!this.latencyUserSet) this.latencyMs = Math.max(40, Math.min(200, Math.round(engine.latencyMs + 35)));
      this.attached = true;
      this.tracks.forEach((t) => this.ensureStrip(t));
      this.applyAll();
      this.syncToolbar();
      this.renderMixer();
    })();
    return this.attaching;
  },

  // ------------------------------------------------------------ Transport
  async play(opts = {}) {
    if (this.playing) return;
    if (!(await startAudio())) return;
    await this.attach();
    const ctx = engine.ctx;
    this.refTime = ctx.currentTime + 0.12;
    this.refBeat = opts.countIn ? -4 : 0;
    this.scheduledBeat = this.refBeat;
    this.playing = true;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
    this.syncToolbar();
  },

  stop() {
    if (!this.playing) { this.cancelRec(); return; }
    clearInterval(this.timer);
    this.playing = false;
    this.cancelRec();
    this.tracks.forEach((t) => { if (t.strip) t.strip.resetInput(); }); // laufende Töne sofort stoppen
    this.syncToolbar();
  },

  currentBeat() {
    if (!this.playing) return 0;
    return this.refBeat + (engine.ctx.currentTime - this.refTime) / (60 / this.bpm);
  },

  setBpm(v, fromUser = true) {
    v = Math.max(40, Math.min(240, Math.round(v) || this.bpm));
    if (fromUser) { this.baseBpm = v; this.speedPct = 100; }
    if (this.playing) {
      const cur = this.currentBeat();
      this.refTime = engine.ctx.currentTime;
      this.refBeat = cur;
    }
    this.bpm = v;
    this.save();
    this.syncToolbar();
  },

  schedule() {
    const ctx = engine.ctx, spb = 60 / this.bpm;
    const from = this.scheduledBeat;
    const to = this.refBeat + (ctx.currentTime + 0.15 - this.refTime) / spb;
    if (to <= from) return;
    const T = (beat) => this.refTime + (beat - this.refBeat) * spb;

    for (let k = Math.ceil(from); k < to; k++) {
      if (this.metro || k < 0) playClick(ctx, this.mix.master, T(k), ((k % 4) + 4) % 4 === 0);
    }

    if (this.rec.state === 'armed' && this.rec.startBeat >= from && this.rec.startBeat < to) {
      const startF = Math.round(T(this.rec.startBeat) * ctx.sampleRate);
      const endF = startF + Math.round((this.loopBeats * spb + REC_TAIL) * ctx.sampleRate);
      this.recorder.port.postMessage({ cmd: 'rec', start: startF, end: endF });
      this.rec = { state: 'recording', beats: this.loopBeats, bpm: this.bpm, startBeat: this.rec.startBeat };
    }

    const solo = this.anySolo();
    for (const tr of this.tracks) {
      if (!tr.strip || !tr.events || isSilent(tr, solo)) continue;
      const L = tr.kind === 'take' ? tr.take.beats : this.loopBeats;
      const k0 = Math.max(0, Math.floor(from / L)), k1 = Math.floor(to / L);
      for (let k = k0; k <= k1; k++) {
        for (const ev of tr.events) {
          const tb = k * L + ev.t;
          if (tb < from || tb >= to) continue;
          if (tr.kind === 'take') playTake(ctx, tr.strip.input, tr.take, T(tb));
          else INST[tr.kind].play(ctx, this.mix, tr.strip.input, ev, T(tb), ev.d * spb);
        }
      }
    }
    this.scheduledBeat = to;
  },

  // ------------------------------------------------------------ Aufnahme
  async toggleRec() {
    if (this.rec.state !== 'idle') { this.cancelRec(); this.syncToolbar(); return; }
    if (!(await startAudio())) return;
    await this.attach();
    if (!this.recorder) { this.msg('Aufnahme wird von diesem Browser nicht unterstützt (AudioWorklet fehlt).'); return; }
    if (!this.playing) {
      this.rec = { state: 'armed', startBeat: 0 };
      await this.play({ countIn: true });
    } else {
      const L = this.loopBeats;
      this.rec = { state: 'armed', startBeat: Math.ceil((Math.max(this.currentBeat(), 0) + 0.75) / L) * L };
    }
    this.syncToolbar();
  },

  cancelRec() {
    if (this.rec.state === 'idle') return;
    if (this.recorder) this.recorder.port.postMessage({ cmd: 'cancel' });
    this.rec = { state: 'idle' };
  },

  onRecorded(data) {
    const ctx = engine.ctx;
    const buf = ctx.createBuffer(1, data.samples.length, ctx.sampleRate);
    buf.copyToChannel(data.samples, 0);
    let peak = 0;
    for (let i = 0; i < data.samples.length; i += 7) peak = Math.max(peak, Math.abs(data.samples[i]));
    const n = this.takes.length + 1;
    const t = {
      id: 't' + this.nextId++, kind: 'take', label: `Gitarre Take ${n}`,
      take: { buffer: buf, beats: this.rec.beats, bpm: this.rec.bpm, offsetMs: Math.min(380, this.latencyMs) },
      vol: 75, pan: 0, mute: false, solo: false, send: 0,
    };
    this.rec = { state: 'idle' };
    this.rebuildEvents(t);
    this.tracks.push(t);
    this.ensureStrip(t);
    this.renderMixer();
    this.syncToolbar();
    this.msg(peak < 0.003 ? 'Die Aufnahme ist leer – kam ein Signal von der Gitarre an?' : `Take ${n} aufgenommen. Läuft er neben dem Beat? Stelle „Versatz“ am Kanal nach.`);
  },

  // ------------------------------------------------------------ Mixdown
  async renderMix(loops = 2, onlyId = null) {
    const sr = 44100, spb = 60 / this.bpm, L = this.loopBeats, total = loops * L;
    const off = new OfflineAudioContext(2, Math.ceil((total * spb + 2.5) * sr), sr);
    const mix = createMixer(off, off.destination);
    mix.master.gain.value = faderGain(this.masterVol);
    const solo = this.tracks.some((t) => t.solo);
    for (const tr of this.tracks) {
      if (onlyId ? tr.id !== onlyId : isSilent(tr, solo)) continue;
      const strip = createStrip(mix);
      applyStrip(strip, onlyId ? { ...tr, mute: false, solo: false } : tr, false, off, true);
      const Lt = tr.kind === 'take' ? tr.take.beats : L;
      for (let k = 0; k * Lt < total - 1e-6; k++) {
        for (const ev of tr.events) {
          const tb = k * Lt + ev.t;
          if (tb >= total) continue;
          if (tr.kind === 'take') playTake(off, strip.input, tr.take, tb * spb);
          else INST[tr.kind].play(off, mix, strip.input, ev, tb * spb, ev.d * spb);
        }
      }
    }
    return off.startRendering();
  },

  async exportMix() {
    const btn = $('#stuExport');
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Berechne … (dauert kurz)';
    try {
      const buf = await this.renderMix(parseInt($('#stuLoops').value, 10) || 2);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(encodeWav(buf));
      a.download = 'gitarren-studio-mix.wav';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      this.msg('Mixdown gespeichert (ohne deine Live-Gitarre, nur Band und aufgenommene Takes).');
    } catch (e) {
      console.error(e);
      this.msg('Mixdown fehlgeschlagen: ' + (e.message || e));
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  },

  // ------------------------------------------------------------ Oberfläche
  msg(text) { $('#stuMsg').textContent = text || ''; },

  buildToolbar() {
    const ps = $('#stuPreset');
    CHORD_PRESETS.forEach((p) => {
      const o = document.createElement('option');
      o.value = p.id; o.textContent = p.name;
      ps.appendChild(o);
    });
    const add = $('#stuAddSel');
    Object.entries(INST).forEach(([k, v]) => {
      const o = document.createElement('option');
      o.value = k; o.textContent = `${v.icon} ${v.label}`;
      add.appendChild(o);
    });

    $('#stuPlay').addEventListener('click', () => this.play());
    $('#stuStop').addEventListener('click', () => this.stop());
    $('#stuRec').addEventListener('click', () => this.toggleRec());
    $('#stuBpm').addEventListener('change', (e) => this.setBpm(parseFloat(e.target.value)));
    $('#stuSpeed').addEventListener('input', (e) => {
      this.speedPct = +e.target.value;
      this.setBpm(this.baseBpm * this.speedPct / 100, false);
    });
    $('#stuSongOff').addEventListener('click', () => { this.leaveSong(); this.afterChordsChange(); });
    $('#stuMetro').addEventListener('change', (e) => { this.metro = e.target.checked; this.save(); });
    $('#stuAdd').addEventListener('click', () => this.addTrack($('#stuAddSel').value));
    $('#stuExport').addEventListener('click', () => this.exportMix());
    ps.addEventListener('change', () => {
      const p = CHORD_PRESETS.find((x) => x.id === ps.value);
      this.presetId = p.id;
      this.leaveSong();
      if (p.text) {
        this.chordsText = p.text;
        if (p.bpm && !this.takes.length && this.rec.state === 'idle') { this.bpm = this.baseBpm = p.bpm; this.speedPct = 100; }
      } else {
        $('#stuChords').focus();
      }
      this.afterChordsChange();
    });
    let t = null;
    $('#stuChords').addEventListener('input', (e) => {
      this.leaveSong();
      this.chordsText = e.target.value;
      this.presetId = 'custom';
      ps.value = 'custom';
      clearTimeout(t);
      t = setTimeout(() => this.afterChordsChange(true), 250);
    });
    $('#stuLatency').addEventListener('input', (e) => {
      this.latencyMs = +e.target.value;
      this.latencyUserSet = true;
      $('#stuLatVal').textContent = this.latencyMs + ' ms';
      this.save();
    });
    document.addEventListener('keydown', (e) => {
      if (state.tab !== 'studio' || e.code !== 'Space') return;
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) return;
      e.preventDefault();
      this.playing ? this.stop() : this.play();
    });
  },

  afterChordsChange(keepInput) {
    this.parse();
    this.save();
    this.syncToolbar(keepInput);
    this.renderChips();
  },

  syncToolbar(keepInput) {
    if (!keepInput) $('#stuChords').value = this.chordsText;
    $('#stuPreset').value = this.presetId;
    $('#stuBpm').value = this.bpm;
    $('#stuSpeed').value = this.speedPct;
    $('#stuSpeedVal').textContent = `${this.speedPct} %`;
    const banner = $('#stuSong');
    banner.hidden = !this.song;
    if (this.song) $('#stuSongName').textContent = `${this.song.title} · ${this.song.style} · ${this.song.key}`;
    $('#stuMetro').checked = this.metro;
    $('#stuLatency').value = this.latencyMs;
    $('#stuLatVal').textContent = this.latencyMs + ' ms';
    $('#stuPlay').disabled = this.playing;
    $('#stuStop').disabled = !this.playing;
    const locked = this.takes.length > 0 || this.rec.state !== 'idle';
    $('#stuBpm').disabled = locked;
    $('#stuSpeed').disabled = locked;
    $('#stuBpm').title = locked ? 'Tempo ist gesperrt, solange Gitarren-Takes existieren (sie sind in diesem Tempo aufgenommen).' : '';
    if (this.bad.length) this.msg('Nicht erkannt: ' + this.bad.join(' ') + ' (Beispiele: E7, Am, G/B, D5, A*2)');
    else if (/^(Nicht erkannt)/.test($('#stuMsg').textContent)) this.msg('');
    this.renderChips();
  },

  renderChips() {
    const wrap = $('#stuChips');
    wrap.innerHTML = '';
    this.bars.forEach((c, i) => {
      if (c.secStart) {
        const l = document.createElement('span');
        l.className = 'sec-label';
        l.textContent = c.sec;
        wrap.appendChild(l);
      }
      const d = document.createElement('div');
      d.className = 'chip' + (c.cont ? ' cont' : '');
      d.dataset.i = i;
      d.textContent = c.cont ? '·' : c.name;
      d.title = `Takt ${i + 1}${c.sec ? ' · ' + c.sec : ''}`;
      wrap.appendChild(d);
    });
  },

  renderMixer() {
    const wrap = $('#mixer');
    wrap.innerHTML = '';
    this.meters = [];
    const change = () => { this.applyAll(); this.save(); };

    // Live-Gitarre
    const g = buildStrip({
      icon: '🎸', title: 'Gitarre live', cfg: this.guitar, onChange: change,
      extra: (box) => {
        const b = document.createElement('button');
        b.className = 'ghost small';
        b.textContent = '🎚 Sound';
        b.title = 'Zum Verstärker wechseln';
        b.addEventListener('click', () => setTab('amp'));
        box.appendChild(b);
      },
    });
    wrap.appendChild(g.root);
    this.meters.push({ fill: g.meter, an: () => this.gStrip && this.gStrip.an, level: 0 });

    // Band + Takes
    this.tracks.forEach((tr) => {
      const spec = tr.kind === 'take' ? null : INST[tr.kind];
      const s = buildStrip({
        icon: spec ? spec.icon : '🎙️', title: spec ? spec.label : tr.label, cfg: tr, onChange: () => { this.applyTrack(tr); this.applyAll(); this.save(); },
        onDelete: () => this.removeTrack(tr.id),
        extra: (box) => {
          if (spec) {
            const sel = document.createElement('select');
            sel.className = 's-style';
            Object.entries(spec.styles).forEach(([k, label]) => {
              const o = document.createElement('option');
              o.value = k; o.textContent = label;
              sel.appendChild(o);
            });
            sel.value = tr.style;
            sel.addEventListener('change', () => { tr.style = sel.value; this.rebuildEvents(tr); this.save(); });
            box.appendChild(sel);
            if (spec.fill) {
              const lb = document.createElement('label');
              lb.className = 'check';
              lb.innerHTML = '<input type="checkbox"> Fill / Crash';
              const cb = lb.querySelector('input');
              cb.checked = tr.fill !== false;
              cb.addEventListener('change', () => { tr.fill = cb.checked; this.rebuildEvents(tr); this.save(); });
              box.appendChild(lb);
            }
          } else {
            const lb = document.createElement('label');
            lb.className = 's-row';
            lb.innerHTML = '<span>Versatz</span><input type="range" min="0" max="380" step="1"><span class="sv"></span>';
            const r = lb.querySelector('input'), sv = lb.querySelector('.sv');
            r.value = tr.take.offsetMs; sv.textContent = tr.take.offsetMs + ' ms';
            r.addEventListener('input', () => { tr.take.offsetMs = +r.value; sv.textContent = r.value + ' ms'; });
            box.appendChild(lb);
          }
        },
      });
      wrap.appendChild(s.root);
      this.meters.push({ fill: s.meter, an: () => tr.strip && tr.strip.an, level: 0 });
    });

    // Master
    const m = buildStrip({
      icon: '🎚️', title: 'Master', master: true, cfg: { get vol() { return Studio.masterVol; }, set vol(v) { Studio.masterVol = v; } },
      onChange: () => { this.applyAll(); this.save(); },
    });
    m.root.classList.add('master');
    wrap.appendChild(m.root);
    this.meters.push({ fill: m.meter, an: () => this.mix && this.mix.meter, level: 0 });
    this.syncToolbar(true);
  },

  uiFrame() {
    if (state.tab === 'studio') {
      this.meters.forEach((m) => {
        const an = m.an();
        let lv = 0;
        if (an) {
          const p = peakOf(an, this.meterBuf);
          lv = Math.max(0, Math.min(1, (20 * Math.log10(Math.max(p, 1e-5)) + 48) / 48));
        }
        m.level = Math.max(lv, m.level * 0.9);
        m.fill.style.height = (m.level * 100).toFixed(0) + '%';
      });

      const pos = $('#stuPos');
      const chips = document.querySelectorAll('#stuChips .chip');
      let active = -1;
      if (this.playing) {
        const b = this.currentBeat();
        if (b < 0) pos.textContent = 'Einzählen … ' + Math.ceil(-b);
        else {
          const bar = Math.floor(b / 4) % Math.max(1, this.bars.length);
          active = bar;
          const c = this.bars[bar];
          pos.textContent = `${c && c.sec ? c.sec + ' · ' : ''}Takt ${bar + 1}/${this.bars.length} · Schlag ${Math.floor(b % 4) + 1}${c ? ' · ' + c.name : ''}`;
        }
      } else pos.textContent = 'Gestoppt';
      chips.forEach((c, i) => c.classList.toggle('now', i === active));

      const rb = $('#stuRec');
      const st = this.rec.state;
      rb.classList.toggle('on', st !== 'idle');
      if (st === 'idle') rb.textContent = '● Aufnehmen';
      else if (st === 'armed') rb.textContent = '⏳ Warte auf Takt 1 …';
      else {
        const done = Math.max(0, Math.min(this.bars.length, Math.floor((this.currentBeat() - this.rec.startBeat) / 4) + 1));
        rb.textContent = `● REC – Takt ${done}/${this.bars.length}`;
      }
    }
    requestAnimationFrame(() => this.uiFrame());
  },
};

/** Baut einen Mixer-Kanalzug. cfg = {vol, pan, mute, solo, send} (wird direkt verändert). */
function buildStrip({ icon, title, cfg, onChange, onDelete, extra, master }) {
  const root = document.createElement('div');
  root.className = 'strip';
  root.innerHTML = `
    <div class="s-head"><span class="ico"></span><span class="s-title"></span><button class="s-del" title="Entfernen">✕</button></div>
    <div class="s-extra"></div>
    <div class="s-fader"><div class="meter-v"><div class="mv-fill"></div></div>
      <input type="range" class="vfader" min="0" max="100" step="1" aria-label="Lautstärke"></div>
    <div class="s-val"></div>
    ${master ? '' : `<label class="s-row"><span>Pan</span><input type="range" class="pan" min="-100" max="100" step="1"></label>
    <label class="s-row"><span>Hall</span><input type="range" class="send" min="0" max="100" step="1"></label>
    <div class="s-btns"><button class="mute" title="Stumm">M</button><button class="solo" title="Solo">S</button></div>`}`;
  root.querySelector('.ico').textContent = icon;
  root.querySelector('.s-title').textContent = title;
  const del = root.querySelector('.s-del');
  if (onDelete) del.addEventListener('click', () => { if (confirm(`„${title}“ entfernen?`)) onDelete(); });
  else del.remove();
  if (extra) extra(root.querySelector('.s-extra'));

  const fader = root.querySelector('.vfader'), val = root.querySelector('.s-val');
  fader.value = cfg.vol; val.textContent = cfg.vol;
  fader.addEventListener('input', () => { cfg.vol = +fader.value; val.textContent = fader.value; onChange(); });
  if (!master) {
    const pan = root.querySelector('.pan'), send = root.querySelector('.send');
    pan.value = cfg.pan; send.value = cfg.send;
    pan.addEventListener('input', () => { cfg.pan = +pan.value; onChange(); });
    pan.addEventListener('dblclick', () => { pan.value = 0; cfg.pan = 0; onChange(); });
    send.addEventListener('input', () => { cfg.send = +send.value; onChange(); });
    const mute = root.querySelector('.mute'), solo = root.querySelector('.solo');
    const paint = () => { mute.classList.toggle('on', cfg.mute); solo.classList.toggle('on', cfg.solo); };
    mute.addEventListener('click', () => { cfg.mute = !cfg.mute; paint(); onChange(); });
    solo.addEventListener('click', () => { cfg.solo = !cfg.solo; paint(); onChange(); });
    paint();
  }
  return { root, meter: root.querySelector('.mv-fill') };
}
