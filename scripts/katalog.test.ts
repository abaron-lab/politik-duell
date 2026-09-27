import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { pruefeDatenordner } from './katalog-laden'
import { seedSql } from './seed-sql'
import { pruefeKatalog, spielbareAbdeckung, spielbareMassnahmen, type Datei } from '../src/data/katalog'

// Kleiner, gültiger Katalog mit echten (nicht fiktiven) Regeln als Ausgangspunkt.
const parteien = (fiktiv = false): Datei => ({
  pfad: 'parteien.json',
  inhalt: {
    fiktiv,
    parteien: [
      { id: 1, name: 'Partei Eins', kurzname: 'Eins', farbe: '#112233', programm_url: 'https://eins.de/programm.pdf', programm_stand: '2026-01-01' },
      { id: 2, name: 'Partei Zwei', kurzname: 'Zwei', farbe: '#445566', programm_url: 'https://zwei.de/programm.pdf', programm_stand: '2026-02-01' },
    ],
  },
})

const massnahme = (ueber: Record<string, unknown> = {}) => ({
  id: 1,
  beschreibung: 'Mehr Praxen',
  ursachen_ids: [11],
  wirksamkeit: 3,
  umsetzbarkeit: 2,
  begruendung: 'Setzt an der Ursache an.',
  beleg_programm_url: 'https://eins.de/programm.pdf#page=4',
  stand: '2026-03-01',
  geprueft: true,
  ...ueber,
})

const thema = (ueber: Record<string, unknown> = {}): Datei => ({
  pfad: 'themen/01-arzt.json',
  inhalt: {
    id: 1,
    name: 'Arzttermine',
    beschreibung: 'Lange Wartezeiten.',
    ursachen: [{ id: 11, beschreibung: 'Zu wenige Praxen', quelle_url: 'https://studie.de/aerzte' }],
    abdeckung: [
      { partei_id: 1, massnahmen: [massnahme()] },
      { partei_id: 2, keine_massnahme: { begruendung: 'Programm durchsucht, nichts gefunden.', stand: '2026-03-01', geprueft: true } },
    ],
    ...ueber,
  },
})

const fehlerVon = (t: Datei, p = parteien()) => pruefeKatalog(p, [t]).fehler.join('\n')

describe('Datenkatalog: Prüfregeln', () => {
  it('akzeptiert einen vollständigen, belegten Katalog', () => {
    const { katalog, fehler, warnungen } = pruefeKatalog(parteien(), [thema()])
    expect(fehler).toEqual([])
    expect(warnungen).toEqual([])
    expect(katalog.massnahmen[0]).toMatchObject({ id: 1, thema_id: 1, partei_id: 1 })
    expect(katalog.ursachen[0]).toMatchObject({ id: 11, thema_id: 1 })
    expect(katalog.abdeckung).toEqual([
      { thema_id: 1, partei_id: 1, art: 'massnahmen', begruendung: null, stand: '2026-03-01', geprueft: true },
      { thema_id: 1, partei_id: 2, art: 'keine', begruendung: 'Programm durchsucht, nichts gefunden.', stand: '2026-03-01', geprueft: true },
    ])
  })

  it('verlangt für jede Partei einen Eintrag in der Abdeckung', () => {
    expect(fehlerVon(thema({ abdeckung: [{ partei_id: 1, massnahmen: [massnahme()] }] }))).toMatch(/„Zwei“ \(2\) fehlt in „abdeckung“/)
  })

  it('verlangt genau eines von massnahmen oder keine_massnahme', () => {
    const doppelt = { partei_id: 2, massnahmen: [massnahme({ id: 2 })], keine_massnahme: { begruendung: 'x', stand: '2026-03-01', geprueft: true } }
    expect(fehlerVon(thema({ abdeckung: [{ partei_id: 1, massnahmen: [massnahme()] }, doppelt] }))).toMatch(/genau eines/)
    expect(fehlerVon(thema({ abdeckung: [{ partei_id: 1, massnahmen: [] }, { partei_id: 2 }] }))).toMatch(/mindestens eine Maßnahme/)
  })

  it('verlangt einen Beleg mit Seitenanker im Programm genau dieser Partei', () => {
    const ohneAnker = thema({ abdeckung: [{ partei_id: 1, massnahmen: [massnahme({ beleg_programm_url: 'https://eins.de/programm.pdf' })] }, { partei_id: 2, keine_massnahme: { begruendung: 'x', stand: '2026-03-01', geprueft: true } }] })
    expect(fehlerVon(ohneAnker)).toMatch(/Seitenanker/)
    const fremd = thema({ abdeckung: [{ partei_id: 1, massnahmen: [massnahme({ beleg_programm_url: 'https://zwei.de/programm.pdf#page=3' })] }, { partei_id: 2, keine_massnahme: { begruendung: 'x', stand: '2026-03-01', geprueft: true } }] })
    expect(fehlerVon(fremd)).toMatch(/nicht auf das Programm der Partei/)
  })

  it('lehnt Werte außerhalb 0–3, fremde Ursachen und unbekannte Rollen ab', () => {
    const mit = (m: Record<string, unknown>) =>
      fehlerVon(thema({ abdeckung: [{ partei_id: 1, massnahmen: [massnahme(m)] }, { partei_id: 2, keine_massnahme: { begruendung: 'x', stand: '2026-03-01', geprueft: true } }] }))
    expect(mit({ wirksamkeit: 4 })).toMatch(/„wirksamkeit“ muss eine ganze Zahl von 0 bis 3/)
    expect(mit({ umsetzbarkeit: 1.5 })).toMatch(/„umsetzbarkeit“/)
    expect(mit({ ursachen_ids: [99] })).toMatch(/Ursache 99 gehört nicht zum Thema/)
    expect(mit({ rollen_modifikator: { pilot: { wert: 1, begruendung: 'x' } } })).toMatch(/unbekannte Rolle/)
    expect(mit({ rollen_modifikator: { mieter: { wert: 1 } } })).toMatch(/„begruendung“ fehlt/)
    expect(mit({ rollen_modifikator: { mieter: { wert: 3, begruendung: 'x' } } })).toMatch(/von -2 bis 2/)
    expect(mit({ wirkung: 3 })).toMatch(/unbekanntes Feld „wirkung“/)
  })

  it('verlangt Quellen für Ursachen und verbietet Platzhalter-Links bei echten Daten', () => {
    expect(fehlerVon(thema({ ursachen: [{ id: 11, beschreibung: 'Zu wenige Praxen' }] }))).toMatch(/„quelle_url“ fehlt/)
    const platzhalter = thema({ ursachen: [{ id: 11, beschreibung: 'x', quelle_url: 'https://example.org/studie' }] })
    expect(fehlerVon(platzhalter)).toMatch(/Platzhalter-Link/)
    expect(fehlerVon(platzhalter, parteien(true))).not.toMatch(/Platzhalter-Link/)
  })

  it('verlangt eine Neuprüfung, wenn der Eintrag älter als das Programm ist', () => {
    const alt = thema({ abdeckung: [{ partei_id: 1, massnahmen: [massnahme({ stand: '2025-12-01' })] }, { partei_id: 2, keine_massnahme: { begruendung: 'x', stand: '2026-01-15', geprueft: true } }] })
    const f = fehlerVon(alt)
    expect(f).toMatch(/2025-12-01 liegt vor dem Programmstand 2026-01-01/)
    expect(f).toMatch(/2026-01-15 liegt vor dem Programmstand 2026-02-01/)
  })

  it('erkennt doppelte IDs über Dateien hinweg', () => {
    const zweites = thema({ name: 'Anderes' })
    const f = pruefeKatalog(parteien(), [thema(), zweites]).fehler.join('\n')
    expect(f).toMatch(/Themen-ID 1 ist doppelt/)
    expect(f).toMatch(/Ursachen-ID 11 ist doppelt/)
    expect(f).toMatch(/Maßnahmen-ID 1 ist doppelt/)
  })

  it('übernimmt bei echten Daten nur vollständig geprüfte Einträge je Thema und Partei', () => {
    // Partei 1: eine Maßnahme geprüft, eine nicht → ganzer Eintrag gilt als „noch nicht erfasst“.
    const t = thema({ abdeckung: [{ partei_id: 1, massnahmen: [massnahme(), massnahme({ id: 2, geprueft: false })] }, { partei_id: 2, keine_massnahme: { begruendung: 'x', stand: '2026-03-01', geprueft: true } }] })
    const echt = pruefeKatalog(parteien(), [t])
    expect(echt.fehler).toEqual([])
    expect(echt.warnungen).toHaveLength(1)
    expect(spielbareMassnahmen(echt.katalog)).toEqual([])
    expect(spielbareAbdeckung(echt.katalog)).toEqual([
      { thema_id: 1, partei_id: 2, art: 'keine', begruendung: 'x', stand: '2026-03-01' },
    ])

    // Sind alle Maßnahmen geprüft, zählt der Eintrag.
    const fertig = thema({ abdeckung: [{ partei_id: 1, massnahmen: [massnahme(), massnahme({ id: 2 })] }, { partei_id: 2, keine_massnahme: { begruendung: 'x', stand: '2026-03-01', geprueft: false } }] })
    const k = pruefeKatalog(parteien(), [fertig]).katalog
    expect(spielbareMassnahmen(k).map((m) => m.id)).toEqual([1, 2])
    expect(spielbareAbdeckung(k).map((a) => a.partei_id)).toEqual([1])

    const fiktiv = pruefeKatalog(parteien(true), [t])
    expect(fiktiv.warnungen).toEqual([])
    expect(spielbareMassnahmen(fiktiv.katalog).map((m) => m.id)).toEqual([1, 2])
  })
})

describe('Datenkatalog im Repo (daten/)', () => {
  const { katalog, fehler } = pruefeDatenordner()

  it('ist fehlerfrei', () => {
    expect(fehler).toEqual([])
  })

  it('deckt jede Kombination aus Thema und Partei ab', () => {
    expect(katalog.abdeckung).toHaveLength(katalog.themen.length * katalog.parteien.length)
  })

  it('supabase/seed.sql ist aktuell (sonst: npm run seed)', () => {
    const datei = readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8')
    expect(datei).toBe(seedSql(katalog))
  })
})
