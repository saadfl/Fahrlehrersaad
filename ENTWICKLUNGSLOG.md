# Entwicklungslog

Dieses Dokument protokolliert Entscheidungen im Projekt: was entschieden wurde,
warum, und wessen Entscheidung es war. Neue Einträge werden oben oder
chronologisch unten angehängt – wichtig ist nur Konsistenz.

---

## 2026-08-23 – Preismodell

**Entscheidung:** Hybridmodell aus kleiner Grundgebühr (~29€/Monat) + Preis pro
neu angelegtem Schüler + 30-Tage-Storno-Regel.

**Begründung:** Reines Pro-Schüler-Modell (Vorbild YOU-DRIVE) hätte falsche
Cashflow-Richtung, kein Recurring Revenue und wäre manipulierbar (späte Anlage,
Karteikarten-Recycling). Referenzrechnung: 30€/Schüler ≈ 1% bei Ø 3.000€
Ausbildungskosten, damit vergleichbar mit Fahrschulcockpit.

**Beteiligt:** Nutzer (Grundidee: Preis pro Schüler), Claude (Analyse der
Schwächen, Hybrid-Vorschlag)

---

## 2026-08-23 – Produktarchitektur

**Entscheidung:** Ein zentrales Backend/eine Datenbank, drei Clients
(Fahrschulmanager, Fahrlehrer-App, Schüler-App) greifen darauf zu. Adapter-
Pattern für TÜV- und TSE-Schnittstellen. DSGVO als Ausnahme von Anfang an in
der Architektur verankert, nicht als Adapter nachrüstbar.

**Begründung:** Adapter-Pattern erlaubt späteres Nachrüsten der Pflicht-
Schnittstellen ohne Strukturänderung. DSGVO betrifft aber grundlegende
Architekturentscheidungen (Verschlüsselung, Serverstandort, Löschkonzept), die
sich nicht nachträglich andocken lassen.

**Beteiligt:** Claude (Architekturvorschlag), Nutzer (Bestätigung)

---

## 2026-08-23 – Datenmodell

**Entscheidung:** 12 Kern-Tabellen (fahrschule, standort, fahrlehrer, fahrzeug,
schueler, vertrag, zahlung, termin, ausbildungsfortschritt, dokument,
benutzer), inkl. vier leerer Adapter-Platzhalterfelder von Beginn an
(pruefung_status, tse_signatur, gobd_beleg_id, tse_geraet_id).

**Begründung:** Platzhalterfelder von Anfang an anzulegen vermeidet spätere
Datenbankmigration, wenn TÜV/TSE-Schnittstellen angebunden werden.

**Beteiligt:** Claude (Entwurf), Nutzer (Review)

**Referenz:** Vollständiges Dokument unter `datenmodell-fahrschulsoftware.md`

---

## 2026-08-23 – Bau-Reihenfolge

**Entscheidung:** Fahrschulmanager (Büro-Tool) zuerst komplett fertigstellen
und bei Pilotfahrschulen testen, danach Fahrlehrer-App, zuletzt Schüler-App
(Lernbereich kann nachgereicht werden).

**Begründung:** Büro-Tool hat höchsten eigenständigen Wert und validiert die
Plattform, bevor in weitere Clients investiert wird.

**Beteiligt:** Claude (Vorschlag), Nutzer (Bestätigung)

---

## 2026-08-23 – Dokumentations-Workflow

**Entscheidung:** Laufende Dokumentation über `CLAUDE.md` (Projekt-Kontext) und
`ENTWICKLUNGSLOG.md` (Entscheidungsprotokoll), gepflegt gemeinsam mit Claude
Code, im selben Repository wie der Quellcode.

**Begründung:** Sichtbare Dokumentation von Entscheidungen und Iterationen
stärkt die Position des Nutzers als aktiver menschlicher Gestalter (relevant
bei späteren Fragen zu Code-Eigentum bei KI-unterstützter Entwicklung).

**Beteiligt:** Claude (Vorschlag), Nutzer (Entscheidung für Umsetzung)

---

## [Datum] – [Titel des nächsten Bausteins]

**Entscheidung:**

**Begründung:**

**Beteiligt:**

---
