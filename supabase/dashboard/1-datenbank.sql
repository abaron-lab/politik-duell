-- AUTOMATISCH ERZEUGT (npm run dashboard) – nicht von Hand bearbeiten.
-- Im Supabase-Dashboard: SQL Editor → New query → alles einfügen → Run.
-- Nur beim ersten Mal komplett ausführen. Später reicht der Teil ab „seed.sql“.

begin;

-- ===== migrations/20260926000000_schema.sql =====
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

-- ===== migrations/20260927000000_moderation.sql =====
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

-- ===== migrations/20260928000000_abdeckung.sql =====
-- „Wer liefert?“ – Abdeckung: „keine Maßnahme im Programm“ vs. „noch nicht erfasst“
--
-- Pro Thema und Partei steht hier, ob das Wahlprogramm vollständig ausgewertet
-- ist: `massnahmen` (alle Maßnahmen erfasst) oder `keine` (nachweislich nichts
-- dazu im Programm). Fehlt der Eintrag, ist das Thema für die Partei noch nicht
-- erfasst – dann wird die Runde nicht gewertet, damit fehlende Daten keiner
-- Partei einen Punkt kosten. Befüllt wird die Tabelle aus daten/ (seed.sql).

create table public.abdeckung (
  thema_id     smallint not null references public.themen (id) on delete cascade,
  partei_id    smallint not null references public.parteien (id) on delete cascade,
  art          text not null check (art in ('massnahmen', 'keine')),
  -- Nur bei `keine`: was im Programm durchsucht wurde.
  begruendung  text check (char_length(begruendung) <= 400),
  stand        date not null,
  primary key (thema_id, partei_id),
  check ((art = 'keine') = (begruendung is not null))
);

alter table public.abdeckung enable row level security;
create policy "Abdeckung lesen" on public.abdeckung for select to anon, authenticated using (true);

-- Neuer Rundenstatus: Thema bekannt, aber für eine der beiden Parteien noch
-- nicht erfasst → keine Wertung, keine Punkte.
alter table public.runden drop constraint runden_status_check;
alter table public.runden add constraint runden_status_check
  check (status in ('gewertet', 'ungeprueft', 'unvollstaendig', 'wert'));

-- ===== seed.sql =====
-- AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
-- FIKTIVE Platzhalterdaten: Parteien, Maßnahmen, Punkte und Links sind erfunden.

-- Mehrfach ausführbar: Stammdaten per Upsert, Maßnahmen und Abdeckung werden neu geschrieben.
-- Gespielte Runden bleiben erhalten.
delete from public.massnahmen;
delete from public.abdeckung;

insert into public.parteien (id, name, kurzname, farbe, programm_url, programm_stand) values
  (1, 'Partei Alpha', 'Alpha', '#2bb3a3', 'https://example.org/mock/alpha/wahlprogramm.pdf', '2026-01-01'),
  (2, 'Partei Beta', 'Beta', '#8f6bff', 'https://example.org/mock/beta/wahlprogramm.pdf', '2026-01-01'),
  (3, 'Partei Gamma', 'Gamma', '#f2a33a', 'https://example.org/mock/gamma/wahlprogramm.pdf', '2026-01-01'),
  (4, 'Partei Delta', 'Delta', '#4f8fe8', 'https://example.org/mock/delta/wahlprogramm.pdf', '2026-01-01'),
  (5, 'Partei Epsilon', 'Epsilon', '#e86a8f', 'https://example.org/mock/epsilon/wahlprogramm.pdf', '2026-01-01')
on conflict (id) do update set name = excluded.name, kurzname = excluded.kurzname, farbe = excluded.farbe,
  programm_url = excluded.programm_url, programm_stand = excluded.programm_stand;

insert into public.themen (id, name, beschreibung) values
  (1, 'Arzttermine', 'Lange Wartezeiten und schwer erreichbare Praxen.'),
  (2, 'Miete', 'Hohe Mieten und schwierige Wohnungssuche.'),
  (3, 'Energiepreise', 'Hohe Kosten für Strom und Heizung.')
on conflict (id) do update set name = excluded.name, beschreibung = excluded.beschreibung;

insert into public.ursachen (id, thema_id, beschreibung, quelle_url) values
  (101, 1, 'Zu wenige Praxen, besonders auf dem Land', 'https://example.org/mock/studie/aerzteversorgung'),
  (102, 1, 'Ineffiziente Terminvergabe', 'https://example.org/mock/studie/terminvergabe'),
  (103, 1, 'Budgetierung begrenzt Behandlungen', 'https://example.org/mock/studie/budgetierung'),
  (201, 2, 'Zu wenig neue Wohnungen', 'https://example.org/mock/studie/wohnungsbau'),
  (202, 2, 'Starke Mietsteigerungen', 'https://example.org/mock/studie/mietentwicklung'),
  (203, 2, 'Hohe Baukosten und lange Genehmigungen', 'https://example.org/mock/studie/baukosten'),
  (301, 3, 'Hohe Netzentgelte', 'https://example.org/mock/studie/netzentgelte'),
  (302, 3, 'Steuern und Abgaben auf Energie', 'https://example.org/mock/studie/energiesteuern'),
  (303, 3, 'Abhängigkeit von fossilen Importen', 'https://example.org/mock/studie/importe')
on conflict (id) do update set thema_id = excluded.thema_id, beschreibung = excluded.beschreibung,
  quelle_url = excluded.quelle_url;

insert into public.massnahmen (id, thema_id, partei_id, beschreibung, ursachen_ids, wirksamkeit, umsetzbarkeit,
  rollen_modifikator, begruendung, beleg_programm_url, beleg_studie_url, stand, geprueft) values
  (1, 1, 1, 'Stipendien und Startförderung für Praxen in unterversorgten Regionen', '{101}', 3, 2, null, 'Setzt direkt an fehlenden Praxen an; Wirkung erst nach einigen Jahren.', 'https://example.org/mock/alpha/wahlprogramm.pdf#page=34', 'https://example.org/mock/studie/landarzt-stipendien', '2026-01-01', false),
  (2, 1, 2, 'Digitale Terminplattform mit Pflicht zur Freigabe freier Termine', '{102}', 2, 2, null, 'Verteilt vorhandene Termine besser, schafft aber keine neuen.', 'https://example.org/mock/beta/wahlprogramm.pdf#page=18', null, '2026-01-01', false),
  (3, 1, 2, 'Budgetgrenzen für hausärztliche Leistungen aufheben', '{103}', 2, 1, null, 'Mehr Behandlungen möglich; Finanzierung durch Kassen ungeklärt.', 'https://example.org/mock/beta/wahlprogramm.pdf#page=19', null, '2026-01-01', false),
  (4, 1, 3, 'Mehr Medizinstudienplätze', '{101}', 2, 1, null, 'Richtige Richtung, wirkt aber erst nach über zehn Jahren Ausbildung.', 'https://example.org/mock/gamma/wahlprogramm.pdf#page=52', null, '2026-01-01', false),
  (5, 1, 4, 'Hausarztpraxis als erste Anlaufstelle mit gezielter Überweisung', '{102,103}', 2, 2, null, 'Entlastet Facharzttermine; erfordert Umstellung im System.', 'https://example.org/mock/delta/wahlprogramm.pdf#page=27', 'https://example.org/mock/studie/primaerarzt', '2026-01-01', false),
  (6, 2, 1, 'Mietpreisbremse verlängern und Ausnahmen streichen', '{202}', 2, 3, '{"mieter":{"wert":1,"begruendung":"Begrenzt Mietsteigerungen für Mieter:innen unmittelbar."},"eigentuemer":{"wert":-1,"begruendung":"Begrenzt mögliche Mieteinnahmen."}}'::jsonb, 'Dämpft Anstiege schnell, schafft aber keinen neuen Wohnraum.', 'https://example.org/mock/alpha/wahlprogramm.pdf#page=12', null, '2026-01-01', false),
  (7, 2, 2, 'Baugenehmigungen digitalisieren und feste Fristen einführen', '{201,203}', 2, 2, null, 'Beschleunigt Neubau; Personal in Bauämtern bleibt Engpass.', 'https://example.org/mock/beta/wahlprogramm.pdf#page=41', 'https://example.org/mock/studie/bauamt-digital', '2026-01-01', false),
  (8, 2, 4, 'Kommunalen und genossenschaftlichen Wohnungsbau fördern', '{201}', 3, 1, null, 'Schafft dauerhaft günstigen Wohnraum; hoher Finanzbedarf.', 'https://example.org/mock/delta/wahlprogramm.pdf#page=9', null, '2026-01-01', false),
  (9, 2, 5, 'Bauvorschriften vereinfachen und Standards bündeln', '{203}', 2, 3, '{"eigentuemer":{"wert":1,"begruendung":"Senkt Kosten bei Sanierung und Neubau im Eigentum."}}'::jsonb, 'Senkt Baukosten zügig; Wirkung auf Mieten indirekt.', 'https://example.org/mock/epsilon/wahlprogramm.pdf#page=22', null, '2026-01-01', false),
  (10, 3, 1, 'Stromsteuer auf das europäische Minimum senken', '{302}', 2, 3, null, 'Sofort spürbar; Einnahmeausfall muss gegenfinanziert werden.', 'https://example.org/mock/alpha/wahlprogramm.pdf#page=45', null, '2026-01-01', false),
  (11, 3, 3, 'Netzentgelte teilweise aus dem Bundeshaushalt tragen', '{301}', 2, 2, null, 'Senkt einen großen Preisbestandteil; dauerhafte Haushaltsbelastung.', 'https://example.org/mock/gamma/wahlprogramm.pdf#page=30', 'https://example.org/mock/studie/netzentgelte-zuschuss', '2026-01-01', false),
  (12, 3, 3, 'Ausbau heimischer erneuerbarer Energien beschleunigen', '{303}', 2, 2, null, 'Verringert Importabhängigkeit mittelfristig.', 'https://example.org/mock/gamma/wahlprogramm.pdf#page=31', null, '2026-01-01', false),
  (13, 3, 4, 'Einnahmen aus CO₂-Preis als Pro-Kopf-Auszahlung zurückgeben', '{302}', 1, 2, '{"studierend":{"wert":1,"begruendung":"Pauschale Auszahlung entlastet kleine Einkommen relativ stärker."},"rentner":{"wert":1,"begruendung":"Pauschale Auszahlung entlastet kleine Einkommen relativ stärker."},"arbeitslos":{"wert":1,"begruendung":"Pauschale Auszahlung entlastet kleine Einkommen relativ stärker."}}'::jsonb, 'Gleicht Belastung aus, senkt den Preis selbst aber nicht.', 'https://example.org/mock/delta/wahlprogramm.pdf#page=38', null, '2026-01-01', false),
  (14, 3, 5, 'Langfristige Lieferverträge für Gas absichern', '{303}', 1, 2, null, 'Mehr Planbarkeit, aber kaum Einfluss auf Strom- und Netzkosten.', 'https://example.org/mock/epsilon/wahlprogramm.pdf#page=15', null, '2026-01-01', false);

select setval(pg_get_serial_sequence('public.massnahmen', 'id'), (select max(id) from public.massnahmen));

insert into public.abdeckung (thema_id, partei_id, art, begruendung, stand) values
  (1, 1, 'massnahmen', null, '2026-01-01'),
  (1, 2, 'massnahmen', null, '2026-01-01'),
  (1, 3, 'massnahmen', null, '2026-01-01'),
  (1, 4, 'massnahmen', null, '2026-01-01'),
  (1, 5, 'keine', 'Kapitel „Gesundheit“ und Stichwortsuche durchsucht, nichts dazu gefunden (fiktives Beispiel).', '2026-01-01'),
  (2, 1, 'massnahmen', null, '2026-01-01'),
  (2, 2, 'massnahmen', null, '2026-01-01'),
  (2, 3, 'keine', 'Kapitel „Bauen und Wohnen“ und Stichwortsuche durchsucht, nichts dazu gefunden (fiktives Beispiel).', '2026-01-01'),
  (2, 4, 'massnahmen', null, '2026-01-01'),
  (2, 5, 'massnahmen', null, '2026-01-01'),
  (3, 1, 'massnahmen', null, '2026-01-01'),
  (3, 2, 'keine', 'Kapitel „Energie und Klima“ und Stichwortsuche durchsucht, nichts dazu gefunden (fiktives Beispiel).', '2026-01-01'),
  (3, 3, 'massnahmen', null, '2026-01-01'),
  (3, 4, 'massnahmen', null, '2026-01-01'),
  (3, 5, 'massnahmen', null, '2026-01-01');

commit;
