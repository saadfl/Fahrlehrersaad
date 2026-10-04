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

-- Einmaliger Einrichtungsschlüssel für die Migration (wird danach wieder gelöscht)
create table if not exists public.einrichtung_schluessel (name text primary key, wert text not null);
alter table public.einrichtung_schluessel enable row level security;
insert into public.einrichtung_schluessel(name, wert)
values ('migration', encode(gen_random_bytes(12), 'hex'))
on conflict (name) do nothing;
