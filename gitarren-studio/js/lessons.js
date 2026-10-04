// Lektionen. Alle mitgelieferten Riffs sind selbst geschrieben ("im Stil von ...").
// Echte Song-Tabs sind urheberrechtlich geschützt – dafür gibt es den Import für eigene Tabs (parseAsciiTab).
'use strict';

const S = (s, f) => ({ s, f }); // Saite (6 = tiefes E ... 1 = hohes e), Bund (0 = leer)
const ev = (b, d, n, name) => ({ b, d, n, name });

const SHAPES = {
  E5: [S(6, 0), S(5, 2)], A5: [S(5, 0), S(4, 2)], D5: [S(4, 0), S(3, 2)], B5: [S(5, 2), S(4, 4)],
  G: [S(6, 3), S(5, 2), S(4, 0), S(3, 0), S(2, 0), S(1, 3)],
  C: [S(5, 3), S(4, 2), S(3, 0), S(2, 1), S(1, 0)],
  D: [S(4, 0), S(3, 2), S(2, 3), S(1, 2)],
};

// Einzelnoten-Folge: [saite, bund, dauer]; saite = null ergibt eine Pause
function seq(list, start = 0) {
  let b = start;
  const out = [];
  for (const [s, f, d] of list) {
    if (s !== null) out.push(ev(b, d, [S(s, f)]));
    b += d;
  }
  return out;
}

// Akkord-Anschläge eines Taktes
function hits(startBeat, chordName, offsets, dur) {
  return offsets.map((o, i) => ev(startBeat + o, dur, SHAPES[chordName], i === 0 ? chordName : undefined));
}

const eighths = (n) => Array.from({ length: n }, (_, i) => i * 0.5);

const LESSON_DEFS = [
  {
    id: 'open', title: 'Leere Saiten', level: 'Anfänger', style: 'Warm-up', bpm: 70, amp: 'clean',
    desc: 'Alle sechs Saiten einmal hoch und wieder runter. So gewöhnst du dich an Anzeige und Tempo.',
    tips: ['Schlage jede Saite einzeln und sauber an – Plektrum immer im Wechsel (Ab-, Aufschlag).',
      'Wenn nichts erkannt wird: Eingangspegel im Amp-Tab hochdrehen.'],
    events: seq([[6, 0, 1], [5, 0, 1], [4, 0, 1], [3, 0, 1], [2, 0, 1], [1, 0, 1],
      [2, 0, 1], [3, 0, 1], [4, 0, 1], [5, 0, 1], [6, 0, 1]]),
  },
  {
    id: 'ode', title: 'Ode an die Freude', level: 'Anfänger', style: 'Erste Melodie (gemeinfrei)', bpm: 80, amp: 'clean',
    desc: 'Beethovens Melodie auf den beiden höchsten Saiten – ideal, um Griffwechsel auf Einzelnoten zu üben.',
    tips: ['Nur zwei Saiten: hohes e (Bund 0, 1, 3) und H-Saite (Bund 1, 3).',
      'Zeigefinger = Bund 1, Ringfinger = Bund 3.'],
    events: (() => {
      const A = [[1, 0, 1], [1, 0, 1], [1, 1, 1], [1, 3, 1]];
      const B = [[1, 3, 1], [1, 1, 1], [1, 0, 1], [2, 3, 1]];
      const C = [[2, 1, 1], [2, 1, 1], [2, 3, 1], [1, 0, 1]];
      const D1 = [[1, 0, 1.5], [2, 3, 0.5], [2, 3, 2]];
      const D2 = [[2, 3, 1.5], [2, 1, 0.5], [2, 1, 2]];
      return seq([...A, ...B, ...C, ...D1, ...A, ...B, ...C, ...D2]);
    })(),
  },
  {
    id: 'power', title: 'Power Chords: E5 – A5 – D5', level: 'Anfänger', style: 'Classic Rock Grundlage', bpm: 80, amp: 'plexi',
    desc: 'Die Grundlage fast jedes Rock-Songs: Zweiklänge aus Grundton und Quinte auf den tiefen Saiten.',
    tips: ['Zeigefinger auf den Grundton, Ringfinger zwei Bünde höher auf die nächste Saite.',
      'Dämpfe mit der Anschlagshand (Handballen) leicht an der Brücke – so klingt es tight.',
      'Erkannt wird der Grundton – achte auf saubere Anschläge.'],
    events: (() => {
      const q = [0, 1, 2, 3];
      const out = [];
      let b = 0;
      const add = (name, offs, d, len) => { out.push(...hits(b, name, offs, d)); b += len; };
      add('E5', q, 1, 4);
      add('A5', q, 1, 4);
      add('D5', [0, 1], 1, 2); add('A5', [0, 1], 1, 2);
      add('E5', q, 1, 4);
      add('E5', eighths(8), 0.5, 4);
      add('A5', eighths(8), 0.5, 4);
      add('D5', [0, 1], 1, 2); add('A5', [0, 1], 1, 2);
      add('E5', [0], 4, 4);
      return out;
    })(),
  },
  {
    id: 'strum', title: 'Lagerfeuer-Rocker: G – C – D', level: 'Anfänger', style: 'Offene Akkorde, Rock-Rhythmus', bpm: 90, amp: 'crunch',
    desc: 'Drei offene Akkorde mit klassischem Rock-Anschlagmuster: Ab, Ab, Auf, Auf, Ab, Auf.',
    tips: ['Muster pro Takt: 1 – 2 & – & 4 & (je Zählzeit ein Schlag, "und" = Aufschlag).',
      'Die Anschlagshand schwingt immer durch, auch bei Pausen.',
      'Akkord-Erkennung prüft, ob ein Ton des Akkords klingt – achte auf saubere Griffe.'],
    events: (() => {
      const pat = [0, 1, 1.5, 2.5, 3, 3.5];
      const prog = ['G', 'C', 'G', 'D', 'G', 'C', 'D'];
      const out = [];
      prog.forEach((c, i) => out.push(...hits(i * 4, c, pat, 0.5)));
      out.push(...hits(prog.length * 4, 'G', [0], 4));
      return out;
    })(),
  },
  {
    id: 'arp', title: 'Rock-Ballade: Arpeggios', level: 'Mittel', style: 'Stil: 70er Powerballade', bpm: 72, amp: 'clean',
    desc: 'Am – C – G – D, Akkord für Akkord gezupft. Perfekt für Fingerpicking und sauberes Timing.',
    tips: ['Daumen/Plektrum spielt den Basston, die drei hohen Saiten folgen.',
      'Lass die Töne ineinander klingen (Akkord greifen und stehen lassen).'],
    events: (() => {
      const A = {
        Am: [S(5, 0), S(3, 2), S(2, 1), S(1, 0)],
        C: [S(5, 3), S(3, 0), S(2, 1), S(1, 0)],
        G: [S(6, 3), S(3, 0), S(2, 0), S(1, 3)],
        D: [S(4, 0), S(3, 2), S(2, 3), S(1, 2)],
      };
      const order = [0, 1, 2, 3, 2, 1, 2, 3];
      const out = [];
      ['Am', 'C', 'G', 'D', 'Am', 'C', 'G'].forEach((c, bar) => {
        order.forEach((idx, i) => out.push(ev(bar * 4 + i * 0.5, 0.5, [A[c][idx]], i === 0 ? c : undefined)));
      });
      out.push(ev(28, 4, [S(5, 0)], 'Am'));
      return out;
    })(),
  },
  {
    id: 'riff', title: 'Blues-Rock-Riff in E', level: 'Mittel', style: 'Stil: Hard Rock der 70er', bpm: 100, amp: 'plexi',
    desc: 'Ein Riff auf der tiefen E-Saite aus der E-Moll-Pentatonik inkl. Blue Note (Bund 6).',
    tips: ['Alles auf einer Saite: Zeigefinger = 3, Ringfinger = 5, kleiner Finger = 6.',
      'Spiele die leere Saite zwischendurch angedämpft/kurz.'],
    events: (() => {
      const A = [0, 0, 3, 0, 5, 0, 3, 0];
      const B = [0, 0, 3, 0, 5, 6, 5, 3];
      const out = [];
      [A, B, A, B, A, B, A, B].forEach((bar, i) =>
        bar.forEach((f, k) => out.push(ev(i * 4 + k * 0.5, 0.5, [S(6, f)]))));
      out.push(ev(32, 4, SHAPES.E5, 'E5'));
      return out;
    })(),
  },
  {
    id: 'chuck', title: '12-Takt-Blues im Rock\'n\'Roll-Stil', level: 'Mittel', style: 'Stil: Chuck-Berry-Rhythmus', bpm: 90, amp: 'crunch',
    desc: 'Der Klassiker: auf dem Grundton bleiben und die Quinte zwischen Bund 2 und 4 (Quinte/Sexte) wechseln.',
    tips: ['Zeigefinger bleibt liegen, Ring- und kleiner Finger wechseln.',
      'Dritter Takt-Block (A, B) wechselt die Saiten – gleiche Fingerform nach oben schieben.',
      'Im "Wartemodus" kannst du das Tempo üben, ohne zu verlieren.'],
    events: (() => {
      const roots = { E: [6, 0], A: [5, 0], B: [5, 2] };
      const prog = ['E', 'E', 'E', 'E', 'A', 'A', 'E', 'E', 'B', 'A', 'E', 'E'];
      const out = [];
      prog.forEach((c, bar) => {
        const [rs, rf] = roots[c];
        for (let i = 0; i < 8; i++) {
          out.push(ev(bar * 4 + i * 0.5, 0.5, [S(rs, rf), S(rs - 1, rf + (i % 2 === 0 ? 2 : 4))],
            i === 0 ? c : undefined));
        }
      });
      return out;
    })(),
  },
  {
    id: 'penta', title: 'Solo-Training: A-Moll-Pentatonik', level: 'Fortgeschritten', style: 'Stil: Classic-Rock-Soli', bpm: 80, amp: 'lead',
    desc: 'Box 1 der Pentatonik (5. Bund) hoch und runter, danach zwei typische Lick-Muster.',
    tips: ['Zeigefinger = 5. Bund, Ringfinger/kleiner Finger = 7./8. Bund.',
      'Spiele bewusst im Wechselschlag – das gibt dir Geschwindigkeit.',
      'Erst langsam (Tempo-Regler 60 %), dann steigern.'],
    events: (() => {
      const up = [[6, 5], [6, 8], [5, 5], [5, 7], [4, 5], [4, 7], [3, 5], [3, 7], [2, 5], [2, 8], [1, 5], [1, 8]];
      const down = up.slice().reverse().slice(1);
      const part1 = [...up, ...down].map(([s, f]) => [s, f, 0.5]);
      part1.push([6, 5, 3.5]);
      const lickA = [[1, 8], [1, 5], [2, 8], [2, 5], [3, 7], [3, 5], [4, 7], [4, 5]].map(([s, f]) => [s, f, 0.5]);
      const lickB = [[4, 5], [5, 7], [5, 5], [6, 8], [6, 5]].map(([s, f]) => [s, f, 0.5]);
      lickB.push([null, 0, 1.5]);
      return seq([...part1, ...lickA, ...lickB, ...lickA, ...lickB, [6, 5, 4]]);
    })(),
  },
];

function finalizeLesson(def) {
  const events = def.events.slice().sort((a, b) => a.b - b.b);
  const last = events[events.length - 1];
  const beats = Math.ceil((last.b + last.d) / 4) * 4;
  return { tuning: 'standard', ...def, events, beats };
}

const LESSONS = LESSON_DEFS.map(finalizeLesson);

/**
 * ASCII-Tabulatur -> Lektion.
 * Erwartet 6 Zeilen pro System (hohes e oben, tiefes E unten). Eine Spalte = 1/stepsPerBeat Schlag.
 */
function parseAsciiTab(text, stepsPerBeat = 2) {
  const lineRe = /^\s*(?:[A-Ga-g][#b]?)?\s*[|:]?[-0-9|hpbrxsvt/\\~().<>^*=\s]*-[-0-9|hpbrxsvt/\\~().<>^*=\s]*$/;
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks = [];
  let cur = [];
  for (const raw of lines) {
    if (raw.trim() && lineRe.test(raw) && (raw.match(/-/g) || []).length >= 3) {
      cur.push(raw.replace(/^\s*(?:[A-Ga-g][#b]?)?\s*\|?/, ''));
    } else if (cur.length) {
      blocks.push(cur);
      cur = [];
    }
  }
  if (cur.length) blocks.push(cur);

  const events = [];
  let col0 = 0;
  for (const block of blocks) {
    for (let k = 0; k + 6 <= block.length; k += 6) {
      const L = block.slice(k, k + 6);
      const width = Math.max(...L.map((l) => l.length));
      const g = L.map((l) => l.padEnd(width, '-'));
      const keep = [];
      for (let c = 0; c < width; c++) {
        const bars = g.filter((l) => l[c] === '|').length;
        if (bars < 4) keep.push(c);
      }
      const cols = keep.map((c) => g.map((l) => l[c]));
      for (let c = 0; c < cols.length; c++) {
        const notes = [];
        for (let s = 0; s < 6; s++) {
          const ch = cols[c][s];
          if (/[0-9]/.test(ch) && !(c > 0 && /[0-9]/.test(cols[c - 1][s]))) {
            let txt = ch;
            if (c + 1 < cols.length && /[0-9]/.test(cols[c + 1][s])) txt += cols[c + 1][s];
            const f = parseInt(txt, 10);
            if (f <= 24) notes.push(S(s + 1, f));
          }
        }
        if (notes.length) events.push(ev((col0 + c) / stepsPerBeat, 0.5, notes));
      }
      col0 += cols.length;
    }
  }
  if (!events.length) return null;
  for (let i = 0; i < events.length; i++) {
    const next = events[i + 1];
    events[i].d = next ? Math.max(0.25, Math.min(2, next.b - events[i].b)) : 1;
  }
  // Takt-Beginn auf 0 schieben
  const shift = Math.floor(events[0].b / 4) * 4;
  events.forEach((e) => { e.b -= shift; });
  return events;
}
