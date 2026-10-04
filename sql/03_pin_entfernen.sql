-- ════════════════════════════════════════════════════════════════
-- SCHRITT 6 (erst wenn alles getestet ist): Klartext-PINs löschen
-- ════════════════════════════════════════════════════════════════
alter table schueler drop column if exists pin;
alter table fahrlehrer_profil drop column if exists pin;
