(function () {
  "use strict";

  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("clear-btn");
  const searchResults = document.getElementById("search-results");
  const resultsOele = document.getElementById("results-oele");
  const resultsOeleGrid = document.getElementById("results-oele-grid");
  const resultsTags = document.getElementById("results-tags");
  const resultsTagsRow = document.getElementById("results-tags-row");
  const resultsEmpty = document.getElementById("results-empty");
  const browse = document.getElementById("browse");
  const anwendungChips = document.getElementById("anwendung-chips");
  const eigenschaftenChips = document.getElementById("eigenschaften-chips");
  const azList = document.getElementById("az-list");
  const azCount = document.getElementById("az-count");

  function renderBrowseSections() {
    getAllTags("anwendung").forEach((tag) => anwendungChips.insertAdjacentHTML("beforeend", tagChipHTML(tag)));
    getAllTags("eigenschaften").forEach((tag) => eigenschaftenChips.insertAdjacentHTML("beforeend", tagChipHTML(tag)));

    const sorted = OILS.slice().sort((a, b) => a.name.localeCompare(b.name, "de"));
    azCount.textContent = "(" + sorted.length + ")";
    sorted.forEach((oil) => {
      const li = document.createElement("li");
      li.innerHTML =
        '<a href="oel.html?id=' + encodeURIComponent(slugify(oil.name)) + '">' + escapeHtml(oil.name) + "</a>" +
        '<span class="botanisch-inline"> — ' + escapeHtml(oil.botanisch) + "</span>";
      azList.appendChild(li);
    });
  }

  function currentMatches(query) {
    const oilMatches = searchOils(query);
    const tagMatches = [...searchTags(query, "anwendung"), ...searchTags(query, "eigenschaften")];
    return { oilMatches, tagMatches };
  }

  function renderResults(query) {
    const { oilMatches, tagMatches } = currentMatches(query);

    resultsOeleGrid.innerHTML = oilMatches.map((oil) => oilCardHTML(oil)).join("");
    resultsOele.hidden = oilMatches.length === 0;

    resultsTagsRow.innerHTML = tagMatches.map((tag) => tagChipHTML(tag)).join("");
    resultsTags.hidden = tagMatches.length === 0;

    resultsEmpty.hidden = !(oilMatches.length === 0 && tagMatches.length === 0);
  }

  function updateView() {
    const query = searchInput.value.trim();
    clearBtn.classList.toggle("visible", query.length > 0);

    if (!query) {
      searchResults.hidden = true;
      browse.hidden = false;
      return;
    }

    browse.hidden = true;
    searchResults.hidden = false;
    renderResults(query);
  }

  searchInput.addEventListener("input", updateView);

  searchInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const query = searchInput.value.trim();
    if (!query) return;
    const { oilMatches, tagMatches } = currentMatches(query);

    if (oilMatches.length === 1) {
      window.location.href = "oel.html?id=" + encodeURIComponent(slugify(oilMatches[0].name));
    } else if (oilMatches.length === 0 && tagMatches.length === 1) {
      const tag = tagMatches[0];
      window.location.href =
        "anwendung.html?typ=" + encodeURIComponent(tag.typ) + "&id=" + encodeURIComponent(tag.slug);
    }
    // Bei mehreren Treffern bleibt die Ergebnisliste unterhalb sichtbar.
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    updateView();
  });

  renderBrowseSections();
  updateView();
})();
