// Tonhöhen-Erkennung (YIN-Algorithmus) und Noten-Hilfsfunktionen.
'use strict';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_DE = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'H'];

const Pitch = {
  refA: 440,

  freqToMidiFloat(f) {
    return 69 + 12 * Math.log2(f / Pitch.refA);
  },
  midiToFreq(m) {
    return Pitch.refA * Math.pow(2, (m - 69) / 12);
  },
  noteName(midi) {
    return NOTE_NAMES[((midi % 12) + 12) % 12];
  },
  noteNameDe(midi) {
    return NOTE_NAMES_DE[((midi % 12) + 12) % 12];
  },
  octave(midi) {
    return Math.floor(midi / 12) - 1;
  },

  rms(buf) {
    let s = 0;
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  },

  /**
   * YIN: liefert { freq, clarity } oder null.
   * Bereich ca. 60 Hz (tiefes B/Drop-Tunings) bis 1200 Hz.
   */
  yin(buf, sampleRate) {
    const W = 2048; // Fensterlänge
    const tauMin = Math.floor(sampleRate / 1200);
    const tauMax = Math.min(Math.floor(sampleRate / 60), buf.length - W - 1);
    if (tauMax <= tauMin + 2) return null;
    const start = buf.length - W - tauMax - 1; // neuestes Stück des Puffers nutzen
    const x = start > 0 ? buf.subarray(start) : buf;

    const cmnd = new Float32Array(tauMax + 1);
    cmnd[0] = 1;
    let running = 0;
    for (let tau = 1; tau <= tauMax; tau++) {
      let d = 0;
      for (let j = 0; j < W; j++) {
        const diff = x[j] - x[j + tau];
        d += diff * diff;
      }
      running += d;
      cmnd[tau] = running === 0 ? 1 : (d * tau) / running;
    }

    const threshold = 0.15;
    let tau = -1;
    for (let t = tauMin; t <= tauMax; t++) {
      if (cmnd[t] < threshold) {
        while (t + 1 <= tauMax && cmnd[t + 1] < cmnd[t]) t++;
        tau = t;
        break;
      }
    }
    if (tau < 0) return null;

    // parabolische Interpolation für Genauigkeit unter einem Sample
    let better = tau;
    if (tau > 1 && tau < tauMax) {
      const s0 = cmnd[tau - 1], s1 = cmnd[tau], s2 = cmnd[tau + 1];
      const denom = 2 * (2 * s1 - s2 - s0);
      if (denom !== 0) better = tau + (s2 - s0) / denom;
    }
    return { freq: sampleRate / better, clarity: 1 - cmnd[tau] };
  },
};

// Standard-Stimmung: Saite 6 (tiefes E) ... Saite 1 (hohes e) als MIDI-Noten
const TUNINGS = {
  standard: { name: 'Standard (E A D G H E)', strings: { 6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64 } },
  eb: { name: 'Halbton tiefer (Es)', strings: { 6: 39, 5: 44, 4: 49, 3: 54, 2: 58, 1: 63 } },
  dropd: { name: 'Drop D', strings: { 6: 38, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64 } },
  dstd: { name: 'D-Stimmung (Ganzton tiefer)', strings: { 6: 38, 5: 43, 4: 48, 3: 53, 2: 57, 1: 62 } },
  dadgad: { name: 'DADGAD', strings: { 6: 38, 5: 45, 4: 50, 3: 55, 2: 57, 1: 62 } },
};
