// 80er-Rock-Jam-Tracks: eigene Arrangements "im Stil von" – mit Strophe, Refrain, Solo usw.
// Tempo und die Lautstärke jedes Instruments lassen sich im Studio frei regeln.
// Hinweis: Das sind keine Aufnahmen oder Nachbauten bestimmter Songs, sondern frei komponierte
// Begleitungen in der Art der Zeit (Akkordfolgen und Rhythmen sind typisch, die Stücke selbst sind neu).
'use strict';

// Band-Eintrag: kind, Standard-Spielweise, Lautstärke, Pan, Hall, pro Abschnitt abweichende Spielweise (false = pausiert)
const bandOf = (kind, style, vol, pan, send, sec) => ({ kind, style, vol, pan, send, sec: sec || {} });

// Künstler-Links: Kanäle aus deiner "For you"-Liste, alle anderen als YouTube-Music-Suche
const ARTIST_URL = {
  'Pink Floyd': 'https://music.youtube.com/channel/UCO6LS_5W7vqG9mALDNzSFug',
  'Genesis': 'https://music.youtube.com/channel/UCqlnY5lvEp6F52AZSql04qQ',
  'Nazareth': 'https://music.youtube.com/channel/UCTJuMLFXDRjeccfu0nMGHWg',
  'Rory Gallagher': 'https://music.youtube.com/channel/UCokxZ1WorYTuSvdB5Tw4nbw',
  'Neil Young': 'https://music.youtube.com/channel/UC6JhadLTf6g6f-ZdeEaAqBQ',
  'Fleetwood Mac': 'https://music.youtube.com/channel/UCCzULu3prrEaPvM2ZtkJlYQ',
  "Guns N' Roses": 'https://music.youtube.com/channel/UCSLbbBoUqpin6BE34whSOvA',
  'Green Day': 'https://music.youtube.com/channel/UC4JNeITH4P7G51C1hJoG6vQ',
  'Westernhagen': 'https://music.youtube.com/channel/UCVLMC-cVjPX17xWU-MWbtoA',
  'Herbert Grönemeyer': 'https://music.youtube.com/channel/UCpgBROkXWpGzEMXnz0LGHbg',
};
const artistUrl = (name) => ARTIST_URL[name] || 'https://music.youtube.com/search?q=' + encodeURIComponent(name);

// Dein Geschmack (aus deiner Nachricht und deiner "For you"-Seite); in der Songs-Ansicht änderbar
const DEFAULT_TASTE = ['Led Zeppelin', 'Pink Floyd', 'Van Halen', 'Motörhead', 'Uriah Heep', 'Foreigner', 'Nazareth',
  "Guns N' Roses", 'Black Sabbath', 'Genesis', 'Rory Gallagher', 'Neil Young', 'Fleetwood Mac', 'Westernhagen'];

const SONG_FORM = ['Intro', 'Strophe', 'Refrain', 'Strophe', 'Refrain', 'Solo', 'Refrain', 'Outro'];

const SONGS = [
  {
    id: 'neon-arena', title: 'Neon Arena', style: 'Arena-Rock', tag: 'Stadion & Arena', artists: ['Foreigner', 'Van Halen'],
    key: 'D-Dur', bpm: 120, hue: 350,
    tip: 'Strophe: Akkorde ganz durchschrammeln. Refrain: Power Chords auf der A- und D-Saite, kräftig anschlagen.',
    form: SONG_FORM,
    sections: { Intro: 'D A Bm G', Strophe: 'D A Bm G D A G A', Refrain: 'G D A Bm G D A*2', Solo: 'Bm G D A Bm G A*2', Outro: 'G D A*2' },
    band: [
      bandOf('drums', 'rock', 78, 0, 12, { Intro: false, Strophe: 'half', Refrain: 'drive', Solo: 'drive', Outro: 'rock' }),
      bandOf('bass', 'root4', 78, 0, 0, { Intro: false, Refrain: 'root8', Solo: 'root8', Outro: 'root8' }),
      bandOf('keys', 'comp', 55, -20, 25, { Intro: 'arp', Strophe: false, Outro: 'whole' }),
      bandOf('pad', 'whole', 48, 0, 40, { Refrain: 'whole', Strophe: false, Solo: 'whole' }),
      bandOf('perc', 'tamb', 52, -25, 10, { Intro: false, Strophe: false, Outro: false }),
    ],
  },
  {
    id: 'stahlherz', title: 'Stahlherz', style: 'Power-Ballade', tag: 'Balladen', artists: ["Guns N' Roses", 'Foreigner'],
    key: 'C-Dur', bpm: 68, hue: 25,
    tip: 'Strophe: gezupfte Arpeggios. Refrain: offene Akkorde laufen lassen. Im Solo lange, singende Töne.',
    form: SONG_FORM,
    sections: { Intro: 'C G Am F', Strophe: 'C G Am F C G F G', Refrain: 'F C G Am F C G*2', Solo: 'F C G Am F C G*2', Outro: 'F C G C' },
    band: [
      bandOf('drums', 'ballad', 70, 0, 15, { Intro: false, Strophe: false, Refrain: 'ballad', Solo: 'half', Outro: false }),
      bandOf('bass', 'whole', 72, 0, 0, { Intro: false, Strophe: 'whole', Refrain: 'root4', Solo: 'root4' }),
      bandOf('keys', 'arp', 62, -15, 35, { Refrain: 'whole', Solo: 'whole' }),
      bandOf('pad', 'whole', 52, 0, 45, { Intro: false, Strophe: false }),
      bandOf('organ', 'swell', 45, 20, 25, { Intro: false, Strophe: false, Refrain: 'swell', Solo: 'swell', Outro: false }),
    ],
  },
  {
    id: 'sunset-party', title: 'Sunset Strip Party', style: 'Party-Hard-Rock', tag: 'Hard Rock', artists: ['Van Halen', "Guns N' Roses"],
    key: 'E-Dur', bpm: 132, hue: 320,
    tip: 'Alles Power Chords (E5, D5, A5 …). Mit dem Handballen leicht abdämpfen, Achtel durchschlagen.',
    form: SONG_FORM,
    sections: { Intro: 'E5*2 D5 A5', Strophe: 'E5*2 D5 A5 E5*2 D5 B5', Refrain: 'A5 B5 E5*2 A5 B5 E5*2', Solo: 'E5 G5 D5 A5 E5 G5 A5 B5', Outro: 'E5*2 D5 A5' },
    band: [
      bandOf('drums', 'drive', 80, 0, 10, { Intro: 'rock', Strophe: 'rock', Outro: 'drive' }),
      bandOf('bass', 'root8', 80, 0, 0),
      bandOf('organ', 'stabs', 48, 20, 20, { Intro: false, Strophe: false, Solo: false }),
      bandOf('perc', 'cow', 42, -25, 8, { Intro: false, Strophe: false, Solo: false, Outro: false }),
    ],
  },
  {
    id: 'rust-highway', title: 'Rust Highway', style: 'Folk-Rock mit Biss', tag: 'Folk- & Deutschrock', artists: ['Neil Young', 'Rory Gallagher'],
    key: 'G-Dur', bpm: 112, hue: 40,
    tip: 'Offene Akkorde G, C, D. Roh und kräftig anschlagen, ruhig etwas schmutzig – Crunch, nicht zu sauber.',
    form: SONG_FORM,
    sections: { Intro: 'G*2 C D', Strophe: 'G C G D G C D G', Refrain: 'C G D Em C G D*2', Solo: 'G C D G C D G*2', Outro: 'G C D G' },
    band: [
      bandOf('drums', 'rock', 78, 0, 12, { Intro: false, Strophe: 'half', Refrain: 'rock' }),
      bandOf('bass', 'root4', 76, 0, 0, { Intro: false, Refrain: 'root8' }),
      bandOf('organ', 'whole', 55, 20, 25, { Intro: false, Strophe: 'half', Refrain: 'whole' }),
      bandOf('keys', 'quarters', 50, -20, 25, { Intro: false, Strophe: false, Solo: false }),
      bandOf('perc', 'tamb', 55, -25, 10, { Intro: false, Strophe: false }),
    ],
  },
  {
    id: 'midnight-wave', title: 'Midnight Wave', style: 'Synth-Rock', tag: 'Prog & Synth', artists: ['Genesis', 'Fleetwood Mac'],
    key: 'A-Moll', bpm: 128, hue: 190,
    tip: 'Sparsam spielen: kurze, saubere Akkorde oder einzelne Töne. Viel Platz für die Synths.',
    form: SONG_FORM,
    sections: { Intro: 'Am F C G', Strophe: 'Am F C G Am F C G', Refrain: 'F C G Am F C G Am', Solo: 'Am F C G Am F C G', Outro: 'Am F C G' },
    band: [
      bandOf('drums', 'rock', 76, 0, 15, { Intro: false, Strophe: 'rock', Refrain: 'drive' }),
      bandOf('bass', 'root8', 78, 0, 0, { Intro: false }),
      bandOf('arp', 'up16', 52, 25, 35, { Refrain: 'updown8' }),
      bandOf('pad', 'whole', 44, 0, 45, { Strophe: false, Solo: false }),
      bandOf('perc', 'shaker16', 45, -25, 10, { Intro: false, Outro: false }),
    ],
  },
  {
    id: 'highway-boogie', title: 'Highway Boogie', style: 'Hard-Rock-Boogie', tag: 'Blues & Boogie', artists: ['Nazareth', 'Rory Gallagher'],
    key: 'A-Dur', bpm: 126, hue: 10,
    tip: '12-Takt-Blues in A. Rhythmus-Riff auf der A-Saite (Bund 0/2/4) mit Shuffle-Gefühl.',
    form: ['Intro', 'Strophe', 'Strophe', 'Solo', 'Strophe', 'Outro'],
    sections: { Intro: 'A*2', Strophe: 'A*4 D*2 A*2 E D A*2', Solo: 'A*4 D*2 A*2 E D A E', Outro: 'A*2 E A' },
    band: [
      bandOf('drums', 'shuffle', 80, 0, 10, { Intro: false }),
      bandOf('bass', 'boogie', 80, 0, 0, { Intro: false }),
      bandOf('organ', 'half', 45, 20, 20, { Intro: false, Strophe: false, Outro: false }),
      bandOf('perc', 'tamb', 48, -25, 10, { Intro: false, Strophe: false }),
    ],
  },
  {
    id: 'schwarzer-asphalt', title: 'Schwarzer Asphalt', style: 'Heavy Rock', tag: 'Hard Rock', artists: ['Black Sabbath', 'Uriah Heep'],
    key: 'E-Moll', bpm: 120, hue: 0,
    tip: 'Riff in E-Moll mit tiefen Saiten, Refrain mit offenen Akkorden. Im Solo E-Moll-Pentatonik.',
    form: SONG_FORM,
    sections: { Intro: 'Em*2 C D', Strophe: 'Em*2 C D Em*2 G A', Refrain: 'G D Em C G D Em*2', Solo: 'Em*2 C D Em*2 G A', Outro: 'Em*2 C D' },
    band: [
      bandOf('drums', 'drive', 82, 0, 10, { Intro: 'rock', Strophe: 'rock' }),
      bandOf('bass', 'root8', 80, 0, 0, { Intro: 'root4' }),
      bandOf('organ', 'swell', 46, 20, 25, { Intro: false, Strophe: 'whole', Solo: false }),
      bandOf('pad', 'whole', 38, 0, 40, { Intro: false, Strophe: false, Solo: false, Outro: false }),
    ],
  },
  {
    id: 'prime-time', title: 'Prime Time Radio', style: 'Soft- & AOR-Rock', tag: 'Stadion & Arena', artists: ['Fleetwood Mac', 'Foreigner'],
    key: 'A-Dur', bpm: 124, hue: 45,
    tip: 'Saubere, glatte Akkorde mit leichtem Crunch. Der Refrain lebt von Keyboard und Gesang – schön sauber bleiben.',
    form: SONG_FORM,
    sections: { Intro: 'A E F#m D', Strophe: 'A E F#m D A E D*2', Refrain: 'D A E F#m D A E*2', Solo: 'F#m D A E F#m D E*2', Outro: 'D A E A' },
    band: [
      bandOf('drums', 'rock', 76, 0, 12, { Intro: false, Strophe: 'half' }),
      bandOf('bass', 'root8', 76, 0, 0, { Intro: false, Strophe: 'root4' }),
      bandOf('keys', 'comp', 60, -20, 25, { Intro: 'whole', Strophe: 'offbeat' }),
      bandOf('pad', 'whole', 46, 0, 40, { Intro: false, Strophe: false }),
      bandOf('arp', 'updown8', 44, 25, 30, { Intro: false, Strophe: false, Solo: false }),
      bandOf('perc', 'tamb', 48, -25, 10, { Intro: false, Strophe: false }),
    ],
  },
  {
    id: 'glaeserne-nacht', title: 'Gläserne Nacht', style: 'Space-Rock', tag: 'Prog & Synth', artists: ['Pink Floyd', 'Genesis'],
    key: 'D-Moll', bpm: 100, hue: 265,
    tip: 'Mit Hall und leichtem Delay denken: wenige, klingende Töne oder weite Akkorde statt dichter Rhythmusgitarre.',
    form: SONG_FORM,
    sections: { Intro: 'Dm Bb F C', Strophe: 'Dm Bb F C Dm Bb C*2', Refrain: 'Bb F C Dm Bb F C*2', Solo: 'Dm Bb F C Dm Bb F C', Outro: 'Dm Bb F C' },
    band: [
      bandOf('drums', 'half', 74, 0, 20, { Intro: false, Refrain: 'rock' }),
      bandOf('bass', 'root8', 76, 0, 0, { Intro: false, Strophe: 'root4' }),
      bandOf('pad', 'whole', 54, 0, 55),
      bandOf('arp', 'octave8', 48, 25, 40, { Intro: 'up16', Refrain: 'updown8', Outro: 'up16' }),
      bandOf('organ', 'swell', 40, 20, 35, { Intro: false, Strophe: false, Solo: false, Outro: false }),
    ],
  },
  {
    id: 'stadium-stomp', title: 'Stadium Stomp', style: 'Stadion-Hymne', tag: 'Stadion & Arena', artists: ['Foreigner', 'Van Halen'],
    key: 'E-Dur', bpm: 100, hue: 55,
    tip: 'Langsames Stampfen: Power Chords auf Zählzeit 1 und 3, alle singen mit. Im Halbtakt-Groove viel Platz lassen.',
    form: SONG_FORM,
    sections: { Intro: 'E5*2 G5 A5', Strophe: 'E5*2 G5 A5 E5*2 G5 B5', Refrain: 'C5 G5 D5 E5 C5 G5 D5*2', Solo: 'E5*2 G5 A5 E5*2 G5 B5', Outro: 'E5*2 G5 A5' },
    band: [
      bandOf('drums', 'half', 82, 0, 15, { Refrain: 'drive' }),
      bandOf('bass', 'root4', 78, 0, 0, { Refrain: 'root8' }),
      bandOf('organ', 'whole', 50, 20, 25, { Intro: false, Strophe: false }),
      bandOf('perc', 'cow', 40, -25, 8, { Intro: false, Strophe: false, Solo: false, Outro: false }),
      bandOf('pad', 'whole', 40, 0, 40, { Intro: false, Strophe: false, Solo: false }),
    ],
  },
  {
    id: 'ace-of-speed', title: 'Ace of Speed', style: 'Speed-Rock', tag: 'Hard Rock', artists: ['Motörhead', 'Van Halen'],
    key: 'E-Dur', bpm: 156, hue: 5,
    tip: 'Gnadenlos durchgehende Achtel, nur Power Chords, Plektrum im Wechselschlag. Gain hoch, Bass ruhig laut lassen.',
    form: SONG_FORM,
    sections: { Intro: 'E5*4', Strophe: 'E5*2 D5 A5 E5*2 D5 A5', Refrain: 'A5 D5 E5*2 A5 D5 E5*2', Solo: 'E5*2 D5 A5 E5*2 D5 B5', Outro: 'E5*2 D5 E5' },
    band: [
      bandOf('drums', 'drive', 86, 0, 8),
      bandOf('bass', 'root8', 86, 0, 0, { Intro: 'root4' }),
    ],
  },
  {
    id: 'doom-machine', title: 'Doom Machine', style: 'Doom / Heavy', tag: 'Heavy & Doom', artists: ['Black Sabbath', 'Led Zeppelin'],
    key: 'E-Moll (Tritonus)', bpm: 72, hue: 280,
    tip: 'Langsam und schwer: E5 → B♭5 (Tritonus) mit viel Gain, Töne lang klingen lassen. Der Bass trägt, die Gitarre ist die Wand.',
    form: SONG_FORM,
    sections: { Intro: 'E5*2 Bb5*2', Strophe: 'E5*2 Bb5*2 E5*2 G5 A5', Refrain: 'G5 A5 E5*2 G5 A5 Bb5*2', Solo: 'E5*2 Bb5*2 E5*2 G5 A5', Outro: 'E5*2 Bb5*2' },
    band: [
      bandOf('drums', 'half', 82, 0, 18, { Intro: false, Refrain: 'half' }),
      bandOf('bass', 'whole', 84, 0, 0, { Strophe: 'root4', Refrain: 'root4' }),
      bandOf('organ', 'swell', 38, 20, 35, { Intro: false, Strophe: false, Solo: false }),
    ],
  },
  {
    id: 'blues-hammer', title: 'Blues Hammer', style: 'Heavy Blues', tag: 'Blues & Boogie', artists: ['Led Zeppelin', 'Rory Gallagher'],
    key: 'E-Blues', bpm: 92, hue: 30,
    tip: '12-Takt-Blues in E: dicker Riff-Sound, Pausen sind wichtig. Im Solo E-Moll-Pentatonik mit Blue Note.',
    form: ['Intro', 'Strophe', 'Strophe', 'Solo', 'Strophe', 'Outro'],
    sections: { Intro: 'E7*2', Strophe: 'E7*4 A7*2 E7*2 B7 A7 E7*2', Solo: 'E7*4 A7*2 E7*2 B7 A7 E7 B7', Outro: 'E7*2' },
    band: [
      bandOf('drums', 'half', 82, 0, 18, { Intro: false, Solo: 'shuffle' }),
      bandOf('bass', 'walk', 80, 0, 0, { Intro: false }),
      bandOf('organ', 'half', 42, 20, 28, { Intro: false, Strophe: false, Outro: false }),
    ],
  },
  {
    id: 'prog-throne', title: 'Prog Throne', style: 'Orgel-Hardrock', tag: 'Prog & Synth', artists: ['Uriah Heep', 'Pink Floyd'],
    key: 'D-Moll', bpm: 116, hue: 300,
    tip: 'Die Orgel führt, die Gitarre setzt Akzente und Riffs dazwischen. Im Solo mit Wah und Sustain.',
    form: SONG_FORM,
    sections: { Intro: 'Dm*2 Bb C', Strophe: 'Dm Bb C Dm Gm Bb C Dm', Refrain: 'Bb C Dm Gm Bb C Dm*2', Solo: 'Dm Bb C Dm Gm Bb C A', Outro: 'Dm*2 Bb C' },
    band: [
      bandOf('drums', 'rock', 78, 0, 14, { Intro: false, Refrain: 'drive' }),
      bandOf('bass', 'root8', 78, 0, 0, { Intro: 'root4' }),
      bandOf('organ', 'half', 64, 20, 28, { Intro: 'whole', Refrain: 'stabs', Solo: 'swell' }),
      bandOf('pad', 'whole', 34, 0, 40, { Intro: false, Strophe: false, Solo: false }),
    ],
  },
  {
    id: 'kneipenrock', title: 'Kneipenrock', style: 'Deutschrock', tag: 'Folk- & Deutschrock', artists: ['Westernhagen', 'Herbert Grönemeyer'],
    key: 'E-Dur', bpm: 118, hue: 90,
    tip: 'Offene Akkorde E, A, H (B-Dur) mit kräftigem Anschlag – die Orgel und das Tamburin machen die Kneipenstimmung.',
    form: SONG_FORM,
    sections: { Intro: 'E*2 A B', Strophe: 'E A E B E A B E', Refrain: 'A E B E A E B*2', Solo: 'E A E B A E B E', Outro: 'E A B E' },
    band: [
      bandOf('drums', 'rock', 78, 0, 12, { Intro: false, Strophe: 'half' }),
      bandOf('bass', 'root4', 78, 0, 0, { Intro: false, Refrain: 'root8' }),
      bandOf('organ', 'half', 56, 20, 25, { Intro: 'whole', Strophe: 'whole', Refrain: 'stabs' }),
      bandOf('keys', 'quarters', 46, -20, 25, { Intro: false, Strophe: false, Solo: false }),
      bandOf('perc', 'tamb', 52, -25, 10, { Intro: false, Strophe: false }),
    ],
  },
];

/** Songstruktur -> Takte mit Abschnittsname; liefert { chords, bars, text } */
function songBars(song) {
  const bars = [];
  const textParts = [];
  song.form.forEach((name, idx) => {
    const { chords } = parseChords(song.sections[name]);
    expandBars(chords).forEach((c, i) => bars.push({ ...c, sec: name, secIdx: idx, secStart: i === 0 }));
    textParts.push(song.sections[name]);
  });
  return { bars: bars.slice(0, 96), text: textParts.join(' | ') };
}
