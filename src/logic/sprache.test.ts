import { describe, expect, it } from 'vitest'
import { fehlerText, transkript } from './sprache'

const ergebnis = (transcript: string, isFinal = true) => Object.assign([{ transcript }], { isFinal })

describe('Spracherkennung', () => {
  it('setzt finale und vorläufige Ergebnisse zusammen', () => {
    const results = Object.assign([ergebnis('Ich warte seit Monaten '), ergebnis(' auf einen Arzttermin', false)], {})
    expect(transkript(results)).toBe('Ich warte seit Monaten auf einen Arzttermin')
  })

  it('ignoriert leere Ergebnisse', () => {
    expect(transkript([ergebnis('  ')])).toBe('')
  })

  it('meldet Abbruch nicht als Fehler', () => {
    expect(fehlerText('aborted')).toBeNull()
  })

  it('verweist bei fehlender Freigabe auf die Texteingabe', () => {
    expect(fehlerText('not-allowed')).toMatch(/eintippen/)
  })
})
