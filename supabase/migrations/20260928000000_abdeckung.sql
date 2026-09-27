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
