-- ════════════════════════════════════════════════════════════════
-- SCHRITT 1 (sicher, ändert nichts am Verhalten der laufenden App)
-- Supabase → SQL Editor → New query → einfügen → Run
-- ════════════════════════════════════════════════════════════════
alter table schueler add column if not exists auth_id uuid unique;
alter table schueler add column if not exists login_name text unique;
alter table fahrlehrer_profil add column if not exists auth_id uuid unique;
alter table fahrlehrer_profil add column if not exists login_name text unique;

-- neue Konten bekommen keine Klartext-PIN mehr in der Tabelle
alter table schueler alter column pin drop not null;
alter table fahrlehrer_profil alter column pin drop not null;
