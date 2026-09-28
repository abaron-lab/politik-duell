-- „Wer liefert?“ – Bewertung durch eingeladene Prüfende (Plan: docs/plan-pruefung.md)
--
-- Die Betreiberin lädt Personen mit Fachwissen über einen persönlichen Link ein.
-- Sie bewerten die Maßnahmen eines Themas; die Admin-Ansicht bildet daraus je
-- Maßnahme den Median. Namen stehen nur hier (nie im Repo).
--
-- Datenschutz: Bewertungen von Parteimaßnahmen können politische Haltungen
-- erkennen lassen (Art. 9 DSGVO). Deshalb: Einwilligung vor der ersten
-- Bewertung, keine IP-Adressen, keine Konten, Löschen einer Einladung löscht
-- alle Bewertungen der Person.
--
-- Zugriff: anon hat keinen Zugriff. Prüfende arbeiten nur über die Edge
-- Function `pruefung` (Service Role), die den Token-Hash prüft. Admins lesen
-- alles und verwalten Einladungen.

create table public.pruef_einladungen (
  id               uuid primary key default gen_random_uuid(),
  -- SHA-256 (hex) des Tokens. Der Token selbst wird nur einmal angezeigt.
  token_hash       text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  -- Nur intern (Admin-Ansicht).
  name             text not null check (char_length(name) between 1 and 80),
  -- Welche Themen die Person bewerten soll.
  themen           smallint[] not null check (cardinality(themen) > 0),
  erstellt         timestamptz not null default now(),
  gesperrt         boolean not null default false,
  -- Einwilligung zur Verarbeitung (Pflicht vor dem Bewerten).
  einwilligung_am  timestamptz,
  -- Einwilligung zur öffentlichen Nennung (freiwillig).
  name_oeffentlich boolean not null default false,
  check (not name_oeffentlich or einwilligung_am is not null)
);

create table public.pruef_bewertungen (
  einladung_id  uuid not null references public.pruef_einladungen (id) on delete cascade,
  -- ID aus daten/themen/*.json (ungeprüfte Maßnahmen stehen nicht in der Datenbank).
  massnahme_id  integer not null,
  thema_id      smallint not null,
  wirksamkeit   smallint check (wirksamkeit between 0 and 3),
  umsetzbarkeit smallint check (umsetzbarkeit between 0 and 3),
  notiz         text check (char_length(notiz) <= 1000),
  -- Die Empfehlung (Entwurfswerte) wird erst nach der eigenen Bewertung sichtbar.
  empfehlung_gesehen        boolean not null default false,
  -- Werte nach dem Ansehen der Empfehlung geändert? Nur zur Einordnung.
  nach_empfehlung_geaendert boolean not null default false,
  aktualisiert  timestamptz not null default now(),
  abgesendet    boolean not null default false,
  primary key (einladung_id, massnahme_id),
  check (not empfehlung_gesehen or (wirksamkeit is not null and umsetzbarkeit is not null)),
  check (not abgesendet or (wirksamkeit is not null and umsetzbarkeit is not null))
);
create index on public.pruef_bewertungen (thema_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.pruef_einladungen enable row level security;
alter table public.pruef_bewertungen enable row level security;

-- anon: keine Rechte, auch nicht über Standardrechte des Schemas.
revoke all on public.pruef_einladungen, public.pruef_bewertungen from anon;

create policy "Admins lesen Einladungen" on public.pruef_einladungen
  for select to authenticated using (public.ist_admin());
create policy "Admins legen Einladungen an" on public.pruef_einladungen
  for insert to authenticated with check (public.ist_admin());
create policy "Admins sperren Einladungen" on public.pruef_einladungen
  for update to authenticated using (public.ist_admin()) with check (public.ist_admin());
create policy "Admins löschen Einladungen" on public.pruef_einladungen
  for delete to authenticated using (public.ist_admin());

-- Admins dürfen nur sperren – Einwilligungen gibt nur die Person selbst.
revoke insert, update on public.pruef_einladungen from authenticated;
grant insert (token_hash, name, themen) on public.pruef_einladungen to authenticated;
grant update (gesperrt) on public.pruef_einladungen to authenticated;

-- Bewertungen schreibt nur die Edge Function; Admins lesen.
create policy "Admins lesen Bewertungen" on public.pruef_bewertungen
  for select to authenticated using (public.ist_admin());
revoke insert, update, delete on public.pruef_bewertungen from authenticated;

-- ---------------------------------------------------------------------------
-- Öffentliche Nennung (Methodenseite): je Thema die Zahl der Personen, die
-- abgesendet haben, und die Namen derer, die der Nennung zugestimmt haben.
-- ---------------------------------------------------------------------------

create or replace function public.pruefende_oeffentlich()
returns table (thema_id smallint, thema text, anzahl integer, namen text[])
language sql
stable
security definer
set search_path = public
as $$
  select b.thema_id,
         coalesce(t.name, 'Thema ' || b.thema_id),
         count(distinct e.id)::integer,
         coalesce(array_agg(distinct e.name order by e.name) filter (where e.name_oeffentlich), '{}')
  from pruef_bewertungen b
  join pruef_einladungen e on e.id = b.einladung_id
  left join themen t on t.id = b.thema_id
  where b.abgesendet and not e.gesperrt and e.einwilligung_am is not null
  group by b.thema_id, t.name
  order by b.thema_id;
$$;

revoke all on function public.pruefende_oeffentlich() from public;
grant execute on function public.pruefende_oeffentlich() to anon, authenticated;
