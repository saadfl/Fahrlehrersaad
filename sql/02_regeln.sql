-- ════════════════════════════════════════════════════════════════
-- SCHRITT 4 (erst NACH der Migration der Konten ausführen!)
-- Setzt die Zugriffsregeln (RLS): Schüler sehen nur ihre eigenen Daten.
-- Supabase → SQL Editor → New query → einfügen → Run
-- ════════════════════════════════════════════════════════════════

-- Hilfsfunktionen -------------------------------------------------
create or replace function public.ist_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from fahrlehrer_profil where auth_id = auth.uid())
$$;

create or replace function public.ist_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from fahrlehrer_profil where auth_id = auth.uid() and rolle = 'admin')
$$;

create or replace function public.ist_eigener_schueler(sid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from schueler where auth_id = auth.uid() and id::text = sid)
$$;

-- alte Regeln ("using (true)") entfernen und RLS einschalten -------
do $$
declare t text; pol record;
begin
  foreach t in array array['schueler','schueler_info','ausbildungsstand','notizen','meine_schueler',
                           'lernmaterial','quiz_fragen','fahrlehrer_profil','standorte','meldungen']
  loop
    for pol in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Schüler-Daten: Lehrer/Admin alles, Schüler nur die eigenen (lesen) ----
create policy schueler_staff on schueler for all to authenticated
  using (ist_staff()) with check (ist_staff());
create policy schueler_eigen on schueler for select to authenticated
  using (auth_id = auth.uid());

create policy info_staff on schueler_info for all to authenticated
  using (ist_staff()) with check (ist_staff());
create policy info_eigen on schueler_info for select to authenticated
  using (ist_eigener_schueler(schueler_id::text));

create policy stand_staff on ausbildungsstand for all to authenticated
  using (ist_staff()) with check (ist_staff());
create policy stand_eigen on ausbildungsstand for select to authenticated
  using (ist_eigener_schueler(schueler_id::text));

create policy notizen_staff on notizen for all to authenticated
  using (ist_staff()) with check (ist_staff());
create policy notizen_eigen on notizen for select to authenticated
  using (ist_eigener_schueler(schueler_id::text));

create policy meine_staff on meine_schueler for all to authenticated
  using (ist_staff()) with check (ist_staff());
create policy meine_eigen on meine_schueler for select to authenticated
  using (ist_eigener_schueler(schueler_id::text));

-- Inhalte: alle Angemeldeten lesen, nur Admin ändert -------------------
create policy mat_lesen on lernmaterial for select to authenticated using (true);
create policy mat_admin on lernmaterial for all to authenticated
  using (ist_admin()) with check (ist_admin());

create policy quiz_lesen on quiz_fragen for select to authenticated using (true);
create policy quiz_admin on quiz_fragen for all to authenticated
  using (ist_admin()) with check (ist_admin());

create policy fl_lesen on fahrlehrer_profil for select to authenticated using (true);
create policy fl_admin on fahrlehrer_profil for all to authenticated
  using (ist_admin()) with check (ist_admin());

create policy so_lesen on standorte for select to authenticated using (true);
create policy so_admin on standorte for all to authenticated
  using (ist_admin()) with check (ist_admin());

create policy md_lesen on meldungen for select to authenticated using (true);
create policy md_admin on meldungen for all to authenticated
  using (ist_admin()) with check (ist_admin());

-- Foto-Speicher: lesen öffentlich (Bucket ist public), hochladen nur Admin ----
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname='storage' and tablename='objects'
               and (coalesce(qual,'') ilike '%ernmaterial%' or coalesce(with_check,'') ilike '%ernmaterial%')
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy lm_schreiben on storage.objects for insert to authenticated
  with check (bucket_id in ('Lernmaterial','lernmaterial') and public.ist_admin());
create policy lm_aendern on storage.objects for update to authenticated
  using (bucket_id in ('Lernmaterial','lernmaterial') and public.ist_admin());
create policy lm_loeschen on storage.objects for delete to authenticated
  using (bucket_id in ('Lernmaterial','lernmaterial') and public.ist_admin());
