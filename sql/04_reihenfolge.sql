-- Reihenfolge für Fahrlehrer und Standorte (additiv, keine Daten gehen verloren)
alter table public.fahrlehrer_profil add column if not exists reihenfolge integer;
alter table public.standorte add column if not exists reihenfolge integer;

-- bestehende Einträge nach Anlegedatum durchnummerieren
update public.fahrlehrer_profil f set reihenfolge = x.rn
from (select id, row_number() over (order by erstellt_am, id) rn from public.fahrlehrer_profil) x
where f.id = x.id and f.reihenfolge is null;
update public.standorte s set reihenfolge = x.rn
from (select id, row_number() over (order by erstellt_am, id) rn from public.standorte) x
where s.id = x.id and s.reihenfolge is null;

-- neue Einträge landen automatisch ganz unten
create or replace function public.reihenfolge_ans_ende() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.reihenfolge is null then
    execute format('select coalesce(max(reihenfolge),0)+1 from public.%I', tg_table_name) into new.reihenfolge;
  end if;
  return new;
end $$;
drop trigger if exists fl_reihenfolge on public.fahrlehrer_profil;
create trigger fl_reihenfolge before insert on public.fahrlehrer_profil for each row execute function public.reihenfolge_ans_ende();
drop trigger if exists so_reihenfolge on public.standorte;
create trigger so_reihenfolge before insert on public.standorte for each row execute function public.reihenfolge_ans_ende();
