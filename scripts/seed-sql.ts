// Baut den Inhalt von supabase/seed.sql aus dem geprüften Datenkatalog.
import { spielbareAbdeckung, spielbareMassnahmen, type Katalog } from '../src/data/katalog.ts'

const q = (v: string | null | undefined) => (v == null ? 'null' : `'${v.replace(/'/g, "''")}'`)
const zeilen = (werte: string[]) => werte.join(',\n  ')

export function seedSql(k: Katalog): string {
  const massnahmen = spielbareMassnahmen(k)
  const abdeckung = spielbareAbdeckung(k)
  const kopf = k.fiktiv
    ? '-- FIKTIVE Platzhalterdaten: Parteien, Maßnahmen, Punkte und Links sind erfunden.'
    : '-- Nur vollständig geprüfte Einträge je Thema und Partei; alles andere gilt als „noch nicht erfasst“.'
  return `-- AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
${kopf}

-- Mehrfach ausführbar: Stammdaten per Upsert, Maßnahmen und Abdeckung werden neu geschrieben.
-- Gespielte Runden bleiben erhalten.
delete from public.massnahmen;
delete from public.abdeckung;

insert into public.parteien (id, name, kurzname, farbe, programm_url, programm_stand) values
  ${zeilen(k.parteien.map((p) => `(${p.id}, ${q(p.name)}, ${q(p.kurzname)}, ${q(p.farbe)}, ${q(p.programm_url)}, ${q(p.programm_stand)})`))}
on conflict (id) do update set name = excluded.name, kurzname = excluded.kurzname, farbe = excluded.farbe,
  programm_url = excluded.programm_url, programm_stand = excluded.programm_stand;

-- Parteien, die nicht mehr im Katalog stehen (z. B. fiktive nach dem Umstieg), entfernen.
-- Gespielte Runden bleiben erhalten, ihr Parteiverweis wird leer.
delete from public.parteien where id not in (${k.parteien.map((p) => p.id).join(', ')});

insert into public.themen (id, name, beschreibung) values
  ${zeilen(k.themen.map((t) => `(${t.id}, ${q(t.name)}, ${q(t.beschreibung)})`))}
on conflict (id) do update set name = excluded.name, beschreibung = excluded.beschreibung;

insert into public.ursachen (id, thema_id, beschreibung, quelle_url) values
  ${zeilen(k.ursachen.map((u) => `(${u.id}, ${u.thema_id}, ${q(u.beschreibung)}, ${q(u.quelle_url)})`))}
on conflict (id) do update set thema_id = excluded.thema_id, beschreibung = excluded.beschreibung,
  quelle_url = excluded.quelle_url;
${
  massnahmen.length
    ? `
insert into public.massnahmen (id, thema_id, partei_id, beschreibung, ursachen_ids, wirksamkeit, umsetzbarkeit,
  rollen_modifikator, begruendung, beleg_programm_url, beleg_studie_url, stand, geprueft) values
  ${zeilen(
    massnahmen.map(
      (m) =>
        `(${m.id}, ${m.thema_id}, ${m.partei_id}, ${q(m.beschreibung)}, '{${m.ursachen_ids.join(',')}}', ${m.wirksamkeit}, ${m.umsetzbarkeit}, ` +
        `${m.rollen_modifikator ? `${q(JSON.stringify(m.rollen_modifikator))}::jsonb` : 'null'}, ${q(m.begruendung)}, ` +
        `${q(m.beleg_programm_url)}, ${q(m.beleg_studie_url)}, ${q(m.stand)}, ${m.geprueft})`,
    ),
  )};

select setval(pg_get_serial_sequence('public.massnahmen', 'id'), (select max(id) from public.massnahmen));
`
    : ''
}${
  abdeckung.length
    ? `
insert into public.abdeckung (thema_id, partei_id, art, begruendung, stand) values
  ${zeilen(abdeckung.map((a) => `(${a.thema_id}, ${a.partei_id}, ${q(a.art)}, ${q(a.begruendung)}, ${q(a.stand)})`))};
`
    : ''
}`
}
