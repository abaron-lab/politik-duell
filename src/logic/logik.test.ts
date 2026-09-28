import { describe, expect, it } from 'vitest'
import { ABDECKUNG, MASSNAHMEN, PARTEIEN, THEMEN, URSACHEN } from '../data/mock'
import type { Nachricht } from '../data/types'
import { analysiere } from './analyse'
import { besteParteien, bewertePartei, massnahmenPunkte, rundenpunkte, werteRunde } from './bewertung'

const spieler = (...texte: string[]): Nachricht[] => texte.map((text) => ({ von: 'spieler', text }))
const partei = (id: number) => PARTEIEN.find((p) => p.id === id)!

describe('analysiere (Mock der Edge Function)', () => {
  it('erkennt ein Alltagsproblem und ordnet Thema und Ursache zu', () => {
    const a = analysiere(spieler('Ich warte seit Monaten auf einen Termin beim Facharzt'), THEMEN, URSACHEN)
    expect(a.typ).toBe('problem')
    expect(a.thema_id).toBe(1)
    expect(a.ursachen_ids).toEqual([102])
  })

  it('fragt bei einer Forderung nach dem Problem dahinter', () => {
    const a = analysiere(spieler('Weniger Steuern!'), THEMEN, URSACHEN)
    expect(a.typ).toBe('forderung')
    expect(a.nachfrage).toBeTruthy()
  })

  it('fragt höchstens zweimal nach', () => {
    const verlauf: Nachricht[] = [
      { von: 'spieler', text: 'Mehr Wohnungen!' },
      { von: 'ki', text: 'Nachfrage 1' },
      { von: 'spieler', text: 'Man sollte mehr bauen' },
      { von: 'ki', text: 'Nachfrage 2' },
      { von: 'spieler', text: 'Wir brauchen mehr Wohnungen' },
    ]
    const a = analysiere(verlauf, THEMEN, URSACHEN)
    expect(a.typ).toBe('problem')
    expect(a.thema_id).toBe(2)
  })

  it('erkennt eine persönliche Haltung', () => {
    const a = analysiere(spieler('Ich finde Gerechtigkeit wichtig'), THEMEN, URSACHEN)
    expect(a.typ).toBe('wert')
  })

  it('liefert thema_id null für unbekannte Themen', () => {
    const a = analysiere(spieler('Das Internet bei uns im Ort ist ständig weg'), THEMEN, URSACHEN)
    expect(a.typ).toBe('problem')
    expect(a.thema_id).toBeNull()
  })

  it('nimmt alle Ursachen des Themas, wenn keine konkret genannt ist', () => {
    const a = analysiere(spieler('Meine Stromrechnung ist ein Problem'), THEMEN, URSACHEN)
    expect(a.thema_id).toBe(3)
    expect(a.ursachen_ids).toEqual([301, 302, 303])
  })
})

describe('Bewertung', () => {
  it('summiert über Ursachen und nimmt je Ursache die beste Maßnahme', () => {
    // Partei Gamma, Energie: Netzentgelte (2+2) + Importe (2+2); Steuern: keine Maßnahme
    const e = bewertePartei(partei(3), 3, [301, 302, 303], null, MASSNAHMEN, ABDECKUNG)
    expect(e.punkte).toBe(8)
    expect(e.treffer).toHaveLength(2)
  })

  it('gibt 0 Punkte ohne Maßnahme zum Thema und vermerkt „keine“', () => {
    const e = bewertePartei(partei(5), 1, [101, 102, 103], null, MASSNAHMEN, ABDECKUNG)
    expect(e.punkte).toBe(0)
    expect(e.abdeckung?.art).toBe('keine')
    expect(e.abdeckung?.begruendung).toBeTruthy()
  })

  it('unterscheidet „keine Maßnahme zu diesen Ursachen“ von „nichts zum Thema“', () => {
    // Partei Beta hat Maßnahmen zu Arztterminen, aber keine zu fehlenden Praxen (101).
    const e = bewertePartei(partei(2), 1, [101], null, MASSNAHMEN, ABDECKUNG)
    expect(e.punkte).toBe(0)
    expect(e.abdeckung?.art).toBe('massnahmen')
  })

  it('wertet nicht, wenn das Thema für eine Partei noch nicht erfasst ist', () => {
    const ohneAlpha = ABDECKUNG.filter((a) => !(a.partei_id === 1 && a.thema_id === 2))
    const alpha = bewertePartei(partei(1), 2, [202], null, MASSNAHMEN, ohneAlpha)
    const beta = bewertePartei(partei(2), 2, [201], null, MASSNAHMEN, ohneAlpha)
    expect(alpha.abdeckung).toBeNull()
    // Maßnahmen liegen vor, zählen aber nicht, solange das Thema nicht erfasst ist.
    expect(alpha.treffer).toEqual([])
    expect(alpha.punkte).toBe(0)
    expect(werteRunde(alpha, beta)).toEqual({ status: 'unvollstaendig', punkte: [0, 0] })
    expect(werteRunde(beta, alpha)).toEqual({ status: 'unvollstaendig', punkte: [0, 0] })
    // Sind beide erfasst, gilt die normale Regel.
    const alphaErfasst = bewertePartei(partei(1), 2, [202], null, MASSNAHMEN, ABDECKUNG)
    expect(werteRunde(alphaErfasst, beta).status).toBe('gewertet')
  })

  it('vergleicht bei der besten Lösung nur erfasste Parteien', () => {
    const ohneAlpha = ABDECKUNG.filter((a) => !(a.partei_id === 1 && a.thema_id === 1))
    expect(besteParteien(PARTEIEN, 1, [101], null, MASSNAHMEN, ohneAlpha).map((b) => b.partei.id)).toEqual([3])
    expect(besteParteien(PARTEIEN, 1, [101], null, MASSNAHMEN, [])).toEqual([])
  })

  it('berücksichtigt den Rollen-Modifikator', () => {
    // Beispielmaßnahme: Wirksamkeit 2, Umsetzbarkeit 3; Mieter +1, Eigentümer −1 auf die Wirksamkeit.
    expect(bewertePartei(partei(1), 2, [202], null, MASSNAHMEN, ABDECKUNG).punkte).toBe(2 * 3)
    expect(bewertePartei(partei(1), 2, [202], 'mieter', MASSNAHMEN, ABDECKUNG).punkte).toBe(3 * 3)
    expect(bewertePartei(partei(1), 2, [202], 'eigentuemer', MASSNAHMEN, ABDECKUNG).punkte).toBe(1 * 3)
  })

  it('multipliziert Wirksamkeit und Umsetzbarkeit, Rolle nur innerhalb 0–3', () => {
    const m = { ...MASSNAHMEN[0], wirksamkeit: 1 as const, umsetzbarkeit: 3 as const, rollen_modifikator: { mieter: { wert: 2, begruendung: 'x' }, eigentuemer: { wert: -2, begruendung: 'x' } } }
    expect(massnahmenPunkte(m, null).punkte).toBe(3)
    expect(massnahmenPunkte({ ...m, wirksamkeit: 0 }, null).punkte).toBe(0)
    expect(massnahmenPunkte({ ...m, umsetzbarkeit: 0 }, null).punkte).toBe(0)
    expect(massnahmenPunkte({ ...m, wirksamkeit: 2 }, 'mieter')).toMatchObject({ punkte: 9, wirksamkeit: 3 })
    expect(massnahmenPunkte(m, 'eigentuemer')).toMatchObject({ punkte: 0, wirksamkeit: 0 })
  })

  it('vergibt Rundenpunkte nach Regel', () => {
    expect(rundenpunkte(5, 3)).toEqual([1, 0])
    expect(rundenpunkte(2, 4)).toEqual([0, 1])
    expect(rundenpunkte(4, 4)).toEqual([1, 1])
    expect(rundenpunkte(0, 0)).toEqual([0, 0])
  })

  it('findet die insgesamt beste Partei', () => {
    const beste = besteParteien(PARTEIEN, 1, [101], null, MASSNAHMEN, ABDECKUNG)
    expect(beste.map((b) => b.partei.id)).toEqual([1])
  })
})

describe('sindBeispieldaten', () => {
  it('erkennt eingebaute und fiktive Supabase-Daten, nicht aber echte', async () => {
    const { sindBeispieldaten, MOCK_DATEN } = await import('../data/quelle')
    expect(sindBeispieldaten(MOCK_DATEN)).toBe(true)
    expect(sindBeispieldaten({ ...MOCK_DATEN, quelle: 'supabase' })).toBe(true)
    const echt = { ...MOCK_DATEN, quelle: 'supabase' as const, parteien: [{ ...MOCK_DATEN.parteien[0], programm_url: 'https://www.spd.de/programm.pdf' }] }
    expect(sindBeispieldaten(echt)).toBe(false)
  })
})
