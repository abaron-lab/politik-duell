import { useRef, useState } from 'react'
import { useSpracherkennung } from '../logic/sprache'

const MIN_HALTEDAUER_MS = 350

function Mikrofon() {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
      <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Push-to-talk: Knopf gedrückt halten, sprechen, loslassen. Auch per Leertaste bedienbar. */
export function SprechKnopf({ gesperrt, onText }: { gesperrt: boolean; onText: (text: string) => void }) {
  const { unterstuetzt, aktiv, zwischentext, fehler, lokal, start, stop } = useSpracherkennung(onText)
  const [kurzHinweis, setKurzHinweis] = useState(false)
  const gedruecktSeit = useRef(0)

  if (!unterstuetzt) {
    return <p className="sprech-info">Spracheingabe wird von diesem Browser nicht unterstützt – bitte tippe dein Problem ein.</p>
  }

  function druecken() {
    if (gesperrt || aktiv) return
    gedruecktSeit.current = Date.now()
    setKurzHinweis(false)
    start()
  }

  function loslassen() {
    if (!gedruecktSeit.current) return
    if (Date.now() - gedruecktSeit.current < MIN_HALTEDAUER_MS) setKurzHinweis(true)
    gedruecktSeit.current = 0
    stop()
  }

  return (
    <div className="sprech-bereich">
      <button
        type="button"
        className={`sprech-knopf${aktiv ? ' aktiv' : ''}`}
        disabled={gesperrt}
        aria-pressed={aktiv}
        aria-label={aktiv ? 'Aufnahme läuft – loslassen zum Beenden' : 'Gedrückt halten und sprechen'}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          druecken()
        }}
        onPointerUp={loslassen}
        onPointerCancel={loslassen}
        onLostPointerCapture={loslassen}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault()
            druecken()
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            loslassen()
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Mikrofon />
      </button>
      <p className="sprech-status" aria-live="polite">
        {aktiv
          ? zwischentext || 'Ich höre zu …'
          : fehler ?? (kurzHinweis ? 'Halte den Knopf gedrückt, solange du sprichst.' : 'Gedrückt halten und sprechen')}
      </p>
      <p className="sprech-info">
        {lokal
          ? 'Die Spracherkennung läuft auf deinem Gerät. Audio wird nicht gespeichert.'
          : 'Die Spracherkennung übernimmt dein Browser (bei Chrome über Server von Google). Wir speichern kein Audio.'}
      </p>
    </div>
  )
}
