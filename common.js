/**
 * Gemeinsame Hilfsfunktionen für die Suchseite, Öl-Artikel und
 * Anwendungs-/Eigenschaften-Übersichtsseiten. Wird auf allen Seiten
 * nach data.js eingebunden.
 */

/** Wandelt einen deutschen Namen/Begriff in einen URL-freundlichen Slug um. */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Entfernt eine Endung wie "öl"/"-öl"/"öle" für flexiblere Ölsuche ("Lavendelöl" -> "Lavendel"). */
function stripOelSuffix(query) {
  return query.replace(/\s*-?\s*öle?$/i, "").trim();
}

function findOilBySlug(slug) {
  return OILS.find((oil) => slugify(oil.name) === slug) || null;
}

/** typ: "eigenschaften" | "anwendung" */
function getAllTags(typ) {
  const set = new Set();
  OILS.forEach((oil) => oil[typ].forEach((t) => set.add(t)));
  return Array.from(set)
    .sort((a, b) => a.localeCompare(b, "de"))
    .map((name) => ({ name, slug: slugify(name), typ }));
}

function findTagBySlug(typ, slug) {
  return getAllTags(typ).find((t) => t.slug === slug) || null;
}

function oilsForTag(typ, slug) {
  return OILS.filter((oil) => oil[typ].some((t) => slugify(t) === slug));
}

/** Öle, die mindestens ein Tag (Eigenschaft oder Anwendung) mit `oil` teilen, absteigend nach Überschneidung sortiert. */
function relatedOils(oil, limit) {
  const scored = OILS.filter((o) => o.name !== oil.name).map((o) => {
    const sharedEigenschaften = o.eigenschaften.filter((e) => oil.eigenschaften.includes(e)).length;
    const sharedAnwendung = o.anwendung.filter((a) => oil.anwendung.includes(a)).length;
    return { oil: o, score: sharedEigenschaften + sharedAnwendung };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.oil.name.localeCompare(b.oil.name, "de"))
    .slice(0, limit)
    .map((s) => s.oil);
}

function searchOils(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const qStripped = stripOelSuffix(q).toLowerCase();
  return OILS.filter((oil) => {
    const name = oil.name.toLowerCase();
    const bot = oil.botanisch.toLowerCase();
    return name.includes(q) || (qStripped && name.includes(qStripped)) || bot.includes(q);
  });
}

function searchTags(query, typ) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getAllTags(typ).filter((t) => t.name.toLowerCase().includes(q));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Kompakte Link-Karte für ein Öl, u. a. für Such-/Kategorieergebnisse. */
function oilCardHTML(oil, opts) {
  const options = opts || {};
  const previewTags = oil.anwendung.slice(0, 3);
  return (
    '<a class="card oil-link" href="oel.html?id=' +
    encodeURIComponent(slugify(oil.name)) +
    '">' +
    "<h3>" + escapeHtml(oil.name) + "</h3>" +
    '<div class="botanisch">' + escapeHtml(oil.botanisch) + " · " + escapeHtml(oil.familie) + "</div>" +
    (options.hideDescription ? "" : '<p class="beschreibung">' + escapeHtml(oil.beschreibung) + "</p>") +
    '<div class="tag-row">' +
    previewTags.map((t) => '<span class="tag tag-anwendung">' + escapeHtml(t) + "</span>").join("") +
    "</div>" +
    "</a>"
  );
}

/** Link-Chip zu einer Anwendungs-/Eigenschaften-Kategorieseite. */
function tagChipHTML(tag) {
  return (
    '<a class="chip" href="anwendung.html?typ=' +
    encodeURIComponent(tag.typ) +
    "&id=" +
    encodeURIComponent(tag.slug) +
    '">' +
    escapeHtml(tag.name) +
    "</a>"
  );
}

/**
 * Zusätzliche Erste-Hilfe-/Sicherheitshinweise für besonders sensible
 * Anwendungs-Kategorien (Wunden, Verbrennungen, Hautausschlag). Werden auf
 * der jeweiligen Kategorieseite als auffälliges Banner über den Ölen
 * angezeigt. Schlüssel = Slug der Anwendungs-Kategorie.
 */
const CATEGORY_SAFETY_NOTES = {
  "kleine-wunden-schuerfwunden": {
    title: "Erste Hilfe geht vor",
    text:
      "Wunde zuerst reinigen (klares Wasser, ggf. mildes Wunddesinfektionsmittel) und bei Bedarf steril abdecken. " +
      "Ätherische Öle nur stark verdünnt und nur auf bereits gereinigter, nicht mehr blutender, oberflächlicher Haut " +
      "ringsum bzw. auf verschorften Stellen anwenden – niemals unverdünnt und niemals direkt in eine offene, tiefe " +
      "oder stark blutende Wunde. Bei tiefen Wunden, Bisswunden, Anzeichen einer Entzündung (Rötung, Schwellung, " +
      "Eiter, Fieber), fehlendem Tetanusschutz oder wenn die Wunde nicht heilt: ärztliche Hilfe aufsuchen. " +
      "Ätherische Öle ersetzen keine notwendige Wundversorgung."
  },
  "verbrennungen-leicht": {
    title: "Erst kühlen, dann (wenn überhaupt) Öl",
    text:
      "Verbrennung sofort 10–20 Minuten mit kühlem (nicht eiskaltem) Wasser kühlen – das ist die wichtigste Maßnahme. " +
      "Ätherische Öle niemals auf eine frische, offene, nässende oder großflächige Verbrennung oder auf Brandblasen " +
      "auftragen. Traditionell genannte Öle wie Lavendel oder Immortelle werden – wenn überhaupt – frühestens nach " +
      "dem Kühlen, stark verdünnt und nur auf bereits abgekühlter, geschlossener Haut eingesetzt. Bei Verbrennungen " +
      "ab Grad 2, großflächigen Verbrennungen, Verbrennungen im Gesicht/an Gelenken/Genitalien, bei Kindern, oder " +
      "starken Schmerzen: sofort ärztliche/notärztliche Hilfe aufsuchen."
  },
  "hautausschlag-hautreizung": {
    title: "Erst testen, Ursache im Blick behalten",
    text:
      "Vor jeder Anwendung eine Verträglichkeitsprobe (Patch-Test) an einer kleinen, gesunden Hautstelle machen und " +
      "das Öl gut in einem neutralen Pflanzenöl verdünnen. Bei großflächigem, nässendem, sich ausbreitendem oder " +
      "nicht eindeutig zuordenbarem Ausschlag, bei Fieber, starkem Juckreiz, Anzeichen einer allergischen Reaktion " +
      "oder bei Säuglingen/Kleinkindern: ärztlichen Rat einholen, statt selbst zu behandeln."
  }
};

function categorySafetyNote(slug) {
  return CATEGORY_SAFETY_NOTES[slug] || null;
}
