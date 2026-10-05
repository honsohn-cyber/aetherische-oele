// Oberfläche: Verstärker, Stimmgerät und Lektionen.
'use strict';

const $ = (sel) => document.querySelector(sel);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const store = {
  get(key, def) {
    try { const v = localStorage.getItem('gs.' + key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('gs.' + key, JSON.stringify(val)); } catch (e) { /* privater Modus o. Ä. */ }
  },
};

const engine = new AmpEngine();
const state = { tab: 'amp', pitch: null, pitchTime: 0, attack: null, rmsHist: [] };
const CABLE_RE = /rocksmith|guitar adapter|real ?tone|guitar ?link|usb guitar/i;

// ---------------------------------------------------------------- Audio starten / Geräte
function setStatus(text, cls = '') {
  const el = $('#status');
  el.textContent = text;
  el.className = 'status ' + cls;
}

function describeError(e) {
  if (!e) return 'Unbekannter Fehler';
  if (e.name === 'NotAllowedError') return 'Zugriff auf den Eingang wurde verweigert – bitte im Browser erlauben.';
  if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') return 'Kein Eingang gefunden – Kabel einstecken und erneut versuchen.';
  if (e.name === 'NotReadableError') return 'Eingang wird gerade von einem anderen Programm benutzt.';
  return e.message || String(e);
}

let startPromise = null;
function startAudio() {
  if (engine.ready) return Promise.resolve(true);
  if (startPromise) return startPromise;
  startPromise = (async () => {
    try {
      setStatus('Starte …');
      const saved = store.get('inputId', null);
      try {
        await engine.start(saved || undefined);
      } catch (e) {
        if (saved) await engine.start(); else throw e;
      }
      await refreshDevices(true);
      await Studio.attach();
      $('#btnStart').textContent = '● Audio läuft';
      $('#btnStart').disabled = true;
      updateStatus();
      return true;
    } catch (e) {
      console.error(e);
      setStatus(describeError(e), 'err');
      return false;
    } finally {
      startPromise = null;
    }
  })();
  return startPromise;
}

function updateStatus() {
  const lat = engine.latencyMs;
  setStatus(`Eingang: ${engine.currentLabel || 'Standard'}${lat ? ` · Latenz ≈ ${lat} ms` : ''}`, 'ok');
}

async function refreshDevices(autopick) {
  const { inputs, outputs } = await engine.listDevices();
  const sel = $('#selIn');
  sel.innerHTML = '';
  inputs.forEach((d, i) => {
    const o = document.createElement('option');
    o.value = d.deviceId;
    o.textContent = d.label || `Eingang ${i + 1}`;
    sel.appendChild(o);
  });
  sel.disabled = inputs.length === 0;
  if (engine.currentDeviceId) sel.value = engine.currentDeviceId;

  if (autopick) {
    const cable = inputs.find((d) => CABLE_RE.test(d.label));
    if (cable && cable.deviceId !== engine.currentDeviceId) {
      try {
        await engine.selectInput(cable.deviceId);
        sel.value = cable.deviceId;
        store.set('inputId', cable.deviceId);
      } catch (e) { console.warn(e); }
    }
  }

  if (engine.supportsOutputSelect) {
    $('#outWrap').hidden = false;
    const so = $('#selOut');
    so.innerHTML = '<option value="">Standard</option>';
    outputs.forEach((d, i) => {
      if (d.deviceId === 'default') return;
      const o = document.createElement('option');
      o.value = d.deviceId;
      o.textContent = d.label || `Ausgang ${i + 1}`;
      so.appendChild(o);
    });
  }
}

$('#btnStart').addEventListener('click', startAudio);

// Wenn der Eingang verschwindet oder das Audio angehalten wird, soll man das sehen und es soll sich selbst erholen
let reconnecting = false;
engine.onInputState = async (s) => {
  if (s === 'mute') { setStatus('⚠ Eingang vom System stummgeschaltet (anderes Programm? Datenschutz-Schalter?)', 'err'); return; }
  if (s === 'unmute') { updateStatus(); return; }
  if (s !== 'ended' || reconnecting) return;
  reconnecting = true;
  setStatus('⚠ Eingang getrennt – Kabel prüfen, ich verbinde neu …', 'err');
  for (let i = 0; i < 60 && reconnecting; i++) {
    try {
      await engine.selectInput(engine.currentDeviceId);
      await refreshDevices(false);
      updateStatus();
      break;
    } catch (e) { await new Promise((r) => setTimeout(r, 2000)); }
  }
  reconnecting = false;
};
engine.onCtxState = (st) => {
  if (st === 'running') { updateStatus(); return; }
  setStatus('⚠ Audio angehalten – klicke irgendwo auf die Seite, um fortzufahren', 'err');
  engine.ctx.resume().catch(() => {});
};
document.addEventListener('pointerdown', () => {
  if (engine.ctx && engine.ctx.state !== 'running') engine.ctx.resume().catch(() => {});
});
$('#selIn').addEventListener('change', async (e) => {
  try {
    await engine.selectInput(e.target.value);
    store.set('inputId', e.target.value);
    updateStatus();
  } catch (err) { setStatus(describeError(err), 'err'); }
});
$('#selOut').addEventListener('change', (e) => engine.setOutput(e.target.value).catch(console.warn));
if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
  navigator.mediaDevices.addEventListener('devicechange', () => { if (engine.ready) refreshDevices(false); });
}

// ---------------------------------------------------------------- Tabs
function setTab(name) {
  state.tab = name;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('main > .panel').forEach((p) => { p.hidden = p.id !== 'tab-' + name; });
  if (name !== 'lessons' && Game.run === 'playing') Game.stop();
  if ((name === 'tuner' || name === 'lessons') && Studio.playing) Studio.stop();
  engine.setMuted(name === 'tuner' && $('#chkMuteTuner').checked);
}
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));

// ---------------------------------------------------------------- Regler (Knöpfe)
const KNOBS = [
  { key: 'inputLevel', label: 'Eingang' },
  { key: 'gate', label: 'Gate' },
  { key: 'gain', label: 'Gain' },
  { key: 'bass', label: 'Bass' },
  { key: 'mid', label: 'Mitten' },
  { key: 'treble', label: 'Höhen' },
  { key: 'presence', label: 'Präsenz' },
  { key: 'reverb', label: 'Hall' },
  { key: 'volume', label: 'Lautstärke' },
];
const knobUi = {};
let activePreset = null;

function makeKnob(def) {
  const el = document.createElement('div');
  el.className = 'knob';
  el.tabIndex = 0;
  el.setAttribute('role', 'slider');
  el.setAttribute('aria-label', def.label);
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', '10');
  el.innerHTML = '<div class="dial"><div class="pointer"></div></div><div class="kv"></div><div class="kl"></div>';
  el.querySelector('.kl').textContent = def.label;
  const pointer = el.querySelector('.pointer');
  const kv = el.querySelector('.kv');

  const show = (v) => {
    pointer.style.transform = `rotate(${-135 + (v / 10) * 270}deg)`;
    kv.textContent = v.toFixed(1);
    el.setAttribute('aria-valuenow', v.toFixed(1));
  };
  const change = (v) => {
    v = Math.round(clamp(v, 0, 10) * 10) / 10;
    show(v);
    engine.setParam(def.key, v);
    activePreset = null;
    renderPresets();
    store.set('params', engine.params);
  };

  let drag = null;
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    drag = { y: e.clientY, v: engine.params[def.key] };
  });
  el.addEventListener('pointermove', (e) => {
    if (drag) change(drag.v + ((drag.y - e.clientY) / 130) * 10);
  });
  el.addEventListener('pointerup', () => { drag = null; });
  el.addEventListener('pointercancel', () => { drag = null; });
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    change(engine.params[def.key] + (e.deltaY < 0 ? 0.25 : -0.25));
  }, { passive: false });
  el.addEventListener('keydown', (e) => {
    const step = { ArrowUp: 0.5, ArrowRight: 0.5, ArrowDown: -0.5, ArrowLeft: -0.5 }[e.key];
    if (step) { e.preventDefault(); change(engine.params[def.key] + step); }
  });
  show(engine.params[def.key]);
  return { el, show };
}

function buildKnobs() {
  const wrap = $('#knobs');
  KNOBS.forEach((def) => {
    const k = makeKnob(def);
    knobUi[def.key] = k;
    wrap.appendChild(k.el);
  });
  const seg = $('#channelSeg');
  Object.entries(CHANNELS).forEach(([id, ch]) => {
    const b = document.createElement('button');
    b.textContent = ch.label;
    b.dataset.ch = id;
    b.addEventListener('click', () => {
      engine.setParam('channel', id);
      activePreset = null;
      syncControls();
      renderPresets();
      store.set('params', engine.params);
    });
    seg.appendChild(b);
  });
  $('#chkCab').addEventListener('change', (e) => {
    engine.setParam('cab', e.target.checked);
    store.set('params', engine.params);
  });
}

function syncControls() {
  KNOBS.forEach((d) => knobUi[d.key].show(engine.params[d.key]));
  document.querySelectorAll('#channelSeg button').forEach((b) => b.classList.toggle('active', b.dataset.ch === engine.params.channel));
  $('#chkCab').checked = !!engine.params.cab;
}

// ---------------------------------------------------------------- Presets
let userPresets = store.get('userPresets', []);

function applyPreset(preset) {
  engine.setParams(preset.p);
  activePreset = preset.id;
  syncControls();
  renderPresets();
  store.set('params', engine.params);
}

function renderPresets() {
  const grid = $('#presetGrid');
  grid.innerHTML = '';
  [...AMP_PRESETS, ...userPresets].forEach((p) => {
    const b = document.createElement('button');
    b.className = 'preset' + (p.id === activePreset ? ' active' : '');
    b.innerHTML = '<b></b><span></span>';
    b.querySelector('b').textContent = p.name;
    b.querySelector('span').textContent = p.desc;
    b.addEventListener('click', () => applyPreset(p));
    if (p.id.startsWith('u')) {
      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '✕';
      del.title = 'Preset löschen';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm(`Preset „${p.name}“ löschen?`)) return;
        userPresets = userPresets.filter((x) => x.id !== p.id);
        store.set('userPresets', userPresets);
        if (activePreset === p.id) activePreset = null;
        renderPresets();
      });
      b.appendChild(del);
    }
    grid.appendChild(b);
  });
}

$('#btnSavePreset').addEventListener('click', () => {
  const name = prompt('Name für dein Preset:');
  if (!name) return;
  const { inputLevel, ...rest } = engine.params;
  const preset = { id: 'u' + Date.now(), name: name.slice(0, 30), desc: 'Eigenes Preset', p: rest };
  userPresets.push(preset);
  store.set('userPresets', userPresets);
  activePreset = preset.id;
  renderPresets();
});

// ---------------------------------------------------------------- Tonerkennung (läuft für Stimmgerät und Lektionen)
const inBuf = new Float32Array(4096);
let meterLevel = 0;

function tick() {
  if (!engine.ready) return;
  const now = performance.now();
  engine.readInput(inBuf);

  let peak = 0;
  for (let i = inBuf.length - 2048; i < inBuf.length; i++) {
    const a = Math.abs(inBuf[i]);
    if (a > peak) peak = a;
  }
  const rms = Pitch.rms(inBuf.subarray(inBuf.length - 1024));

  // Pegelanzeige in dB
  const db = 20 * Math.log10(Math.max(peak, 1e-5));
  meterLevel = Math.max(clamp((db + 60) / 60, 0, 1), meterLevel * 0.85);
  $('#meterBar').style.width = (meterLevel * 100).toFixed(0) + '%';
  $('#clipDot').classList.toggle('on', peak > 0.98);

  // Hinweis, wenn lange gar nichts ankommt
  if (peak > 0.0008) state.lastSignal = now;
  else if (state.lastSignal == null) state.lastSignal = now;
  const quiet = now - state.lastSignal > 10000;
  if (quiet !== state.quietShown && /^(Eingang:|Kein Signal)/.test($('#status').textContent)) {
    state.quietShown = quiet;
    if (quiet) setStatus('Kein Signal am Eingang – spiele eine Saite an. Kommt nichts an: Eingang-Menü prüfen oder „Eingang“-Regler hochdrehen.');
    else updateStatus();
  }

  // Anschlag erkennen (plötzlicher Pegelanstieg)
  const h = state.rmsHist;
  const base = h.length >= 4 ? Math.min(...h.slice(-4)) : rms;
  if (rms > 0.012 && rms > base * 1.5 + 0.003 && (!state.attack || now - state.attack.t > 90)) {
    state.attack = { t: now, beat: Game.beat, used: false };
  }
  h.push(rms);
  if (h.length > 8) h.shift();

  // Tonhöhe
  let p = null;
  if (rms > 0.008) {
    const r = Pitch.yin(inBuf, engine.ctx.sampleRate);
    if (r && r.clarity > 0.8) {
      p = { freq: r.freq, midiF: Pitch.freqToMidiFloat(r.freq), clarity: r.clarity, rms };
      state.pitch = p;
      state.pitchTime = now;
    }
  }
  const current = now - state.pitchTime < 500 ? state.pitch : null;

  if (state.tab === 'tuner') Tuner.update(p, now);
  if (state.tab === 'lessons') {
    $('#hudNote').textContent = current ? `${Pitch.noteNameDe(Math.round(current.midiF))}${Pitch.octave(Math.round(current.midiF))}` : '–';
    Game.onPitch(p, rms);
  }
}
setInterval(tick, 40);

// ---------------------------------------------------------------- Stimmgerät
const Tuner = {
  hist: [],
  lastGood: 0,
  done: new Set(),

  strings() { return TUNINGS[$('#selTuning').value].strings; },

  init() {
    const sel = $('#selTuning');
    Object.entries(TUNINGS).forEach(([id, t]) => {
      const o = document.createElement('option');
      o.value = id; o.textContent = t.name;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => { this.done.clear(); this.renderStrings(); });
    $('#inpRef').addEventListener('change', (e) => {
      Pitch.refA = clamp(parseFloat(e.target.value) || 440, 415, 466);
      e.target.value = Pitch.refA;
    });
    $('#chkMuteTuner').addEventListener('change', () => setTab(state.tab));
    this.renderStrings();
  },

  renderStrings() {
    const wrap = $('#tStrings');
    wrap.innerHTML = '';
    const names = { 6: '6', 5: '5', 4: '4', 3: '3', 2: '2', 1: '1' };
    [6, 5, 4, 3, 2, 1].forEach((s) => {
      const midi = this.strings()[s];
      const b = document.createElement('button');
      b.dataset.s = s;
      b.innerHTML = `${Pitch.noteNameDe(midi)}<small>Saite ${names[s]}</small>`;
      b.addEventListener('click', () => this.playRef(midi));
      wrap.appendChild(b);
    });
  },

  playRef(midi) {
    if (!engine.ctx) { startAudio().then(() => this.playRef(midi)); return; }
    const ctx = engine.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = Pitch.midiToFreq(midi);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 2.3);
  },

  idle() {
    $('#tNote').textContent = '–';
    $('#tNote').classList.remove('ok');
    $('#tOct').textContent = '';
    $('#tCents').textContent = '–';
    $('#tHint').textContent = 'Spiele eine leere Saite an.';
    $('#tHint').classList.remove('ok');
    $('#needle').style.left = '50%';
    $('#needle').className = '';
    document.querySelectorAll('#tStrings button').forEach((b) => b.classList.remove('near'));
  },

  update(p, now) {
    if (p) {
      this.hist.push(p.midiF);
      if (this.hist.length > 5) this.hist.shift();
      this.lastGood = now;
    }
    if (!this.hist.length || now - this.lastGood > 700) { this.hist = []; this.idle(); return; }

    const sorted = this.hist.slice().sort((a, b) => a - b);
    const m = sorted[Math.floor(sorted.length / 2)];
    const strs = this.strings();
    let best = null;
    for (const [s, midi] of Object.entries(strs)) {
      const d = Math.abs(m - midi);
      if (d <= 2 && (!best || d < best.d)) best = { s: +s, midi, d };
    }
    const target = best ? best.midi : Math.round(m);
    const cents = (m - target) * 100;
    const inTune = Math.abs(cents) <= 5;

    $('#tNote').textContent = Pitch.noteNameDe(target);
    $('#tNote').classList.toggle('ok', inTune);
    $('#tOct').textContent = Pitch.octave(target);
    $('#tCents').textContent = `${cents >= 0 ? '+' : ''}${cents.toFixed(0)} ¢  ·  ${Pitch.midiToFreq(m).toFixed(1)} Hz`;
    const needle = $('#needle');
    needle.style.left = clamp(50 + cents, 0, 100) + '%';
    needle.className = inTune ? 'ok' : 'off';
    const hint = $('#tHint');
    hint.classList.toggle('ok', inTune);
    hint.textContent = inTune ? '✓ Gestimmt' : cents < 0 ? 'Zu tief – Saite anziehen ↑' : 'Zu hoch – Saite lockern ↓';

    document.querySelectorAll('#tStrings button').forEach((b) => {
      const isNear = best && +b.dataset.s === best.s;
      b.classList.toggle('near', !!isNear);
      if (isNear && inTune) this.done.add(+b.dataset.s);
      b.classList.toggle('done', this.done.has(+b.dataset.s));
    });
  },
};

// ---------------------------------------------------------------- Lektionen / Spiel
const STRING_COLORS = { 6: '#ff4d4d', 5: '#ffd43b', 4: '#4dabf7', 3: '#ff922b', 2: '#51cf66', 1: '#cc5de8' };
const STRING_LABELS = { 1: 'e', 2: 'H', 3: 'G', 4: 'D', 5: 'A', 6: 'E' };

let userLessons = store.get('userLessons', []);
let best = store.get('best', {});
let lessons = [];

function buildLessons() {
  lessons = LESSONS.slice();
  userLessons.forEach((u) => {
    const evs = parseAsciiTab(u.tab, u.steps);
    if (!evs) return;
    lessons.push(finalizeLesson({
      id: u.id, title: u.title, level: 'Eigene', style: 'Eigene Tabulatur', bpm: u.bpm, user: true,
      desc: 'Deine eigene Tabulatur. Tipp: Starte mit dem Wartemodus und langsamem Tempo.',
      tips: ['Das Tempo und die Schritte pro Schlag kannst du beim Hinzufügen anpassen.'],
      events: evs,
    }));
  });
}

function starsFor(acc) { return acc >= 0.95 ? 3 : acc >= 0.8 ? 2 : acc >= 0.5 ? 1 : 0; }

function renderLessonList() {
  const list = $('#lessonList');
  list.innerHTML = '';
  lessons.forEach((l) => {
    const b = document.createElement('button');
    b.className = 'lesson' + (Game.lesson && Game.lesson.id === l.id ? ' active' : '');
    const st = best[l.id] ? '★'.repeat(best[l.id].stars) + '☆'.repeat(3 - best[l.id].stars) : '☆☆☆';
    b.innerHTML = '<b></b><div class="sub"><span class="lv"></span><span class="stars"></span></div>';
    b.querySelector('b').textContent = l.title;
    b.querySelector('.lv').textContent = `${l.level} · ${l.bpm} BPM`;
    b.querySelector('.stars').textContent = st;
    b.addEventListener('click', () => selectLesson(l.id));
    if (l.user) {
      const del = document.createElement('span');
      del.textContent = ' ✕';
      del.title = 'Löschen';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm(`„${l.title}“ löschen?`)) return;
        userLessons = userLessons.filter((u) => u.id !== l.id);
        store.set('userLessons', userLessons);
        buildLessons();
        selectLesson(LESSONS[0].id);
      });
      b.querySelector('.lv').appendChild(del);
    }
    list.appendChild(b);
  });
}

function selectLesson(id) {
  const l = lessons.find((x) => x.id === id) || lessons[0];
  Game.load(l);
  $('#lTitle').textContent = l.title;
  $('#lMeta').textContent = `${l.level} · ${l.style} · ${l.bpm} BPM`;
  $('#lDesc').textContent = l.desc;
  const tips = $('#lTips');
  tips.innerHTML = '';
  (l.tips || []).forEach((t) => { const li = document.createElement('li'); li.textContent = t; tips.appendChild(li); });
  const bs = $('#btnLoadSound');
  const preset = AMP_PRESETS.find((p) => p.id === l.amp);
  bs.hidden = !preset;
  bs.textContent = preset ? `🎚 Sound laden: ${preset.name}` : '';
  bs.onclick = () => { if (preset) applyPreset(preset); };
  $('#btnPlay').disabled = false;
  renderLessonList();
}

const Game = {
  lesson: null, ev: [], run: 'idle', beat: -2, speed: 1, last: 0, lastClick: -99,
  wait: false, metro: true, loop: false,
  stats: { hit: 0, miss: 0, streak: 0 },
  tolB: 0.3, tolA: 0.7,
  cv: null, ctx2: null,

  init() {
    this.cv = $('#cv');
    this.ctx2 = this.cv.getContext('2d');
    $('#rngSpeed').addEventListener('input', (e) => {
      this.speed = e.target.value / 100;
      $('#spdVal').textContent = e.target.value + ' %';
    });
    $('#chkWait').addEventListener('change', (e) => { this.wait = e.target.checked; });
    $('#chkMetro').addEventListener('change', (e) => { this.metro = e.target.checked; });
    $('#chkLoop').addEventListener('change', (e) => { this.loop = e.target.checked; });
    $('#btnPlay').addEventListener('click', () => this.start());
    $('#btnStop').addEventListener('click', () => this.stop());
    document.addEventListener('keydown', (e) => {
      if (state.tab !== 'lessons' || e.code !== 'Space') return;
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) return;
      e.preventDefault();
      this.run === 'playing' ? this.stop() : this.start();
    });
    requestAnimationFrame((ts) => this.frame(ts));
  },

  load(lesson) {
    this.run = 'idle';
    $('#overlay').hidden = true;
    $('#btnStop').disabled = true;
    this.lesson = lesson;
    const tun = TUNINGS[lesson.tuning || 'standard'].strings;
    this.ev = lesson.events.map((e) => ({ ...e, midis: e.n.map((n) => tun[n.s] + n.f), st: 0, hitAt: 0 }));
    this.resetRun();
    this.beat = -2;
  },

  resetRun() {
    this.ev.forEach((e) => { e.st = 0; e.hitAt = 0; });
    this.stats = { hit: 0, miss: 0, streak: 0 };
  },

  async start() {
    if (!this.lesson || this.run === 'playing') return;
    const ok = await startAudio();
    if (!ok) return;
    this.resetRun();
    this.beat = -4;
    this.lastClick = -5;
    this.run = 'playing';
    this.last = performance.now();
    $('#overlay').hidden = true;
    $('#btnPlay').disabled = true;
    $('#btnStop').disabled = false;
  },

  stop() {
    if (this.run === 'playing') {
      this.run = 'idle';
      this.beat = -2;
    }
    $('#btnPlay').disabled = !this.lesson;
    $('#btnStop').disabled = true;
  },

  advance(dt) {
    const rate = (this.lesson.bpm * this.speed) / 60;
    let nb = this.beat + dt * rate;
    if (this.wait) {
      const pending = this.ev.find((e) => e.st === 0);
      if (pending && pending.b <= nb) nb = Math.max(this.beat, Math.min(nb, pending.b));
    } else {
      for (const e of this.ev) {
        if (e.st === 0 && nb > e.b + this.tolA) {
          e.st = 2;
          this.stats.miss++;
          this.stats.streak = 0;
        }
      }
    }
    const fl = Math.floor(nb);
    while (this.lastClick < fl) {
      this.lastClick++;
      if (this.metro || this.lastClick < 0) engine.click(((this.lastClick % 4) + 4) % 4 === 0);
    }
    this.beat = nb;
    if (nb >= this.lesson.beats) this.finish();
  },

  finish() {
    if (this.loop) {
      this.resetRun();
      this.beat = -1;
      this.lastClick = -2;
      return;
    }
    this.run = 'done';
    $('#btnPlay').disabled = false;
    $('#btnStop').disabled = true;
    const total = this.ev.length;
    const acc = total ? this.stats.hit / total : 0;
    const stars = starsFor(acc);
    let extra = '';
    if (!this.wait) {
      const prev = best[this.lesson.id];
      if (!prev || acc > prev.acc) {
        best[this.lesson.id] = { acc, stars };
        store.set('best', best);
        renderLessonList();
        extra = prev ? '<div>Neuer Bestwert!</div>' : '';
      }
    }
    const ov = $('#overlay');
    ov.innerHTML = `<div class="big">${Math.round(acc * 100)} %</div>
      <div class="stars">${this.wait ? '' : '★'.repeat(stars) + '☆'.repeat(3 - stars)}</div>
      <div>${this.stats.hit} von ${total} Noten getroffen</div>${extra}
      <div><button class="primary" id="ovAgain">Nochmal</button>
      <button class="ghost" id="ovNext">Nächste Lektion</button></div>`;
    ov.hidden = false;
    $('#ovAgain').onclick = () => this.start();
    $('#ovNext').onclick = () => {
      const i = lessons.findIndex((l) => l.id === this.lesson.id);
      selectLesson(lessons[(i + 1) % lessons.length].id);
    };
  },

  matches(midiF, midis) {
    for (const m of midis) {
      const d = midiF - m;
      if (Math.abs(d) < 0.75) return true;
      // Bei tiefen Tönen erkennt die Tonhöhenanalyse manchmal die Oktave darüber – das lassen wir gelten
      if (m < 52 && Math.abs(d - 12) < 0.75) return true;
    }
    return false;
  },

  onPitch(p) {
    if (this.run !== 'playing') return;
    const att = state.attack;
    if (!att || att.used || performance.now() - att.t > 450) return;
    const cands = this.ev.filter((e) => e.st === 0 && att.beat >= e.b - this.tolB && att.beat <= e.b + this.tolA);
    for (const e of cands) {
      const strum = e.n.length >= 3;
      const ok = strum
        ? !p || p.clarity < 0.9 || this.matches(p.midiF, e.midis)
        : !!p && this.matches(p.midiF, e.midis);
      if (ok) {
        e.st = 1;
        e.hitAt = performance.now();
        att.used = true;
        this.stats.hit++;
        this.stats.streak++;
        break;
      }
    }
  },

  // ---- Zeichnen
  frame(ts) {
    const dt = Math.min(0.1, (ts - this.last) / 1000);
    this.last = ts;
    if (state.tab === 'lessons' && this.lesson) {
      if (this.run === 'playing') this.advance(dt);
      this.draw();
      const judged = this.stats.hit + this.stats.miss;
      $('#hudScore').textContent = judged ? Math.round((this.stats.hit / judged) * 100) + ' %' : '–';
      $('#hudStreak').textContent = this.stats.streak;
      $('#hudProg').style.width = clamp((this.beat / this.lesson.beats) * 100, 0, 100) + '%';
    }
    requestAnimationFrame((t) => this.frame(t));
  },

  draw() {
    const cv = this.cv, c = this.ctx2;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    const top = 52, bottom = H - 26, gap = (bottom - top) / 5;
    const yOf = (s) => top + (s - 1) * gap;
    const hitX = Math.min(170, W * 0.2);
    const ppb = (W - hitX - 30) / 7;
    const beat = this.beat;
    const xOf = (b) => hitX + (b - beat) * ppb;

    // Taktstriche
    c.font = '11px system-ui, sans-serif';
    for (let k = Math.floor(beat - hitX / ppb) - 1; k <= Math.ceil(beat + 8); k++) {
      const x = xOf(k);
      if (x < 0 || x > W || k < 0 || k > this.lesson.beats) continue;
      const bar = k % 4 === 0;
      c.strokeStyle = bar ? '#ffffff40' : '#ffffff14';
      c.lineWidth = bar ? 2 : 1;
      c.beginPath(); c.moveTo(x, top - 8); c.lineTo(x, bottom + 8); c.stroke();
      if (bar && k < this.lesson.beats) { c.fillStyle = '#ffffff55'; c.fillText(String(k / 4 + 1), x + 4, H - 8); }
    }
    // Saiten
    for (let s = 1; s <= 6; s++) {
      c.strokeStyle = STRING_COLORS[s] + '88';
      c.lineWidth = 1 + (s - 1) * 0.35;
      c.beginPath(); c.moveTo(0, yOf(s)); c.lineTo(W, yOf(s)); c.stroke();
      c.fillStyle = STRING_COLORS[s];
      c.font = 'bold 12px system-ui, sans-serif';
      c.fillText(STRING_LABELS[s], 8, yOf(s) + 4);
    }
    // Trefferlinie
    const grad = c.createLinearGradient(hitX - 6, 0, hitX + 6, 0);
    grad.addColorStop(0, '#fff0'); grad.addColorStop(0.5, '#ffffffcc'); grad.addColorStop(1, '#fff0');
    c.fillStyle = grad;
    c.fillRect(hitX - 6, top - 14, 12, bottom - top + 28);

    // Noten
    const now = performance.now();
    c.textAlign = 'center';
    for (const e of this.ev) {
      const x = xOf(e.b);
      if (x < -50 || x > W + 50) continue;
      const ys = e.n.map((n) => yOf(n.s));
      if (e.n.length > 1) {
        c.strokeStyle = e.st === 1 ? '#3ddc8488' : '#ffffff55';
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(x, Math.min(...ys)); c.lineTo(x, Math.max(...ys)); c.stroke();
      }
      if (e.name) {
        c.fillStyle = e.st === 1 ? '#3ddc84' : '#ffffffcc';
        c.font = 'bold 14px system-ui, sans-serif';
        c.fillText(e.name, x, 28);
      }
      e.n.forEach((n, i) => {
        const y = ys[i];
        const w = 32, h = 24;
        if (e.d >= 1.5 && e.st !== 2) {
          c.fillStyle = STRING_COLORS[n.s] + '55';
          c.fillRect(x, y - 3, (e.d - 0.15) * ppb, 6);
        }
        let fill = STRING_COLORS[n.s], stroke = null, alpha = 1, scale = 1;
        if (e.st === 1) {
          const age = now - e.hitAt;
          fill = '#3ddc84';
          alpha = age < 200 ? 1 : 0.28;
          scale = age < 200 ? 1 + 0.35 * (1 - age / 200) : 1;
        } else if (e.st === 2) {
          fill = '#4a4a52'; stroke = '#ff5c5c'; alpha = 0.7;
        }
        c.save();
        c.globalAlpha = alpha;
        c.translate(x, y);
        c.scale(scale, scale);
        c.fillStyle = fill;
        c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 6); c.fill();
        if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
        c.fillStyle = e.st === 2 ? '#bbb' : '#111';
        c.font = 'bold 15px system-ui, sans-serif';
        c.textBaseline = 'middle';
        c.fillText(String(n.f), 0, 1);
        c.restore();
      });
    }
    c.textAlign = 'start';
    c.textBaseline = 'alphabetic';

    // Einzähler / Hinweise
    c.textAlign = 'center';
    if (this.run === 'playing' && beat < 0) {
      c.fillStyle = '#ffffffdd';
      c.font = 'bold 72px system-ui, sans-serif';
      c.fillText(String(Math.ceil(-beat)), W * 0.55, H / 2 + 24);
    }
    c.textAlign = 'start';
  },
};

// ---------------------------------------------------------------- Eigene Tabs importieren
$('#impAdd').addEventListener('click', () => {
  const tab = $('#impTab').value;
  const steps = parseInt($('#impSteps').value, 10);
  const bpm = clamp(parseInt($('#impBpm').value, 10) || 90, 40, 220);
  const evs = parseAsciiTab(tab, steps);
  const msg = $('#impMsg');
  if (!evs) { msg.textContent = 'Keine Noten gefunden. Sind es 6 Zeilen pro System (e, H, G, D, A, E)?'; return; }
  const u = { id: 'user-' + Date.now(), title: ($('#impTitle').value || 'Eigene Tabulatur').slice(0, 40), bpm, steps, tab };
  userLessons.push(u);
  store.set('userLessons', userLessons);
  buildLessons();
  selectLesson(u.id);
  msg.textContent = `${evs.length} Noten übernommen.`;
});

// ---------------------------------------------------------------- Start
(function init() {
  const savedParams = store.get('params', {});
  if (savedParams.v !== 2) { savedParams.gate = 0; savedParams.v = 2; } // altes Standard-Gate (2) schnitt leise Signale ab
  Object.assign(engine.params, savedParams);
  if (!CHANNELS[engine.params.channel]) engine.params.channel = 'crunch';
  buildKnobs();
  renderPresets();
  syncControls();
  Tuner.init();
  Studio.init();
  SongsUI.init();
  Game.init();
  buildLessons();
  selectLesson(LESSONS[0].id);
  setStatus('Nicht gestartet – klicke auf „Audio starten“');
  window.__gs = { engine, Game, Tuner, Studio, state, lessons: () => lessons };
})();
