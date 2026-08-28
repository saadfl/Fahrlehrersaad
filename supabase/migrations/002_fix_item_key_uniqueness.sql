-- ════════════════════════════════════════════════════════════════
-- MIGRATION: item_key-Eindeutigkeit auf lernmaterial korrigieren
-- ════════════════════════════════════════════════════════════════
-- Dieses Skript im Supabase SQL-Editor ausführen (Projekt → SQL Editor → New Query)
--
-- Hintergrund: Vor der Multi-Tenant-Umstellung war `item_key` in der
-- Tabelle `lernmaterial` vermutlich allein UNIQUE (ein Datensatz pro
-- Ausbildungsthema). Die AUSBILDUNG-Struktur (theme.js) ist aber für
-- ALLE Fahrschulen identisch, d.h. derselbe item_key kommt jetzt bei
-- JEDER Fahrschule vor. Ohne Anpassung könnte nur eine einzige
-- Fahrschule pro item_key überhaupt Material speichern (upsert der
-- zweiten Fahrschule würde gegen die alte Unique-Constraint laufen).
--
-- AdminScreens.js geht bereits davon aus, dass der Constraint auf
-- (fahrschule_id, item_key) liegt (upsert mit onConflict:"fahrschule_id,item_key").
-- Dieses Skript stellt das her, unabhängig vom bisherigen Constraint-Namen.
--
-- Das Skript ist idempotent: mehrfaches Ausführen schadet nicht.
-- ════════════════════════════════════════════════════════════════


-- 1. Alten Unique-Constraint/-Index entfernen, der NUR auf item_key liegt
--    (Name ist uns nicht bekannt, deshalb dynamisch über den Katalog suchen)
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'lernmaterial'
      AND con.contype = 'u'
      AND (
        SELECT array_agg(a.attname ORDER BY a.attname)
        FROM unnest(con.conkey) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
      ) = ARRAY['item_key']
  LOOP
    EXECUTE format('ALTER TABLE lernmaterial DROP CONSTRAINT %I', c.conname);
    RAISE NOTICE 'Alten Constraint % entfernt', c.conname;
  END LOOP;
END $$;

-- Falls es sich um einen reinen Unique-Index (nicht Constraint) handelte
DROP INDEX IF EXISTS lernmaterial_item_key_key;
DROP INDEX IF EXISTS lernmaterial_item_key_idx;


-- 2. Neuen zusammengesetzten Unique-Constraint anlegen (falls noch nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lernmaterial_fahrschule_item_key_unique'
  ) THEN
    ALTER TABLE lernmaterial
      ADD CONSTRAINT lernmaterial_fahrschule_item_key_unique UNIQUE (fahrschule_id, item_key);
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- FERTIG. Zur Kontrolle:
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'lernmaterial'::regclass;
-- -- Erwartet: lernmaterial_fahrschule_item_key_unique (Typ 'u'), kein Constraint mehr nur auf item_key
-- ════════════════════════════════════════════════════════════════
