#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Erzeugt: "Wesenheiten der ätherischen Öle.pdf"

Ein Nachschlagewerk, das für alle 47 im Ätherische-Öle-Wiki erfassten Öle
eine kurze, poetisch-esoterische "Wesenheit" (Charakter/Ausstrahlung des
Öls) beschreibt – aufbauend auf den bereits im Datensatz (data.js)
vorhandenen Eigenschaften und Beschreibungen. Gruppiert nach Pflanzenfamilie,
analog zur Farbthematik der Website (hero.js FAMILY_THEME).
"""

import os
from xml.sax.saxutils import escape as xml_escape

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, NextPageTemplate, PageBreak,
    Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.styles import ParagraphStyle

# ---------------------------------------------------------------- Farben --
BG        = HexColor("#faf8f4")
SURFACE   = HexColor("#ffffff")
TEXT      = HexColor("#2b2620")
TEXT_MUTED= HexColor("#6b6255")
ACCENT    = HexColor("#6b8f47")
ACCENT_DK = HexColor("#4f6b34")
CHIP_BG   = HexColor("#eef1e6")
BORDER    = HexColor("#e5e0d5")
WARN_BG   = HexColor("#fff6e9")
WARN_BORD = HexColor("#f0d9a8")

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm

OUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "dokumente", "Wesenheiten-der-aetherischen-Oele.pdf",
)

# Farbthema je Pflanzenfamilie (angelehnt an hero.js FAMILY_THEME, "to"-Ton)
FAMILY_COLOR = {
    "Lippenblütler": "#4f3572",
    "Rautengewächse": "#d9701f",
    "Myrtengewächse": "#276456",
    "Korbblütler": "#cf9a2c",
    "Kieferngewächse": "#254a34",
    "Zypressengewächse": "#25504a",
    "Süßgräser": "#71962f",
    "Ingwergewächse": "#a0611f",
    "Doldenblütler": "#8a9a3a",
    "Balsambaumgewächse": "#8f5127",
    "Rosengewächse": "#b95f7f",
    "Sandelholzgewächse": "#8a6a3f",
    "Storchschnabelgewächse": "#a3436a",
    "Annonengewächse": "#b98a17",
    "Muskatnussgewächse": "#6e3520",
    "Lorbeergewächse": "#4a5726",
}

# ------------------------------------------------------------- Styles ----

def style(name, **kw):
    base = dict(fontName="Helvetica", textColor=TEXT, leading=13.5)
    base.update(kw)
    return ParagraphStyle(name, **base)

S_COVER_TITLE = style("CoverTitle", fontName="Helvetica-Bold", fontSize=28,
                       leading=34, textColor=ACCENT_DK, alignment=TA_CENTER)
S_COVER_SUB   = style("CoverSub", fontName="Helvetica", fontSize=13.5,
                       leading=19, textColor=TEXT_MUTED, alignment=TA_CENTER)
S_COVER_META  = style("CoverMeta", fontName="Helvetica", fontSize=10,
                       leading=14, textColor=TEXT_MUTED, alignment=TA_CENTER)

S_H1 = style("H1", fontName="Helvetica-Bold", fontSize=16, leading=20,
             textColor=ACCENT_DK, spaceBefore=4, spaceAfter=8)
S_H2 = style("H2", fontName="Helvetica-Bold", fontSize=12, leading=15,
             textColor=TEXT, spaceBefore=8, spaceAfter=4)
S_BODY = style("Body", fontSize=9.6, leading=13.8, alignment=TA_JUSTIFY,
               spaceAfter=6)
S_LABEL = style("Label", fontName="Helvetica-Bold", fontSize=7.6, leading=10,
                 textColor=TEXT_MUTED)
S_FAMTITLE = style("FamTitle", fontName="Helvetica-Bold", fontSize=15,
                    leading=18, textColor=SURFACE)
S_FAMSUB = style("FamSub", fontName="Helvetica-Oblique", fontSize=9,
                  leading=12, textColor=HexColor("#f2ede0"))
S_OILNAME = style("OilName", fontName="Helvetica-Bold", fontSize=12.5,
                   leading=15.5, textColor=TEXT)
S_WESEN = style("Wesen", fontName="Helvetica-Oblique", fontSize=10,
                 leading=13, textColor=ACCENT_DK)
S_META = style("Meta", fontName="Helvetica", fontSize=8, leading=11,
               textColor=TEXT_MUTED)
S_KEYWORD = style("Keyword", fontName="Helvetica", fontSize=7.6, leading=10,
                   textColor=ACCENT_DK, alignment=TA_CENTER)
S_TABLE_HEAD = style("TableHead", fontName="Helvetica-Bold", fontSize=8.3,
                      leading=10.5, textColor=SURFACE)
S_TABLE_CELL = style("TableCell", fontName="Helvetica", fontSize=8.3,
                      leading=11, textColor=TEXT)
S_TOC = style("Toc", fontName="Helvetica", fontSize=9.6, leading=13.5,
              textColor=TEXT)
S_WARN = style("Warn", fontName="Helvetica", fontSize=8.4, leading=12.2,
               textColor=HexColor("#5c4a25"), alignment=TA_JUSTIFY)


def P(text, s=S_BODY):
    """Paragraph-Shortcut: escaped Text (Text darf bereits <b>/<i> enthalten,
    daher KEIN automatisches Escaping hier – Aufrufer müssen selbst escapen,
    falls Rohdaten mit &, < oder > enthalten sind)."""
    return Paragraph(text, s)


def esc(text):
    return xml_escape(text)


# --------------------------------------------------------- Inhaltsdaten --

INTRO_TEXT = """
Dieses Nachschlagewerk beschreibt f&uuml;r alle 47 &Ouml;le des
&Auml;therische-&Ouml;le-Wikis eine kurze, pers&ouml;nlichkeitsartige
&bdquo;<b>Wesenheit</b>&ldquo; &ndash; einen poetischen Charakterzug, der aus
Duft, Pflanzenfamilie und den traditionell zugeschriebenen Wirk-Eigenschaften
des jeweiligen &Ouml;ls abgeleitet ist. Die Idee: &Auml;therische &Ouml;le
werden in vielen Kulturen und in der energetischen Aromatherapie nicht nur
als Duftstoff, sondern als eigenst&auml;ndiger &bdquo;Charakter&ldquo; mit
einer bestimmten Ausstrahlung erlebt &ndash; die stille Kraft des Zedernholzes,
die feurige Entschlossenheit der Gew&uuml;rznelke, die kindliche Leichtigkeit
der Mandarine. Die &Ouml;le sind nach Pflanzenfamilie gruppiert, passend zur
Farbthematik der Website.
"""

DISCLAIMER_TEXT = """
<b>Wichtiger Hinweis:</b> Die beschriebenen &bdquo;Wesenheiten&ldquo; sind ein
<b>poetisch-spirituelles Deutungsbild</b> aus der energetischen Aromatherapie-
und Wellness-Praxis &ndash; keine medizinische, wissenschaftlich belegte oder
botanische Tatsachenbeschreibung. Sie ersetzen keine &auml;rztliche,
psychotherapeutische oder sonstige fachliche Beratung und sind kein
Heilversprechen. Die faktischen Angaben zu botanischem Namen, Familie und
&uuml;berlieferten Wirk-Eigenschaften stammen aus dem Datensatz dieses
Wikis (<code>data.js</code>) und beschreiben traditionelle bzw.
volkskundliche Nutzung. &Auml;therische &Ouml;le stets verd&uuml;nnt anwenden
und Sicherheitshinweise der jeweiligen Artikelseite beachten; bei
Schwangerschaft, chronischen Erkrankungen oder bei Kindern vorab fachlichen
Rat einholen.
"""

# Reihenfolge der Familien orientiert an hero.js FAMILY_THEME.
FAMILY_ORDER = [
    "Lippenblütler", "Rautengewächse", "Myrtengewächse", "Korbblütler",
    "Kieferngewächse", "Zypressengewächse", "Süßgräser", "Ingwergewächse",
    "Doldenblütler", "Balsambaumgewächse", "Rosengewächse",
    "Sandelholzgewächse", "Storchschnabelgewächse", "Annonengewächse",
    "Muskatnussgewächse", "Lorbeergewächse",
]

FAMILY_SUBTITLE = {
    "Lippenblütler": "Lamiaceae – krautig-würzige Vielfalt",
    "Rautengewächse": "Rutaceae – die Zitrusfamilie",
    "Myrtengewächse": "Myrtaceae – klar und keimhemmend",
    "Korbblütler": "Asteraceae – sanft und hautberuhigend",
    "Kieferngewächse": "Pinaceae – waldig und aufrichtend",
    "Zypressengewächse": "Cupressaceae – herb und reinigend",
    "Süßgräser": "Poaceae – frisch-grasige Schärfe",
    "Ingwergewächse": "Zingiberaceae – warm und würzig",
    "Doldenblütler": "Apiaceae – süßlich-verdauungsfördernd",
    "Balsambaumgewächse": "Burseraceae – harzig und heilig",
    "Rosengewächse": "Rosaceae – edel und herzöffnend",
    "Sandelholzgewächse": "Santalaceae – holzig und meditativ",
    "Storchschnabelgewächse": "Geraniaceae – rosig und ausgleichend",
    "Annonengewächse": "Annonaceae – schwer-exotisch blumig",
    "Muskatnussgewächse": "Myristicaceae – warm-weihnachtlich würzig",
    "Lorbeergewächse": "Lauraceae – intensiv und wärmend",
}

# Jedes Öl: name, wesenheit (Titel), botanisch, familie, eigenschaften,
# wesen_satz (Kern-Charaktersatz), beschreibung (aus data.js übernommen)
OILS = [
    # --- Lippenblütler ---------------------------------------------------
    dict(name="Lavendel", wesenheit="Die Friedensstifterin", botanisch="Lavandula angustifolia",
         familie="Lippenblütler", eigenschaften=["beruhigend", "entspannend", "schmerzlindernd", "entzündungshemmend"],
         wesen_satz="Als Friedensstifterin bringt sie überall dort Ausgleich, wo Anspannung und Unruhe herrschen.",
         beschreibung="Der Klassiker unter den ätherischen Ölen: blumig-krautig im Duft, wirkt ausgleichend auf Nerven und Gemüt und gilt als das mit am häufigsten genannte Öl zur Beruhigung von Haut und Nervensystem."),
    dict(name="Pfefferminze", wesenheit="Der Wachrüttler", botanisch="Mentha × piperita",
         familie="Lippenblütler", eigenschaften=["anregend", "kühlend", "schmerzlindernd", "konzentrationsfördernd"],
         wesen_satz="Als Wachrüttler durchbricht er Trägheit mit einem einzigen klaren, kühlen Atemzug.",
         beschreibung="Frisch-mentholiger Duft, der klärt und wach macht – klassisch bei Spannungskopfschmerz und immer dann, wenn der Kopf schwer und träge wird."),
    dict(name="Rosmarin", wesenheit="Der Erinnerer", botanisch="Salvia rosmarinus",
         familie="Lippenblütler", eigenschaften=["anregend", "durchblutungsfördernd", "konzentrationsfördernd", "krampflösend"],
         wesen_satz="Als Erinnerer schärft er den Blick zurück und den Blick nach vorn zugleich.",
         beschreibung="Kräftig-krautiger Duft, der die Durchblutung anregt und traditionell mit geistiger Klarheit und einem wachen Gedächtnis verbunden wird."),
    dict(name="Salbei", wesenheit="Die weise Alte", botanisch="Salvia officinalis",
         familie="Lippenblütler", eigenschaften=["antibakteriell", "schweißhemmend", "krampflösend"],
         wesen_satz="Als weise Alte mahnt sie zur Zurückhaltung und hält gleichzeitig entschieden ihre Grenzen.",
         beschreibung="Würzig-kräftiger Duft mit adstringierender Wirkung – ein Öl, das Grenzen zieht: gegen Schweiß, gegen Halsschmerzen, gegen zu viel."),
    dict(name="Muskatellersalbei", wesenheit="Die Träumerin", botanisch="Salvia sclarea",
         familie="Lippenblütler", eigenschaften=["entspannend", "ausgleichend", "krampflösend"],
         wesen_satz="Als Träumerin löst sie festgehaltene Anspannung in warmer, nussiger Weichheit auf.",
         beschreibung="Warm-krautiger, leicht nussiger Duft mit stark entspannender Wirkung, traditionell mit hormoneller Balance und tiefer Entspannung verbunden."),
    dict(name="Thymian", wesenheit="Der Kämpfer", botanisch="Thymus vulgaris",
         familie="Lippenblütler", eigenschaften=["antibakteriell", "schleimlösend", "anregend"],
         wesen_satz="Als Kämpfer stellt er sich mit unerschrockener Schärfe hartnäckigen Erregern entgegen.",
         beschreibung="Intensiv-würziger Duft mit starker keimhemmender Wirkung, klassisch bei Husten und immer dort, wo entschlossen durchgegriffen werden soll."),
    dict(name="Oregano", wesenheit="Der kraftvolle Wächter", botanisch="Origanum vulgare",
         familie="Lippenblütler", eigenschaften=["antibakteriell", "antiviral", "wärmend"],
         wesen_satz="Als kraftvoller Wächter bringt er eine der stärksten Verteidigungslinien unter den Ölen ins Feld.",
         beschreibung="Sehr intensiver, würzig-scharfer Duft mit einer der stärksten keimhemmenden Wirkungen unter den ätherischen Ölen – kompromisslos und geradlinig."),
    dict(name="Majoran", wesenheit="Der Tröster", botanisch="Origanum majorana",
         familie="Lippenblütler", eigenschaften=["krampflösend", "beruhigend", "wärmend"],
         wesen_satz="Als Tröster löst er verkrampfte Muskeln und aufgewühlte Gedanken gleichermaßen.",
         beschreibung="Warm-krautiger Duft, der Verspannungen löst und beruhigend auf das Nervensystem wirkt – ein stiller, verlässlicher Begleiter."),
    dict(name="Basilikum", wesenheit="Der klare Kopf", botanisch="Ocimum basilicum",
         familie="Lippenblütler", eigenschaften=["konzentrationsfördernd", "krampflösend", "anregend"],
         wesen_satz="Als klarer Kopf räumt er das Denken auf und schärft die Konzentration.",
         beschreibung="Frisch-krautiger, leicht süßlicher Duft, der den Kopf freimacht und als Topfpflanze zusätzlich lästige Fliegen und Mücken fernhält."),
    dict(name="Melisse", wesenheit="Die Herzensruhige", botanisch="Melissa officinalis",
         familie="Lippenblütler", eigenschaften=["beruhigend", "stimmungsaufhellend", "krampflösend"],
         wesen_satz="Als Herzensruhige beruhigt sie mit zart-zitroniger Note ein aufgewühltes Gemüt.",
         beschreibung="Fein-zitronig-krautiger Duft mit ausgleichender Wirkung auf Herz und Gemüt – bei innerer Unruhe seit jeher geschätzt."),
    dict(name="Patchouli", wesenheit="Der Erdverbundene", botanisch="Pogostemon cablin",
         familie="Lippenblütler", eigenschaften=["erdend", "beruhigend", "hautklärend"],
         wesen_satz="Als Erdverbundener hält er mit schwerem, lang nachwirkendem Duft fest am Boden.",
         beschreibung="Schwer-erdig-holziger Duft, der lange nachwirkt; beliebt zur Raumbeduftung und als erdende Note in der Hautpflege."),
    # --- Rautengewächse ----------------------------------------------------
    dict(name="Zitrone", wesenheit="Die Klärerin", botanisch="Citrus limon",
         familie="Rautengewächse", eigenschaften=["anregend", "stimmungsaufhellend", "antibakteriell"],
         wesen_satz="Als Klärerin schneidet sie mit heller Frische durch Trübes und Verbrauchtes.",
         beschreibung="Frisch-fruchtiger Duft, der belebt und die Stimmung hebt – klassischer Bestandteil selbstgemachter Allzweckreiniger wegen seiner fettlösenden, frischen Note."),
    dict(name="Süßorange", wesenheit="Die Frohnatur", botanisch="Citrus sinensis",
         familie="Rautengewächse", eigenschaften=["stimmungsaufhellend", "entspannend", "anregend"],
         wesen_satz="Als Frohnatur trägt sie kindliche Leichtigkeit in jeden noch so grauen Alltag.",
         beschreibung="Warmer, fruchtig-süßer Duft, der Fröhlichkeit vermittelt – mild genug, um auch in selbstgemachten Reinigern verwendet zu werden."),
    dict(name="Bergamotte", wesenheit="Die Lichtbringerin", botanisch="Citrus bergamia",
         familie="Rautengewächse", eigenschaften=["stimmungsaufhellend", "entspannend", "anregend"],
         wesen_satz="Als Lichtbringerin hellt sie trübe Stimmungen mit ihrer feinen, zitrisch-blumigen Wärme auf.",
         beschreibung="Fein-zitrisch mit blumiger Note, bekannt aus dem Earl-Grey-Tee. Wirkt ausgleichend bei Anspannung und trüber Stimmung."),
    dict(name="Petitgrain", wesenheit="Der gelassene Bruder", botanisch="Citrus aurantium (Blätter)",
         familie="Rautengewächse", eigenschaften=["entspannend", "ausgleichend", "stimmungsaufhellend"],
         wesen_satz="Als gelassener Bruder bringt er grün-holzige Ruhe, wo Neroli zu kostbar wäre.",
         beschreibung="Frisch-grün-holziger Duft aus den Blättern des Bitterorangenbaums, wirkt ausgleichend bei nervöser Anspannung."),
    dict(name="Neroli", wesenheit="Die zarte Prinzessin", botanisch="Citrus aurantium (Blüten)",
         familie="Rautengewächse", eigenschaften=["entspannend", "stimmungsaufhellend", "ausgleichend"],
         wesen_satz="Als zarte Prinzessin besänftigt sie mit blumiger Zartheit innere Nervosität.",
         beschreibung="Fein-blumig-frischer Duft der Bitterorangenblüte, geschätzt bei innerer Unruhe, Nervosität und in der feinen Hautpflege."),
    dict(name="Mandarine", wesenheit="Das Kind", botanisch="Citrus reticulata",
         familie="Rautengewächse", eigenschaften=["entspannend", "stimmungsaufhellend", "anregend"],
         wesen_satz="Als Kind bringt sie unbeschwerte, milde Süße bis in den Abend hinein.",
         beschreibung="Süß-fruchtiger, milder Duft – einer der wenigen Zitrusdüfte, die auch abends zum Einschlafen und für Kinder als sanft gelten."),
    dict(name="Limette", wesenheit="Der frische Funke", botanisch="Citrus aurantiifolia",
         familie="Rautengewächse", eigenschaften=["anregend", "stimmungsaufhellend", "antibakteriell"],
         wesen_satz="Als frischer Funke entzündet sie spritzige Wachheit im Handumdrehen.",
         beschreibung="Spritzig-frischer Duft, der belebt und sich – wie andere Zitrusöle – hervorragend für selbstgemachte Haushaltsreiniger eignet."),
    dict(name="Grapefruit", wesenheit="Die Morgenmuntere", botanisch="Citrus paradisi",
         familie="Rautengewächse", eigenschaften=["anregend", "stimmungsaufhellend", "entgiftend"],
         wesen_satz="Als Morgenmuntere reißt sie mit herb-frischer Energie den Tag auf.",
         beschreibung="Frisch-herb-fruchtiger Duft, der belebt und die Konzentration unterstützt – ein idealer Duft für den Morgen."),
    # --- Myrtengewächse ------------------------------------------------
    dict(name="Teebaum", wesenheit="Der Wächter", botanisch="Melaleuca alternifolia",
         familie="Myrtengewächse", eigenschaften=["antibakteriell", "antiviral", "pilzhemmend", "hautklärend"],
         wesen_satz="Als Wächter zieht er eine unsichtbare, reinigende Grenze um alles, was er berührt.",
         beschreibung="Kräftig-medizinischer Duft mit ausgeprägter reinigender Wirkung. Beliebt bei unreiner Haut sowie gegen Schimmel und Gerüche im Haushalt."),
    dict(name="Eukalyptus", wesenheit="Der Befreier des Atems", botanisch="Eucalyptus globulus",
         familie="Myrtengewächse", eigenschaften=["schleimlösend", "antibakteriell", "kühlend"],
         wesen_satz="Als Befreier des Atems öffnet er Wege, wo Enge und Schwere den Weg versperren.",
         beschreibung="Camphrig-frischer Duft, der das Durchatmen erleichtert. Klassisch zur Inhalation oder im Diffusor bei Erkältung."),
    dict(name="Zitroneneukalyptus", wesenheit="Die Beschützerin der Schwelle", botanisch="Eucalyptus citriodora",
         familie="Myrtengewächse", eigenschaften=["insektenabweisend", "erfrischend"],
         wesen_satz="Als Beschützerin der Schwelle hält sie unerwünschte Gäste mit spielerischer Entschlossenheit fern.",
         beschreibung="Intensiv zitronig-frischer Duft; enthält viel Citronellal und gilt als eine der wirksamsten pflanzlichen Alternativen zu klassischen Mückenschutzmitteln."),
    dict(name="Gewürznelke", wesenheit="Der feurige Krieger", botanisch="Syzygium aromaticum",
         familie="Myrtengewächse", eigenschaften=["antibakteriell", "schmerzlindernd", "wärmend"],
         wesen_satz="Als feuriger Krieger stellt er sich Schmerz und Kälte mit betäubender Entschlossenheit entgegen.",
         beschreibung="Intensiv-würziger Duft mit betäubender Wirkung, traditionell bei Zahnschmerzen genutzt – kompromisslos in Kraft und Wirkung."),
    dict(name="Myrte", wesenheit="Die sanfte Schwester", botanisch="Myrtus communis",
         familie="Myrtengewächse", eigenschaften=["schleimlösend", "antibakteriell", "ausgleichend"],
         wesen_satz="Als sanfte Schwester begleitet sie milde, wo kräftigere Verwandte zu stark wären.",
         beschreibung="Mild-frischer, leicht fruchtiger Duft – eine sanftere Alternative zu Eukalyptus, auch für die Anwendung am Abend geeignet."),
    # --- Korbblütler --------------------------------------------------
    dict(name="Römische Kamille", wesenheit="Die sanfte Mutter", botanisch="Chamaemelum nobile",
         familie="Korbblütler", eigenschaften=["beruhigend", "entzündungshemmend", "krampflösend"],
         wesen_satz="Als sanfte Mutter nimmt sie Unruhe und Trotz behutsam an die Hand.",
         beschreibung="Mild-apfelartiger, süßer Duft mit sehr sanfter, beruhigender Wirkung – auch für Kinder und empfindliche Haut geeignet."),
    dict(name="Echte Kamille (Blau)", wesenheit="Die blaue Heilerin", botanisch="Matricaria chamomilla",
         familie="Korbblütler", eigenschaften=["entzündungshemmend", "beruhigend", "hautklärend", "wundheilungsfördernd"],
         wesen_satz="Als blaue Heilerin legt sie sich kühlend über gereizte Haut und aufgewühlte Nerven.",
         beschreibung="Intensiv-krautiger Duft mit tiefblauer Farbe durch den Inhaltsstoff Chamazulen – stärker entzündungshemmend als ihre römische Verwandte."),
    dict(name="Immortelle (Currykraut)", wesenheit="Die Unsterbliche", botanisch="Helichrysum italicum",
         familie="Korbblütler", eigenschaften=["entzündungshemmend", "hautklärend", "durchblutungsfördernd", "wundheilungsfördernd"],
         wesen_satz="Als Unsterbliche unterstützt sie beharrlich die Regeneration von Haut und Gewebe.",
         beschreibung="Warm-honigartiger, würziger Duft. In der Aromatherapie das wohl bekannteste Öl zur Unterstützung des Hautbilds bei blauen Flecken und kleinen Hautverletzungen."),
    # --- Kieferngewächse ------------------------------------------------
    dict(name="Zedernholz", wesenheit="Der ruhige Riese", botanisch="Cedrus atlantica",
         familie="Kieferngewächse", eigenschaften=["beruhigend", "erdend", "schleimlösend"],
         wesen_satz="Als ruhiger Riese verleiht er Geborgenheit durch schiere, gelassene Standhaftigkeit.",
         beschreibung="Holzig-warmer, erdender Duft, der Geborgenheit vermittelt; Zedernholzringe im Schrank sind zudem ein traditioneller, natürlicher Mottenschutz."),
    dict(name="Fichtennadel", wesenheit="Der Waldläufer", botanisch="Picea abies",
         familie="Kieferngewächse", eigenschaften=["schleimlösend", "anregend", "durchblutungsfördernd"],
         wesen_satz="Als Waldläufer trägt er die frische Weite eines Winterwaldes in geschlossene Räume.",
         beschreibung="Frisch-waldiger Duft, der an einen Winterspaziergang erinnert – wach machend und zugleich erdend."),
    dict(name="Latschenkiefer", wesenheit="Der Bergsteiger", botanisch="Pinus mugo",
         familie="Kieferngewächse", eigenschaften=["schleimlösend", "durchblutungsfördernd", "anregend"],
         wesen_satz="Als Bergsteiger schenkt er zäher Ausdauer harzige, aufrichtende Kraft.",
         beschreibung="Harzig-waldiger Duft, klassisch in Erkältungsbädern und Massageölen für eine verspannte Muskulatur."),
    # --- Zypressengewächse ------------------------------------------------
    dict(name="Wacholder", wesenheit="Der Reiniger", botanisch="Juniperus communis",
         familie="Zypressengewächse", eigenschaften=["entgiftend", "durchblutungsfördernd", "anregend"],
         wesen_satz="Als Reiniger fegt er Altlasten hinweg und schafft Raum für Neues.",
         beschreibung="Frisch-holziger, herber Duft. Wird traditionell bei Muskelverspannungen und zur Anregung des Stoffwechsels genutzt."),
    dict(name="Zypresse", wesenheit="Der Übergangsbegleiter", botanisch="Cupressus sempervirens",
         familie="Zypressengewächse", eigenschaften=["durchblutungsfördernd", "entwässernd", "erdend"],
         wesen_satz="Als Übergangsbegleiter steht er still und aufrecht in Zeiten des Wandels.",
         beschreibung="Holzig-frischer Duft, der traditionell bei schweren Beinen und zur inneren Sammlung in schwierigen Lebensphasen geschätzt wird."),
    # --- Süßgräser ------------------------------------------------------
    dict(name="Vetiver", wesenheit="Der Tiefwurzler", botanisch="Chrysopogon zizanioides",
         familie="Süßgräser", eigenschaften=["erdend", "beruhigend", "entspannend"],
         wesen_satz="Als Tiefwurzler verankert er kreisende Gedanken tief im Boden der Ruhe.",
         beschreibung="Tief-erdig-holziger Duft mit stark erdender Wirkung, geschätzt bei innerer Unruhe, Gedankenkreisen und Schlafproblemen."),
    dict(name="Citronella", wesenheit="Die Torwächterin", botanisch="Cymbopogon nardus",
         familie="Süßgräser", eigenschaften=["insektenabweisend", "erfrischend", "anregend"],
         wesen_satz="Als Torwächterin hält sie mit grasig-frischer Schärfe ungebetene Insekten fern.",
         beschreibung="Frisch-grasig-zitroniger Duft, der weltweit bekannteste Bestandteil von Anti-Mücken-Kerzen und -Sprays für Terrasse und Garten."),
    dict(name="Zitronengras", wesenheit="Der klare Diener", botanisch="Cymbopogon citratus",
         familie="Süßgräser", eigenschaften=["anregend", "antibakteriell", "geruchsneutralisierend"],
         wesen_satz="Als klarer Diener bringt er preiswerte, verlässliche Frische in Haushalt und Duft.",
         beschreibung="Intensiv-zitronig-grasiger Duft, bekannt aus der asiatischen Küche sowie als preiswerte Alternative zu Zitrusölen für Diffusor und Haushaltsreiniger."),
    # --- Ingwergewächse ------------------------------------------------
    dict(name="Ingwer", wesenheit="Der Antreiber", botanisch="Zingiber officinale",
         familie="Ingwergewächse", eigenschaften=["wärmend", "verdauungsfördernd", "krampflösend"],
         wesen_satz="Als Antreiber bringt er ins Stocken geratene Kraft mit würziger Wärme wieder in Fluss.",
         beschreibung="Scharf-würziger, wärmender Duft. Wird gerne bei Reiseübelkeit und zur Anregung der Verdauung eingesetzt."),
    dict(name="Kardamom", wesenheit="Der belebende Würzmeister", botanisch="Elettaria cardamomum",
         familie="Ingwergewächse", eigenschaften=["wärmend", "verdauungsfördernd", "anregend"],
         wesen_satz="Als belebender Würzmeister bringt er Wärme und geistige Frische zugleich.",
         beschreibung="Warm-würzig-frischer Duft, der die Verdauung anregt und gleichzeitig geistig belebend wirkt."),
    # --- Doldenblütler ------------------------------------------------
    dict(name="Fenchel", wesenheit="Die Beruhigerin des Bauches", botanisch="Foeniculum vulgare",
         familie="Doldenblütler", eigenschaften=["verdauungsfördernd", "krampflösend"],
         wesen_satz="Als Beruhigerin des Bauches löst sie sanft, was sich innerlich verkrampft hat.",
         beschreibung="Süßlich-anisartiger Duft, klassisch bei Blähungen und Verdauungsbeschwerden – auch aus dem Fencheltee bekannt."),
    dict(name="Anis", wesenheit="Der süße Tröster", botanisch="Pimpinella anisum",
         familie="Doldenblütler", eigenschaften=["verdauungsfördernd", "schleimlösend", "krampflösend"],
         wesen_satz="Als süßer Tröster besänftigt er Husten und unruhigen Magen gleichermaßen.",
         beschreibung="Süßlich-würziger Duft, traditionell bei Husten sowie zur Beruhigung des Magen-Darm-Trakts eingesetzt."),
    # --- Balsambaumgewächse ------------------------------------------------
    dict(name="Weihrauch", wesenheit="Der Priester", botanisch="Boswellia carterii",
         familie="Balsambaumgewächse", eigenschaften=["beruhigend", "entzündungshemmend", "erdend"],
         wesen_satz="Als Priester führt er den Geist von der Oberfläche zurück zu seiner Mitte.",
         beschreibung="Harzig-warmer, meditativer Duft. Wird traditionell zur inneren Ruhe und Konzentration bei Meditation eingesetzt."),
    dict(name="Myrrhe", wesenheit="Die weise Heilerin", botanisch="Commiphora myrrha",
         familie="Balsambaumgewächse", eigenschaften=["entzündungshemmend", "erdend", "antibakteriell", "wundheilungsfördernd"],
         wesen_satz="Als weise Heilerin begleitet sie Wunden und Übergänge mit stiller, harziger Kraft.",
         beschreibung="Herb-harziger, warmer Duft, traditionell zur Mundpflege sowie bei rissiger, strapazierter Haut eingesetzt."),
    # --- Rosengewächse ------------------------------------------------
    dict(name="Rose", wesenheit="Die Königin des Herzens", botanisch="Rosa damascena",
         familie="Rosengewächse", eigenschaften=["beruhigend", "hautklärend", "stimmungsaufhellend"],
         wesen_satz="Als Königin des Herzens öffnet sie mit edler Zartheit, was verschlossen war.",
         beschreibung="Fein-blumiger, edler Duft mit ausgleichender Wirkung auf Herz und Gemüt – ein Klassiker der hochwertigen Hautpflege."),
    # --- Sandelholzgewächse ------------------------------------------------
    dict(name="Sandelholz", wesenheit="Der Meditierende", botanisch="Santalum album",
         familie="Sandelholzgewächse", eigenschaften=["beruhigend", "erdend", "aphrodisierend"],
         wesen_satz="Als Meditierender führt er mit jedem Atemzug tiefer nach innen.",
         beschreibung="Weich-holziger, balsamischer Duft, der zur Meditation und für erdende Momente der Ruhe geschätzt wird."),
    # --- Storchschnabelgewächse ------------------------------------------------
    dict(name="Geranie", wesenheit="Die Ausgleicherin", botanisch="Pelargonium graveolens",
         familie="Storchschnabelgewächse", eigenschaften=["ausgleichend", "hautklärend", "entzündungshemmend", "insektenabweisend"],
         wesen_satz="Als Ausgleicherin bringt sie widerstreitende Gefühle sanft ins Gleichgewicht.",
         beschreibung="Rosig-krautiger Duft, der hormonell und emotional ausgleichend wirkt und zugleich als natürliche Alternative im Mückenschutz gilt."),
    # --- Annonengewächse ------------------------------------------------
    dict(name="Ylang-Ylang", wesenheit="Die Verführerin", botanisch="Cananga odorata",
         familie="Annonengewächse", eigenschaften=["entspannend", "aphrodisierend", "stimmungsaufhellend"],
         wesen_satz="Als Verführerin löst sie Verkrampfung in schwerem, süßem Wohlgefühl auf.",
         beschreibung="Schwer-süßer, exotisch-blumiger Duft mit stimmungsaufhellender und entspannender Wirkung."),
    # --- Muskatnussgewächse ------------------------------------------------
    dict(name="Muskatnuss", wesenheit="Der wärmende Geist", botanisch="Myristica fragrans",
         familie="Muskatnussgewächse", eigenschaften=["wärmend", "verdauungsfördernd", "krampflösend"],
         wesen_satz="Als wärmender Geist bringt er würzige Behaglichkeit in kalte, träge Stunden.",
         beschreibung="Warm-würziger, weihnachtlicher Duft, traditionell zur Anregung der Verdauung und bei Muskelverspannungen eingesetzt."),
    # --- Lorbeergewächse ------------------------------------------------
    dict(name="Zimtrinde", wesenheit="Der Feuerhüter", botanisch="Cinnamomum verum",
         familie="Lorbeergewächse", eigenschaften=["wärmend", "antibakteriell", "durchblutungsfördernd"],
         wesen_satz="Als Feuerhüter trägt er wärmende, mutmachende Kraft in kalte, erschöpfte Zeiten.",
         beschreibung="Warm-würziger, intensiver Duft. Wird traditionell zur Unterstützung des Immunsystems in der kalten Jahreszeit eingesetzt."),
]

assert len(OILS) == 47, f"Erwartet 47 Öle, gefunden: {len(OILS)}"

# ------------------------------------------------------------ Templates --

def cover_page(c: pdfcanvas.Canvas, doc):
    c.saveState()
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - 10 * mm, PAGE_W, 10 * mm, stroke=0, fill=1)
    c.setFillColor(ACCENT_DK)
    c.rect(0, 0, PAGE_W, 6 * mm, stroke=0, fill=1)

    dots = [
        (PAGE_W * 0.20, PAGE_H * 0.74, 24, "#8b6fb3"),
        (PAGE_W * 0.76, PAGE_H * 0.70, 30, "#4f9c8c"),
        (PAGE_W * 0.50, PAGE_H * 0.62, 18, "#f6a94a"),
        (PAGE_W * 0.32, PAGE_H * 0.56, 14, "#e8a0b4"),
        (PAGE_W * 0.66, PAGE_H * 0.52, 16, "#a8c86b"),
        (PAGE_W * 0.44, PAGE_H * 0.46, 11, "#c9a06a"),
    ]
    for x, y, r, col in dots:
        c.saveState()
        c.setFillColor(HexColor(col))
        c.setFillAlpha(0.18)
        p = c.beginPath()
        p.circle(x, y, r)
        c.drawPath(p, fill=1, stroke=0)
        c.restoreState()
    c.restoreState()


def inner_page(c: pdfcanvas.Canvas, doc):
    c.saveState()
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.setFillColor(ACCENT_DK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, PAGE_H - 12 * mm, "WESENHEITEN DER ÄTHERISCHEN ÖLE")
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.6)
    c.line(MARGIN, PAGE_H - 14 * mm, PAGE_W - MARGIN, PAGE_H - 14 * mm)
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 7.6)
    c.drawString(MARGIN, 11 * mm, "Poetisch-spirituelles Deutungsbild – kein medizinischer Rat, keine botanische Tatsachenbehauptung")
    c.drawRightString(PAGE_W - MARGIN, 11 * mm, f"Seite {doc.page}")
    c.restoreState()


doc = BaseDocTemplate(
    OUT_PATH, pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN, topMargin=20 * mm, bottomMargin=16 * mm,
    title="Wesenheiten der ätherischen Öle",
    author="Ätherische Öle – Nachschlagewerk",
    subject="Wesenheiten & ätherische Öle",
)

frame_cover = Frame(0, 0, PAGE_W, PAGE_H, id="cover", leftPadding=0, rightPadding=0,
                     topPadding=0, bottomPadding=0)
frame_inner = Frame(MARGIN, 16 * mm, PAGE_W - 2 * MARGIN, PAGE_H - 36 * mm, id="inner")

doc.addPageTemplates([
    PageTemplate(id="Cover", frames=[frame_cover], onPage=cover_page),
    PageTemplate(id="Inner", frames=[frame_inner], onPage=inner_page),
])

story = []

# ------------------------------------------------------------- Cover -----
story.append(Spacer(1, 90 * mm))
story.append(P("Wesenheiten", S_COVER_TITLE))
story.append(P("der &auml;therischen &Ouml;le", S_COVER_TITLE))
story.append(Spacer(1, 8 * mm))
story.append(P("Alle 47 &Ouml;le des Nachschlagewerks &ndash; ihr poetischer Charakter, gruppiert nach Pflanzenfamilie", S_COVER_SUB))
story.append(Spacer(1, 36 * mm))
story.append(P("Poetisch-spirituelles Deutungsbild aus der energetischen Aromatherapie", S_COVER_META))
story.append(P("Kein medizinischer Rat &middot; keine botanische Tatsachenbehauptung", S_COVER_META))

story.append(NextPageTemplate("Inner"))
story.append(PageBreak())

# ------------------------------------------------------------- Intro -----
story.append(P("Einleitung", S_H1))
story.append(P(INTRO_TEXT, S_BODY))
story.append(Spacer(1, 4))

warn_table = Table([[P(DISCLAIMER_TEXT, S_WARN)]], colWidths=[PAGE_W - 2 * MARGIN])
warn_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), WARN_BG),
    ("BOX", (0, 0), (-1, -1), 0.75, WARN_BORD),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(warn_table)
story.append(Spacer(1, 12))

story.append(P("Inhalt nach Pflanzenfamilie", S_H2))
toc_rows = []
oils_by_family = {}
for o in OILS:
    oils_by_family.setdefault(o["familie"], []).append(o)
for fam in FAMILY_ORDER:
    names = ", ".join(esc(o["name"]) for o in oils_by_family.get(fam, []))
    toc_rows.append([
        Paragraph(f"<font color='{FAMILY_COLOR[fam]}'><b>&#9679;</b></font> <b>{esc(fam)}</b>", S_TOC),
        Paragraph(names, S_TOC),
    ])
toc_table = Table(toc_rows, colWidths=[48 * mm, 122 * mm])
toc_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LINEBELOW", (0, 0), (-1, -2), 0.4, BORDER),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.append(toc_table)

story.append(PageBreak())

# --------------------------------------------------------- Kapitel -------
for fam in FAMILY_ORDER:
    oils = oils_by_family.get(fam, [])
    if not oils:
        continue
    accent = HexColor(FAMILY_COLOR[fam])

    fam_header = Table(
        [[[Paragraph(esc(fam), S_FAMTITLE), Paragraph(FAMILY_SUBTITLE.get(fam, ""), S_FAMSUB)]]],
        colWidths=[PAGE_W - 2 * MARGIN],
    )
    fam_header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), accent),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    story.append(fam_header)
    story.append(Spacer(1, 8))

    for i, o in enumerate(oils):
        kw_cells = [Paragraph(esc(k), S_KEYWORD) for k in o["eigenschaften"]]
        kw_table = Table([kw_cells], colWidths=[(PAGE_W - 2 * MARGIN) / len(kw_cells)] * len(kw_cells))
        kw_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CHIP_BG),
            ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))

        name_row = Table(
            [[
                Paragraph(f"{esc(o['name'])}", S_OILNAME),
                Paragraph(esc(o["botanisch"]), S_META),
            ]],
            colWidths=[(PAGE_W - 2 * MARGIN) * 0.55, (PAGE_W - 2 * MARGIN) * 0.45],
        )
        name_row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))

        full_text = f"{esc(o['wesen_satz'])} {esc(o['beschreibung'])}"

        card = [
            name_row,
            P(o["wesenheit"], S_WESEN),
            Spacer(1, 4),
            kw_table,
            Spacer(1, 5),
            P(full_text, S_BODY),
        ]
        story.append(KeepTogether(card))
        if i != len(oils) - 1:
            story.append(HRFlowable(width="100%", thickness=0.3, color=BORDER, spaceBefore=6, spaceAfter=10))

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=0.6, color=accent, spaceBefore=0, spaceAfter=14))

story.append(PageBreak())

# ------------------------------------------------------- Abschlussseite --
story.append(P("&Uuml;bersichtstabelle &ndash; alle 47 &Ouml;le", S_H1))
overview_rows = [[
    Paragraph("&Ouml;l", S_TABLE_HEAD),
    Paragraph("Wesenheit", S_TABLE_HEAD),
    Paragraph("Pflanzenfamilie", S_TABLE_HEAD),
]]
for fam in FAMILY_ORDER:
    for o in oils_by_family.get(fam, []):
        overview_rows.append([
            Paragraph(esc(o["name"]), S_TABLE_CELL),
            Paragraph(esc(o["wesenheit"]), S_TABLE_CELL),
            Paragraph(esc(fam), S_TABLE_CELL),
        ])
overview_table = Table(overview_rows, colWidths=[48 * mm, 62 * mm, 60 * mm], repeatRows=1)
overview_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), ACCENT_DK),
    ("TEXTCOLOR", (0, 0), (-1, 0), SURFACE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SURFACE, CHIP_BG]),
    ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(overview_table)
story.append(Spacer(1, 14))
story.append(P(DISCLAIMER_TEXT, S_WARN))

doc.build(story)
print("PDF geschrieben:", OUT_PATH, "-", len(OILS), "Öle")
