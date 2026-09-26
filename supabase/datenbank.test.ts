// Prüft Migration, Seed-Daten, Row Level Security und Rate-Limit gegen ein
// echtes Postgres (PGlite, läuft im Prozess – kein Supabase nötig).
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { MASSNAHMEN } from '../src/data/mock'

const lies = (pfad: string) => readFileSync(new URL(pfad, import.meta.url), 'utf8')
const db = new PGlite()

beforeAll(async () => {
  // Rollen, die Supabase mitbringt.
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`)
  for (const datei of readdirSync(new URL('./migrations', import.meta.url)).sort()) {
    await db.exec(lies(`./migrations/${datei}`))
  }
  await db.exec(lies('./seed.sql'))
}, 30_000)

async function alsRolle<T>(rolle: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${rolle}`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}

describe('Datenbank', () => {
  it('enthält die Seed-Daten', async () => {
    const r = await db.query<{ n: number }>('select count(*)::int as n from massnahmen')
    expect(r.rows[0].n).toBe(MASSNAHMEN.length)
  })

  it('Seed ist mehrfach ausführbar', async () => {
    await db.exec(lies('./seed.sql'))
    const r = await db.query<{ n: number }>('select count(*)::int as n from parteien')
    expect(r.rows[0].n).toBe(5)
  })

  it('anon darf Stammdaten lesen', async () => {
    const r = await alsRolle('anon', () => db.query('select * from massnahmen'))
    expect(r.rows.length).toBe(MASSNAHMEN.length)
  })

  it('anon sieht nur freigegebene Runden', async () => {
    await db.exec(`insert into runden (problem_text, status, freigegeben) values ('offen', 'wert', false), ('frei', 'wert', true)`)
    const r = await alsRolle('anon', () => db.query<{ problem_text: string }>('select problem_text from runden'))
    expect(r.rows.map((x) => x.problem_text)).toEqual(['frei'])
  })

  it('anon darf nicht schreiben', async () => {
    await expect(
      alsRolle('anon', () => db.query(`insert into runden (problem_text, status) values ('x', 'wert')`)),
    ).rejects.toThrow()
    await expect(alsRolle('anon', () => db.query(`update parteien set name = 'x'`))).resolves.toMatchObject({
      affectedRows: 0,
    })
  })

  it('anon sieht Review-Warteschlange und Rate-Limit nicht', async () => {
    await db.exec(`insert into review_warteschlange (problem_text) values ('Bus fährt selten')`)
    const r = await alsRolle('anon', () => db.query('select * from review_warteschlange'))
    expect(r.rows).toHaveLength(0)
    await expect(
      alsRolle('anon', () => db.query(`select rate_limit_pruefen(gen_random_uuid(), 1, '1 minute')`)),
    ).rejects.toThrow()
  })

  it('Rate-Limit sperrt nach der erlaubten Zahl an Anfragen', async () => {
    const id = '00000000-0000-4000-8000-000000000001'
    const pruefe = async () =>
      (await db.query<{ ok: boolean }>(`select rate_limit_pruefen($1, 3, '10 minutes') as ok`, [id])).rows[0].ok
    expect([await pruefe(), await pruefe(), await pruefe(), await pruefe()]).toEqual([true, true, true, false])
  })

  it('prüft Wertebereiche', async () => {
    await expect(
      db.query(`insert into massnahmen (thema_id, partei_id, beschreibung, ursachen_ids, wirksamkeit, umsetzbarkeit,
        begruendung, beleg_programm_url, stand) values (1, 1, 'x', '{101}', 4, 1, 'x', 'https://x', now())`),
    ).rejects.toThrow()
  })
})
