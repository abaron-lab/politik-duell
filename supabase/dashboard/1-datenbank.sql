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

-- ===== migrations/20260929000000_pruefung.sql =====
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

-- ===== seed.sql =====
-- AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
-- Nur vollständig geprüfte Einträge je Thema und Partei; alles andere gilt als „noch nicht erfasst“.

-- Mehrfach ausführbar: Stammdaten per Upsert, Maßnahmen und Abdeckung werden neu geschrieben.
-- Gespielte Runden bleiben erhalten.
delete from public.massnahmen;
delete from public.abdeckung;

insert into public.parteien (id, name, kurzname, farbe, programm_url, programm_stand) values
  (11, 'CDU/CSU', 'Union', '#8a96a3', 'https://www.cdu.de/app/uploads/2025/01/km_btw_2025_wahlprogramm_langfassung_ansicht.pdf', '2024-12-17'),
  (12, 'SPD', 'SPD', '#f0605d', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf', '2025-01-11'),
  (13, 'Bündnis 90/Die Grünen', 'Grüne', '#6fbf4a', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf', '2025-01-26'),
  (14, 'FDP', 'FDP', '#ffe74d', 'https://www.fdp.de/sites/default/files/2024-12/fdp-wahlprogramm_2025.pdf', '2025-02-09'),
  (15, 'AfD', 'AfD', '#4fb8e8', 'https://www.afd.de/wp-content/uploads/2025/02/AfD_Bundestagswahlprogramm2025_web.pdf', '2025-01-12'),
  (16, 'Die Linke', 'Linke', '#e0659b', 'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf', '2025-01-18'),
  (17, 'BSW', 'BSW', '#b784c9', 'https://bsw-vg.de/wp-content/themes/bsw/assets/downloads/BSW%20Wahlprogramm%202025.pdf', '2025-01-12')
on conflict (id) do update set name = excluded.name, kurzname = excluded.kurzname, farbe = excluded.farbe,
  programm_url = excluded.programm_url, programm_stand = excluded.programm_stand;

-- Parteien, die nicht mehr im Katalog stehen (z. B. fiktive nach dem Umstieg), entfernen.
-- Gespielte Runden bleiben erhalten, ihr Parteiverweis wird leer.
delete from public.parteien where id not in (11, 12, 13, 14, 15, 16, 17);

insert into public.themen (id, name, beschreibung) values
  (1, 'Arzttermine', 'Lange Wartezeiten und schwer erreichbare Praxen.'),
  (2, 'Miete', 'Hohe Mieten und schwierige Wohnungssuche.'),
  (3, 'Energiepreise', 'Hohe Kosten für Strom und Heizung.'),
  (4, 'Schule', 'Unterrichtsausfall, fehlende Lehrkräfte und marode Schulgebäude.'),
  (5, 'Arbeitsplätze', 'Unsichere Jobs, Stellenabbau und schwache Wirtschaft.'),
  (6, 'Zuwanderung und Integration', 'Probleme bei Aufnahme, Integration und Rückführung von Zugewanderten.'),
  (7, 'Rente', 'Niedrige Renten und Sorge um die Altersvorsorge.'),
  (8, 'Bus und Bahn', 'Seltene Verbindungen, Ausfälle und Verspätungen.'),
  (9, 'Sicherheit', 'Sich im Alltag unsicher fühlen oder Opfer von Kriminalität werden.'),
  (10, 'Pflege', 'Pflegeplatz oder Pflegedienst finden, hohe Kosten, überlastete Angehörige.')
on conflict (id) do update set name = excluded.name, beschreibung = excluded.beschreibung;

insert into public.ursachen (id, thema_id, beschreibung, quelle_url) values
  (101, 1, 'Zu wenige Hausarztpraxen, besonders auf dem Land; viele Ärztinnen und Ärzte gehen bald in den Ruhestand', 'https://idw-online.de/de/news769524'),
  (102, 1, 'Termine und Wege durch das Gesundheitssystem werden kaum gesteuert; knappes Personal wird nicht gezielt eingesetzt', 'https://www.svr-gesundheit.de/publikationen/gutachten-2024/'),
  (103, 1, 'Unterschiedliche Vergütung: Facharztpraxen vergeben Termine bevorzugt an Privatversicherte', 'https://idw-online.de/de/news750098'),
  (201, 2, 'Es werden weniger Wohnungen gebaut als gebraucht (Bedarf laut Prognose rund 320.000 pro Jahr)', 'https://www.bbsr.bund.de/BBSR/DE/presse/presseinformationen/2025/wohnungsbedarfsprognose.html'),
  (202, 2, 'Mieten bei Neuvermietung liegen rund 43 % über Bestandsmieten, in großen Städten besonders hoch', 'https://www.bbsr.bund.de/BBSR/DE/startseite/topmeldungen/entwicklung-wohnungsmieten-2025.html'),
  (203, 2, 'Stark gestiegene Baukosten: Wohngebäude wurden 2010 bis 2025 um 89 % teurer, mehr als doppelt so stark wie die Inflation', 'https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Baupreise-Immobilienpreisindex/_inhalt.html'),
  (204, 2, 'Mieten in laufenden Verträgen steigen weiter (Nettokaltmieten 2025 im Schnitt +2,1 %)', 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/01/PD26_019_611.html'),
  (301, 3, 'Hohe Netzentgelte für den Betrieb und Ausbau der Stromnetze', 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/PreiseAbschlaege/Tarife-table.html'),
  (302, 3, 'Steuern, Abgaben und Umlagen machen einen großen Teil des Strompreises aus', 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/PreiseAbschlaege/Tarife-table.html'),
  (303, 3, 'Rund 70 % der Energie wird importiert, vor allem Öl, Gas und Steinkohle', 'https://www.umweltbundesamt.de/daten/umweltzustand-trends/energie/primaerenergiegewinnung-importe'),
  (401, 4, 'Zu wenige Lehrkräfte: Kurzfristig liegt das Angebot deutlich unter dem Einstellungsbedarf', 'https://www.kmk.org/downloads-dokumente/statistik/schulstatistik/lehrkraefteeinstellungsbedarf-und-angebot.html'),
  (402, 4, 'Großer Sanierungsstau bei Schulgebäuden (rund 68 Mrd. Euro, größter Posten der Kommunen)', 'https://www.bundestag.de/resource/blob/1157306/KfW-Kommunalpanel-2025.pdf'),
  (403, 4, 'Wachsende Lernrückstände: Ein Drittel der Neuntklässler verfehlt den Mindeststandard in Mathematik', 'https://www.iqb.hu-berlin.de/de/schule/sekundarstufe-i/bildungstrend/2024/'),
  (501, 5, 'Die Industrie verliert an Wettbewerbsfähigkeit; Strukturwandel und geopolitische Veränderungen gefährden das Exportmodell', 'https://www.sachverstaendigenrat-wirtschaft.de/fileadmin/dateiablage/gutachten/jg202526/JG202526_Kurzfassung.pdf'),
  (502, 5, 'Strukturwandel: Die Industrie baut Stellen ab, neue Jobs entstehen vor allem in anderen Branchen', 'https://iab.de/presseinfo/iab-prognose-fuer-2026-2027-erwerbstaetigkeit-schrumpft-trotz-besserer-konjunktur/'),
  (503, 5, 'Löhne in Ostdeutschland liegen weiterhin deutlich unter denen im Westen', 'https://www.destatis.de/DE/Themen/Querschnitt/35-Jahre-Deutsche-Einheit/Vermoegen-Einkommen/Textbausteine/01_verdienstunterschiede.html'),
  (601, 6, 'Unterbringung bleibt für die meisten Kommunen herausfordernd; Ausländerbehörden sind besonders stark belastet', 'https://mediendienst-integration.de/fileadmin/Dateien/EXPERTISE_FLUECHTLINGSAUFNAHME_IN_DEN_KOMMUNEN_MEDIENDIENST_INTEGRATION_NOV_2025_FINAL.pdf'),
  (602, 6, 'Asyl- und Gerichtsverfahren dauern lange (im Schnitt rund anderthalb Jahre bis zur rechtskräftigen Entscheidung)', 'https://www.bundestag.de/presse/hib/kurzmeldungen-1145824'),
  (603, 6, 'Sprachkurse, Anerkennung von Abschlüssen und Zugang zum Arbeitsmarkt dauern lange', 'https://iab-forum.de/10-jahre-fluchtmigration-2015-was-integration-foerdert-und-was-sie-bremst/'),
  (604, 6, 'Viele Ausreisepflichtige werden nicht zurückgeführt, etwa wegen fehlender Papiere', 'https://mediendienst-integration.de/fluechtlinge/abschiebungen/warum-werden-ausreisepflichtige-personen-nicht-abgeschoben/'),
  (701, 7, 'Immer weniger Beitragszahlende kommen auf eine Rentnerin oder einen Rentner', 'https://www.demografie-portal.de/DE/Fakten/altersrentner-beitragszahler.html'),
  (702, 7, 'Niedrige Löhne und Lücken im Erwerbsleben (z. B. Arbeitslosigkeit) führen zu niedrigen Rentenansprüchen', 'https://www.diw.de/sixcms/detail.php?id=diw_01.c.402060.de'),
  (703, 7, 'Viele Beschäftigte haben keine betriebliche Altersvorsorge, vor allem in kleinen Betrieben', 'https://www.bpb.de/themen/soziale-lage/rentenpolitik/291012/empirische-befunde-zur-betrieblichen-altersversorgung/'),
  (801, 8, 'Rund 21 Millionen Menschen fehlt ein gutes Grundangebot an Bus und Bahn, besonders auf dem Land', 'https://www.agora-verkehrswende.de/aktuelles/oev-atlas-zeigt-grosse-unterschiede-beim-bus-und-bahnangebot'),
  (802, 8, 'Marodes, überaltertes Schienennetz mit wachsendem Nachholbedarf', 'https://www.bundesrechnungshof.de/fileadmin/import/SharedDocs/Downloads/DE/Berichte/2025/evaluation-luf-3_volltext-evaluation-luf-3_volltext.pdf'),
  (803, 8, 'Zu wenige Bus- und Straßenbahnfahrerinnen und -fahrer; viele Stellen bleiben unbesetzt', 'https://www.kofa.de/daten-und-fakten/studien/fachkraeftereport-juni-2025/'),
  (901, 9, 'Unsicherheit ballt sich an bestimmten Orten: nachts fühlen sich viele an Bahnhöfen und in Parks unsicher', 'https://www.bka.de/DE/Presse/Listenseite_Pressemitteilungen/2026/Presse2026/260420_PM_PKS_SKiD.html'),
  (902, 9, 'Überlastete Strafjustiz: Rund eine Million offene Ermittlungsverfahren, Verfahren dauern lange', 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2025/10/PD25_360_2421.html'),
  (903, 9, 'Junge Menschen werden häufiger Opfer von Gewalt; die Zahl tatverdächtiger Kinder steigt', 'https://www.bka.de/DE/Presse/Listenseite_Pressemitteilungen/2026/Presse2026/260420_PM_PKS_SKiD.html'),
  (1001, 10, 'Zu wenige Pflegekräfte; bis 2049 fehlen je nach Szenario 280.000 bis 690.000', 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2024/01/PD24_033_23_12.html'),
  (1002, 10, 'Steigende Eigenanteile im Pflegeheim (im ersten Jahr im Schnitt über 3.300 Euro im Monat)', 'https://www.vdek.com/presse/pressemitteilungen/2026/stationaere-pflege-eigenanteile-juli-2026.html'),
  (1003, 10, 'Durch die Alterung steigt die Zahl der Pflegebedürftigen deutlich', 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2023/03/PD23_124_12.html'),
  (1004, 10, 'Pflegende Angehörige tragen die Hauptlast; Entlastungsangebote werden wenig genutzt', 'https://www.zqp.de/thema/entlastung-pflegende/')
on conflict (id) do update set thema_id = excluded.thema_id, beschreibung = excluded.beschreibung,
  quelle_url = excluded.quelle_url;

commit;
