# 🎸 Gitarren-Studio

Ein kostenloses Programm, das die E-Gitarre über das **Rocksmith Real Tone Cable** (oder jedes andere
USB-Gitarrenkabel / Audio-Interface) mit dem PC verbindet. Es läuft komplett im Browser – nichts zu installieren,
keine Konten, keine Kosten.

* **Verstärker**: 8 Sounds (Sauber, Blues, Crunch, Brit Rock, Classic Lead, Hi-Gain, Fuzz, Raum),
  vier Kanäle, Regler für Gain / Bass / Mitten / Höhen / Präsenz / Hall / Lautstärke,
  Noise-Gate, Boxen-Simulation und eigene Presets (werden im Browser gespeichert).
* **Stimmgerät**: chromatisch, mit Saitenanzeige. Stimmungen: Standard, Es, Drop D, D, DADGAD.
  Klick auf eine Saite spielt den Referenzton.
* **Lektionen**: Rocksmith-artiger Notenstrom. Das Programm hört deiner Gitarre zu und wertet,
  ob du die richtige Note zur richtigen Zeit spielst (Sterne, Trefferquote, Serie).
  Tempo-Regler, Wartemodus, Metronom, Wiederholen.
* **Eigene Tabs**: Füge eine ASCII-Tabulatur ein – sie wird wie eine Lektion abgespielt.

## Starten

1. Kabel an die Gitarre und den USB-Port des PCs.
2. `index.html` im **Chrome** oder **Edge** öffnen (Doppelklick genügt).
3. Auf **„▶ Audio starten“** klicken und den Zugriff erlauben. Das Kabel wird (meist) automatisch
   als Eingang gewählt, sonst oben im Menü „Eingang“ auswählen.
4. **Kopfhörer aufsetzen** – mit Lautsprechern gibt es Rückkopplung.

Alternativ per kleinem Server: `python3 -m http.server 8000` im Ordner und `http://localhost:8000` öffnen.

## Tipps

* Anzeige oben blinkt rot → *Eingang* herunterdrehen. Lektion erkennt nichts → *Eingang* hochdrehen.
* Im Browser liegt die Verzögerung typischerweise bei 30–50 ms (steht oben in der Statuszeile). Zum Üben reicht das,
  die Wertung hat deshalb ein großzügiges Zeitfenster. Nutze Kopfhörer am PC-Ausgang oder ein anderes Ausgabegerät
  (Auswahl „Ausgang“ oben, falls dein Browser es anbietet) – das Kabel selbst hat keinen Kopfhörerausgang.
* Das Kabel liefert ein Mono-Signal einer Gitarre. Läuft nichts, prüfe im Eingang-Menü, ob das Kabel gewählt ist.

## Wie die Wertung funktioniert

Das Programm erkennt Anschlag (plötzlicher Lautstärkeanstieg) und Tonhöhe (YIN-Algorithmus).
Ein Treffer = richtige Tonhöhe + frischer Anschlag im Zeitfenster der Note.
Bei Akkorden mit drei oder mehr Saiten (Strumming) wird vor allem der **Rhythmus** gewertet, weil die
Tonhöhe eines Akkords nicht eindeutig bestimmbar ist. Bei Power Chords zählt der Grundton oder die Quinte.

## Eigene Lektionen und Songs

Echte Song-Tabs sind urheberrechtlich geschützt, deshalb sind die mitgelieferten Lektionen **eigene Riffs „im Stil von“
Classic Rock** (Power Chords, Chuck-Berry-Rhythmus, Hard-Rock-Riff, Pentatonik-Solo, Balladen-Arpeggio …).
Tabs, die du selbst hast oder die frei verfügbar sind, kannst du unter **Lektionen → „Eigene Tabulatur einfügen“**
einfügen:

```
e|-----------------|
B|-----------------|
G|-----------------|
D|-----2-----------|
A|--0-----3-----10-|
E|-3-------------12|
```

* 6 Zeilen pro System, hohes **e** oben. Mehrere Systeme untereinander werden hintereinander gespielt.
* *Schritte/Schlag*: wie viele Zeichen pro Viertelnote (2 = jedes Zeichen ist eine Achtel).
* Techniken (h, p, b, ~ …) werden ignoriert, es zählen nur die Bundzahlen.

Weitere feste Lektionen: in `js/lessons.js` im Array `LESSON_DEFS` ergänzen
(Format: `ev(beat, dauer, [S(saite, bund)], 'Akkordname')`).

## Dateien

```
index.html      Oberfläche
style.css       Design
js/pitch.js     Tonhöhenerkennung (YIN), Noten, Stimmungen
js/audio.js     Verstärker-Simulation (Web Audio)
js/lessons.js   Lektionen und Tab-Import
js/app.js       Regler, Stimmgerät, Notenstrom und Wertung
```
