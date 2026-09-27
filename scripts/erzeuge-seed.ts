// Erzeugt supabase/seed.sql aus den Mock-Daten in src/data/mock.ts.
// Aufruf: npm run seed
import { writeFileSync } from 'node:fs'
import { MASSNAHMEN, PARTEIEN, THEMEN, URSACHEN } from '../src/data/mock.ts'

const q = (v: string | null | undefined) => (v == null ? 'null' : `'${v.replace(/'/g, "''")}'`)
const zeilen = (werte: string[]) => werte.join(',\n  ')

const sql = `-- AUTOMATISCH ERZEUGT aus src/data/mock.ts (npm run seed) – nicht von Hand bearbeiten.
-- FIKTIVE Platzhalterdaten: Parteien, Maßnahmen, Punkte und Links sind erfunden.

-- Mehrfach ausführbar: Stammdaten per Upsert, Maßnahmen werden neu geschrieben.
-- Gespielte Runden bleiben erhalten.
delete from public.massnahmen;

insert into public.parteien (id, name, kurzname, farbe, programm_url, programm_stand) values
  ${zeilen(PARTEIEN.map((p) => `(${p.id}, ${q(p.name)}, ${q(p.kurzname)}, ${q(p.farbe)}, ${q(p.programm_url)}, ${q(p.programm_stand)})`))}
on conflict (id) do update set name = excluded.name, kurzname = excluded.kurzname, farbe = excluded.farbe,
  programm_url = excluded.programm_url, programm_stand = excluded.programm_stand;

insert into public.themen (id, name, beschreibung) values
  ${zeilen(THEMEN.map((t) => `(${t.id}, ${q(t.name)}, ${q(t.beschreibung)})`))}
on conflict (id) do update set name = excluded.name, beschreibung = excluded.beschreibung;

insert into public.ursachen (id, thema_id, beschreibung, quelle_url) values
  ${zeilen(URSACHEN.map((u) => `(${u.id}, ${u.thema_id}, ${q(u.beschreibung)}, ${q(u.quelle_url)})`))}
on conflict (id) do update set thema_id = excluded.thema_id, beschreibung = excluded.beschreibung,
  quelle_url = excluded.quelle_url;

insert into public.massnahmen (id, thema_id, partei_id, beschreibung, ursachen_ids, wirksamkeit, umsetzbarkeit,
  rollen_modifikator, begruendung, beleg_programm_url, beleg_studie_url, stand, geprueft) values
  ${zeilen(
    MASSNAHMEN.map(
      (m) =>
        `(${m.id}, ${m.thema_id}, ${m.partei_id}, ${q(m.beschreibung)}, '{${m.ursachen_ids.join(',')}}', ${m.wirksamkeit}, ${m.umsetzbarkeit}, ` +
        `${m.rollen_modifikator ? `${q(JSON.stringify(m.rollen_modifikator))}::jsonb` : 'null'}, ${q(m.begruendung)}, ` +
        `${q(m.beleg_programm_url)}, ${q(m.beleg_studie_url)}, ${q(m.stand)}, ${m.geprueft})`,
    ),
  )};

select setval(pg_get_serial_sequence('public.massnahmen', 'id'), (select max(id) from public.massnahmen));
`

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql)
console.log('supabase/seed.sql geschrieben.')
