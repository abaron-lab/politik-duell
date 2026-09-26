import { useCallback, useEffect, useRef, useState } from 'react'

// Push-to-talk über die Web Speech API (Chrome, Edge, Safari).
// Es wird kein Audio gespeichert; nur der erkannte Text landet im Eingabefeld.

interface ErkennungsAlternative {
  transcript: string
}
interface ErkennungsErgebnis {
  readonly length: number
  readonly isFinal: boolean
  [i: number]: ErkennungsAlternative
}
interface ErkennungsEreignis {
  readonly results: { readonly length: number; [i: number]: ErkennungsErgebnis }
}
interface Erkennung {
  lang: string
  continuous: boolean
  interimResults: boolean
  processLocally?: boolean
  onresult: ((e: ErkennungsEreignis) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
interface ErkennungsKlasse {
  new (): Erkennung
  available?: (opt: { langs: string[]; processLocally: boolean }) => Promise<string>
}

function erkennungsKlasse(): ErkennungsKlasse | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: ErkennungsKlasse; webkitSpeechRecognition?: ErkennungsKlasse }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Setzt den Text aus allen bisherigen Ergebnissen zusammen (final + vorläufig). */
export function transkript(results: ErkennungsEreignis['results']): string {
  const teile: string[] = []
  for (let i = 0; i < results.length; i++) {
    const t = results[i][0]?.transcript.trim()
    if (t) teile.push(t)
  }
  return teile.join(' ')
}

/** Verständliche Meldungen zu den Fehlercodes der Web Speech API. */
export function fehlerText(code: string): string | null {
  switch (code) {
    case 'aborted':
      return null
    case 'no-speech':
      return 'Ich habe nichts gehört. Halte den Knopf gedrückt, während du sprichst.'
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Das Mikrofon ist nicht freigegeben. Du kannst dein Problem auch eintippen.'
    case 'audio-capture':
      return 'Kein Mikrofon gefunden. Du kannst dein Problem auch eintippen.'
    case 'network':
      return 'Die Spracherkennung ist gerade nicht erreichbar. Bitte tippe dein Problem ein.'
    case 'language-not-supported':
      return 'Deutsch wird von der Spracherkennung dieses Browsers nicht unterstützt. Bitte tippe.'
    default:
      return 'Die Spracherkennung hat nicht geklappt. Versuch es noch einmal oder tippe.'
  }
}

export const SPRACHE = 'de-DE'

export function useSpracherkennung(onFertig: (text: string) => void) {
  const Klasse = erkennungsKlasse()
  const [aktiv, setAktiv] = useState(false)
  const [zwischentext, setZwischentext] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)
  /** true, wenn die Erkennung auf dem Gerät läuft (kein Audio an Server). */
  const [lokal, setLokal] = useState(false)

  const erkennung = useRef<Erkennung | null>(null)
  const text = useRef('')
  const fertigRef = useRef(onFertig)
  useEffect(() => {
    fertigRef.current = onFertig
  }, [onFertig])

  // Neuere Chrome-Versionen können lokal auf dem Gerät erkennen.
  useEffect(() => {
    let abgebrochen = false
    Klasse?.available?.({ langs: [SPRACHE], processLocally: true })
      .then((status) => !abgebrochen && setLokal(status === 'available'))
      .catch(() => {})
    return () => {
      abgebrochen = true
    }
  }, [Klasse])

  useEffect(() => () => erkennung.current?.abort(), [])

  const start = useCallback(() => {
    if (!Klasse || erkennung.current) return
    const rec = new Klasse()
    rec.lang = SPRACHE
    rec.continuous = true
    rec.interimResults = true
    if (lokal) rec.processLocally = true
    text.current = ''
    rec.onresult = (e) => {
      text.current = transkript(e.results)
      setZwischentext(text.current)
    }
    rec.onerror = (e) => setFehler(fehlerText(e.error))
    rec.onend = () => {
      erkennung.current = null
      setAktiv(false)
      setZwischentext('')
      if (text.current) fertigRef.current(text.current)
    }
    setFehler(null)
    setZwischentext('')
    try {
      rec.start()
      erkennung.current = rec
      setAktiv(true)
    } catch {
      setFehler(fehlerText('unbekannt'))
    }
  }, [Klasse, lokal])

  const stop = useCallback(() => {
    erkennung.current?.stop()
  }, [])

  return { unterstuetzt: Klasse !== null, aktiv, zwischentext, fehler, lokal, start, stop }
}
