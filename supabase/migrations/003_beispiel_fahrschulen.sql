-- ════════════════════════════════════════════════════════════════
-- MIGRATION: Zwei Test-Fahrschulen anlegen
-- ════════════════════════════════════════════════════════════════
-- Dieses Skript im Supabase SQL-Editor ausführen (Projekt → SQL Editor → New Query)
--
-- Legt zwei Beispiel-Fahrschulen an, um das Multi-Tenant-Setup end-to-end
-- zu testen (zwei parallele Mandanten mit eigenem Branding und eigenen
-- Admin-Zugängen, unter /fahrwerk und /fahrfreude erreichbar).
--
-- Idempotent: mehrfaches Ausführen legt keine Duplikate an
-- (ON CONFLICT DO NOTHING über slug bzw. fahrschule_id+pin).
-- ════════════════════════════════════════════════════════════════

INSERT INTO fahrschulen (name, slug, farbe_primary, preis_pro_schueler, ueber_uns_text)
VALUES (
  'Fahrschule Fahrwerk',
  'fahrwerk',
  '#2563EB',
  20.00,
  'Deine Fahrschule Fahrwerk – sicher ans Ziel.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO fahrschulen (name, slug, farbe_primary, preis_pro_schueler, ueber_uns_text)
VALUES (
  'Fahrschule Fahrfreude',
  'fahrfreude',
  '#16A34A',
  20.00,
  'Fahrfreude von Anfang an.'
)
ON CONFLICT (slug) DO NOTHING;

-- Je einen Admin-Zugang pro Test-Fahrschule anlegen
DO $$
DECLARE
  fahrwerk_id UUID;
  fahrfreude_id UUID;
BEGIN
  SELECT id INTO fahrwerk_id FROM fahrschulen WHERE slug = 'fahrwerk';
  SELECT id INTO fahrfreude_id FROM fahrschulen WHERE slug = 'fahrfreude';

  INSERT INTO fahrlehrer (fahrschule_id, name, pin, rolle)
  VALUES (fahrwerk_id, 'Admin Fahrwerk', '1111', 'admin')
  ON CONFLICT (fahrschule_id, pin) DO NOTHING;

  INSERT INTO fahrlehrer (fahrschule_id, name, pin, rolle)
  VALUES (fahrfreude_id, 'Admin Fahrfreude', '2222', 'admin')
  ON CONFLICT (fahrschule_id, pin) DO NOTHING;
END $$;


-- ════════════════════════════════════════════════════════════════
-- FERTIG. Zur Kontrolle:
-- SELECT name, slug, farbe_primary FROM fahrschulen ORDER BY erstellt_am;
-- SELECT f.name AS fahrschule, l.name, l.pin, l.rolle FROM fahrlehrer l JOIN fahrschulen f ON f.id = l.fahrschule_id;
--
-- Danach testen: /fahrwerk und /fahrfreude aufrufen, jeweils mit
-- Name "Admin Fahrwerk"/PIN 1111 bzw. "Admin Fahrfreude"/PIN 2222 einloggen.
-- ════════════════════════════════════════════════════════════════
