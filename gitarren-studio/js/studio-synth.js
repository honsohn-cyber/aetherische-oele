// Studio-Klangerzeugung: Akkorde, Begleit-Instrumente (alles synthetisiert) und Mixer-Bausteine.
// Funktioniert mit einem normalen AudioContext (live) und mit einem OfflineAudioContext (Mixdown).
'use strict';

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const faderGain = (v) => (v <= 0 ? 0 : Math.pow(v / 75, 2)); // 75 = 0 dB, 100 = +5 dB

// ---------------------------------------------------------------- Akkorde
const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, H: 11 };
const CHORD_Q = {
  '': { iv: [0, 4, 7] },
  m: { iv: [0, 3, 7], minor: true },
  7: { iv: [0, 4, 7, 10] },
  m7: { iv: [0, 3, 7, 10], minor: true },
  maj7: { iv: [0, 4, 7, 11] },
  5: { iv: [0, 7] },
  sus4: { iv: [0, 5, 7] },
  sus2: { iv: [0, 2, 7] },
  dim: { iv: [0, 3, 6], minor: true },
};
const pcOf = (letter, acc) =>
  (((NOTE_PC[letter.toUpperCase()] + (/[#♯]/.test(acc) ? 1 : /[b♭]/.test(acc) ? -1 : 0)) % 12) + 12) % 12;

/** "E7*4 A7*2 B7 A7/C#" -> { chords, bad } (jeder Akkord = ein Takt, *n = n Takte) */
function parseChords(text) {
  const chords = [];
  const bad = [];
  for (const tok of text.trim().split(/[\s,|]+/).filter(Boolean)) {
    const m = /^([A-Ha-h])([#b♯♭]?)(maj7|M7|m7|m|7|5|sus4|sus2|dim|)(?:\/([A-Ha-h])([#b♯♭]?))?(?:\*(\d+))?$/.exec(tok);
    if (!m) { bad.push(tok); continue; }
    const q = m[3] === 'M7' ? 'maj7' : m[3];
    const root = pcOf(m[1], m[2]);
    chords.push({
      name: tok.replace(/\*\d+$/, ''),
      root, q, iv: CHORD_Q[q].iv, minor: !!CHORD_Q[q].minor,
      bassPc: m[4] ? pcOf(m[4], m[5]) : root,
      bars: m[6] ? Math.max(1, Math.min(16, parseInt(m[6], 10))) : 1,
    });
  }
  return { chords, bad };
}

function expandBars(chords) {
  const bars = [];
  chords.forEach((c) => { for (let i = 0; i < c.bars; i++) bars.push(c); });
  return bars.slice(0, 32);
}

const CHORD_PRESETS = [
  { id: 'blues', name: '12-Takt-Blues in E', text: 'E7*4 A7*2 E7*2 B7 A7 E7*2', bpm: 100 },
  { id: 'rock145', name: 'Rock I–IV–V in A', text: 'A*2 D E', bpm: 120 },
  { id: 'power', name: 'Power-Rock (E5 – A5 – D5)', text: 'E5*2 A5 D5 E5*2 G5 A5', bpm: 110 },
  { id: 'camp', name: 'Lagerfeuer (G – C – D)', text: 'G C G D', bpm: 90 },
  { id: 'ballad', name: 'Ballade (Am – C – G – D)', text: 'Am C G D', bpm: 72 },
  { id: 'andalus', name: 'Andalusisch (Am – G – F – E)', text: 'Am G F E', bpm: 100 },
  { id: 'mixo', name: 'Mixolydisch (D – C – G – D)', text: 'D C G D', bpm: 110 },
  { id: 'hard', name: 'Hard Rock in E-Moll', text: 'Em*2 G D A', bpm: 120 },
  { id: 'custom', name: 'Eigene Akkorde …', text: '', bpm: 0 },
];

// ---------------------------------------------------------------- Hüllkurven-Helfer
function adsr(g, t, a, peak, dur, r) {
  const hold = t + Math.max(a, dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, hold);
  g.gain.exponentialRampToValueAtTime(0.0001, hold + r);
  return hold + r;
}

function noiseSrc(ctx, mix, t, dur) {
  const n = ctx.createBufferSource();
  n.buffer = mix.noise;
  n.loop = true;
  n.start(t, Math.random() * 0.5);
  n.stop(t + dur);
  return n;
}

function filt(ctx, type, freq, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  return f;
}

// ---------------------------------------------------------------- Stimmen (Voices)
function playDrum(ctx, mix, out, ev, t) {
  const v = ev.v == null ? 0.8 : ev.v;
  const g = ctx.createGain();
  g.connect(out);
  const noiseHit = (type, freq, dur, level, q) => {
    const n = noiseSrc(ctx, mix, t, dur + 0.05);
    const f = filt(ctx, type, freq, q);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(level * v, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(f).connect(ng).connect(out);
  };
  const tone = (f0, f1, dur, level, type = 'sine') => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.4);
    const og = ctx.createGain();
    og.gain.setValueAtTime(level * v, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(og).connect(out);
    o.start(t); o.stop(t + dur + 0.02);
  };
  switch (ev.drum) {
    case 'kick': tone(150, 45, 0.4, 0.95); noiseHit('highpass', 3000, 0.012, 0.25); break;
    case 'snare': tone(210, 150, 0.12, 0.35, 'triangle'); noiseHit('highpass', 1600, 0.2, 0.55); break;
    case 'rim': tone(420, 380, 0.04, 0.3, 'square'); noiseHit('bandpass', 1800, 0.05, 0.3, 1.2); break;
    case 'hat': noiseHit('highpass', 7500, 0.045, 0.28); break;
    case 'ohat': noiseHit('highpass', 7000, 0.28, 0.25); break;
    case 'crash': noiseHit('highpass', 4500, 1.4, 0.3); break;
    case 'tom1': tone(210, 150, 0.3, 0.7); break;
    case 'tom2': tone(160, 110, 0.35, 0.75); break;
    case 'tom3': tone(120, 80, 0.4, 0.8); break;
    default: break;
  }
}

function playPerc(ctx, mix, out, ev, t) {
  const v = ev.v == null ? 0.6 : ev.v;
  if (ev.perc === 'cow') {
    const g = ctx.createGain(), bp = filt(ctx, 'bandpass', 800, 1.5);
    [560, 845].forEach((f) => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + 0.3); });
    g.gain.setValueAtTime(0.22 * v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    g.connect(bp).connect(out);
    return;
  }
  const tamb = ev.perc === 'tamb';
  const dur = tamb ? 0.22 : 0.05;
  const n = noiseSrc(ctx, mix, t, dur + 0.05);
  const f = filt(ctx, 'bandpass', tamb ? 7500 : 6000, tamb ? 0.8 : 0.5);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime((tamb ? 0.8 : 0.7) * v, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  n.connect(f).connect(g).connect(out);
}

function playBass(ctx, mix, out, ev, t, dur) {
  const f = mtof(ev.note), v = ev.v == null ? 0.8 : ev.v;
  const saw = ctx.createOscillator(), sub = ctx.createOscillator();
  saw.type = 'sawtooth'; sub.type = 'sine';
  saw.frequency.value = f; sub.frequency.value = f;
  const lp = filt(ctx, 'lowpass', 1500, 1);
  lp.frequency.setValueAtTime(1600, t);
  lp.frequency.exponentialRampToValueAtTime(420, t + 0.18);
  const sg = ctx.createGain(), subg = ctx.createGain(), g = ctx.createGain();
  sg.gain.value = 0.45; subg.gain.value = 0.7;
  saw.connect(sg).connect(lp); sub.connect(subg).connect(lp); lp.connect(g).connect(out);
  const end = adsr(g, t, 0.006, 0.55 * v, Math.max(0.08, dur), 0.07);
  saw.start(t); sub.start(t); saw.stop(end + 0.02); sub.stop(end + 0.02);
}

function playEP(ctx, mix, out, ev, t, dur) {
  const f = mtof(ev.note), v = ev.v == null ? 0.7 : ev.v;
  const car = ctx.createOscillator(), mod = ctx.createOscillator();
  car.type = 'sine'; mod.type = 'sine';
  car.frequency.value = f; mod.frequency.value = f;
  const mg = ctx.createGain();
  mg.gain.setValueAtTime(f * 1.6, t);
  mg.gain.exponentialRampToValueAtTime(f * 0.12, t + 0.7);
  mod.connect(mg).connect(car.frequency);
  const g = ctx.createGain();
  const vol = 0.2 * v;
  const d = Math.max(0.1, dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * Math.exp(-d / 1.3)), t + d);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.25);
  car.connect(g).connect(out);
  car.start(t); mod.start(t);
  car.stop(t + d + 0.3); mod.stop(t + d + 0.3);
}

function playOrgan(ctx, mix, out, ev, t, dur) {
  const f = mtof(ev.note), v = ev.v == null ? 0.7 : ev.v;
  const g = ctx.createGain();
  const lp = filt(ctx, 'lowpass', 5000, 0.5);
  g.connect(lp).connect(out);
  const harm = [[1, 1], [2, 0.8], [3, 0.55], [4, 0.4], [6, 0.22], [8, 0.15]];
  const end = adsr(g, t, ev.a || 0.012, 0.13 * v, dur, 0.09);
  harm.forEach(([r, lv]) => {
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f * r; og.gain.value = lv;
    o.connect(og).connect(g);
    o.start(t); o.stop(end + 0.02);
  });
}

function playPad(ctx, mix, out, ev, t, dur) {
  const f = mtof(ev.note), v = ev.v == null ? 0.7 : ev.v;
  const g = ctx.createGain();
  const lp = filt(ctx, 'lowpass', 1300, 0.6);
  g.connect(lp).connect(out);
  const end = adsr(g, t, ev.a || 0.5, 0.16 * v, dur, 0.9);
  [-7, 7].forEach((det) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
    o.connect(g); o.start(t); o.stop(end + 0.02);
  });
}

function playArp(ctx, mix, out, ev, t, dur) {
  const f = mtof(ev.note), v = ev.v == null ? 0.7 : ev.v;
  const o = ctx.createOscillator(), o2 = ctx.createOscillator();
  o.type = 'sawtooth'; o2.type = 'square';
  o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 6;
  const lp = filt(ctx, 'lowpass', 3000, 3);
  lp.frequency.setValueAtTime(3200, t);
  lp.frequency.exponentialRampToValueAtTime(600, t + 0.16);
  const g = ctx.createGain();
  o.connect(g); o2.connect(g); g.connect(lp).connect(out);
  const end = adsr(g, t, 0.004, 0.3 * v, Math.max(0.06, dur * 0.8), 0.06);
  o.start(t); o2.start(t); o.stop(end + 0.02); o2.stop(end + 0.02);
}

function playTake(ctx, out, take, t) {
  const src = ctx.createBufferSource();
  src.buffer = take.buffer;
  const g = ctx.createGain();
  const len = take.beats * (60 / take.bpm);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(1, t + 0.006);
  g.gain.setValueAtTime(1, t + len - 0.006);
  g.gain.linearRampToValueAtTime(0, t + len);
  src.connect(g).connect(out);
  src.start(t, take.offsetMs / 1000, len);
}

// ---------------------------------------------------------------- Muster-Generatoren
const bassMidi = (pc) => 28 + ((pc - 4 + 12) % 12); // E1 ... D#2
const voicing = (c, low) => {
  const base = low + ((c.root - (low % 12) + 12) % 12);
  return c.iv.map((x) => base + x);
};

function genDrums(bars, style, opts) {
  const ev = [];
  const nb = bars.length;
  bars.forEach((c, i) => {
    const b = i * 4;
    const lastFill = opts.fill && nb >= 2 && i === nb - 1;
    const A = (t, drum, v) => { if (!lastFill || t < 3) ev.push({ t: b + t, d: 0.25, drum, v }); };
    const eighths = (fn) => { for (let k = 0; k < 8; k++) fn(k * 0.5, k); };
    switch (style) {
      case 'drive':
        eighths((t, k) => A(t, k === 7 ? 'ohat' : 'hat', k % 2 ? 0.4 : 0.6));
        [0, 1.5, 2.5].forEach((t) => A(t, 'kick', 1));
        [1, 3].forEach((t) => A(t, 'snare', 0.9));
        break;
      case 'shuffle':
        for (let k = 0; k < 4; k++) { A(k, 'hat', 0.55); A(k + 2 / 3, 'hat', 0.33); }
        A(0, 'kick', 1); A(2, 'kick', 0.95); A(1, 'snare', 0.9); A(3, 'snare', 0.9);
        break;
      case 'half':
        eighths((t, k) => A(t, 'hat', k % 2 ? 0.35 : 0.5));
        A(0, 'kick', 1); A(1.5, 'kick', 0.8); A(2, 'snare', 1);
        break;
      case 'ballad':
        eighths((t, k) => A(t, 'hat', k % 2 ? 0.2 : 0.32));
        A(0, 'kick', 0.9); A(2.5, 'kick', 0.7); A(1, 'rim', 0.6); A(3, 'rim', 0.6);
        break;
      default: // rock
        eighths((t, k) => A(t, 'hat', k % 2 ? 0.38 : 0.55));
        A(0, 'kick', 1); A(2, 'kick', 0.95); A(1, 'snare', 0.9); A(3, 'snare', 0.9);
    }
    if (lastFill) {
      ev.push({ t: b + 3, d: 0.25, drum: 'tom1', v: 0.8 }, { t: b + 3.25, d: 0.25, drum: 'tom1', v: 0.7 },
        { t: b + 3.5, d: 0.25, drum: 'tom2', v: 0.8 }, { t: b + 3.75, d: 0.25, drum: 'tom3', v: 0.9 });
    }
    if (opts.fill && i === 0) ev.push({ t: b, d: 1, drum: 'crash', v: 0.55 });
  });
  return ev;
}

function genBass(bars, style) {
  const ev = [];
  bars.forEach((c, i) => {
    const b = i * 4;
    const r = bassMidi(c.bassPc);
    const third = c.minor ? 3 : 4;
    const n = (t, d, semis, v = 0.8) => ev.push({ t: b + t, d, note: r + semis, v });
    switch (style) {
      case 'root8':
        for (let k = 0; k < 8; k++) n(k * 0.5, 0.45, 0, k % 2 ? 0.65 : 0.85);
        break;
      case 'walk':
        [0, third, 7, 9].forEach((s, k) => n(k, 0.9, s, k === 0 ? 0.9 : 0.75));
        break;
      case 'boogie': {
        const seq = [0, third, 7, 9, 10, 9, 7, third];
        seq.forEach((s, j) => n(Math.floor(j / 2) + (j % 2) * (2 / 3), 0.55, s, j % 2 ? 0.65 : 0.85));
        break;
      }
      case 'whole':
        n(0, 3.8, 0, 0.9);
        break;
      default: // root4
        for (let k = 0; k < 4; k++) n(k, 0.9, 0, k === 0 ? 0.95 : 0.8);
    }
  });
  return ev;
}

function genChordInst(bars, style, low, pat) {
  const ev = [];
  bars.forEach((c, i) => {
    const b = i * 4;
    const tones = voicing(c, low);
    const hit = (t, d, v, extra) => tones.forEach((note) => ev.push({ t: b + t, d, note, v, ...extra }));
    pat(style, tones, hit, (t, d, note, v) => ev.push({ t: b + t, d, note, v }));
  });
  return ev;
}

function genKeys(bars, style) {
  return genChordInst(bars, style, 52, (s, tones, hit, single) => {
    switch (s) {
      case 'offbeat': [0.5, 1.5, 2.5, 3.5].forEach((t) => hit(t, 0.35, 0.65)); break;
      case 'quarters': [0, 1, 2, 3].forEach((t) => hit(t, 0.5, 0.65)); break;
      case 'comp': [0, 1.5, 2, 3.5].forEach((t) => hit(t, 0.4, 0.7)); break;
      case 'arp': {
        const up = [...tones, tones[0] + 12];
        const cyc = [...up, ...up.slice(1, -1).reverse()];
        for (let k = 0; k < 8; k++) single(k * 0.5, 0.5, cyc[k % cyc.length], 0.65);
        break;
      }
      default: hit(0, 3.8, 0.6); // whole
    }
  });
}

function genOrgan(bars, style) {
  return genChordInst(bars, style, 48, (s, tones, hit) => {
    switch (s) {
      case 'half': hit(0, 1.9, 0.7); hit(2, 1.9, 0.7); break;
      case 'stabs': [0, 1.5, 2.5].forEach((t) => hit(t, 0.4, 0.75)); break;
      case 'swell': hit(0, 3.8, 0.7, { a: 0.7 }); break;
      default: hit(0, 3.9, 0.7);
    }
  });
}

function genPad(bars, style) {
  const ev = [];
  bars.forEach((c, i) => {
    const b = i * 4;
    const tones = voicing(c, 48);
    const all = [...tones, tones[0] + 12];
    const hits = style === 'half' ? [[0, 1.9, 0.3], [2, 1.9, 0.3]] : [[0, 4.0, 0.55]];
    hits.forEach(([t, d, a]) => all.forEach((note) => ev.push({ t: b + t, d, note, v: 0.7, a })));
  });
  return ev;
}

function genArp(bars, style) {
  const ev = [];
  bars.forEach((c, i) => {
    const b = i * 4;
    const tones = voicing(c, 60);
    const seq = [...tones, tones[0] + 12];
    const add = (t, d, note, v) => ev.push({ t: b + t, d, note, v });
    if (style === 'updown8') {
      const cyc = [...seq, ...seq.slice(1, -1).reverse()];
      for (let k = 0; k < 8; k++) add(k * 0.5, 0.45, cyc[k % cyc.length], 0.7);
    } else if (style === 'octave8') {
      for (let k = 0; k < 8; k++) add(k * 0.5, 0.4, tones[0] + (k % 2 ? 12 : 0), k % 2 ? 0.55 : 0.75);
    } else { // up16
      for (let k = 0; k < 16; k++) add(k * 0.25, 0.22, seq[k % seq.length], k % 4 === 0 ? 0.8 : 0.55);
    }
  });
  return ev;
}

function genPerc(bars, style) {
  const ev = [];
  bars.forEach((c, i) => {
    const b = i * 4;
    const add = (t, perc, v) => ev.push({ t: b + t, d: 0.25, perc, v });
    if (style === 'shaker16') {
      for (let k = 0; k < 16; k++) add(k * 0.25, 'shaker', k % 4 === 0 ? 0.75 : k % 2 === 0 ? 0.5 : 0.35);
    } else if (style === 'cow') {
      for (let k = 0; k < 4; k++) add(k, 'cow', k === 0 ? 0.75 : 0.55);
    } else { // tamb
      add(1, 'tamb', 0.8); add(3, 'tamb', 0.8);
      for (let k = 0; k < 8; k++) if (k % 2) add(k * 0.5, 'shaker', 0.3);
    }
  });
  return ev;
}

// Instrument-Register
const INST = {
  drums: { label: 'Schlagzeug', icon: '🥁', vol: 78, def: 'rock', fill: true, gen: genDrums, play: playDrum,
    styles: { rock: 'Rock 8tel', drive: 'Rock Drive', shuffle: 'Shuffle', half: 'Halbtakt', ballad: 'Ballade' } },
  bass: { label: 'E-Bass', icon: '🎸', vol: 78, def: 'root8', gen: genBass, play: playBass,
    styles: { root4: 'Grundton Viertel', root8: 'Grundton Achtel', walk: 'Walking Bass', boogie: 'Boogie', whole: 'Ganze Noten' } },
  keys: { label: 'E-Piano', icon: '🎹', vol: 62, def: 'comp', gen: genKeys, play: playEP,
    styles: { whole: 'Ganze Akkorde', comp: 'Rock-Komping', offbeat: 'Offbeat', quarters: 'Viertel-Stabs', arp: 'Arpeggio' } },
  organ: { label: 'Orgel', icon: '🎛️', vol: 55, def: 'whole', gen: genOrgan, play: playOrgan,
    styles: { whole: 'Ganze Takte', half: 'Halbe Noten', stabs: 'Stabs', swell: 'Swell' } },
  pad: { label: 'Streicher-Pad', icon: '🎻', vol: 50, def: 'whole', gen: genPad, play: playPad,
    styles: { whole: 'Ganze Takte', half: 'Halbe Noten' } },
  arp: { label: 'Synth-Arpeggio', icon: '✨', vol: 52, def: 'up16', gen: genArp, play: playArp,
    styles: { up16: '16tel aufwärts', updown8: '8tel auf/ab', octave8: 'Oktaven 8tel' } },
  perc: { label: 'Percussion', icon: '🪘', vol: 55, def: 'tamb', gen: genPerc, play: playPerc,
    styles: { tamb: 'Tamburin Backbeat', shaker16: 'Shaker 16tel', cow: 'Cowbell' } },
};

// ---------------------------------------------------------------- Mixer-Bausteine
function createMixer(ctx, dest) {
  const m = { ctx };
  m.master = ctx.createGain();
  m.limiter = ctx.createDynamicsCompressor();
  m.limiter.threshold.value = -4; m.limiter.knee.value = 6; m.limiter.ratio.value = 14;
  m.limiter.attack.value = 0.003; m.limiter.release.value = 0.15;
  m.soft = ctx.createWaveShaper();
  m.soft.curve = makeSoftClipCurve();
  m.meter = ctx.createAnalyser();
  m.meter.fftSize = 512;
  m.master.connect(m.limiter).connect(m.soft).connect(m.meter).connect(dest);

  m.reverbIn = ctx.createGain();
  m.reverb = ctx.createConvolver();
  m.reverb.buffer = makeImpulse(ctx, 1.6, 2.4);
  m.reverbOut = ctx.createGain();
  m.reverbOut.gain.value = 0.85;
  m.reverbIn.connect(m.reverb).connect(m.reverbOut).connect(m.master);

  const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  m.noise = nb;
  return m;
}

function createStrip(mix) {
  const ctx = mix.ctx;
  const s = {};
  s.fader = ctx.createGain();
  s.pan = ctx.createStereoPanner();
  s.send = ctx.createGain();
  s.an = ctx.createAnalyser();
  s.an.fftSize = 512;
  s.fader.connect(s.pan);
  s.pan.connect(mix.master);
  s.pan.connect(s.an);
  s.pan.connect(s.send);
  s.send.connect(mix.reverbIn);
  // Eingang neu aufbauen = alles bereits angeschlagene sofort verstummen lassen
  s.resetInput = () => {
    if (s.input) s.input.disconnect();
    s.input = ctx.createGain();
    s.input.connect(s.fader);
  };
  s.resetInput();
  s.dispose = () => {
    [s.input, s.fader, s.pan, s.send, s.an].forEach((n) => { try { n.disconnect(); } catch (e) { /* egal */ } });
  };
  return s;
}

const isSilent = (cfg, anySolo) => cfg.mute || (anySolo && !cfg.solo);

function applyStrip(s, cfg, anySolo, ctx, immediate) {
  const gain = isSilent(cfg, anySolo) ? 0 : faderGain(cfg.vol);
  if (immediate) {
    s.fader.gain.value = gain;
    s.pan.pan.value = cfg.pan / 100;
    s.send.gain.value = (cfg.send / 100) * 0.9;
  } else {
    const t = ctx.currentTime;
    s.fader.gain.setTargetAtTime(gain, t, 0.015);
    s.pan.pan.setTargetAtTime(cfg.pan / 100, t, 0.015);
    s.send.gain.setTargetAtTime((cfg.send / 100) * 0.9, t, 0.015);
  }
}

function playClick(ctx, out, t, accent) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = accent ? 1600 : 1100;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + 0.08);
}

function peakOf(an, buf) {
  an.getFloatTimeDomainData(buf);
  let p = 0;
  for (let i = 0; i < buf.length; i++) { const a = Math.abs(buf[i]); if (a > p) p = a; }
  return p;
}

function encodeWav(buf) {
  const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate;
  const view = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); view.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, ch, true);
  view.setUint32(24, sr, true); view.setUint32(28, sr * ch * 2, true); view.setUint16(32, ch * 2, true);
  view.setUint16(34, 16, true); w(36, 'data'); view.setUint32(40, n * ch * 2, true);
  const data = [];
  for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}
