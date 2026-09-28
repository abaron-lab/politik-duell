import { describe, expect, it } from 'vitest'
import { corsKoepfe, erlaubteUrspruenge, globalesLimit, RATE_LIMIT_GLOBAL, ursprungErlaubt } from './zugriff.ts'

describe('erlaubte Herkunft', () => {
  const liste = erlaubteUrspruenge(' https://politikduell.de/, https://wer-liefert-*.vercel.app ')

  it('ohne Secret ist alles erlaubt', () => {
    expect(erlaubteUrspruenge(undefined)).toBeNull()
    expect(erlaubteUrspruenge(' , ')).toBeNull()
    expect(ursprungErlaubt('https://irgendwo.example', null)).toBe(true)
    expect(corsKoepfe('https://irgendwo.example', null)['Access-Control-Allow-Origin']).toBe('*')
  })

  it.each([
    ['https://politikduell.de', true],
    ['https://wer-liefert-git-main-abaron.vercel.app', true],
    ['http://politikduell.de', false],
    ['https://politikduell.de.boese.example', false],
    ['https://boese.example/https://politikduell.de', false],
    ['https://wer-liefert-x.boese.vercel.app', false],
    [null, false],
  ])('%s → %s', (ursprung, ok) => {
    expect(ursprungErlaubt(ursprung, liste)).toBe(ok)
  })

  it('CORS nennt nur erlaubte Herkunft', () => {
    expect(corsKoepfe('https://politikduell.de', liste)['Access-Control-Allow-Origin']).toBe('https://politikduell.de')
    expect(corsKoepfe('https://boese.example', liste)['Access-Control-Allow-Origin']).toBe('null')
  })
})

describe('globales Limit', () => {
  it('liest das Secret, sonst Standard', () => {
    expect(globalesLimit('120')).toBe(120)
    expect(globalesLimit(undefined)).toBe(RATE_LIMIT_GLOBAL.max)
    expect(globalesLimit('0')).toBe(RATE_LIMIT_GLOBAL.max)
    expect(globalesLimit('viel')).toBe(RATE_LIMIT_GLOBAL.max)
  })
})
