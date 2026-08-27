# Projekt: Fahrschulverwaltungssoftware

## Kurzbeschreibung

Eigenständige Fahrschulverwaltungssoftware für den deutschen Markt, als neuer
Anbieter gegen etablierte Wettbewerber. Ziel: Drei-Produkt-Ökosystem auf
gemeinsamer Datenbasis:

1. **Fahrschulmanager** – Browser-basiertes Büro-Verwaltungstool (wird zuerst gebaut)
2. **Fahrlehrer-App** – Mobile App für Fahrlehrer (zweiter Baustein)
3. **Schüler-App** – Mobile App mit Lernbereich für Fahrschüler (letzter Baustein, kann initial ohne Lernbereich starten)

Alle drei Clients greifen auf **eine zentrale Datenbank/API** zu – keine
getrennten synchronisierten Systeme.

## Wettbewerbsumfeld

Analysierte Marktbegleiter: Fahrschul-Manager (Vogel System, Marktführer),
Fahrschulcockpit (1%-Umsatzmodell + LivePay), Fahrschule.live (Adaptech GmbH),
FahrschulOffice 360°, YOU-DRIVE (Preis pro neuem Schüler), WINDRIVE
(Einmalkauf ca. 1.440€ + Wartung), drivEddy.

## Preismodell (Entscheidung)

Hybridmodell:
- Kleine monatliche Grundgebühr (ca. 29€/Monat)
- Preis pro neu angelegtem Schüler als Hauptkomponente
- Storno-Regel: Rückerstattung/Nicht-Berechnung bei Abbruch innerhalb der
  ersten 30 Tage (verhindert Manipulation durch späte Anlage/Karteikarten-Recycling)

Hintergrund: Reines Pro-Schüler-Modell (wie YOU-DRIVE) hat drei Schwächen –
falsche Cashflow-Richtung, kein Recurring Revenue, Manipulierbarkeit. Referenzpunkt:
30€/Schüler entspricht ca. 1% bei durchschnittlich 3.000€ Ausbildungskosten
(damit vergleichbar mit Fahrschulcockpit).

## Architekturprinzipien

- **Zentrale DB/API**, alle drei Apps als Clients darauf
- **Adapter-Pattern** für alle externen Pflicht-Schnittstellen (TÜV-Prüfungsanbindung,
  TSE-Kassensicherheit) – eigene Zwischenschicht im Code, damit Schnittstellen
  später ohne Strukturänderung nachrüstbar sind
- **Ausnahme DSGVO**: kann NICHT nachträglich wie ein Adapter angedockt werden.
  Verschlüsselung, Serverstandort und Löschkonzept müssen von Anfang an in der
  Architektur mitgedacht werden, sobald mit echten/realistischen Personendaten
  getestet wird
- Datenmodell mit 12 Kern-Tabellen bereits entworfen (siehe Datenmodell-Dokument):
  fahrschule, standort, fahrlehrer, fahrzeug, schueler, vertrag, zahlung,
  termin, ausbildungsfortschritt, dokument, benutzer
- Vier Adapter-Platzhalterfelder von Anfang an als leere DB-Felder anlegen:
  `pruefung_status`, `tse_signatur`, `gobd_beleg_id`, `tse_geraet_id`

## Kritische ungeklärte Blocker (❓ = unverifiziert, keine öffentlichen Preise)

1. **arge tp 21-Lizenz** für amtliche Prüfungsfragen – Kosten/Konditionen unbekannt,
   größter finanzieller Unsicherheitsfaktor. Katalog wird 2x jährlich aktualisiert
   (1. April, 1. Oktober). Fremdsprachen als separates Modul (12 amtliche Sprachen).
2. **TÜV-Prüfungsschnittstelle** – technische Machbarkeit/Integrationsaufwand unklar
3. **Anbieterstabilität** – Fahrschulen sind skeptisch gegenüber neuen Anbietern,
   Vertrauenssignale (Langfristigkeit, Datenexport-Garantien) wichtig

Diese drei Punkte müssen vor Markteinführung geklärt werden, bevor Schnittstellen
angefragt und das Produkt live geschaltet wird.

## Laufende Kosten (recherchiert, Stand 2026)

- Cloud-TSE: 8–20€/Monat bzw. 108–240€/Jahr, pro Standort/Kasse
- Hardware-TSE: ca. 175–350€ einmalig, 5 Jahre gültig
- SEPA-Lastschrift (z.B. GoCardless): ca. 1% + 20ct, max. 1€/Transaktion
- arge tp 21 / TÜV-Kosten: unbekannt (keine öffentlichen Preise verfügbar)

## Bau-Reihenfolge

1. Fahrschulmanager (Büro-Tool) zuerst komplett fertigstellen und bei
   Pilotfahrschulen testen
2. Fahrlehrer-App danach
3. Schüler-App zuletzt (Lernbereich kann später nachgereicht werden)

## Entwicklungsansatz

- Nutzer entwickelt selbst, gemeinsam mit Claude als technischem
  Entwicklungspartner – kein externes Team, keine Agentur
- Alle Pflicht-Schnittstellen (TÜV, TSE) werden erst angefragt, wenn die
  Software technisch fertig ist
- Startkapital-Planung (Selbstbau-Szenario): Bauphase 8–12 Monate,
  ca. 2.800–10.300€ ohne die unbekannten arge/TÜV-Kosten

## Sonstige wichtige Punkte

- **Minderjährige Schüler**: DSGVO-Sonderfall, Einwilligung Erziehungsberechtigte
  nötig, Besonderheiten ab 16,5/17 Jahre (begleitetes Fahren/B196)
- **Scope-Kontrolle**: Feature-Creep aktiv vermeiden, da Solo-Projekt ohne
  bremsendes Team
- **Zahlungsabwicklung**: über fertigen Dienstleister (Stripe/GoCardless)
  abwickeln, um eigene PCI-Konformität zu umgehen
- **Code-Eigentum bei KI-Entwicklung**: Anthropic überträgt alle eigenen Rechte
  an Outputs an den Nutzer. Empfehlung: Git-Versionskontrolle von Anfang an,
  eigene Entscheidungen/Begründungen dokumentieren (aktiver menschlicher
  Gestaltungsanteil stärkt Schutzposition)

## Arbeitssprache

Alle Gespräche zu diesem Projekt auf Deutsch.

## Format-Präferenz

Vergleichsdaten, Preisrechnungen und strukturierte Vergleiche bevorzugt in
Tabellenform darstellen.

## Bewusst zurückgestellt (auf Nutzerwunsch, noch nicht entschieden)

- Konkreter Tech-Stack (Datenbank, Backend-Framework)
- Zeitplan pro Entwicklungsphase
