(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("id") || "";
  const oil = findOilBySlug(slug);

  const notFound = document.getElementById("not-found");
  const article = document.getElementById("article");

  if (!oil) {
    notFound.hidden = false;
    article.hidden = true;
    return;
  }

  document.title = oil.name + " – Ätherische Öle";
  document.getElementById("page-title").textContent = document.title;

  document.getElementById("oil-hero").innerHTML = generateHeroSVG(oil);

  document.getElementById("oil-name").textContent = oil.name;
  document.getElementById("oil-botanisch").textContent = oil.botanisch + " · " + oil.familie;
  document.getElementById("info-botanisch").textContent = oil.botanisch;
  document.getElementById("info-familie").textContent = oil.familie;
  document.getElementById("oil-beschreibung").textContent = oil.beschreibung;

  const hinweiseBox = document.getElementById("oil-hinweise");
  hinweiseBox.innerHTML = "<strong>Hinweis</strong>" + escapeHtml(oil.hinweise);

  const infoEigenschaften = document.getElementById("info-eigenschaften");
  oil.eigenschaften.forEach((name) => {
    infoEigenschaften.insertAdjacentHTML(
      "beforeend",
      tagChipHTML({ name, slug: slugify(name), typ: "eigenschaften" })
    );
  });

  const infoAnwendung = document.getElementById("info-anwendung");
  oil.anwendung.forEach((name) => {
    infoAnwendung.insertAdjacentHTML(
      "beforeend",
      tagChipHTML({ name, slug: slugify(name), typ: "anwendung" })
    );
  });

  const safetyNotesBox = document.getElementById("safety-notes");
  oil.anwendung
    .map((name) => categorySafetyNote(slugify(name)))
    .filter(Boolean)
    .forEach((note) => {
      safetyNotesBox.insertAdjacentHTML(
        "beforeend",
        '<div class="safety-note"><strong>⚠ ' +
          escapeHtml(note.title) +
          "</strong><p>" +
          escapeHtml(note.text) +
          "</p></div>"
      );
    });

  const related = relatedOils(oil, 6);
  const relatedSection = document.getElementById("related-section");
  const relatedGrid = document.getElementById("related-grid");
  if (related.length === 0) {
    relatedSection.hidden = true;
  } else {
    relatedGrid.innerHTML = related.map((o) => oilCardHTML(o, { hideDescription: true })).join("");
  }

  article.hidden = false;
})();
