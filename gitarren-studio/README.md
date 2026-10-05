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
* **Studio**: Eine Backing-Band zum Mitspielen und Mixen (siehe unten).
* **80er Songs**: 15 Jam-Tracks mit Strophe, Refrain, Solo und Outro – mit Regler für Geschwindigkeit und Lautstärke jedes Instruments.

## Starten

1. Kabel an die Gitarre und den USB-Port des PCs.
2. `index.html` im **Chrome** oder **Edge** öffnen (Doppelklick genügt).
3. Auf **„▶ Audio starten“** klicken und den Zugriff erlauben. Das Kabel wird (meist) automatisch
   als Eingang gewählt, sonst oben im Menü „Eingang“ auswählen.
4. **Kopfhörer aufsetzen** – mit Lautsprechern gibt es Rückkopplung.

Alternativ per kleinem Server: `python3 -m http.server 8000` im Ordner und `http://localhost:8000` öffnen.

## Studio

Im Tab **Studio** baust du dir eine Band und mischst sie zusammen mit deiner Gitarre.

* **Akkordfolge** wählen (12-Takt-Blues, Rock I–IV–V, Power-Rock, Ballade …) oder selbst tippen:
  `Am G*2 F/C D5 Em7` (ein Akkord = ein Takt, `*4` = vier Takte, `/C` = Basston).
* **Instrumente hinzufügen** (alle werden im Browser erzeugt): Schlagzeug, E-Bass, E-Piano, Orgel, Streicher-Pad,
  Synth-Arpeggio, Percussion. Jedes hat mehrere Spielweisen (z. B. Rock, Shuffle, Walking Bass, Boogie, Offbeat …)
  und kann mehrfach hinzugefügt werden.
* **Mixer**: pro Kanal Fader, Pan, Hall-Send, Mute und Solo, dazu Pegelanzeige und Master.
  Deine Live-Gitarre hat einen eigenen Kanal (ihr Sound kommt aus dem Verstärker-Tab).
* **Aufnehmen**: Das Studio zählt einen Takt ein und nimmt deine Gitarre einen Durchlauf lang auf.
  Der Take läuft ab der nächsten Runde im Loop mit; du kannst weitere Takes übereinander legen.
  Läuft ein Take neben dem Beat, stelle am Kanal den **Versatz** nach (Latenz-Ausgleich).
  Das Tempo ist gesperrt, solange Takes existieren.
* **Mixdown**: „Als WAV speichern“ rendert Band und Takes (ohne Live-Gitarre) zu einer Datei.

## 80er Songs

Im Tab **80er Songs** liegen 15 Jam-Tracks (Arena-Rock, Power-Ballade, Party-Hard-Rock, Folk-Rock, Synth-Rock, Boogie,
Heavy Rock, Speed-Rock, Doom, Heavy Blues, Orgel-Hardrock, Space-Rock, Deutschrock …). Ein Klick auf **„Laden & spielen“**
öffnet den Song im Studio:

* **Geschwindigkeit**: Regler 50–130 % (die BPM stehen daneben).
* **Lautstärke pro Instrument**: Fader im Mixer, dazu M (stumm) und S (solo). Beispiel: Schlagzeug leise = du übernimmst den Beat.
* Jeder Song hat Abschnitte (Intro, Strophe, Refrain, Solo, Outro), in denen die Instrumente anders spielen oder pausieren.
* **Mein Geschmack**: Die Bandliste (Led Zeppelin, Pink Floyd, Van Halen, Motörhead, Uriah Heep, Foreigner, Nazareth, Guns N' Roses,
  Black Sabbath, Genesis, Rory Gallagher, Neil Young, Fleetwood Mac, Westernhagen) bestimmt die Reihenfolge der Karten.
  Du kannst sie ändern. Die Bandnamen verlinken auf YouTube Music.

Wichtig: Das sind **frei komponierte Begleitungen „im Stil von“**, keine Originalaufnahmen und keine Nachbauten bestimmter Songs
(Riffs und Melodien sind urheberrechtlich geschützt, und aus YouTube-Aufnahmen lassen sich keine einzelnen Instrumente herausregeln).
Das Programm hat keinen Zugriff auf dein YouTube-Music-Konto.

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
