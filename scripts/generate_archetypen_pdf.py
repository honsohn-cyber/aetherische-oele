#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Erzeugt: "Archetypische Eigenschaften der Young Living Öle.pdf"
Ein Nachschlagewerk, das die 12 klassischen (Jung'schen) Archetypen mit
ätherischen Ölen bzw. Ölmischungen von Young Living verknüpft, so wie sie in
der Aromatherapie-/Wellness-Community rund um emotionale & spirituelle
Anwendungen häufig beschrieben werden.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, NextPageTemplate, PageBreak,
    Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

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
MARGIN = 20 * mm

import os
OUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "dokumente", "Archetypische-Eigenschaften-Young-Living-Oele.pdf",
)

# ------------------------------------------------------------- Styles ----
styles = getSampleStyleSheet()

def style(name, **kw):
    base = dict(fontName="Helvetica", textColor=TEXT, leading=14)
    base.update(kw)
    return ParagraphStyle(name, **base)

S_COVER_TITLE = style("CoverTitle", fontName="Helvetica-Bold", fontSize=30,
                       leading=36, textColor=ACCENT_DK, alignment=TA_CENTER)
S_COVER_SUB   = style("CoverSub", fontName="Helvetica", fontSize=14.5,
                       leading=20, textColor=TEXT_MUTED, alignment=TA_CENTER)
S_COVER_META  = style("CoverMeta", fontName="Helvetica", fontSize=10,
                       leading=14, textColor=TEXT_MUTED, alignment=TA_CENTER)

S_H1 = style("H1", fontName="Helvetica-Bold", fontSize=17, leading=21,
             textColor=ACCENT_DK, spaceBefore=4, spaceAfter=8)
S_H2 = style("H2", fontName="Helvetica-Bold", fontSize=12.5, leading=16,
             textColor=TEXT, spaceBefore=10, spaceAfter=4)
S_BODY = style("Body", fontSize=10, leading=14.5, alignment=TA_JUSTIFY,
               spaceAfter=6)
S_BODY_SM = style("BodySmall", fontSize=8.7, leading=12.5, textColor=TEXT_MUTED,
                   alignment=TA_JUSTIFY, spaceAfter=4)
S_LABEL = style("Label", fontName="Helvetica-Bold", fontSize=8, leading=11,
                 textColor=ACCENT_DK)
S_ARCH_NR = style("ArchNr", fontName="Helvetica-Bold", fontSize=9, leading=11,
                   textColor=SURFACE, alignment=TA_CENTER)
S_ARCH_TITLE = style("ArchTitle", fontName="Helvetica-Bold", fontSize=16,
                      leading=19, textColor=SURFACE)
S_ARCH_SUBTITLE = style("ArchSubtitle", fontName="Helvetica-Oblique", fontSize=10,
                         leading=13, textColor=HexColor("#e9f0e0"))
S_KEYWORD = style("Keyword", fontName="Helvetica", fontSize=8.3, leading=11,
                   textColor=ACCENT_DK, alignment=TA_CENTER)
S_TABLE_HEAD = style("TableHead", fontName="Helvetica-Bold", fontSize=8.6,
                      leading=11, textColor=SURFACE)
S_TABLE_CELL = style("TableCell", fontName="Helvetica", fontSize=8.6,
                      leading=11.5, textColor=TEXT)
S_TOC = style("Toc", fontName="Helvetica", fontSize=10.3, leading=15,
              textColor=TEXT)
S_WARN = style("Warn", fontName="Helvetica", fontSize=8.6, leading=12.5,
               textColor=HexColor("#5c4a25"), alignment=TA_JUSTIFY)
S_FOOTNOTE = style("Footnote", fontName="Helvetica-Oblique", fontSize=8,
                    leading=11, textColor=TEXT_MUTED, alignment=TA_JUSTIFY)

# --------------------------------------------------------- Inhaltsdaten --

INTRO_TEXT = """
Dieses Nachschlagewerk verbindet zwölf klassische, auf C.&nbsp;G.&nbsp;Jung
zur&uuml;ckgehende <b>Archetypen</b> &ndash; wiederkehrende Grundmuster der
menschlichen Psyche wie der Held, der Weise oder der Sch&ouml;pfer &ndash;
mit &auml;therischen &Ouml;len und &Ouml;lmischungen von <b>Young
Living</b>. In der Aromatherapie- und Wellness-Community werden einzelne
&Ouml;le seit jeher mit bestimmten Stimmungen, inneren Haltungen und
&bdquo;Charakteren&ldquo; assoziiert &ndash; Young Living selbst vermarktet
seine emotionalen &Ouml;lmischungen (z.&nbsp;B. Valor&reg;, Joy&reg;, Peace
&amp; Calming&reg;, Release&reg;) ausdr&uuml;cklich mit genau solchen
thematischen, gef&uuml;hlsbetonten Botschaften. Dieses Dokument ordnet diese
Themen dem passenden Archetyp zu und beschreibt, wof&uuml;r er steht.
"""

DISCLAIMER_TEXT = """
<b>Wichtiger Hinweis:</b> Die hier beschriebenen &bdquo;archetypischen
Eigenschaften&ldquo; sind ein <b>spirituell-psychologisches
Deutungsmodell</b> aus der energetischen Aromatherapie- und
Wellness-Praxis &ndash; keine medizinische, wissenschaftlich belegte oder
offizielle Klassifikation von Young Living. Sie ersetzen keine
&auml;rztliche, psychotherapeutische oder sonstige fachliche Beratung und
sind nicht als Heilversprechen zu verstehen. Produktnamen wie Valor&reg;,
Joy&reg;, Peace &amp; Calming&reg;, Release&reg;, Believe&reg;,
Envision&reg;, Highest Potential&trade; oder Awaken&reg; sind Marken der
Young Living Essential Oils, LC. &Auml;therische &Ouml;le stets verd&uuml;nnt
anwenden, Sicherheits- und Kontraindikationshinweise der jeweiligen
Hersteller beachten und bei Schwangerschaft, chronischen Erkrankungen oder
bei Kindern vorab fachlichen Rat einholen.
"""

# Jedes Archetyp-Kapitel:
# nr, titel, untertitel(engl.), keywords[list], primary oil name, botanisch/typ,
# duftfamilie, kernthema-absatz, anwendung-hinweis
ARCHETYPES = [
    dict(
        nr=1, titel="Der/Die Unschuldige", sub="The Innocent",
        keywords=["Reine Freude", "Leichtigkeit", "Urvertrauen", "Kindliche Offenheit"],
        oel="Orange & Mandarine", botan="Citrus sinensis / Citrus reticulata",
        familie="Zitrusfamilie &ndash; frisch, s&uuml;&szlig; und sonnig",
        text="""Der Archetyp des Unschuldigen steht f&uuml;r ungetr&uuml;bte Freude,
        Optimismus und das Vertrauen, dass die Welt grunds&auml;tzlich gut ist. In
        der emotionalen Aromatherapie werden milde, s&uuml;&szlig;e Zitrus&ouml;le
        wie Orange und Mandarine diesem Archetyp zugeordnet: Ihr Duft wird als
        unbeschwert, warm und kindlich-fr&ouml;hlich beschrieben und soll dabei
        helfen, wieder mit dem eigenen inneren Kind und einer spielerischen,
        angstfreien Grundhaltung in Verbindung zu kommen &ndash; ein Gegengewicht zu
        &Uuml;berforderung und Zynismus des Alltags.""",
        anwendung="Klassisch abends im Diffusor f&uuml;r Familien und Kinderzimmer &ndash; als milder, freundlicher Duft ohne Sch&auml;rfe."
    ),
    dict(
        nr=2, titel="Der/Die Zugeh&ouml;rige", sub="Everyman",
        keywords=["Geborgenheit", "Alltagsruhe", "Zugeh&ouml;rigkeit", "Harmonie"],
        oel="Peace &amp; Calming&reg;", botan="&Ouml;lmischung (u.&nbsp;a. Tangerine, Orange, Ylang Ylang, Patchouli, Blue Tansy)",
        familie="Weich-fruchtig mit blumig-erdiger Basis",
        text="""Dieser Archetyp sehnt sich nach Zugeh&ouml;rigkeit, Verl&auml;sslichkeit
        und einem ruhigen, geerdeten Alltag &ndash; er ist der Gegenpol zum
        Ausnahmezustand. Die bekannte Young-Living-Mischung Peace &amp;
        Calming&reg; wurde von Anfang an mit dieser Botschaft beworben: ein
        weicher, ausgleichender Duft f&uuml;r ruhige Abende, entspannte
        Familienmomente und einen Nervensystem-Reset nach einem hektischen Tag.""",
        anwendung="Auf Kissen, Handgelenk oder im Diffusor zur Einschlafbegleitung und f&uuml;r ruhige gemeinsame Momente."
    ),
    dict(
        nr=3, titel="Der Held / Die Heldin", sub="The Hero",
        keywords=["Mut", "Selbstvertrauen", "Aufrichtung", "Durchhalteverm&ouml;gen"],
        oel="Valor&reg;", botan="&Ouml;lmischung (u.&nbsp;a. Fichten-/Nadelholz&ouml;le, Weihrauch, Blue Tansy)",
        familie="Holzig-harzig, erdend und zugleich aufrichtend",
        text="""Der Held &uuml;berwindet Hindernisse durch Mut, Willenskraft und
        Selbstvertrauen. Valor&reg; ist innerhalb der Young-Living-Produktpalette
        das wohl bekannteste &bdquo;Mut-&Ouml;l&ldquo; &ndash; traditionell
        beschrieben als Unterst&uuml;tzung, um sich buchst&auml;blich
        &bdquo;aufzurichten&ldquo;, Selbstzweifel loszulassen und mit einem
        gest&auml;rkten R&uuml;ckgrat neuen Herausforderungen zu begegnen. Der
        holzig-harzige Duft wird oft als &bdquo;erdend und mutmachend
        zugleich&ldquo; beschrieben.""",
        anwendung="Verd&uuml;nnt auf die Fu&szlig;sohlen oder das Brustbein vor herausfordernden Situationen, Pr&auml;sentationen oder Ver&auml;nderungen."
    ),
    dict(
        nr=4, titel="Der/Die F&uuml;rsorger(in)", sub="The Caregiver",
        keywords=["Mitgef&uuml;hl", "N&auml;hren", "Emotionale Balance", "F&uuml;rsorge"],
        oel="Geranie & Inner Child&reg;", botan="Pelargonium graveolens / &Ouml;lmischung",
        familie="Rosig-krautig, weich und ausgleichend",
        text="""Der F&uuml;rsorger stellt die Bed&uuml;rfnisse anderer in den
        Mittelpunkt &ndash; oft auf Kosten der eigenen. Geranium gilt in der
        Aromatherapie traditionell als hormonell und emotional ausgleichendes
        &Ouml;l, das N&auml;hren erst m&ouml;glich macht, ohne sich selbst zu
        verlieren. Die Mischung Inner Child&reg; erg&auml;nzt dieses Thema um die
        F&uuml;rsorge f&uuml;r das eigene innere Kind &ndash; ein Erinnern daran,
        dass auch der F&uuml;rsorger Zuwendung braucht.""",
        anwendung="Als Handcreme-Zusatz oder im Diffusor w&auml;hrend bewusster Auszeiten und Selbstf&uuml;rsorge-Ritualen."
    ),
    dict(
        nr=5, titel="Der/Die Entdecker(in)", sub="The Explorer",
        keywords=["Klarheit", "Aufbruch", "Freiheit", "Neue Horizonte"],
        oel="Pfefferminze & Envision&reg;", botan="Mentha &times; piperita / &Ouml;lmischung",
        familie="Frisch-mentholig, klar und weitend",
        text="""Der Entdecker sucht das Neue, Weite und Unbekannte &ndash; getrieben
        von Neugier statt Angst. Pfefferminze steht f&uuml;r geistige Klarheit und
        das &bdquo;Freimachen des Kopfes&ldquo;, das n&ouml;tig ist, um
        eingefahrene Pfade zu verlassen. Envision&reg; wird von Young Living
        gezielt mit den Themen Vision, Ziele setzen und den n&auml;chsten Schritt
        wagen beworben &ndash; passend zum Aufbruchsimpuls dieses Archetyps.""",
        anwendung="Am Morgen oder vor kreativen Planungsphasen im Diffusor, verd&uuml;nnt auf die Schl&auml;fen (Augenkontakt vermeiden)."
    ),
    dict(
        nr=6, titel="Der Rebell / Die Rebellin", sub="The Outlaw",
        keywords=["Loslassen", "Befreiung", "Wandel", "Grenzen setzen"],
        oel="Release&reg;", botan="&Ouml;lmischung (u.&nbsp;a. Ylang Ylang, Lavandin, Geranie, Sandelholz, Blue Tansy)",
        familie="S&uuml;&szlig;-holzig mit blumiger Tiefe",
        text="""Der Rebell bricht mit dem Alten, wenn es nicht mehr passt &ndash;
        radikale Ver&auml;nderung als Befreiung. Release&reg; wird in der
        Young-Living-Welt traditionell mit dem Loslassen von aufgestautem &Auml;rger
        und alten emotionalen Mustern in Verbindung gebracht: nicht laut und
        aufst&auml;ndisch, sondern als bewusster, befreiender Schnitt mit dem, was
        nicht mehr dient.""",
        anwendung="Verd&uuml;nnt &uuml;ber der Leber-Region (rechter Rippenbogen) oder im Nacken, begleitend zu bewussten Loslass-Ritualen."
    ),
    dict(
        nr=7, titel="Der/Die Liebende", sub="The Lover",
        keywords=["Hingabe", "Verbindung", "Herz&ouml;ffnung", "Sinnlichkeit"],
        oel="Rose & Ylang Ylang", botan="Rosa damascena / Cananga odorata",
        familie="Blumig-schwer, warm und sinnlich",
        text="""Dieser Archetyp lebt f&uuml;r Verbindung, Leidenschaft und
        Hingabe &ndash; zu anderen Menschen ebenso wie zum eigenen Herzen. Rose
        gilt seit jeher als das &bdquo;Herz&ouml;l&ldquo; schlechthin und wird mit
        Selbstliebe, Mitgef&uuml;hl und emotionaler &Ouml;ffnung assoziiert;
        Ylang Ylang erg&auml;nzt dies um eine sinnlich-entspannende, sanft
        stimmungsaufhellende Note.""",
        anwendung="Stark verd&uuml;nnt als Parf&uuml;m&ouml;l am Handgelenk/Dekollet&eacute; oder im Diffusor f&uuml;r bewusste Zweisamkeit."
    ),
    dict(
        nr=8, titel="Der/Die Sch&ouml;pfer(in)", sub="The Creator",
        keywords=["Kreativit&auml;t", "Manifestation", "Vorstellungskraft", "Gestaltungskraft"],
        oel="Believe&reg; & Transformation&reg;", botan="&Ouml;lmischungen",
        familie="Warm-harzig-blumig, weit und inspirierend",
        text="""Der Sch&ouml;pfer verwandelt Ideen in Wirklichkeit &ndash; sein
        Motor ist Vorstellungskraft gepaart mit dem Vertrauen, etwas Neues
        erschaffen zu k&ouml;nnen. Believe&reg; wird bei Young Living explizit mit
        dem Thema &bdquo;an die eigenen M&ouml;glichkeiten glauben&ldquo;
        beworben, Transformation&reg; mit dem bewussten Gestalten von
        Ver&auml;nderung &ndash; beides zentrale Motive kreativen Schaffens.""",
        anwendung="Im Diffusor am Arbeits- oder Kreativplatz, besonders zu Beginn neuer Projekte."
    ),
    dict(
        nr=9, titel="Der Narr / Die Lebensfrohe", sub="The Jester",
        keywords=["Leichtigkeit", "Lebensfreude", "Humor", "Pr&auml;senz"],
        oel="Joy&reg;", botan="&Ouml;lmischung (u.&nbsp;a. Rose, Ylang Ylang, Geranie, Zitrone, Mandarine, Bergamotte, Jasmin)",
        familie="Blumig-fruchtig, opulent und strahlend",
        text="""Der Narr erinnert daran, das Leben nicht zu ernst zu nehmen und im
        gegenw&auml;rtigen Moment Freude zu finden. Joy&reg; ist eine der
        &auml;ltesten und bekanntesten Young-Living-Mischungen und wird seit
        Jahrzehnten genau mit diesem Versprechen beworben: ein blumig-strahlender
        Duft, der pure, unmittelbare Lebensfreude vermitteln soll.""",
        anwendung="Auf H&auml;nde reiben und einatmen, oder im Diffusor bei Feiern und bewussten Momenten der Dankbarkeit."
    ),
    dict(
        nr=10, titel="Der/Die Weise", sub="The Sage",
        keywords=["Einsicht", "innere Ruhe", "Spirituelle Tiefe", "Klarheit"],
        oel="Weihrauch & Sandelholz", botan="Boswellia carterii / Santalum album",
        familie="Harzig-holzig, still und meditativ",
        text="""Der Weise sucht Wahrheit, &Uuml;berblick und tieferes Verstehen
        jenseits des Alltagsl&auml;rms. Weihrauch wird seit Jahrtausenden mit
        Meditation, Ritual und spiritueller Sammlung verbunden; Sandelholz erdet
        diese Qualit&auml;t zus&auml;tzlich und wird traditionell zur
        Vertiefung von Achtsamkeitspraxis und innerer Stille eingesetzt.""",
        anwendung="Vor Meditation, Yoga oder ruhigen Reflexionsmomenten im Diffusor oder verd&uuml;nnt auf den Handr&uuml;cken."
    ),
    dict(
        nr=11, titel="Der Magier / Die Magierin", sub="The Magician",
        keywords=["Bewusstseinswandel", "Vision", "Transformation", "Wahrnehmung"],
        oel="Awaken&reg; & Clarity&reg;", botan="&Ouml;lmischungen",
        familie="Frisch-w&uuml;rzig mit floraler und zitrischer Kopfnote",
        text="""Der Magier verwandelt Wahrnehmung in neue Wirklichkeit &ndash; er
        steht f&uuml;r Bewusstwerdung und den Moment des &bdquo;Aufwachens&ldquo;.
        Awaken&reg; wird von Young Living ausdr&uuml;cklich mit dem Erkennen des
        eigenen Potenzials und pers&ouml;nlichem Wandel beworben, Clarity&reg; mit
        geistiger Klarheit und fokussiertem Bewusstsein &ndash; beides Kernthemen
        dieses Archetyps.""",
        anwendung="Am Morgen oder vor wichtigen Entscheidungen im Diffusor, um Klarheit und Weitblick zu unterst&uuml;tzen."
    ),
    dict(
        nr=12, titel="Der Herrscher / Die Herrscherin", sub="The Ruler",
        keywords=["F&uuml;hrung", "Verantwortung", "Zielstrebigkeit", "Struktur"],
        oel="Highest Potential&trade; & Motivation&reg;", botan="&Ouml;lmischungen",
        familie="Warm-w&uuml;rzig-holzig, kraftvoll und fokussierend",
        text="""Der Herrscher &uuml;bernimmt Verantwortung, setzt klare Ziele und
        gestaltet aktiv sein Umfeld. Highest Potential&trade; wird mit dem
        Ausch&ouml;pfen der eigenen F&auml;higkeiten und souver&auml;ner
        Selbstf&uuml;hrung beworben, Motivation&reg; mit Zielstrebigkeit und
        Tatkraft &ndash; Qualit&auml;ten, die diesen Archetyp im besten Sinn
        ausmachen, ohne in Kontrolle oder Starrheit zu kippen.""",
        anwendung="Im Diffusor am Arbeitsplatz oder verd&uuml;nnt auf den Nacken vor wichtigen Terminen und Entscheidungen."
    ),
]

ARCH_ACCENTS = [
    "#c9a13b", "#6b8f47", "#b5533c", "#7a8f6b", "#4f8f8a", "#8a5a8f",
    "#c46a86", "#a06b3c", "#d9a441", "#4f6b34", "#5a6fa0", "#8f6b3c",
]

# ------------------------------------------------------------ Templates --

def cover_page(c: pdfcanvas.Canvas, doc):
    c.saveState()
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - 10 * mm, PAGE_W, 10 * mm, stroke=0, fill=1)
    c.setFillColor(ACCENT_DK)
    c.rect(0, 0, PAGE_W, 6 * mm, stroke=0, fill=1)

    # dekorative "Tropfen"
    import math
    for i, (x, y, r, col) in enumerate([
        (PAGE_W * 0.22, PAGE_H * 0.72, 26, "#9fc772"),
        (PAGE_W * 0.78, PAGE_H * 0.66, 34, "#6b8f47"),
        (PAGE_W * 0.5, PAGE_H * 0.60, 20, "#4f6b34"),
        (PAGE_W * 0.30, PAGE_H * 0.55, 14, "#c9a13b"),
        (PAGE_W * 0.68, PAGE_H * 0.50, 16, "#b5533c"),
    ]):
        c.saveState()
        c.setFillColor(HexColor(col))
        c.setFillAlpha(0.16)
        p = c.beginPath()
        p.circle(x, y, r)
        c.drawPath(p, fill=1, stroke=0)
        c.restoreState()

    c.restoreState()


def inner_page(c: pdfcanvas.Canvas, doc):
    c.saveState()
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    # Kopfzeile
    c.setFillColor(ACCENT_DK)
    c.setFont("Helvetica-Bold", 8.3)
    c.drawString(MARGIN, PAGE_H - 13 * mm, "ARCHETYPISCHE EIGENSCHAFTEN DER YOUNG LIVING ÖLE")
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.6)
    c.line(MARGIN, PAGE_H - 15 * mm, PAGE_W - MARGIN, PAGE_H - 15 * mm)
    # Fusszeile
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 12 * mm, "Spirituell-psychologisches Deutungsmodell – kein medizinischer Rat, keine offizielle Young-Living-Klassifikation")
    c.drawRightString(PAGE_W - MARGIN, 12 * mm, f"Seite {doc.page}")
    c.restoreState()


doc = BaseDocTemplate(
    OUT_PATH, pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN, topMargin=22 * mm, bottomMargin=18 * mm,
    title="Archetypische Eigenschaften der Young Living Öle",
    author="Young Living Archetypen-Guide",
    subject="Archetypen & ätherische Öle",
)

frame_cover = Frame(0, 0, PAGE_W, PAGE_H, id="cover", leftPadding=0, rightPadding=0,
                     topPadding=0, bottomPadding=0)
frame_inner = Frame(MARGIN, 18 * mm, PAGE_W - 2 * MARGIN, PAGE_H - 40 * mm, id="inner")

doc.addPageTemplates([
    PageTemplate(id="Cover", frames=[frame_cover], onPage=cover_page),
    PageTemplate(id="Inner", frames=[frame_inner], onPage=inner_page),
])

story = []

# ------------------------------------------------------------- Cover -----
story.append(Spacer(1, 92 * mm))
story.append(Paragraph("Archetypische Eigenschaften", S_COVER_TITLE))
story.append(Paragraph("der &Ouml;le von Young Living", S_COVER_TITLE))
story.append(Spacer(1, 8 * mm))
story.append(Paragraph(
    "Ein Nachschlagewerk: zw&ouml;lf klassische Archetypen &ndash; zw&ouml;lf &auml;therische &Ouml;le",
    S_COVER_SUB))
story.append(Spacer(1, 40 * mm))
story.append(Paragraph("Spirituell-psychologisches Deutungsmodell aus der energetischen Aromatherapie", S_COVER_META))
story.append(Paragraph("Kein medizinischer Rat &middot; keine offizielle Klassifikation von Young Living", S_COVER_META))

story.append(NextPageTemplate("Inner"))
story.append(PageBreak())

# ------------------------------------------------------------- Intro -----
story.append(Paragraph("Einleitung", S_H1))
story.append(Paragraph(INTRO_TEXT, S_BODY))
story.append(Spacer(1, 4))

warn_table = Table([[Paragraph(DISCLAIMER_TEXT, S_WARN)]], colWidths=[PAGE_W - 2 * MARGIN])
warn_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), WARN_BG),
    ("BOX", (0, 0), (-1, -1), 0.75, WARN_BORD),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(warn_table)
story.append(Spacer(1, 10))

story.append(Paragraph("Die zw&ouml;lf Archetypen im &Uuml;berblick", S_H2))
toc_rows = []
for a in ARCHETYPES:
    toc_rows.append([
        Paragraph(f"{a['nr']:02d}", S_ARCH_NR.clone("n", textColor=ACCENT_DK, alignment=TA_LEFT)),
        Paragraph(f"<b>{a['titel']}</b> <font color='#6b6255'>({a['sub']})</font>", S_TOC),
        Paragraph(a["oel"], S_TOC),
    ])
toc_table = Table(toc_rows, colWidths=[10 * mm, 78 * mm, 82 * mm])
toc_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LINEBELOW", (0, 0), (-1, -2), 0.4, BORDER),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.append(toc_table)

story.append(PageBreak())

# --------------------------------------------------------- Kapitel -------
for idx, a in enumerate(ARCHETYPES):
    accent = HexColor(ARCH_ACCENTS[idx % len(ARCH_ACCENTS)])

    header_tbl = Table(
        [[
            Paragraph(f"{a['nr']:02d}", S_ARCH_NR),
            [Paragraph(a["titel"], S_ARCH_TITLE), Paragraph(a["sub"], S_ARCH_SUBTITLE)],
        ]],
        colWidths=[14 * mm, PAGE_W - 2 * MARGIN - 14 * mm],
    )
    header_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), accent),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("LEFTPADDING", (1, 0), (1, 0), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))

    kw_cells = [Paragraph(k, S_KEYWORD) for k in a["keywords"]]
    kw_table = Table([kw_cells], colWidths=[(PAGE_W - 2 * MARGIN) / len(kw_cells)] * len(kw_cells))
    kw_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CHIP_BG),
        ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    info_table = Table(
        [
            [Paragraph("ZUGEORDNETES &Ouml;L / MISCHUNG", S_LABEL), Paragraph(a["oel"], S_TABLE_CELL)],
            [Paragraph("BOTANISCH / ZUSAMMENSETZUNG", S_LABEL), Paragraph(a["botan"], S_TABLE_CELL)],
            [Paragraph("DUFTCHARAKTER", S_LABEL), Paragraph(a["familie"], S_TABLE_CELL)],
        ],
        colWidths=[46 * mm, PAGE_W - 2 * MARGIN - 46 * mm],
    )
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("LINEBELOW", (0, 0), (-1, 1), 0.4, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    anwendung_tbl = Table(
        [[Paragraph(f"<b>Anwendungsidee:</b> {a['anwendung']}", S_BODY_SM)]],
        colWidths=[PAGE_W - 2 * MARGIN],
    )
    anwendung_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CHIP_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    block = [
        header_tbl,
        Spacer(1, 6),
        kw_table,
        Spacer(1, 8),
        Paragraph(a["text"], S_BODY),
        Spacer(1, 4),
        info_table,
        Spacer(1, 6),
        anwendung_tbl,
    ]
    story.append(KeepTogether(block))
    if idx != len(ARCHETYPES) - 1:
        story.append(Spacer(1, 14))
        story.append(HRFlowable(width="100%", thickness=0.4, color=BORDER, spaceAfter=14))

story.append(PageBreak())

# ------------------------------------------------------- Abschlussseite --
story.append(Paragraph("&Uuml;bersichtstabelle", S_H1))
overview_rows = [[
    Paragraph("Archetyp", S_TABLE_HEAD),
    Paragraph("&Ouml;l / Mischung", S_TABLE_HEAD),
    Paragraph("Kernthema", S_TABLE_HEAD),
]]
for a in ARCHETYPES:
    overview_rows.append([
        Paragraph(f"<b>{a['nr']:02d}.</b> {a['titel']}", S_TABLE_CELL),
        Paragraph(a["oel"], S_TABLE_CELL),
        Paragraph(", ".join(a["keywords"][:2]), S_TABLE_CELL),
    ])
overview_table = Table(overview_rows, colWidths=[62 * mm, 55 * mm, 53 * mm], repeatRows=1)
overview_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), ACCENT_DK),
    ("TEXTCOLOR", (0, 0), (-1, 0), SURFACE),
    ("BACKGROUND", (0, 1), (-1, -1), SURFACE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SURFACE, CHIP_BG]),
    ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
]))
story.append(overview_table)
story.append(Spacer(1, 14))

story.append(Paragraph("Zur Einordnung", S_H2))
story.append(Paragraph(
    """Die Zuordnung von &auml;therischen &Ouml;len zu Archetypen ist keine
    exakte Wissenschaft, sondern ein <b>Interpretationswerkzeug</b>: Sie
    hilft, &uuml;ber den reinen Duft hinaus eine pers&ouml;nliche, bewusste
    Verbindung zu einem &Ouml;l aufzubauen &ndash; &auml;hnlich wie ein
    Tarot-Bild oder ein Mantra als Reflexionsanlass dient. Verschiedene
    Quellen und Lehrende innerhalb der Young-Living-Community ordnen &Ouml;le
    teils unterschiedlichen Archetypen oder Themen zu; dieses Dokument stellt
    eine in sich stimmige, aber nicht die einzig g&uuml;ltige Zuordnung dar.
    Wer sich intensiver mit den emotionalen &Ouml;lmischungen von Young
    Living besch&auml;ftigen m&ouml;chte, findet ausf&uuml;hrliche,
    produktspezifische Informationen in der offiziellen Young-Living-Literatur
    (u.&nbsp;a. im &bdquo;Feelings&ldquo;-Kit-Begleitheft).""",
    S_BODY))
story.append(Spacer(1, 8))
story.append(Paragraph(DISCLAIMER_TEXT, S_WARN))

doc.build(story)
print("PDF geschrieben:", OUT_PATH)
