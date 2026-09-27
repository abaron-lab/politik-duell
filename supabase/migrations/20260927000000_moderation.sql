-- „Wer liefert?“ – Meilenstein 4: Wortwolke, Moderation, Admin-Ansicht
--
-- Ablauf: Die Edge Function speichert zu jeder Runde ein kurzes Stichwort und
-- prüft es mit einem automatischen Filter (Beleidigungen, Namen, Hetze,
-- Kontaktdaten). In die Wortwolke kommt ein Eintrag erst, wenn ein Admin ihn
-- freigibt. Admins melden sich über Supabase Auth an und stehen in `admins`.

-- ---------------------------------------------------------------------------
-- Neue Spalten für die Moderation
-- ---------------------------------------------------------------------------

alter table public.runden
  -- 1–3 Wörter für die Wortwolke (von der KI vorgeschlagen, vom Admin änderbar)
  add column stichwort   text check (char_length(stichwort) between 1 and 40),
  -- Grund, falls der automatische Filter angeschlagen hat (dann nicht freigeben)
  add column filter_grund text check (char_length(filter_grund) <= 100),
  add column abgelehnt   boolean not null default false,
  add column moderiert_am timestamptz,
  add constraint runden_frei_oder_abgelehnt check (not (freigegeben and abgelehnt));

-- Offene Einträge für die Admin-Ansicht
create index on public.runden (created_at desc) where not freigegeben and not abgelehnt;

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------

-- Wer hier steht, darf moderieren. Eintragen nur im SQL Editor (siehe EINRICHTEN.md).
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.ist_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

revoke all on function public.ist_admin() from public, anon;
grant execute on function public.ist_admin() to authenticated;

create policy "Admins sehen sich selbst" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Zugriffsregeln für Admins
-- ---------------------------------------------------------------------------

create policy "Admins lesen alle Runden" on public.runden
  for select to authenticated using (public.ist_admin());
create policy "Admins moderieren Runden" on public.runden
  for update to authenticated using (public.ist_admin()) with check (public.ist_admin());
create policy "Admins löschen Runden" on public.runden
  for delete to authenticated using (public.ist_admin());

-- Admins dürfen nur die Moderationsfelder ändern, nicht Punkte oder Parteien.
revoke update on public.runden from anon, authenticated;
grant update (stichwort, freigegeben, abgelehnt, moderiert_am) on public.runden to authenticated;

create policy "Admins lesen Review-Warteschlange" on public.review_warteschlange
  for select to authenticated using (public.ist_admin());
create policy "Admins erledigen Review-Einträge" on public.review_warteschlange
  for update to authenticated using (public.ist_admin()) with check (public.ist_admin());
revoke update on public.review_warteschlange from anon, authenticated;
grant update (erledigt) on public.review_warteschlange to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: Wortwolke und Admin-Ansicht bekommen Änderungen live.
-- Realtime beachtet Row Level Security: anon erhält nur freigegebene Runden.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.runden, public.review_warteschlange;
  end if;
end;
$$;
