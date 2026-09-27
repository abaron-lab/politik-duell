import { describe, expect, it } from 'vitest'
import { zaehleWoerter } from './wortwolke'

describe('zaehleWoerter', () => {
  it('zählt ohne Rücksicht auf Groß-/Kleinschreibung, häufigste zuerst', () => {
    expect(zaehleWoerter(['Miete', 'Heizkosten', 'miete', ' Miete ', ''])).toEqual([
      { text: 'Miete', anzahl: 3 },
      { text: 'Heizkosten', anzahl: 1 },
    ])
  })
})
