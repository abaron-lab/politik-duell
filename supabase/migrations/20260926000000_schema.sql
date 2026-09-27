-- „Wer liefert?“ – Grundschema (Meilenstein 3)
--
-- Datenschutz: Es gibt keine Konten, keine IP-Adressen und kein Audio.
-- Gespeichert wird nur die anonyme, neutrale Zusammenfassung eines Problems.
--
-- Zugriff: Die App (Rolle anon) darf nur lesen. Schreiben passiert
-- ausschließlich über die Edge Function `analyse` mit dem Service-Role-Key.

-- ---------------------------------------------------------------------------
-- Kuratierte Daten
-- ---------------------------------------------------------------------------

create table public.parteien (
  id              smallint primary key,
  name            text not null unique,
  kurzname        text not null unique,
  farbe           text not null check (farbe ~ '^#[0-9a-fA-F]{6}$'),
  programm_url    text not null,
  programm_stand  date not null
);

create table public.themen (
  id           smallint primary key,
  name         text not null unique,
  beschreibung text not null
);

create table public.ursachen (
  id           smallint primary key,
  thema_id     smallint not null references public.themen (id) on delete cascade,
  beschreibung text not null,
  quelle_url   text not null
);
create index on public.ursachen (thema_id);

create table public.massnahmen (
  id                 serial primary key,
  thema_id           smallint not null references public.themen (id) on delete cascade,
  partei_id          smallint not null references public.parteien (id) on delete cascade,
  beschreibung       text not null,
  ursachen_ids       smallint[] not null check (cardinality(ursachen_ids) > 0),
  wirksamkeit        smallint not null check (wirksamkeit between 0 and 3),
  umsetzbarkeit      smallint not null check (umsetzbarkeit between 0 and 3),
  -- { "mieter": { "wert": 1, "begruendung": "…" }, … }
  rollen_modifikator jsonb,
  begruendung        text not null,
  beleg_programm_url text not null,   -- mit #page=N wo möglich
  beleg_studie_url   text,
  stand              date not null,
  geprueft           boolean not null default false
);
create index on public.massnahmen (thema_id, partei_id);

-- ---------------------------------------------------------------------------
-- Spieldaten (nur über die Edge Function beschreibbar)
-- ---------------------------------------------------------------------------

create table public.runden (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  thema_id     smallint references public.themen (id) on delete set null,
  problem_text text not null check (char_length(problem_text) <= 200),
  partei_a     smallint references public.parteien (id) on delete set null,
  partei_b     smallint references public.parteien (id) on delete set null,
  punkte_a     smallint,
  punkte_b     smallint,
  status       text not null check (status in ('gewertet', 'ungeprueft', 'wert')),
  freigegeben  boolean not null default false   -- für die Wortwolke (Moderation, Meilenstein 4)
);
create index on public.runden (created_at desc) where freigegeben;

-- Probleme ohne Thema in der Datenbank – zur redaktionellen Prüfung.
create table public.review_warteschlange (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  problem_text    text not null check (char_length(problem_text) <= 200),
  einschaetzung   text check (char_length(einschaetzung) <= 400),
  erledigt        boolean not null default false
);

-- Rate-Limit pro Sitzung. Die Sitzungs-ID ist eine zufällige UUID aus dem
-- Browser (sessionStorage), ohne Bezug zu einer Person.
create table public.rate_limit (
  sitzung       uuid primary key,
  fenster_start timestamptz not null default now(),
  anzahl        integer not null default 0
);

-- Zählt eine Anfrage und gibt true zurück, solange das Limit nicht überschritten ist.
create or replace function public.rate_limit_pruefen(p_sitzung uuid, p_max integer, p_fenster interval)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anzahl integer;
begin
  insert into rate_limit as r (sitzung, fenster_start, anzahl)
  values (p_sitzung, now(), 1)
  on conflict (sitzung) do update
    set anzahl = case when r.fenster_start < now() - p_fenster then 1 else r.anzahl + 1 end,
        fenster_start = case when r.fenster_start < now() - p_fenster then now() else r.fenster_start end
  returning anzahl into v_anzahl;

  -- Alte Einträge nebenbei aufräumen.
  delete from rate_limit where fenster_start < now() - interval '1 day';

  return v_anzahl <= p_max;
end;
$$;

revoke all on function public.rate_limit_pruefen(uuid, integer, interval) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.parteien             enable row level security;
alter table public.themen               enable row level security;
alter table public.ursachen             enable row level security;
alter table public.massnahmen           enable row level security;
alter table public.runden               enable row level security;
alter table public.review_warteschlange enable row level security;
alter table public.rate_limit           enable row level security;

create policy "Parteien lesen"   on public.parteien   for select to anon, authenticated using (true);
create policy "Themen lesen"     on public.themen     for select to anon, authenticated using (true);
create policy "Ursachen lesen"   on public.ursachen   for select to anon, authenticated using (true);
create policy "Maßnahmen lesen"  on public.massnahmen for select to anon, authenticated using (true);
create policy "Freigegebene Probleme lesen" on public.runden for select to anon, authenticated using (freigegeben);

-- review_warteschlange und rate_limit: keine Policies → für anon/authenticated
-- nicht sichtbar. Schreiben auf allen Tabellen nur mit dem Service-Role-Key.
