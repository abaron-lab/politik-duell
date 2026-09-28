import { beforeEach, describe, expect, it } from 'vitest'
import { EingabeFehler } from './fehler.ts'
import {
  bearbeitePruefung,
  neuerToken,
  pruefePruefAnfrage,
  TOKEN_MUSTER,
  tokenHash,
  type BewertungEingabe,
  type Einladung,
  type GespeicherteBewertung,
  type PruefAnfrage,
  type PruefSpeicher,
} from './pruefung.ts'

const KATALOG = { 2: [2001, 2002], 3: [3001] }

/** Speicher im Arbeitsspeicher, verhält sich wie die Tabellen. */
function testSpeicher(einladungen: (Einladung & { hash: string })[], limit = Infinity) {
  const bewertungen = new Map<string, GespeicherteBewertung[]>()
  const zaehler = new Map<string, number>()
  const s: PruefSpeicher = {
    async imLimit(k) {
      zaehler.set(k, (zaehler.get(k) ?? 0) + 1)
      return zaehler.get(k)! <= limit
    },
    async einladung(hash) {
      const e = einladungen.find((x) => x.hash === hash)
      return e ? { ...e } : null
    },
    async bewertungen(id) {
      return (bewertungen.get(id) ?? []).map((b) => ({ ...b }))
    },
    async einwilligen(id, nameOeffentlich) {
      const e = einladungen.find((x) => x.id === id)!
      e.einwilligung_am = '2026-10-01T10:00:00Z'
      e.name_oeffentlich = nameOeffentlich
    },
    async speichern(id, zeilen) {
      const liste = bewertungen.get(id) ?? []
      for (const z of zeilen) {
        const i = liste.findIndex((b) => b.massnahme_id === z.massnahme_id)
        if (i >= 0) liste[i] = z
        else liste.push(z)
      }
      bewertungen.set(id, liste)
    },
    async absenden(id, themaId) {
      for (const b of bewertungen.get(id) ?? []) if (b.thema_id === themaId) b.abgesendet = true
    },
    async widerrufen(id) {
      bewertungen.delete(id)
      const e = einladungen.find((x) => x.id === id)!
      e.einwilligung_am = null
      e.name_oeffentlich = false
    },
  }
  return { s, bewertungen }
}

const bewertung = (ueber: Partial<BewertungEingabe> = {}): BewertungEingabe => ({
  massnahme_id: 2001,
  wirksamkeit: 2,
  umsetzbarkeit: 3,
  notiz: null,
  empfehlung_gesehen: false,
  ...ueber,
})

describe('Token', () => {
  it('neue Tokens haben das erwartete Format und sind verschieden', () => {
    const a = neuerToken()
    expect(a).toMatch(TOKEN_MUSTER)
    expect(neuerToken()).not.toBe(a)
  })

  it('Hash ist SHA-256 in Hex', async () => {
    expect(await tokenHash('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('Anfrage prüfen', () => {
  const fehler = (roh: unknown) => () => pruefePruefAnfrage(roh)

  it('akzeptiert gültige Aktionen', () => {
    expect(pruefePruefAnfrage({ token: 't', aktion: 'laden' })).toEqual({ token: 't', aktion: 'laden' })
    expect(pruefePruefAnfrage({ token: 't', aktion: 'absenden', thema_id: 2 })).toMatchObject({ thema_id: 2 })
    expect(pruefePruefAnfrage({ token: 't', aktion: 'speichern', bewertungen: [bewertung({ notiz: '  gut  ' })] })).toMatchObject({
      bewertungen: [{ notiz: 'gut' }],
    })
  })

  it.each([
    ['ohne Inhalt', null],
    ['unbekannte Aktion', { token: 't', aktion: 'loeschen' }],
    ['Einwilligung ohne Angabe', { token: 't', aktion: 'einwilligen' }],
    ['Thema keine Zahl', { token: 't', aktion: 'absenden', thema_id: '2' }],
    ['leere Liste', { token: 't', aktion: 'speichern', bewertungen: [] }],
    ['Wert 4', { token: 't', aktion: 'speichern', bewertungen: [bewertung({ wirksamkeit: 4 as 3 })] }],
    ['Wert −1', { token: 't', aktion: 'speichern', bewertungen: [bewertung({ umsetzbarkeit: -1 as 0 })] }],
    ['Wert 1.5', { token: 't', aktion: 'speichern', bewertungen: [bewertung({ umsetzbarkeit: 1.5 as 1 })] }],
    ['doppelte Maßnahme', { token: 't', aktion: 'speichern', bewertungen: [bewertung(), bewertung()] }],
    ['Notiz zu lang', { token: 't', aktion: 'speichern', bewertungen: [bewertung({ notiz: 'x'.repeat(1001) })] }],
    ['Empfehlung ohne eigene Werte', { token: 't', aktion: 'speichern', bewertungen: [bewertung({ umsetzbarkeit: null, empfehlung_gesehen: true })] }],
  ])('lehnt ab: %s', (_, roh) => {
    expect(fehler(roh)).toThrow(EingabeFehler)
  })
})

describe('Edge Function pruefung', () => {
  let token: string
  let einladung: Einladung & { hash: string }
  let speicher: ReturnType<typeof testSpeicher>
  const rufe = (a: Record<string, unknown>) => bearbeitePruefung({ token, ...a } as PruefAnfrage, speicher.s, KATALOG)

  beforeEach(async () => {
    token = neuerToken()
    einladung = {
      id: 'e1', hash: await tokenHash(token), name: 'Erika', themen: [2],
      gesperrt: false, einwilligung_am: null, name_oeffentlich: false,
    }
    speicher = testSpeicher([einladung])
  })

  it('unbekannte, falsch geformte und gesperrte Tokens → 403 ohne Details', async () => {
    const unbekannt = await rufe({ aktion: 'laden', token: neuerToken() })
    const kaputt = await rufe({ aktion: 'laden', token: 'kurz' })
    einladung.gesperrt = true
    const gesperrt = await rufe({ aktion: 'laden' })
    for (const a of [unbekannt, kaputt, gesperrt]) expect(a).toEqual({ status: 403, body: { fehler: 'Dieser Link ist nicht (mehr) gültig.' } })
  })

  it('laden liefert Name, Themen und Einwilligungsstatus', async () => {
    expect(await rufe({ aktion: 'laden' })).toEqual({
      status: 200,
      body: { name: 'Erika', themen: [2], einwilligung: false, name_oeffentlich: false, bewertungen: [] },
    })
  })

  it('ohne Einwilligung kein Speichern und kein Absenden', async () => {
    expect((await rufe({ aktion: 'speichern', bewertungen: [bewertung()] })).status).toBe(400)
    expect((await rufe({ aktion: 'absenden', thema_id: 2 })).status).toBe(400)
    expect(speicher.bewertungen.size).toBe(0)
  })

  describe('nach Einwilligung', () => {
    beforeEach(async () => {
      expect((await rufe({ aktion: 'einwilligen', name_oeffentlich: true })).status).toBe(200)
    })

    it('speichert nur Maßnahmen der freigegebenen Themen', async () => {
      expect((await rufe({ aktion: 'speichern', bewertungen: [bewertung({ massnahme_id: 3001 })] })).status).toBe(400)
      expect((await rufe({ aktion: 'speichern', bewertungen: [bewertung({ massnahme_id: 9999 })] })).status).toBe(400)
      expect((await rufe({ aktion: 'speichern', bewertungen: [bewertung()] })).status).toBe(200)
      expect(speicher.bewertungen.get('e1')).toEqual([
        { ...bewertung(), thema_id: 2, nach_empfehlung_geaendert: false, abgesendet: false },
      ])
    })

    it('absenden erst, wenn alle Maßnahmen des Themas bewertet sind; nur freigegebene Themen', async () => {
      await rufe({ aktion: 'speichern', bewertungen: [bewertung(), bewertung({ massnahme_id: 2002, umsetzbarkeit: null })] })
      expect(await rufe({ aktion: 'absenden', thema_id: 2 })).toMatchObject({ status: 400, body: { fehler: 'Noch 1 Maßnahme ohne Bewertung.' } })
      expect((await rufe({ aktion: 'absenden', thema_id: 3 })).status).toBe(400)
      await rufe({ aktion: 'speichern', bewertungen: [bewertung({ massnahme_id: 2002, umsetzbarkeit: 1 })] })
      expect((await rufe({ aktion: 'absenden', thema_id: 2 })).status).toBe(200)
      expect(speicher.bewertungen.get('e1')!.every((b) => b.abgesendet)).toBe(true)
    })

    it('nach dem Absenden bleiben Änderungen möglich, Werte aber Pflicht', async () => {
      await rufe({ aktion: 'speichern', bewertungen: [bewertung(), bewertung({ massnahme_id: 2002 })] })
      await rufe({ aktion: 'absenden', thema_id: 2 })
      expect((await rufe({ aktion: 'speichern', bewertungen: [bewertung({ wirksamkeit: 1 })] })).status).toBe(200)
      expect(speicher.bewertungen.get('e1')![0]).toMatchObject({ wirksamkeit: 1, abgesendet: true })
      expect((await rufe({ aktion: 'speichern', bewertungen: [bewertung({ wirksamkeit: null })] })).status).toBe(400)
    })

    it('vermerkt Änderungen nach dem Ansehen der Empfehlung', async () => {
      await rufe({ aktion: 'speichern', bewertungen: [bewertung()] })
      await rufe({ aktion: 'speichern', bewertungen: [bewertung({ empfehlung_gesehen: true })] })
      expect(speicher.bewertungen.get('e1')![0]).toMatchObject({ empfehlung_gesehen: true, nach_empfehlung_geaendert: false })
      // „empfehlung_gesehen“ bleibt gesetzt, auch wenn die App es nicht erneut schickt.
      await rufe({ aktion: 'speichern', bewertungen: [bewertung({ wirksamkeit: 3 })] })
      expect(speicher.bewertungen.get('e1')![0]).toMatchObject({ empfehlung_gesehen: true, nach_empfehlung_geaendert: true })
      await rufe({ aktion: 'speichern', bewertungen: [bewertung()] })
      expect(speicher.bewertungen.get('e1')![0].nach_empfehlung_geaendert).toBe(true)
    })

    it('laden gibt gespeicherte Bewertungen zurück, ohne interne Felder', async () => {
      await rufe({ aktion: 'speichern', bewertungen: [bewertung({ notiz: 'Quelle fehlt' })] })
      const { body } = await rufe({ aktion: 'laden' })
      expect(body).toMatchObject({
        einwilligung: true,
        name_oeffentlich: true,
        bewertungen: [{ massnahme_id: 2001, wirksamkeit: 2, umsetzbarkeit: 3, notiz: 'Quelle fehlt', empfehlung_gesehen: false, abgesendet: false }],
      })
      expect((body as { bewertungen: object[] }).bewertungen[0]).not.toHaveProperty('nach_empfehlung_geaendert')
    })

    it('widerrufen löscht Bewertungen und Einwilligung', async () => {
      await rufe({ aktion: 'speichern', bewertungen: [bewertung()] })
      expect((await rufe({ aktion: 'widerrufen' })).status).toBe(200)
      expect(speicher.bewertungen.size).toBe(0)
      expect(einladung).toMatchObject({ einwilligung_am: null, name_oeffentlich: false })
    })
  })

  it('Rate-Limit', async () => {
    speicher = testSpeicher([einladung], 2)
    expect((await rufe({ aktion: 'laden' })).status).toBe(200)
    expect((await rufe({ aktion: 'laden' })).status).toBe(200)
    expect((await rufe({ aktion: 'laden' })).status).toBe(503)
  })
})
