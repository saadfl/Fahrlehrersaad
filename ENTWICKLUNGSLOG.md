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

## 2026-10-04 – Umstellung der Anmeldung auf Supabase Auth

**Entscheidung:** Name + PIN bleiben für den Nutzer gleich, die Prüfung übernimmt aber
Supabase Auth (intern als Pseudo-E-Mail `<anmeldename>@schueler|lehrer.fahrlehrer-saad.app`,
PIN = Passwort, mind. 6 Ziffern). Konten werden über eine Edge Function
(`konto-verwalten`) angelegt, weil der Service-Schlüssel nicht in die App darf.
Zugriffsregeln (RLS): Schüler sehen nur ihre eigenen Daten, Lehrer alle Schüler,
nur Admin ändert Inhalte. Klartext-PINs werden nach der Migration gelöscht.

**Begründung:** Vorher war die Datenbank mit offenen Regeln (`using (true)`) für jeden
mit dem öffentlichen Schlüssel lesbar, inkl. Klartext-PINs und Gesundheitsdatum
(Sehhilfe). DSGVO lässt sich nicht nachträglich andocken.

**Beteiligt:** Claude (Vorschlag, Umsetzung), Nutzer (Entscheidung für Umsetzung)

---

## 2026-10-04 – Löschfrist für Ausbildungsdaten (5 Jahre nach Abschluss)

**Entscheidung:** Beim Archivieren/Abschließen speichert die App das Datum
(`schueler.abgeschlossen_am`). Im Admin-Dashboard listet „Zur Löschung fällig" Schüler,
deren Abschluss über 5 Jahre zurückliegt; Löschen manuell per Bestätigung (löscht Konto
und alle Daten über die Edge Function). Kein automatisches Löschen.

**Begründung:** § 6 Abs. 2 FahrlG-DV: Ausbildungsnachweis-Daten sind fünf Jahre nach
Abschluss der Ausbildung zu löschen. Die Rechtsauskunft stammt aus einer
Zusammenfassung (JuraForum) und ist noch am Gesetzestext zu prüfen. Bestehende
archivierte Schüler wurden mit dem Migrationsdatum als Abschlussdatum versehen.

**Beteiligt:** Claude (Vorschlag, Umsetzung), Nutzer (Entscheidung für Umsetzung)

---

## 2026-10-04 – Datenschutzerklärung, Impressum, Einwilligung

**Entscheidung:** Die App läuft für die Fahrschule Hajo (Fahrwerk Münster GmbH); die GmbH ist
Verantwortliche im Sinne der DSGVO. Datenschutz- und Impressumsseite in der App (Links auf der
Anmeldeseite und im Fahrschule-Bereich), Pflicht-Häkchen beim Anlegen eines Schülers; der
Zeitpunkt wird in `schueler_info.einwilligung_am` gespeichert.

**Begründung:** Informationspflicht (Art. 13 DSGVO); Sehhilfe ist ein Gesundheitsdatum
(Art. 9). Texte sind ein Entwurf nach Standardbausteinen und vor dem Echtbetrieb von der
GmbH bzw. einem Datenschutzbeauftragten zu prüfen. Offen: Zustimmung der Geschäftsführung,
Auftragsverarbeitungsverträge (Supabase, Vercel, ggf. GmbH–Betreiber).

**Beteiligt:** Claude (Entwurf, Umsetzung), Nutzer (Entscheidung für Umsetzung)

---

## [Datum] – [Titel des nächsten Bausteins]

**Entscheidung:**

**Begründung:**

**Beteiligt:**

---

## 2026-10-04 – Zufalls-PIN, WhatsApp-Zugang, Reihenfolge
- Schüler anlegen: PIN optional (leer = Server erzeugt 6-stellige Zufalls-PIN), Knopf "Zufällig", danach Bildschirm mit "Per WhatsApp senden" (wa.me) und "Kopieren". Gleiche Knöpfe bei "Neue PIN vergeben". Edge Function konto-verwalten v4 (gibt pin zurück).
- Reihenfolge: neue Spalte `reihenfolge` bei fahrlehrer_profil und standorte (sql/04_reihenfolge.sql, Trigger hängt neue Einträge ans Ende). Admin: Pfeile ▲▼; Sortierung gilt in Admin, Lehrer- und Schüler-App.

## 2026-10-04 – Startseite mit Foto
- Anmeldeseite (Willkommen und Anmelden) hat das Fahrschulauto als Hintergrund (public/login-bg.jpg, ca. 1400 px) mit dunkelblauem Verlauf für die Lesbarkeit.

## 2026-10-04 – Balken oben (iPhone-Statusleiste) entfernt
- index.html: viewport-fit=cover, apple-mobile-web-app-status-bar-style=black-translucent; body padding-top = safe-area-inset-top.
- App.js: alle minHeight 100dvh abzüglich safe-area (kein unnötiges Scrollen), NavBar klebt unter der Uhr, eingeloggt liegt eine halbtransparente, unscharfe Leiste unter der Uhr (damit Text beim Scrollen nicht mit der Uhr kollidiert). Anmeldeseite: Foto reicht bis ganz oben.
