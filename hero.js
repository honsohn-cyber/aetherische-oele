/**
 * Generiert ein passendes Titelbild (Hero-Grafik) je Öl-Artikelseite –
 * als selbst gezeichnetes Inline-SVG statt externer Bilddateien. So gibt
 * es garantiert kein kaputtes Bild und keine Internetabhängigkeit.
 *
 * Farbe und Motiv richten sich nach der Pflanzenfamilie (z. B. lila
 * Blütenähre für Lippenblütler wie Lavendel, orange Zitrusscheibe für
 * Rautengewächse, grüner Nadelzweig für Kieferngewächse). Position,
 * Drehung und Anzahl der Motiv-Wiederholungen werden aus dem Namen des
 * Öls deterministisch "zufällig" erzeugt, damit jedes Öl trotz gleicher
 * Familie ein eigenes, aber stabiles Bild bekommt.
 */

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --- Grund-Motive: einfache, abstrakte botanische Formen --- */

function svgFlowerSpike(p) {
  const budCount = p.budCount || 6;
  const spacing = 15;
  let buds = "";
  for (let i = 0; i < budCount; i++) {
    const y = -i * spacing;
    const side = i % 2 === 0 ? -1 : 1;
    buds += '<circle cx="' + side * 6.5 + '" cy="' + y + '" r="6" fill="' + p.color + '" />';
  }
  return (
    '<g transform="translate(' + p.cx + "," + p.cy + ") rotate(" + p.rot + ") scale(" + p.scale + ')">' +
    '<line x1="0" y1="10" x2="0" y2="' + -budCount * spacing + '" stroke="' + p.color + '" stroke-width="2.5" stroke-linecap="round" />' +
    buds +
    "</g>"
  );
}

function svgPetalFlower(p) {
  const petals = p.petals || 8;
  const petalLen = p.petalLen || 18;
  const petalW = p.petalW || 7;
  let petalsMarkup = "";
  for (let i = 0; i < petals; i++) {
    const angle = (360 / petals) * i;
    petalsMarkup +=
      '<ellipse cx="0" cy="' + -petalLen * 0.6 + '" rx="' + petalW + '" ry="' + petalLen +
      '" fill="' + p.color + '" transform="rotate(' + angle + ')" />';
  }
  return (
    '<g transform="translate(' + p.cx + "," + p.cy + ") rotate(" + p.rot + ") scale(" + p.scale + ')">' +
    petalsMarkup +
    '<circle cx="0" cy="0" r="' + petalW * 1.15 + '" fill="' + p.color + '" />' +
    "</g>"
  );
}

function svgLeafBranch(p) {
  const pairs = p.pairs || 4;
  const spacing = p.spacing || 18;
  const leafLen = p.leafLen || 20;
  const leafW = p.leafW || 7;
  const stemLen = pairs * spacing;
  let parts =
    '<line x1="0" y1="6" x2="0" y2="' + -stemLen + '" stroke="' + p.color + '" stroke-width="2" stroke-linecap="round" />';
  for (let i = 1; i <= pairs; i++) {
    const y = -i * spacing;
    if (p.needle) {
      parts +=
        '<line x1="0" y1="' + y + '" x2="' + -leafLen + '" y2="' + (y - leafLen * 0.4) +
        '" stroke="' + p.color + '" stroke-width="1.6" stroke-linecap="round" />';
      parts +=
        '<line x1="0" y1="' + y + '" x2="' + leafLen + '" y2="' + (y - leafLen * 0.4) +
        '" stroke="' + p.color + '" stroke-width="1.6" stroke-linecap="round" />';
    } else {
      parts +=
        '<ellipse cx="' + -leafLen * 0.55 + '" cy="' + y + '" rx="' + leafLen * 0.55 + '" ry="' + leafW +
        '" fill="' + p.color + '" transform="rotate(-28 ' + -leafLen * 0.55 + " " + y + ')" />';
      parts +=
        '<ellipse cx="' + leafLen * 0.55 + '" cy="' + y + '" rx="' + leafLen * 0.55 + '" ry="' + leafW +
        '" fill="' + p.color + '" transform="rotate(28 ' + leafLen * 0.55 + " " + y + ')" />';
    }
  }
  return '<g transform="translate(' + p.cx + "," + p.cy + ") rotate(" + p.rot + ") scale(" + p.scale + ')">' + parts + "</g>";
}

function svgRadialSlice(p) {
  const radius = p.radius || 24;
  const segments = p.segments || 10;
  let lines = "";
  for (let i = 0; i < segments; i++) {
    const angle = (360 / segments) * i;
    const rad = (angle * Math.PI) / 180;
    const x2 = Math.sin(rad) * radius;
    const y2 = -Math.cos(rad) * radius;
    if (p.dots) {
      lines += '<line x1="0" y1="0" x2="' + x2 * 0.85 + '" y2="' + y2 * 0.85 + '" stroke="' + p.color + '" stroke-width="1.4" />';
      lines += '<circle cx="' + x2 + '" cy="' + y2 + '" r="3.5" fill="' + p.color + '" />';
    } else {
      lines += '<line x1="0" y1="0" x2="' + x2 + '" y2="' + y2 + '" stroke="' + p.color + '" stroke-width="1.6" />';
    }
  }
  const ring = p.dots ? "" : '<circle cx="0" cy="0" r="' + radius + '" fill="none" stroke="' + p.color + '" stroke-width="2" />';
  return (
    '<g transform="translate(' + p.cx + "," + p.cy + ") rotate(" + p.rot + ") scale(" + p.scale + ')">' +
    ring +
    lines +
    '<circle cx="0" cy="0" r="' + (p.dots ? 3 : radius * 0.18) + '" fill="' + p.color + '" />' +
    "</g>"
  );
}

function svgBlobCluster(p) {
  const leaf = p.withLeaf
    ? '<ellipse cx="10" cy="-24" rx="7" ry="17" fill="' + p.color + '" transform="rotate(20 10 -24)" />'
    : "";
  return (
    '<g transform="translate(' + p.cx + "," + p.cy + ") rotate(" + p.rot + ") scale(" + p.scale + ')">' +
    '<ellipse cx="-10" cy="0" rx="16" ry="12" fill="' + p.color + '" />' +
    '<ellipse cx="8" cy="6" rx="13" ry="10" fill="' + p.color + '" opacity="0.85" />' +
    '<ellipse cx="2" cy="-8" rx="11" ry="9" fill="' + p.color + '" opacity="0.85" />' +
    leaf +
    "</g>"
  );
}

function svgTeardrop(p) {
  return (
    '<g transform="translate(' + p.cx + "," + p.cy + ") rotate(" + p.rot + ") scale(" + p.scale + ')">' +
    '<path d="M0,-20 C11,-4 11,12 0,20 C-11,12 -11,-4 0,-20 Z" fill="' + p.color + '" />' +
    "</g>"
  );
}

function svgTree(p) {
  return (
    '<g transform="translate(' + p.cx + "," + p.cy + ") rotate(" + p.rot + ") scale(" + p.scale + ')">' +
    '<rect x="-3" y="0" width="6" height="18" fill="' + p.color + '" />' +
    '<circle cx="0" cy="-12" r="17" fill="' + p.color + '" opacity="0.9" />' +
    '<circle cx="-12" cy="-4" r="11" fill="' + p.color + '" opacity="0.75" />' +
    '<circle cx="12" cy="-4" r="11" fill="' + p.color + '" opacity="0.75" />' +
    "</g>"
  );
}

/** Farb- und Motiv-Thema je Pflanzenfamilie. */
const FAMILY_THEME = {
  "Lippenblütler": { from: "#8b6fb3", to: "#4f3572", motif: (p) => svgFlowerSpike({ ...p, budCount: 6 }) },
  "Rautengewächse": { from: "#f6a94a", to: "#d9701f", motif: (p) => svgRadialSlice({ ...p, radius: 26, segments: 10 }) },
  "Myrtengewächse": { from: "#4f9c8c", to: "#276456", motif: (p) => svgLeafBranch({ ...p, pairs: 3, spacing: 20, leafLen: 22, leafW: 8 }) },
  "Korbblütler": { from: "#f0cd6a", to: "#cf9a2c", motif: (p) => svgPetalFlower({ ...p, petals: 10, petalLen: 20, petalW: 6 }) },
  "Kieferngewächse": { from: "#4a7a5c", to: "#254a34", motif: (p) => svgLeafBranch({ ...p, pairs: 5, spacing: 14, leafLen: 20, needle: true }) },
  "Zypressengewächse": { from: "#4a7a72", to: "#25504a", motif: (p) => svgLeafBranch({ ...p, pairs: 6, spacing: 11, leafLen: 14, needle: true }) },
  "Süßgräser": { from: "#a8c86b", to: "#71962f", motif: (p) => svgLeafBranch({ ...p, pairs: 2, spacing: 4, leafLen: 34, leafW: 4 }) },
  "Ingwergewächse": { from: "#d99a53", to: "#a0611f", motif: (p) => svgBlobCluster({ ...p, withLeaf: true }) },
  "Doldenblütler": { from: "#c7d17a", to: "#8a9a3a", motif: (p) => svgRadialSlice({ ...p, radius: 22, segments: 12, dots: true }) },
  "Balsambaumgewächse": { from: "#c98a5e", to: "#8f5127", motif: (p) => svgTeardrop(p) },
  "Rosengewächse": { from: "#e8a0b4", to: "#b95f7f", motif: (p) => svgPetalFlower({ ...p, petals: 8, petalLen: 18, petalW: 9 }) },
  "Sandelholzgewächse": { from: "#c9a06a", to: "#8a6a3f", motif: (p) => svgTree(p) },
  "Storchschnabelgewächse": { from: "#d97fa0", to: "#a3436a", motif: (p) => svgPetalFlower({ ...p, petals: 5, petalLen: 22, petalW: 10 }) },
  "Annonengewächse": { from: "#e8c34a", to: "#b98a17", motif: (p) => svgPetalFlower({ ...p, petals: 6, petalLen: 28, petalW: 5 }) },
  "Muskatnussgewächse": { from: "#a85c3f", to: "#6e3520", motif: (p) => svgBlobCluster({ ...p, withLeaf: false }) },
  "Lorbeergewächse": { from: "#7a8a4a", to: "#4a5726", motif: (p) => svgLeafBranch({ ...p, pairs: 3, spacing: 22, leafLen: 18, leafW: 9 }) }
};

const DEFAULT_THEME = { from: "#8fa876", to: "#56704a", motif: (p) => svgLeafBranch({ ...p, pairs: 3, spacing: 18, leafLen: 20, leafW: 8 }) };

/** Erzeugt das Titelbild (Inline-SVG-Markup) für ein Öl. */
function generateHeroSVG(oil) {
  const theme = FAMILY_THEME[oil.familie] || DEFAULT_THEME;
  const rng = mulberry32(hashCode(oil.name));
  const w = 900;
  const h = 260;
  const angle = Math.round(20 + rng() * 50);
  const gradId = "grad-" + slugify(oil.name);

  let bokeh = "";
  for (let i = 0; i < 3; i++) {
    const r = 40 + rng() * 70;
    const x = rng() * w;
    const y = rng() * h;
    const op = (0.05 + rng() * 0.06).toFixed(2);
    bokeh += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + r.toFixed(0) + '" fill="#ffffff" opacity="' + op + '" />';
  }

  let motifs = "";
  const instanceCount = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < instanceCount; i++) {
    const cx = 40 + rng() * (w - 80);
    const cy = 60 + rng() * (h - 90);
    const scale = 0.7 + rng() * 1.1;
    const rot = Math.round(rng() * 360) - 180;
    const light = rng() > 0.35;
    const color = light
      ? "rgba(255,255,255," + (0.16 + rng() * 0.18).toFixed(2) + ")"
      : "rgba(20,15,10," + (0.1 + rng() * 0.1).toFixed(2) + ")";
    motifs += theme.motif({ cx, cy, scale, rot, color });
  }

  return (
    '<svg viewBox="0 0 ' + w + " " + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration zu ' +
    escapeHtml(oil.name) +
    ' (' + escapeHtml(oil.familie) + ')">' +
    "<defs><linearGradient id=\"" + gradId + "\" gradientTransform=\"rotate(" + angle + " 0.5 0.5)\">" +
    '<stop offset="0%" stop-color="' + theme.from + '" />' +
    '<stop offset="100%" stop-color="' + theme.to + '" />' +
    "</linearGradient></defs>" +
    '<rect width="' + w + '" height="' + h + '" fill="url(#' + gradId + ')" />' +
    bokeh +
    motifs +
    "</svg>"
  );
}
