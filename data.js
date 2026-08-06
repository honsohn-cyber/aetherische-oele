/**
 * Datensatz für die Wiki-artige Öl-Seite (Suche, Artikel- und Kategorieseiten).
 *
 * Jeder Eintrag enthält:
 *  - name / botanisch: Bezeichnung
 *  - familie: Pflanzenfamilie (nur informativ)
 *  - eigenschaften: Wirk-Eigenschaften (Kategorie 1, z. B. "beruhigend")
 *  - anwendung: Anwendungsbereiche (Kategorie 2) – Wellness UND praktische
 *    Haushaltsanwendungen (z. B. "Haushalt & Reinigung", "Insektenschutz",
 *    "Wäsche & Textilien")
 *  - beschreibung: Kurztext
 *  - hinweise: Sicherheits-/Anwendungshinweise
 *
 * Hinweis: Diese Sammlung beschreibt traditionelle/volkskundliche und
 * haushaltspraktische Nutzung ätherischer Öle. Sie ersetzt keine
 * medizinische oder homöopathische Fachberatung und ist keine Anleitung
 * zur Selbstbehandlung von Krankheiten.
 */
const OILS = [
  {
    name: "Lavendel",
    botanisch: "Lavandula angustifolia",
    familie: "Lippenblütler",
    eigenschaften: ["beruhigend", "entspannend", "schmerzlindernd", "entzündungshemmend", "wundheilungsfördernd"],
    anwendung: [
      "Einschlafen & Schlaf",
      "Stress & Entspannung",
      "Hautpflege",
      "Kopfschmerzen",
      "Wäsche & Textilien",
      "Kleine Wunden & Schürfwunden",
      "Verbrennungen (leicht)",
      "Hautausschlag & Hautreizung"
    ],
    beschreibung: "Der Klassiker unter den ätherischen Ölen: blumig-krautig im Duft, wirkt ausgleichend auf Nerven und Gemüt. Ein paar Tropfen auf einem Duftsäckchen im Kleiderschrank halten zudem klassisch Motten fern. In der traditionellen Hausmittel-Praxis das mit am häufigsten genannte Öl bei kleinen, bereits abgekühlten Verbrennungen sowie zur Nachsorge kleiner, sauberer Hautverletzungen – dabei immer stark verdünnt und nie auf frischer/offener Wunde.",
    hinweise: "Sehr gut verträglich; für Diffusor, Bad oder verdünnt (2–3 %) auf der Haut geeignet. Bei Verbrennungen und Wunden erst die Erste-Hilfe-Maßnahmen befolgen (siehe Hinweiskasten auf den jeweiligen Kategorieseiten) – Lavendelöl allenfalls stark verdünnt und erst auf bereits abgekühlter, geschlossener bzw. sauberer Haut, nie auf offenen oder nässenden Stellen."
  },
  {
    name: "Pfefferminze",
    botanisch: "Mentha × piperita",
    familie: "Lippenblütler",
    eigenschaften: ["anregend", "kühlend", "schmerzlindernd", "krampflösend", "konzentrationsfördernd"],
    anwendung: ["Kopfschmerzen", "Konzentration & Fokus", "Verdauung", "Erkältung & Atemwege", "Insektenschutz"],
    beschreibung: "Frisch-mentholiger Duft, der klärt und wach macht. Klassisch bei Spannungskopfschmerz auf die Schläfen (verdünnt); ein paar Tropfen an Fensterbänken sollen zudem Ameisen fernhalten.",
    hinweise: "Nicht bei Kleinkindern und in der Schwangerschaft anwenden; nicht in Augennähe; stark verdünnen."
  },
  {
    name: "Teebaum",
    botanisch: "Melaleuca alternifolia",
    familie: "Myrtengewächse",
    eigenschaften: ["antibakteriell", "antiviral", "pilzhemmend", "hautklärend"],
    anwendung: [
      "Hautpflege",
      "Erkältung & Atemwege",
      "Haushalt & Reinigung",
      "Kleine Wunden & Schürfwunden",
      "Hautausschlag & Hautreizung"
    ],
    beschreibung: "Kräftig-medizinischer Duft mit ausgeprägter reinigender Wirkung. Beliebt bei unreiner Haut sowie – ein paar Tropfen im Putzwasser – gegen Schimmel und Gerüche in Bad und Waschmaschine. Traditionell auch punktuell (stark verdünnt) bei kleinen, bereits gereinigten Schürfwunden, Insektenstichen oder juckenden Hautstellen genutzt.",
    hinweise: "Punktuell stark verdünnt anwenden, kann bei empfindlicher Haut reizen; nicht großflächig und nicht unverdünnt nutzen. Nicht in offene/tiefe Wunden einbringen – nur auf bereits gereinigter, intakter Haut ringsum bzw. auf verschorften Stellen."
  },
  {
    name: "Eukalyptus",
    botanisch: "Eucalyptus globulus",
    familie: "Myrtengewächse",
    eigenschaften: ["schleimlösend", "antibakteriell", "kühlend"],
    anwendung: ["Erkältung & Atemwege", "Konzentration & Fokus"],
    beschreibung: "Camphrig-frischer Duft, der das Durchatmen erleichtert. Klassisch zur Inhalation oder im Diffusor bei Erkältung.",
    hinweise: "Nicht bei Asthma, Kleinkindern und Personen mit Krampfneigung anwenden; nicht direkt unter der Nase von Babys."
  },
  {
    name: "Zitroneneukalyptus",
    botanisch: "Eucalyptus citriodora",
    familie: "Myrtengewächse",
    eigenschaften: ["insektenabweisend", "erfrischend"],
    anwendung: ["Insektenschutz", "Raumbeduftung / Diffusor"],
    beschreibung: "Intensiv zitronig-frischer Duft; enthält viel Citronellal und gilt als eine der wirksamsten pflanzlichen Alternativen zu klassischen Mückenschutzmitteln für Terrasse und Garten.",
    hinweise: "Nicht bei Kleinkindern unter 6 Jahren anwenden; gut verdünnen, kann Haut reizen."
  },
  {
    name: "Zitrone",
    botanisch: "Citrus limon",
    familie: "Rautengewächse",
    eigenschaften: ["anregend", "stimmungsaufhellend", "antibakteriell"],
    anwendung: ["Konzentration & Fokus", "Raumbeduftung / Diffusor", "Verdauung", "Haushalt & Reinigung"],
    beschreibung: "Frisch-fruchtiger Duft, der belebt und die Stimmung hebt. Klassischer Bestandteil selbstgemachter Allzweckreiniger und Spülmittel wegen seiner fettlösenden, frischen Note.",
    hinweise: "Photosensibilisierend – nach Hautkontakt kein direktes Sonnenlicht; nur im Diffusor oder stark verdünnt verwenden."
  },
  {
    name: "Süßorange",
    botanisch: "Citrus sinensis",
    familie: "Rautengewächse",
    eigenschaften: ["stimmungsaufhellend", "entspannend", "anregend"],
    anwendung: ["Stress & Entspannung", "Raumbeduftung / Diffusor", "Haushalt & Reinigung"],
    beschreibung: "Warmer, fruchtig-süßer Duft, der Fröhlichkeit vermittelt. Mild genug, um auch in selbstgemachten Reinigern und zum Auffrischen von Mülleimern verwendet zu werden.",
    hinweise: "Milder als andere Zitrusöle, dennoch leicht photosensibilisierend – Hautkontakt vor Sonne meiden."
  },
  {
    name: "Rosmarin",
    botanisch: "Salvia rosmarinus",
    familie: "Lippenblütler",
    eigenschaften: ["anregend", "durchblutungsfördernd", "konzentrationsfördernd", "krampflösend"],
    anwendung: ["Konzentration & Fokus", "Muskelkater & Verspannung", "Verdauung"],
    beschreibung: "Kräftig-krautiger Duft, der die Durchblutung anregt. Beliebt bei Massageölen für die Muskulatur und zur mentalen Klarheit.",
    hinweise: "Nicht bei Epilepsie, Bluthochdruck oder in der Schwangerschaft anwenden."
  },
  {
    name: "Zimtrinde",
    botanisch: "Cinnamomum verum",
    familie: "Lorbeergewächse",
    eigenschaften: ["wärmend", "antibakteriell", "durchblutungsfördernd"],
    anwendung: ["Erkältung & Atemwege", "Muskelkater & Verspannung"],
    beschreibung: "Warm-würziger, intensiver Duft. Wird traditionell zur Unterstützung des Immunsystems in der kalten Jahreszeit eingesetzt.",
    hinweise: "Sehr hautreizend – ausschließlich stark verdünnt (unter 0,5 %) und niemals pur verwenden."
  },
  {
    name: "Gewürznelke",
    botanisch: "Syzygium aromaticum",
    familie: "Myrtengewächse",
    eigenschaften: ["antibakteriell", "schmerzlindernd", "wärmend"],
    anwendung: ["Mundpflege", "Erkältung & Atemwege", "Wäsche & Textilien", "Insektenschutz"],
    beschreibung: "Intensiv-würziger Duft mit betäubender Wirkung, traditionell bei Zahnschmerzen genutzt. Auf Duftsäckchen im Schrank hält Nelke klassisch Motten fern.",
    hinweise: "Stark hautreizend, nur sehr niedrig dosiert verwenden; nicht in der Schwangerschaft."
  },
  {
    name: "Ingwer",
    botanisch: "Zingiber officinale",
    familie: "Ingwergewächse",
    eigenschaften: ["wärmend", "verdauungsfördernd", "krampflösend"],
    anwendung: ["Verdauung", "Muskelkater & Verspannung"],
    beschreibung: "Scharf-würziger, wärmender Duft. Wird gerne bei Reiseübelkeit und zur Anregung der Verdauung eingesetzt.",
    hinweise: "Kann bei empfindlicher Haut wärmend bis reizend wirken – gut verdünnen."
  },
  {
    name: "Römische Kamille",
    botanisch: "Chamaemelum nobile",
    familie: "Korbblütler",
    eigenschaften: ["beruhigend", "entzündungshemmend", "krampflösend"],
    anwendung: ["Einschlafen & Schlaf", "Stress & Entspannung", "Hautpflege", "Hautausschlag & Hautreizung"],
    beschreibung: "Mild-apfelartiger, süßer Duft mit sehr sanfter, beruhigender Wirkung – auch für Kinder und empfindliche Haut geeignet. Gilt als eine der mildesten Optionen bei gereizter, juckender oder empfindlicher Haut.",
    hinweise: "Bei Korbblütler-Allergie (z. B. Kamille, Ringelblume) vorsichtig testen. Bei großflächigem, unklarem oder sich ausbreitendem Ausschlag sowie bei Kindern unter 2 Jahren vorab ärztlichen Rat einholen."
  },
  {
    name: "Echte Kamille (Blau)",
    botanisch: "Matricaria chamomilla",
    familie: "Korbblütler",
    eigenschaften: ["entzündungshemmend", "beruhigend", "hautklärend", "wundheilungsfördernd"],
    anwendung: ["Hautpflege", "Einschlafen & Schlaf", "Hautausschlag & Hautreizung", "Kleine Wunden & Schürfwunden"],
    beschreibung: "Intensiv-krautiger Duft mit tiefblauer Farbe durch den Inhaltsstoff Chamazulen. Stärker entzündungshemmend als die Römische Kamille, klassisch bei gereizter Haut, Ekzem-neigender Haut und zur Unterstützung der Hautberuhigung nach kleinen, bereits versorgten Verletzungen.",
    hinweise: "Bei Korbblütler-Allergie vorsichtig testen; kann Textilien blau färben. Nur stark verdünnt und nicht auf offenen Wunden anwenden; bei nässendem oder sich ausbreitendem Ausschlag ärztlichen Rat einholen."
  },
  {
    name: "Bergamotte",
    botanisch: "Citrus bergamia",
    familie: "Rautengewächse",
    eigenschaften: ["stimmungsaufhellend", "entspannend", "anregend"],
    anwendung: ["Stress & Entspannung", "Raumbeduftung / Diffusor"],
    beschreibung: "Fein-zitrisch mit blumiger Note, bekannt aus dem Earl-Grey-Tee. Wirkt ausgleichend bei Anspannung und trüber Stimmung.",
    hinweise: "Stark photosensibilisierend – nach Hautanwendung UV-Licht unbedingt meiden (bergaptenfreie Sorten sind unbedenklicher)."
  },
  {
    name: "Zedernholz",
    botanisch: "Cedrus atlantica",
    familie: "Kieferngewächse",
    eigenschaften: ["beruhigend", "erdend", "schleimlösend"],
    anwendung: ["Einschlafen & Schlaf", "Erkältung & Atemwege", "Raumbeduftung / Diffusor", "Wäsche & Textilien"],
    beschreibung: "Holzig-warmer, erdender Duft, der Geborgenheit vermittelt. Zedernholzringe oder -kugeln im Schrank sind ein traditioneller, natürlicher Mottenschutz.",
    hinweise: "Gut verträglich; nicht in der Schwangerschaft in hoher Dosierung."
  },
  {
    name: "Weihrauch",
    botanisch: "Boswellia carterii",
    familie: "Balsambaumgewächse",
    eigenschaften: ["beruhigend", "entzündungshemmend", "erdend"],
    anwendung: ["Stress & Entspannung", "Muskelkater & Verspannung", "Raumbeduftung / Diffusor"],
    beschreibung: "Harzig-warmer, meditativer Duft. Wird traditionell zur inneren Ruhe und Konzentration bei Meditation eingesetzt.",
    hinweise: "Sehr gut verträglich, für die meisten Anwendungen geeignet."
  },
  {
    name: "Myrrhe",
    botanisch: "Commiphora myrrha",
    familie: "Balsambaumgewächse",
    eigenschaften: ["entzündungshemmend", "erdend", "antibakteriell", "wundheilungsfördernd"],
    anwendung: ["Mundpflege", "Hautpflege", "Kleine Wunden & Schürfwunden"],
    beschreibung: "Herb-harziger, warmer Duft, traditionell zur Mundpflege sowie bei rissiger, strapazierter Haut und zur Unterstützung der Hautregeneration nach kleinen, bereits gereinigten Hautverletzungen eingesetzt.",
    hinweise: "Nicht in der Schwangerschaft; sehr zähflüssig, vor Gebrauch leicht anwärmen. Nur stark verdünnt und nie auf frischer, offener oder tiefer Wunde anwenden."
  },
  {
    name: "Ylang-Ylang",
    botanisch: "Cananga odorata",
    familie: "Annonengewächse",
    eigenschaften: ["entspannend", "aphrodisierend", "stimmungsaufhellend"],
    anwendung: ["Stress & Entspannung", "Raumbeduftung / Diffusor"],
    beschreibung: "Schwer-süßer, exotisch-blumiger Duft mit stimmungsaufhellender und entspannender Wirkung.",
    hinweise: "Sparsam dosieren – in hoher Konzentration können Kopfschmerzen auftreten."
  },
  {
    name: "Geranie",
    botanisch: "Pelargonium graveolens",
    familie: "Storchschnabelgewächse",
    eigenschaften: ["ausgleichend", "hautklärend", "entzündungshemmend", "insektenabweisend"],
    anwendung: ["Hautpflege", "Stress & Entspannung", "Insektenschutz", "Hautausschlag & Hautreizung"],
    beschreibung: "Rosig-krautiger Duft, der hormonell und emotional ausgleichend wirkt. Gilt zudem als eine der angenehmer riechenden natürlichen Alternativen im Mückenschutz und wird traditionell bei gereizter Haut eingesetzt.",
    hinweise: "Gut hautverträglich, dennoch verdünnt anwenden; bei stärkeren oder unklaren Hautreizungen ärztlichen Rat einholen."
  },
  {
    name: "Wacholder",
    botanisch: "Juniperus communis",
    familie: "Zypressengewächse",
    eigenschaften: ["entgiftend", "durchblutungsfördernd", "anregend"],
    anwendung: ["Muskelkater & Verspannung", "Verdauung"],
    beschreibung: "Frisch-holziger, herber Duft. Wird traditionell bei Muskelverspannungen und zur Anregung des Stoffwechsels genutzt.",
    hinweise: "Nicht bei Nierenerkrankungen oder in der Schwangerschaft anwenden."
  },
  {
    name: "Fichtennadel",
    botanisch: "Picea abies",
    familie: "Kieferngewächse",
    eigenschaften: ["schleimlösend", "anregend", "durchblutungsfördernd"],
    anwendung: ["Erkältung & Atemwege", "Muskelkater & Verspannung", "Raumbeduftung / Diffusor", "Haushalt & Reinigung"],
    beschreibung: "Frisch-waldiger Duft, der an einen Winterspaziergang erinnert. Ein paar Tropfen im Wischwasser hinterlassen einen sauberen, waldfrischen Duft.",
    hinweise: "Kann bei empfindlicher Haut reizen – gut verdünnen."
  },
  {
    name: "Latschenkiefer",
    botanisch: "Pinus mugo",
    familie: "Kieferngewächse",
    eigenschaften: ["schleimlösend", "durchblutungsfördernd", "anregend"],
    anwendung: ["Erkältung & Atemwege", "Muskelkater & Verspannung", "Raumbeduftung / Diffusor"],
    beschreibung: "Harzig-waldiger Duft, klassisch in Erkältungsbädern und Massageölen für die Muskulatur.",
    hinweise: "Kann bei empfindlicher Haut reizen – gut verdünnen; nicht bei Asthma inhalieren."
  },
  {
    name: "Myrte",
    botanisch: "Myrtus communis",
    familie: "Myrtengewächse",
    eigenschaften: ["schleimlösend", "antibakteriell", "ausgleichend"],
    anwendung: ["Erkältung & Atemwege", "Hautpflege"],
    beschreibung: "Mild-frischer, leicht fruchtiger Duft – eine sanftere Alternative zu Eukalyptus, auch für die Anwendung am Abend geeignet.",
    hinweise: "Gut verträglich; dennoch verdünnt anwenden."
  },
  {
    name: "Salbei",
    botanisch: "Salvia officinalis",
    familie: "Lippenblütler",
    eigenschaften: ["antibakteriell", "schweißhemmend", "krampflösend"],
    anwendung: ["Mundpflege", "Erkältung & Atemwege"],
    beschreibung: "Würzig-kräftiger Duft mit adstringierender Wirkung, traditionell bei Halsschmerzen und übermäßigem Schwitzen genutzt.",
    hinweise: "Enthält Thujon – nicht in der Schwangerschaft, Stillzeit oder bei Epilepsie anwenden."
  },
  {
    name: "Muskatellersalbei",
    botanisch: "Salvia sclarea",
    familie: "Lippenblütler",
    eigenschaften: ["entspannend", "ausgleichend", "krampflösend"],
    anwendung: ["Stress & Entspannung", "Einschlafen & Schlaf"],
    beschreibung: "Warm-krautiger, leicht nussiger Duft mit stark entspannender Wirkung, traditionell zur hormonellen Balance und bei Verspannungen genutzt.",
    hinweise: "Nicht in der Schwangerschaft; nicht vor dem Autofahren, da stark entspannend; nicht mit Alkohol kombinieren."
  },
  {
    name: "Thymian",
    botanisch: "Thymus vulgaris",
    familie: "Lippenblütler",
    eigenschaften: ["antibakteriell", "schleimlösend", "anregend"],
    anwendung: ["Erkältung & Atemwege", "Mundpflege", "Haushalt & Reinigung"],
    beschreibung: "Intensiv-würziger Duft mit starker keimhemmender Wirkung, klassisch bei Husten sowie als Zusatz in selbstgemachten, keimhemmenden Haushaltsreinigern.",
    hinweise: "Hautreizend – niedrig dosieren; nicht bei Kleinkindern und in der Schwangerschaft."
  },
  {
    name: "Oregano",
    botanisch: "Origanum vulgare",
    familie: "Lippenblütler",
    eigenschaften: ["antibakteriell", "antiviral", "wärmend"],
    anwendung: ["Erkältung & Atemwege", "Haushalt & Reinigung"],
    beschreibung: "Sehr intensiver, würzig-scharfer Duft mit einer der stärksten keimhemmenden Wirkungen unter den ätherischen Ölen.",
    hinweise: "Stark hautreizend – nur sehr niedrig dosiert (unter 1 %) und nie pur anwenden; nicht in der Schwangerschaft."
  },
  {
    name: "Majoran",
    botanisch: "Origanum majorana",
    familie: "Lippenblütler",
    eigenschaften: ["krampflösend", "beruhigend", "wärmend"],
    anwendung: ["Muskelkater & Verspannung", "Einschlafen & Schlaf", "Verdauung"],
    beschreibung: "Warm-krautiger Duft, der Verspannungen löst und beruhigend auf das Nervensystem wirkt.",
    hinweise: "Gut verträglich, in der Schwangerschaft dennoch zurückhaltend dosieren."
  },
  {
    name: "Basilikum",
    botanisch: "Ocimum basilicum",
    familie: "Lippenblütler",
    eigenschaften: ["konzentrationsfördernd", "krampflösend", "anregend"],
    anwendung: ["Konzentration & Fokus", "Verdauung", "Insektenschutz"],
    beschreibung: "Frisch-krautiger, leicht süßlicher Duft, der den Kopf freimacht; als Topfpflanze auf der Fensterbank hält er zudem lästige Fliegen und Mücken fern.",
    hinweise: "Nicht in der Schwangerschaft; nur kurzzeitig anwenden, gut verdünnen."
  },
  {
    name: "Melisse",
    botanisch: "Melissa officinalis",
    familie: "Lippenblütler",
    eigenschaften: ["beruhigend", "stimmungsaufhellend", "krampflösend"],
    anwendung: ["Stress & Entspannung", "Einschlafen & Schlaf"],
    beschreibung: "Fein-zitronig-krautiger Duft mit ausgleichender Wirkung auf Herz und Gemüt – bei innerer Unruhe geschätzt.",
    hinweise: "Echtes Melissenöl ist sehr teuer und selten – auf Reinheit/Herkunft achten; sparsam dosieren."
  },
  {
    name: "Sandelholz",
    botanisch: "Santalum album",
    familie: "Sandelholzgewächse",
    eigenschaften: ["beruhigend", "erdend", "aphrodisierend"],
    anwendung: ["Stress & Entspannung", "Raumbeduftung / Diffusor", "Einschlafen & Schlaf"],
    beschreibung: "Weich-holziger, balsamischer Duft, der zur Meditation und für erdende Momente der Ruhe geschätzt wird.",
    hinweise: "Gut verträglich; auf nachhaltige Herkunft achten, da die Bestände geschützt sind."
  },
  {
    name: "Zypresse",
    botanisch: "Cupressus sempervirens",
    familie: "Zypressengewächse",
    eigenschaften: ["durchblutungsfördernd", "entwässernd", "erdend"],
    anwendung: ["Muskelkater & Verspannung", "Stress & Entspannung"],
    beschreibung: "Holzig-frischer Duft, der traditionell bei schweren Beinen und zur inneren Sammlung in schwierigen Lebensphasen geschätzt wird.",
    hinweise: "Nicht in der Schwangerschaft; bei hormonabhängigen Erkrankungen vorher Rücksprache halten."
  },
  {
    name: "Muskatnuss",
    botanisch: "Myristica fragrans",
    familie: "Muskatnussgewächse",
    eigenschaften: ["wärmend", "verdauungsfördernd", "krampflösend"],
    anwendung: ["Verdauung", "Muskelkater & Verspannung"],
    beschreibung: "Warm-würziger, weihnachtlicher Duft, traditionell zur Anregung der Verdauung und bei Muskelverspannungen eingesetzt.",
    hinweise: "Nur sehr niedrig dosieren; nicht in der Schwangerschaft."
  },
  {
    name: "Kardamom",
    botanisch: "Elettaria cardamomum",
    familie: "Ingwergewächse",
    eigenschaften: ["wärmend", "verdauungsfördernd", "anregend"],
    anwendung: ["Verdauung", "Konzentration & Fokus"],
    beschreibung: "Warm-würzig-frischer Duft, der die Verdauung anregt und gleichzeitig geistig belebend wirkt.",
    hinweise: "Gut verträglich, dennoch verdünnt anwenden."
  },
  {
    name: "Fenchel",
    botanisch: "Foeniculum vulgare",
    familie: "Doldenblütler",
    eigenschaften: ["verdauungsfördernd", "krampflösend"],
    anwendung: ["Verdauung"],
    beschreibung: "Süßlich-anisartiger Duft, klassisch bei Blähungen und Verdauungsbeschwerden – auch aus dem Fencheltee bekannt.",
    hinweise: "Nicht in der Schwangerschaft und nicht bei Hormonempfindlichkeit; bei Epilepsie meiden."
  },
  {
    name: "Anis",
    botanisch: "Pimpinella anisum",
    familie: "Doldenblütler",
    eigenschaften: ["verdauungsfördernd", "schleimlösend", "krampflösend"],
    anwendung: ["Verdauung", "Erkältung & Atemwege"],
    beschreibung: "Süßlich-würziger Duft, traditionell bei Husten sowie zur Beruhigung des Magen-Darm-Trakts eingesetzt.",
    hinweise: "Nicht in der Schwangerschaft; nicht bei Hormonempfindlichkeit oder Epilepsie."
  },
  {
    name: "Petitgrain",
    botanisch: "Citrus aurantium (Blätter)",
    familie: "Rautengewächse",
    eigenschaften: ["entspannend", "ausgleichend", "stimmungsaufhellend"],
    anwendung: ["Stress & Entspannung", "Einschlafen & Schlaf"],
    beschreibung: "Frisch-grün-holziger Duft aus den Blättern des Bitterorangenbaums, wirkt ausgleichend bei nervöser Anspannung.",
    hinweise: "Gut verträglich; im Gegensatz zu vielen Zitrusölen nicht photosensibilisierend."
  },
  {
    name: "Neroli",
    botanisch: "Citrus aurantium (Blüten)",
    familie: "Rautengewächse",
    eigenschaften: ["entspannend", "stimmungsaufhellend", "ausgleichend"],
    anwendung: ["Stress & Entspannung", "Hautpflege"],
    beschreibung: "Fein-blumig-frischer Duft der Bitterorangenblüte, geschätzt bei innerer Unruhe, Nervosität und in der Hautpflege.",
    hinweise: "Sehr hochpreisig; gut hautverträglich, dennoch verdünnt anwenden."
  },
  {
    name: "Mandarine",
    botanisch: "Citrus reticulata",
    familie: "Rautengewächse",
    eigenschaften: ["entspannend", "stimmungsaufhellend", "anregend"],
    anwendung: ["Einschlafen & Schlaf", "Stress & Entspannung", "Raumbeduftung / Diffusor"],
    beschreibung: "Süß-fruchtiger, milder Duft – einer der wenigen Zitrusdüfte, die auch abends zum Einschlafen und für Kinder als sanft gelten.",
    hinweise: "Leicht photosensibilisierend; Hautkontakt vor Sonne meiden."
  },
  {
    name: "Limette",
    botanisch: "Citrus aurantiifolia",
    familie: "Rautengewächse",
    eigenschaften: ["anregend", "stimmungsaufhellend", "antibakteriell"],
    anwendung: ["Raumbeduftung / Diffusor", "Haushalt & Reinigung", "Konzentration & Fokus"],
    beschreibung: "Spritzig-frischer Duft, der belebt und sich – wie andere Zitrusöle – hervorragend für selbstgemachte Haushaltsreiniger eignet.",
    hinweise: "Photosensibilisierend – nach Hautkontakt Sonne meiden; nur im Diffusor oder stark verdünnt anwenden."
  },
  {
    name: "Grapefruit",
    botanisch: "Citrus paradisi",
    familie: "Rautengewächse",
    eigenschaften: ["anregend", "stimmungsaufhellend", "entgiftend"],
    anwendung: ["Konzentration & Fokus", "Raumbeduftung / Diffusor", "Verdauung", "Haushalt & Reinigung"],
    beschreibung: "Frisch-herb-fruchtiger Duft, der belebt und die Konzentration unterstützt – ein idealer Duft für den Morgen und für frisch duftende Reiniger.",
    hinweise: "Leicht photosensibilisierend; nach Hautkontakt Sonne meiden."
  },
  {
    name: "Rose",
    botanisch: "Rosa damascena",
    familie: "Rosengewächse",
    eigenschaften: ["beruhigend", "hautklärend", "stimmungsaufhellend"],
    anwendung: ["Hautpflege", "Stress & Entspannung"],
    beschreibung: "Fein-blumiger, edler Duft mit ausgleichender Wirkung auf Herz und Gemüt – ein Klassiker der hochwertigen Hautpflege.",
    hinweise: "Sehr hochpreisig, da für wenig Öl viele Blütenblätter nötig sind; auf Reinheit der Quelle achten."
  },
  {
    name: "Immortelle (Currykraut)",
    botanisch: "Helichrysum italicum",
    familie: "Korbblütler",
    eigenschaften: ["entzündungshemmend", "hautklärend", "durchblutungsfördernd", "wundheilungsfördernd"],
    anwendung: ["Hautpflege", "Kleine Wunden & Schürfwunden", "Verbrennungen (leicht)"],
    beschreibung: "Warm-honigartiger, würziger Duft. In der Aromatherapie das wohl bekannteste Öl zur Unterstützung des Hautbilds bei blauen Flecken sowie – meist in Mischung mit Lavendel – bei kleinen, bereits abgekühlten Verbrennungen und oberflächlichen Hautverletzungen.",
    hinweise: "Bei Korbblütler-Allergie vorsichtig testen; hochpreisig, auf Reinheit achten. Nur stark verdünnt und nie auf frischer, offener Wunde oder unversorgter Verbrennung anwenden."
  },
  {
    name: "Patchouli",
    botanisch: "Pogostemon cablin",
    familie: "Lippenblütler",
    eigenschaften: ["erdend", "beruhigend", "hautklärend"],
    anwendung: ["Stress & Entspannung", "Hautpflege", "Raumbeduftung / Diffusor"],
    beschreibung: "Schwer-erdig-holziger Duft, der lange nachwirkt; beliebt zur Raumbeduftung und als erdende Note in der Hautpflege.",
    hinweise: "Sparsam dosieren, sehr intensiv und langanhaltend im Duft."
  },
  {
    name: "Vetiver",
    botanisch: "Chrysopogon zizanioides",
    familie: "Süßgräser",
    eigenschaften: ["erdend", "beruhigend", "entspannend"],
    anwendung: ["Einschlafen & Schlaf", "Stress & Entspannung"],
    beschreibung: "Tief-erdig-holziger Duft mit stark erdender Wirkung, geschätzt bei innerer Unruhe, Gedankenkreisen und Schlafproblemen.",
    hinweise: "Sehr zähflüssig und intensiv – sparsam dosieren."
  },
  {
    name: "Citronella",
    botanisch: "Cymbopogon nardus",
    familie: "Süßgräser",
    eigenschaften: ["insektenabweisend", "erfrischend", "anregend"],
    anwendung: ["Insektenschutz", "Raumbeduftung / Diffusor", "Haushalt & Reinigung"],
    beschreibung: "Frisch-grasig-zitroniger Duft, der weltweit bekannteste Bestandteil von Anti-Mücken-Kerzen und -Sprays für Terrasse und Garten.",
    hinweise: "Kann bei empfindlicher Haut reizen; für Katzen und Hunde kann der Duft unangenehm bis unverträglich sein – Tiere ausweichen lassen."
  },
  {
    name: "Zitronengras",
    botanisch: "Cymbopogon citratus",
    familie: "Süßgräser",
    eigenschaften: ["anregend", "antibakteriell", "geruchsneutralisierend"],
    anwendung: ["Haushalt & Reinigung", "Raumbeduftung / Diffusor", "Insektenschutz"],
    beschreibung: "Intensiv-zitronig-grasiger Duft, bekannt aus der asiatischen Küche sowie als preiswerte Alternative zu Zitrusölen für Diffusor und Haushaltsreiniger.",
    hinweise: "Hautreizend – gut verdünnen; Katzen meiden lassen."
  }
];
