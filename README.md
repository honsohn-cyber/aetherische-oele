# Ätherische Öle – Nachschlagewerk

Eine kleine, statische "Wiki"-Seite für ätherische Öle: eine zentrale Suche,
Artikelseiten pro Öl und Kategorieseiten pro Anwendungsbereich/Eigenschaft –
ähnlich wie bei Wikipedia. Deckt klassische Wellness-Anwendungen (Schlaf,
Stress, Hautpflege …), den praktischen Einsatz im Haushalt (Reinigung,
Insektenschutz, Mottenschutz in der Wäsche …) sowie – mit deutlich
sichtbaren Erste-Hilfe-/Sicherheitshinweisen – die traditionelle Nutzung
bei kleinen Wunden, leichten Verbrennungen und Hautausschlag ab.

47 Öle sind aktuell erfasst.

### Sicherheitshinweise bei Wunden, Verbrennungen & Hautausschlag

Die Kategorien „Kleine Wunden & Schürfwunden“, „Verbrennungen (leicht)“ und
„Hautausschlag & Hautreizung“ zeigen auf ihrer Kategorieseite (und auf der
Artikelseite jedes betroffenen Öls) automatisch ein auffälliges
Erste-Hilfe-Banner (`categorySafetyNote()` in `common.js`), z. B. „bei
Verbrennungen zuerst kühlen“ oder „bei tiefen/entzündeten Wunden zum Arzt“.
Ziel ist es, traditionelles Hausmittel-Wissen abzubilden, ohne den
Eindruck zu erwecken, ätherische Öle seien ein Ersatz für Erste Hilfe oder
ärztliche Behandlung.

## Nutzung

Kein Build, kein Server nötig – einfach `index.html` im Browser öffnen:

```bash
open essential-oils/index.html      # macOS
xdg-open essential-oils/index.html  # Linux
start essential-oils/index.html     # Windows
```

Oder für die Entwicklung mit Live-Reload einen einfachen lokalen Server
starten, z. B. `npx http-server essential-oils`.

## Wie die Suche funktioniert

- **Ein Öl suchen** (z. B. „Lavendel“ oder „Lavendelöl“): Gibt es genau
  einen Treffer, springt <kbd>Enter</kbd> direkt zur Artikelseite des Öls
  (`oel.html?id=lavendel`) – wie ein Wikipedia-Artikel mit Steckbrief,
  Beschreibung, Sicherheitshinweisen und „Ähnlichen Ölen“.
- **Einen Anwendungsbereich suchen** (z. B. „Erkältung“ oder „Haushalt“):
  Gibt es genau einen eindeutigen Treffer, springt <kbd>Enter</kbd> zur
  Kategorieseite (`anwendung.html?typ=anwendung&id=erkaeltung-atemwege`),
  die alle passenden Öle auflistet.
- Bei mehreren möglichen Treffern (z. B. mehrdeutige Suchbegriffe) werden
  passende Öle und Kategorien direkt unterhalb der Suche als Ergebnisliste
  angezeigt – man muss nicht erst Enter drücken.
- Ohne Sucheingabe zeigt die Startseite Stöber-Bereiche: alle
  Anwendungsbereiche und Eigenschaften als klickbare Kategorien sowie eine
  alphabetische Liste aller Öle.

## Struktur

| Datei/Seite      | Zweck                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| `index.html`      | Startseite: Suche + Stöbern (Kategorien, A–Z-Liste)                   |
| `search.js`        | Such- und Navigationslogik der Startseite                            |
| `oel.html`         | Artikelseite-Vorlage für ein einzelnes Öl (liest `?id=<slug>`)        |
| `oel.js`           | Rendert Titelbild, Steckbrief, Beschreibung, Hinweise und „Ähnliche Öle“ |
| `hero.js`           | Generiert das Titelbild jeder Artikelseite als Inline-SVG            |
| `anwendung.html`   | Kategorieseite-Vorlage für einen Anwendungsbereich/eine Eigenschaft (liest `?typ=` & `?id=<slug>`) |
| `anwendung.js`     | Rendert alle Öle, die zu der Kategorie passen                        |
| `data.js`          | Datensatz aller Öle (`OILS`-Array)                                    |
| `common.js`        | Gemeinsame Hilfsfunktionen: Slugs, Suche, Kartenrendering             |
| `style.css`        | Layout & Design (hell/dunkel automatisch je nach Systemeinstellung)   |

Artikel- und Kategorieseiten sind Vorlagen, die ihren Inhalt anhand des
URL-Parameters `id` (bzw. `typ` + `id`) aus `data.js` rendern – es gibt also
keine 47 einzelnen HTML-Dateien, sondern zwei Vorlagen für beliebig viele
Öle/Kategorien.

## Titelbilder

Jede Artikelseite (`oel.html`) bekommt ein passendes Titelbild – statt eines
externen Fotos wird es als Inline-SVG direkt im Browser erzeugt
(`generateHeroSVG()` in `hero.js`). Farbe und Motiv richten sich nach der
Pflanzenfamilie (z. B. lila Blütenähre für Lippenblütler wie Lavendel,
orange Zitrusscheibe für Rautengewächse, grüner Nadelzweig für
Kieferngewächse, siehe `FAMILY_THEME`); Position, Drehung und Anzahl der
Motiv-Wiederholungen werden aus dem Namen des Öls deterministisch erzeugt,
sodass jedes Öl trotz gleicher Familie ein eigenes, aber stabiles Bild
bekommt. Vorteil gegenüber echten Fotos: keine Internetabhängigkeit, keine
kaputten Links, keine Lizenzfragen.

## Eigene Öle ergänzen

Neue Einträge einfach dem `OILS`-Array in `data.js` hinzufügen. Jeder
Eintrag braucht:

```js
{
  name: "…",
  botanisch: "…",
  familie: "…",
  eigenschaften: ["…", "…"],
  anwendung: ["…", "…"],
  beschreibung: "…",
  hinweise: "…"
}
```

Neue Werte in `eigenschaften` bzw. `anwendung` erscheinen automatisch als
neue Kategorien/Filter – es muss nichts weiter angepasst werden. Die
Artikel- und Kategorieseiten (URL-Slugs) werden automatisch aus dem Namen
erzeugt (`slugify()` in `common.js`).

## Hinweis

Die Inhalte beschreiben traditionelle/volkskundliche und
haushaltspraktische Nutzung ätherischer Öle und ersetzen keine
medizinische oder homöopathische Fachberatung.
