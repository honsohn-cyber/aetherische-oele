(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("id") || "";
  let typ = params.get("typ") || "";

  const notFound = document.getElementById("not-found");
  const category = document.getElementById("category");

  // Falls kein/ein ungültiger typ-Parameter übergeben wurde, in beiden
  // Kategorien (Anwendung & Eigenschaft) nach dem Slug suchen.
  let tag = null;
  if (typ === "anwendung" || typ === "eigenschaften") {
    tag = findTagBySlug(typ, slug);
  }
  if (!tag) {
    tag = findTagBySlug("anwendung", slug) || findTagBySlug("eigenschaften", slug);
    if (tag) typ = tag.typ;
  }

  if (!tag) {
    notFound.hidden = false;
    category.hidden = true;
    return;
  }

  document.title = tag.name + " – Ätherische Öle";
  document.getElementById("page-title").textContent = document.title;

  document.getElementById("tag-name").textContent = tag.name;
  document.getElementById("tag-typ-label").textContent =
    typ === "anwendung" ? "Anwendungsbereich" : "Eigenschaft";

  const oils = oilsForTag(typ, slug).sort((a, b) => a.name.localeCompare(b.name, "de"));
  document.getElementById("tag-count").textContent =
    oils.length === 1 ? "1 passendes Öl" : oils.length + " passende Öle";
  document.getElementById("tag-oils-grid").innerHTML = oils.map((oil) => oilCardHTML(oil)).join("");

  const note = typ === "anwendung" ? categorySafetyNote(slug) : null;
  const safetyNote = document.getElementById("safety-note");
  if (note) {
    document.getElementById("safety-note-title").textContent = "⚠ " + note.title;
    document.getElementById("safety-note-text").textContent = note.text;
    safetyNote.hidden = false;
  } else {
    safetyNote.hidden = true;
  }

  category.hidden = false;
})();
