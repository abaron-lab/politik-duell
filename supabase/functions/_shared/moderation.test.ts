import { describe, expect, it } from 'vitest'
import { bereinigeStichwort, pruefeText } from './moderation.ts'

describe('pruefeText', () => {
  it.each([
    'Kein Facharzttermin',
    'Miete frisst das halbe Gehalt',
    'Ich bin behindert und finde keine barrierefreie Wohnung',
    'Wäsche aufhängen geht nicht, Wohnung zu feucht',
    'Einmarsch der Heizkosten',
    'Frau mit zwei Kindern findet keine Kita',
    'Hausarzt nimmt keine neuen Patienten',
    'Stromrechnung 2026 verdoppelt',
  ])('lässt „%s“ durch', (text) => {
    expect(pruefeText(text)).toBeNull()
  })

  it.each([
    ['Mein Vermieter ist ein Idiot', 'beleidigung'],
    ['Drecksvermieter erhöht schon wieder', 'beleidigung'],
    ['Die Schei$$ Nebenkosten', 'beleidigung'],
    ['Alle erschießen', 'hetze'],
    ['Herr Müller aus dem 3. Stock ist laut', 'person'],
    ['Termin bei Dr. Schmidt dauert ewig', 'person'],
    ['Schreib mir: max@example.de', 'kontaktdaten'],
    ['Ruf an 0176 12345678', 'kontaktdaten'],
    ['Siehe www.example.org', 'kontaktdaten'],
    ['Wohne in der Bahnhofstraße 12', 'kontaktdaten'],
  ] as const)('stoppt „%s“ (%s)', (text, grund) => {
    expect(pruefeText(text)).toBe(grund)
  })

  it('prüft mehrere Texte zusammen', () => {
    expect(pruefeText('Mieterhöhung', null, 'Mein Vermieter Herr Meier')).toBe('person')
  })
})

describe('bereinigeStichwort', () => {
  it('kürzt auf höchstens drei Wörter', () => {
    expect(bereinigeStichwort('Keine Wohnung in Uni-Nähe gefunden', 'x')).toBe('Keine Wohnung in')
  })

  it('entfernt Anführungszeichen und Links', () => {
    expect(bereinigeStichwort('„Heizkosten“ https://x.de', 'x')).toBe('Heizkosten')
  })

  it('nutzt den Ersatz, wenn nichts kommt', () => {
    expect(bereinigeStichwort(undefined, 'Miete steigt stark.')).toBe('Miete steigt stark')
  })

  it('hält die Länge ein', () => {
    expect(bereinigeStichwort('Donaudampfschifffahrtsgesellschaftskapitänsmütze', 'x').length).toBeLessThanOrEqual(40)
  })
})
