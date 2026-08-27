-- ════════════════════════════════════════════════════════════════
-- MIGRATION: Multi-Tenant-Struktur für Fahrschul-Manager
-- ════════════════════════════════════════════════════════════════
-- Dieses Skript im Supabase SQL-Editor ausführen (Projekt → SQL Editor → New Query)
-- Reihenfolge ist wichtig, bitte als Ganzes ausführen.
-- ════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- 1. NEUE TABELLE: fahrschulen
-- Das ist die zentrale "Mandanten"-Tabelle. Jede Fahrschule = eine Zeile.
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fahrschulen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifikation / Branding (nur Betreiber darf das ändern)
  name TEXT NOT NULL,                    -- z.B. "Fahrschule Fahrwerk"
  slug TEXT NOT NULL UNIQUE,             -- z.B. "fahrwerk" -> URL /fahrwerk
  icon_url TEXT,                         -- App-Icon (PWA), in Supabase Storage
  logo_url TEXT,                         -- Logo für Header/Vorstellung
  farbe_primary TEXT DEFAULT '#E63946',  -- Branding-Akzentfarbe (Hex)
  
  -- Inhalte (Admin der Fahrschule darf das selbst ändern)
  ueber_uns_text TEXT DEFAULT '',
  adresse TEXT DEFAULT '',
  telefon TEXT DEFAULT '',
  email TEXT DEFAULT '',
  oeffnungszeiten TEXT DEFAULT '',       -- Freitext, z.B. "Mo-Fr 9-18 Uhr"
  social_instagram TEXT DEFAULT '',
  social_tiktok TEXT DEFAULT '',
  social_youtube TEXT DEFAULT '',
  google_bewertung_url TEXT DEFAULT '',
  
  -- Abrechnung
  preis_pro_schueler NUMERIC(10,2) DEFAULT 20.00,
  
  -- Feature-Schalter (Admin kann das in ihrer Maske umstellen)
  meine_schueler_aktiv BOOLEAN DEFAULT true,
  
  -- Status
  aktiv BOOLEAN DEFAULT true,            -- false = Fahrschule deaktiviert/gekündigt
  erstellt_am TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE fahrschulen IS 'Zentrale Mandanten-Tabelle: eine Zeile pro Fahrschule';


-- ────────────────────────────────────────────────────────────────
-- 2. NEUE TABELLE: fahrlehrer
-- Ersetzt den bisherigen einzelnen "Lehrer PIN 9999"-Login.
-- Jeder Fahrlehrer/Admin bekommt einen eigenen Zugang.
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fahrlehrer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fahrschule_id UUID NOT NULL REFERENCES fahrschulen(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  rolle TEXT NOT NULL DEFAULT 'lehrer' CHECK (rolle IN ('admin', 'lehrer')),
  
  -- Team-Vorstellung (für die Schülermaske sichtbar, falls im Team gezeigt)
  foto_url TEXT,
  bio_text TEXT DEFAULT '',
  im_team_sichtbar BOOLEAN DEFAULT true,
  
  aktiv BOOLEAN DEFAULT true,            -- false = Zugang deaktiviert (Mitarbeiter weg)
  erstellt_am TIMESTAMPTZ DEFAULT now(),
  
  -- Innerhalb einer Fahrschule muss die PIN eindeutig sein (nicht global)
  UNIQUE(fahrschule_id, pin)
);

COMMENT ON TABLE fahrlehrer IS 'Fahrlehrer- und Admin-Zugänge pro Fahrschule';


-- ────────────────────────────────────────────────────────────────
-- 3. NEUE TABELLE: fahrlehrer_schueler_markierung
-- "Meine Schüler"-Feature: Viele-zu-Viele, ein Fahrlehrer kann sich
-- mehrere Schüler markieren, ein Schüler kann von mehreren markiert sein
-- (z.B. bei Vertretung).
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fahrlehrer_schueler_markierung (
  fahrlehrer_id UUID NOT NULL REFERENCES fahrlehrer(id) ON DELETE CASCADE,
  schueler_id UUID NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  markiert_am TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (fahrlehrer_id, schueler_id)
);

COMMENT ON TABLE fahrlehrer_schueler_markierung IS 'Verknüpfung "meine Schüler" pro Fahrlehrer';


-- ────────────────────────────────────────────────────────────────
-- 4. NEUE TABELLE: ankuendigungen
-- News/Ankündigungen, die der Admin für die Schüler-Startseite pflegt.
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ankuendigungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fahrschule_id UUID NOT NULL REFERENCES fahrschulen(id) ON DELETE CASCADE,
  
  titel TEXT NOT NULL,
  text TEXT NOT NULL,
  typ TEXT NOT NULL DEFAULT 'info' CHECK (typ IN ('info', 'aktion', 'dringend')),
  
  gueltig_von TIMESTAMPTZ DEFAULT now(),
  gueltig_bis TIMESTAMPTZ,               -- NULL = unbegrenzt gültig
  aktiv BOOLEAN DEFAULT true,
  
  erstellt_am TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ankuendigungen IS 'Ankündigungen/News der Fahrschule für die Schüler-Startseite';


-- ────────────────────────────────────────────────────────────────
-- 5. BESTEHENDE TABELLEN erweitern: fahrschule_id ergänzen
-- Jede bisherige Tabelle bekommt eine Zuordnung zur Fahrschule.
-- ────────────────────────────────────────────────────────────────

ALTER TABLE schueler
  ADD COLUMN IF NOT EXISTS fahrschule_id UUID REFERENCES fahrschulen(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS abgerechnet_am TIMESTAMPTZ;  -- NULL = noch nicht abgerechnet

ALTER TABLE schueler_info
  ADD COLUMN IF NOT EXISTS fahrschule_id UUID REFERENCES fahrschulen(id) ON DELETE CASCADE;

ALTER TABLE notizen
  ADD COLUMN IF NOT EXISTS fahrschule_id UUID REFERENCES fahrschulen(id) ON DELETE CASCADE;

ALTER TABLE lernmaterial
  ADD COLUMN IF NOT EXISTS fahrschule_id UUID REFERENCES fahrschulen(id) ON DELETE CASCADE;

ALTER TABLE quiz_fragen
  ADD COLUMN IF NOT EXISTS fahrschule_id UUID REFERENCES fahrschulen(id) ON DELETE CASCADE;

ALTER TABLE ausbildungsstand
  ADD COLUMN IF NOT EXISTS fahrschule_id UUID REFERENCES fahrschulen(id) ON DELETE CASCADE;


-- ────────────────────────────────────────────────────────────────
-- 6. INDIZES für Performance
-- Jede Abfrage wird jetzt zusätzlich nach fahrschule_id filtern —
-- dafür brauchen wir Indizes, sonst wird's mit mehr Fahrschulen langsam.
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_schueler_fahrschule ON schueler(fahrschule_id);
CREATE INDEX IF NOT EXISTS idx_schueler_info_fahrschule ON schueler_info(fahrschule_id);
CREATE INDEX IF NOT EXISTS idx_notizen_fahrschule ON notizen(fahrschule_id);
CREATE INDEX IF NOT EXISTS idx_lernmaterial_fahrschule ON lernmaterial(fahrschule_id);
CREATE INDEX IF NOT EXISTS idx_quiz_fragen_fahrschule ON quiz_fragen(fahrschule_id);
CREATE INDEX IF NOT EXISTS idx_ausbildungsstand_fahrschule ON ausbildungsstand(fahrschule_id);
CREATE INDEX IF NOT EXISTS idx_fahrlehrer_fahrschule ON fahrlehrer(fahrschule_id);
CREATE INDEX IF NOT EXISTS idx_ankuendigungen_fahrschule ON ankuendigungen(fahrschule_id);
CREATE INDEX IF NOT EXISTS idx_fahrschulen_slug ON fahrschulen(slug);


-- ────────────────────────────────────────────────────────────────
-- 7. BESTANDSDATEN MIGRIEREN
-- Deine bisherige App (Fahrlehrer Saad) wird zur ersten Fahrschule.
-- Alle existierenden Schüler/Daten werden dieser Fahrschule zugeordnet,
-- damit nichts verloren geht.
-- ────────────────────────────────────────────────────────────────

-- Erste Fahrschule anlegen (repräsentiert die bisherige App)
INSERT INTO fahrschulen (name, slug, farbe_primary, telefon, ueber_uns_text)
VALUES (
  'Fahrlehrer Saad',
  'saad',
  '#E63946',
  '',
  'Als leidenschaftlicher Fahrlehrer in Münster helfe ich meinen Schülern, sicher und selbstbewusst ans Steuer zu kommen.'
)
ON CONFLICT (slug) DO NOTHING;

-- Alle bisherigen Datensätze dieser ersten Fahrschule zuordnen
DO $$
DECLARE
  saad_id UUID;
BEGIN
  SELECT id INTO saad_id FROM fahrschulen WHERE slug = 'saad';
  
  UPDATE schueler SET fahrschule_id = saad_id WHERE fahrschule_id IS NULL;
  UPDATE schueler_info SET fahrschule_id = saad_id WHERE fahrschule_id IS NULL;
  UPDATE notizen SET fahrschule_id = saad_id WHERE fahrschule_id IS NULL;
  UPDATE lernmaterial SET fahrschule_id = saad_id WHERE fahrschule_id IS NULL;
  UPDATE quiz_fragen SET fahrschule_id = saad_id WHERE fahrschule_id IS NULL;
  UPDATE ausbildungsstand SET fahrschule_id = saad_id WHERE fahrschule_id IS NULL;
  
  -- Ersten Fahrlehrer-Zugang anlegen (ersetzt die alte feste PIN 9999)
  INSERT INTO fahrlehrer (fahrschule_id, name, pin, rolle)
  VALUES (saad_id, 'Saad', '9999', 'admin')
  ON CONFLICT (fahrschule_id, pin) DO NOTHING;
END $$;


-- ────────────────────────────────────────────────────────────────
-- 8. WICHTIGER HINWEIS ZU ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────────
-- Diese Migration richtet die Tabellenstruktur ein, aber NOCH KEINE
-- Datenbankseitige Zugriffskontrolle (RLS). Aktuell filtert nur der
-- App-Code nach fahrschule_id — das reicht für den Start, ist aber
-- kein Schutz auf Datenbankebene. Das sollten wir vor dem ersten
-- zahlenden, produktiven Einsatz nachrüsten (eigenes Thema, da es mit
-- dem PIN-basierten Login-System zusammenhängt, das kein Supabase Auth
-- nutzt). Für jetzt (Entwicklung/erste Tests) ist das in Ordnung.
-- ────────────────────────────────────────────────────────────────


-- ════════════════════════════════════════════════════════════════
-- FERTIG. Zur Kontrolle:
-- SELECT * FROM fahrschulen;
-- SELECT * FROM fahrlehrer;
-- SELECT name, fahrschule_id FROM schueler;
-- ════════════════════════════════════════════════════════════════
