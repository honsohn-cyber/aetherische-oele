// Audio-Engine: Gitarre (Kabel) -> Verstärker-Simulation -> Kopfhörer/Lautsprecher.
// Alles läuft lokal im Browser über die Web Audio API.
'use strict';

const GATE_WORKLET = `
class Gate extends AudioWorkletProcessor {
  constructor() {
    super();
    this.thr = 0; this.env = 0; this.g = 1; this._g = 1;
    this.port.onmessage = (e) => { if (e.data && typeof e.data.thr === 'number') this.thr = e.data.thr; };
  }
  process(inputs, outputs) {
    const inp = inputs[0], out = outputs[0];
    if (!inp || !inp[0]) return true;
    for (let c = 0; c < out.length; c++) {
      const i = inp[Math.min(c, inp.length - 1)], o = out[c];
      for (let n = 0; n < o.length; n++) {
        if (c === 0) {
          const a = Math.abs(i[n]);
          this.env = a > this.env ? a : this.env * 0.9993;
          const target = (this.thr <= 0 || this.env > this.thr) ? 1 : 0;
          this.g += (target - this.g) * (target > this.g ? 0.02 : 0.0015);
          this._g = this.g;
        }
        o[n] = i[n] * this._g;
      }
    }
    return true;
  }
}
registerProcessor('gate', Gate);
`;


// Synthetischer Hall (Rauschen mit abklingender Hüllkurve) – auch für das Studio
function makeImpulse(ctx, seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const noise = Math.random() * 2 - 1;
      lp += (noise - lp) * (0.55 - 0.4 * t); // Höhen klingen schneller ab
      d[i] = lp * Math.pow(1 - t, decay);
    }
  }
  return buf;
}

// Weicher Begrenzer: nie hartes digitales Clipping
function makeSoftClipCurve() {
  const sc = new Float32Array(1025);
  for (let i = 0; i < sc.length; i++) {
    const x = (i / 1024) * 2 - 1, ax = Math.abs(x);
    sc[i] = Math.sign(x) * (ax < 0.7 ? ax : 0.7 + 0.3 * Math.tanh((ax - 0.7) / 0.3));
  }
  return sc;
}

// Kennlinien für die Verzerrung
function makeCurve(kind) {
  const n = 2048;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    let y;
    switch (kind) {
      case 'clean': // weiches Röhren-Anfahren
        y = Math.tanh(x * 1.0);
        break;
      case 'crunch': // leicht asymmetrisch, Röhren-Charakter
        y = Math.tanh(x * 2.2 + 0.15) - Math.tanh(0.15);
        break;
      case 'lead':
        y = Math.tanh(x * 3.5 + 0.2) - Math.tanh(0.2);
        break;
      case 'fuzz': // hart, stark asymmetrisch
        y = x > 0 ? Math.tanh(x * 6) : Math.max(-1, x * 3.5) * 0.9;
        break;
      default:
        y = x;
    }
    c[i] = Math.max(-1, Math.min(1, y));
  }
  return c;
}

// Kanäle: base = Grundverstärkung vor der Verzerrung, stage2 = zweite Verzerrstufe
const CHANNELS = {
  clean: { label: 'Clean', base: 2, curve: 'clean', stage2: false, interHp: 80, post: 1.0 },
  crunch: { label: 'Crunch', base: 2.5, curve: 'crunch', stage2: false, interHp: 120, post: 0.9 },
  lead: { label: 'Lead', base: 3, curve: 'lead', stage2: true, interHp: 250, post: 0.75 },
  fuzz: { label: 'Fuzz', base: 4, curve: 'fuzz', stage2: false, interHp: 180, post: 0.55 },
};

// Presets. Regler 0..10 wie bei einem echten Verstärker.
const AMP_PRESETS = [
  { id: 'clean', name: 'Sauber', desc: 'Glasklar, funky, Arpeggios',
    p: { channel: 'clean', gain: 1.5, bass: 5, mid: 5, treble: 6, presence: 5, reverb: 3, volume: 6 } },
  { id: 'blues', name: 'Blues', desc: 'Warmes Anfahren, Dynamik',
    p: { channel: 'clean', gain: 4.5, bass: 5, mid: 6, treble: 5, presence: 4, reverb: 3, volume: 6 } },
  { id: 'crunch', name: 'Crunch Rhythm', desc: 'Klassischer Rock-Rhythmussound',
    p: { channel: 'crunch', gain: 5, bass: 5, mid: 6, treble: 6, presence: 6, reverb: 1.5, volume: 5.5 } },
  { id: 'plexi', name: 'Brit Rock', desc: '70er Hard Rock, Power Chords',
    p: { channel: 'crunch', gain: 7, bass: 4.5, mid: 7, treble: 6.5, presence: 6.5, reverb: 1, volume: 5 } },
  { id: 'lead', name: 'Classic Lead', desc: 'Singende Soli, viel Sustain',
    p: { channel: 'lead', gain: 6, bass: 4, mid: 7, treble: 6, presence: 5, reverb: 3.5, volume: 5 } },
  { id: 'hard', name: 'Hi-Gain', desc: 'Dicht & aggressiv, Mitten leicht zurück',
    p: { channel: 'lead', gain: 8.5, bass: 6, mid: 4, treble: 6.5, presence: 7, reverb: 1, volume: 4.5 } },
  { id: 'fuzz', name: 'Fuzz 60s', desc: 'Rauhes Psychedelic-Fuzzgesicht',
    p: { channel: 'fuzz', gain: 6, bass: 5, mid: 5, treble: 4, presence: 4, reverb: 2.5, volume: 5 } },
  { id: 'ambient', name: 'Raum', desc: 'Clean mit viel Hall',
    p: { channel: 'clean', gain: 2, bass: 4, mid: 4, treble: 5, presence: 4, reverb: 8, volume: 6 } },
];

class AmpEngine {
  constructor() {
    this.ctx = null;
    this.stream = null;
    this.params = { ...AMP_PRESETS[2].p, gate: 0, inputLevel: 5, cab: true };
    this.muted = false;
    this.ready = false;
  }

  get supportsOutputSelect() {
    return !!(this.ctx && typeof this.ctx.setSinkId === 'function');
  }

  async start(deviceId) {
    if (!this.ctx) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      this.ctx = ctx;
      ctx.onstatechange = () => this.onCtxState && this.onCtxState(ctx.state);
      try {
        await this._buildGraph();
      } catch (e) {
        this.ctx = null;
        ctx.close();
        throw e;
      }
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    await this.selectInput(deviceId);
    this.ready = true;
  }

  async _buildGraph() {
    const ctx = this.ctx;
    const mk = (type, props = {}) => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      for (const [k, v] of Object.entries(props)) f[k].value = v; // frequency/Q/gain sind AudioParams
      return f;
    };

    this.inGain = ctx.createGain();
    this.inGain.channelCount = 1;
    this.inGain.channelCountMode = 'explicit';

    // Analyser für Pegel/Stimmgerät/Lektionen (nach Eingangsregler, vor Verstärker)
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0;
    this.inGain.connect(this.analyser);

    // Noise Gate (optional, falls AudioWorklet verfügbar)
    let last = this.inGain;
    try {
      // data:-URL funktioniert auch beim Öffnen per Doppelklick (file://), Blob-URLs dort nicht
      const dataUrl = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(GATE_WORKLET);
      try {
        await ctx.audioWorklet.addModule(dataUrl);
      } catch (e1) {
        await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([GATE_WORKLET], { type: 'application/javascript' })));
      }
      this.gate = new AudioWorkletNode(ctx, 'gate', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
      last.connect(this.gate);
      last = this.gate;
    } catch (e) {
      console.warn('Noise Gate nicht verfügbar:', e);
    }

    this.hpf = mk('highpass', { frequency: 70, Q: 0.7 });
    this.preGain = ctx.createGain();
    this.shaper1 = Object.assign(ctx.createWaveShaper(), { oversample: '4x' });
    this.interHp = mk('highpass', { frequency: 120, Q: 0.7 });
    this.interGain = ctx.createGain();
    this.shaper2 = Object.assign(ctx.createWaveShaper(), { oversample: '4x' });
    this.postGain = ctx.createGain();

    this.bass = mk('lowshelf', { frequency: 120 });
    this.mid = mk('peaking', { frequency: 650, Q: 0.7 });
    this.treble = mk('highshelf', { frequency: 2800 });
    this.presence = mk('highshelf', { frequency: 5500 });

    // Box-Simulation (Lautsprecher-Charakter)
    this.cabHp = mk('highpass', { frequency: 75, Q: 0.7 });
    this.cabThump = mk('peaking', { frequency: 120, gain: 2, Q: 1 });
    this.cabBite = mk('peaking', { frequency: 2400, gain: 3, Q: 1.1 });
    this.cabLp1 = mk('lowpass', { frequency: 5200, Q: 0.7 });
    this.cabLp2 = mk('lowpass', { frequency: 5200, Q: 0.7 });
    this.cabOut = ctx.createGain();

    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._makeImpulse(1.8, 2.6);

    this.master = ctx.createGain();
    this.limiter = ctx.createDynamicsCompressor();
    Object.assign(this.limiter.threshold, { value: -6 });
    Object.assign(this.limiter.knee, { value: 6 });
    Object.assign(this.limiter.ratio, { value: 12 });
    Object.assign(this.limiter.attack, { value: 0.003 });
    Object.assign(this.limiter.release, { value: 0.15 });
    // weicher Begrenzer am Ende: nie hartes digitales Clipping auf den Kopfhörern
    this.softClip = Object.assign(ctx.createWaveShaper(), { oversample: '2x' });
    this.softClip.curve = makeSoftClipCurve();
    this.outMeter = ctx.createAnalyser();
    this.outMeter.fftSize = 1024;

    const chain = [last, this.hpf, this.preGain, this.shaper1, this.interHp, this.interGain, this.shaper2,
      this.postGain, this.bass, this.mid, this.treble, this.presence];
    for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1]);
    this.toneOut = this.presence;

    // Box-Pfad und Bypass-Pfad
    this.cabChain = [this.cabHp, this.cabThump, this.cabBite, this.cabLp1, this.cabLp2, this.cabOut];
    for (let i = 0; i < this.cabChain.length - 1; i++) this.cabChain[i].connect(this.cabChain[i + 1]);
    this.bypassCab = ctx.createGain();
    this.toneOut.connect(this.cabHp);
    this.toneOut.connect(this.bypassCab);
    this.cabMix = ctx.createGain();
    this.cabOut.connect(this.cabMix);
    this.bypassCab.connect(this.cabMix);

    this.cabMix.connect(this.dry);
    this.cabMix.connect(this.reverb);
    this.reverb.connect(this.wet);
    this.dry.connect(this.master);
    this.wet.connect(this.master);
    this.master.connect(this.limiter);
    this.limiter.connect(this.softClip);
    this.softClip.connect(this.outMeter);
    this.outMeter.connect(ctx.destination);

    this.applyAll();
  }

  _makeImpulse(seconds, decay) {
    return makeImpulse(this.ctx, seconds, decay);
  }

  async selectInput(deviceId) {
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.source) { try { this.source.disconnect(); } catch (e) { /* egal */ } }
    const audio = {
      echoCancellation: false, noiseSuppression: false, autoGainControl: false,
      channelCount: 1, latency: 0,
    };
    if (deviceId) audio.deviceId = { exact: deviceId };
    this.stream = await navigator.mediaDevices.getUserMedia({ audio });
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.source.connect(this.inGain);
    const t = this.stream.getAudioTracks()[0];
    if (t) {
      // Gerät abgezogen / vom System stummgeschaltet -> App informieren
      t.addEventListener('ended', () => this.onInputState && this.onInputState('ended'));
      t.addEventListener('mute', () => this.onInputState && this.onInputState('mute'));
      t.addEventListener('unmute', () => this.onInputState && this.onInputState('unmute'));
    }
    this.currentDeviceId = t && t.getSettings().deviceId;
    this.currentLabel = t ? t.label : '';
  }

  async listDevices() {
    const all = await navigator.mediaDevices.enumerateDevices();
    return {
      inputs: all.filter((d) => d.kind === 'audioinput'),
      outputs: all.filter((d) => d.kind === 'audiooutput'),
    };
  }

  async setOutput(deviceId) {
    if (this.supportsOutputSelect) await this.ctx.setSinkId(deviceId || '');
  }

  setParam(key, value) {
    this.params[key] = value;
    if (this.ctx) this.applyAll();
  }

  setParams(obj) {
    Object.assign(this.params, obj);
    if (this.ctx) this.applyAll();
  }

  setMuted(m) {
    this.muted = m;
    if (this.ctx) this.applyAll();
  }

  applyAll() {
    const p = this.params;
    const ch = CHANNELS[p.channel] || CHANNELS.clean;
    const t = this.ctx.currentTime;
    const ramp = (param, v) => param.setTargetAtTime(v, t, 0.015);

    // Eingangspegel: 0..10 -> -12..+24 dB
    ramp(this.inGain.gain, Math.pow(10, (-12 + p.inputLevel * 3.6) / 20));

    if (this.gate) this.gate.port.postMessage({ thr: p.gate <= 0 ? 0 : 0.0008 + p.gate * 0.0035 });

    if (this._curveKey !== p.channel) {
      this._curveKey = p.channel;
      this.shaper1.curve = makeCurve(ch.curve);
      this.shaper2.curve = ch.stage2 ? makeCurve('lead') : makeCurve('linear');
    }
    ramp(this.preGain.gain, ch.base * Math.pow(10, p.gain * 0.15));
    this.interHp.frequency.value = ch.interHp;
    ramp(this.interGain.gain, ch.stage2 ? 1.6 : 1);
    ramp(this.postGain.gain, ch.post * (ch.stage2 ? 0.8 : 1));

    ramp(this.bass.gain, (p.bass - 5) * 2.4);
    ramp(this.mid.gain, (p.mid - 5) * 2.6);
    ramp(this.treble.gain, (p.treble - 5) * 2.4);
    ramp(this.presence.gain, (p.presence - 5) * 2.2);

    ramp(this.cabOut.gain, p.cab ? 1 : 0);
    ramp(this.bypassCab.gain, p.cab ? 0 : 1);

    ramp(this.dry.gain, 1);
    ramp(this.wet.gain, (p.reverb / 10) * 0.9);

    const vol = Math.pow(p.volume / 10, 2) * 1.6;
    ramp(this.master.gain, this.muted ? 0 : vol);
  }

  // Aktueller Zeitbereichs-Puffer des Eingangs
  readInput(buf) {
    this.analyser.getFloatTimeDomainData(buf);
    return buf;
  }

  get latencyMs() {
    if (!this.ctx) return 0;
    return Math.round(((this.ctx.baseLatency || 0) + (this.ctx.outputLatency || 0)) * 1000);
  }

  // Kurzer Klick für das Metronom
  click(accent) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.value = accent ? 1600 : 1100;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.08);
  }
}
