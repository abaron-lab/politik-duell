import { useState } from 'react'
import { MASSNAHMEN, PARTEIEN, ROLLEN, THEMEN, URSACHEN } from '../data/mock'
import type { AnalyseAntwort, Nachricht } from '../data/types'
import { analysiereAsync } from '../logic/analyse'
import { besteParteien, bewertePartei, rundenpunkte } from '../logic/bewertung'
import { REVIEW_WARTESCHLANGE, type RundenErgebnis, type Spieler } from '../spiel'
import { parteiStil } from './stil'

const WERT_ANTWORT =
  'Das klingt nach einer persönlichen Haltung – die respektieren wir. Werte werden hier nicht gewertet. ' +
  'Magst du stattdessen ein konkretes Alltagsproblem nennen?'

function werteAus(
  analyse: AnalyseAntwort,
  nr: number,
  sprecher: 0 | 1,
  spieler: [Spieler, Spieler],
): RundenErgebnis {
  const rolle = spieler[sprecher].rolle
  const thema = THEMEN.find((t) => t.id === analyse.thema_id) ?? null

  if (!thema) {
    REVIEW_WARTESCHLANGE.push(analyse.zusammenfassung)
    return {
      nr, sprecher, rolle, thema: null, status: 'ungeprueft',
      zusammenfassung: analyse.zusammenfassung, ergebnisse: null, punkte: [0, 0], beste: [],
    }
  }

  const ea = bewertePartei(spieler[0].partei, thema.id, analyse.ursachen_ids, rolle, MASSNAHMEN)
  const eb = bewertePartei(spieler[1].partei, thema.id, analyse.ursachen_ids, rolle, MASSNAHMEN)
  return {
    nr, sprecher, rolle, thema, status: 'gewertet',
    zusammenfassung: analyse.zusammenfassung,
    ergebnisse: [ea, eb],
    punkte: rundenpunkte(ea.punkte, eb.punkte),
    beste: besteParteien(PARTEIEN, thema.id, analyse.ursachen_ids, rolle, MASSNAHMEN),
  }
}

export function Runde({
  nr,
  sprecher,
  spieler,
  onErgebnis,
}: {
  nr: number
  sprecher: 0 | 1
  spieler: [Spieler, Spieler]
  onErgebnis: (r: RundenErgebnis) => void
}) {
  const [verlauf, setVerlauf] = useState<Nachricht[]>([])
  const [hinweis, setHinweis] = useState<string | null>(null)
  const [eingabe, setEingabe] = useState('')
  const [denkt, setDenkt] = useState(false)

  const aktiv = spieler[sprecher]
  const rolle = ROLLEN.find((r) => r.id === aktiv.rolle)?.label

  async function absenden(e: { preventDefault(): void }) {
    e.preventDefault()
    const text = eingabe.trim()
    if (!text || denkt) return
    const neu: Nachricht[] = [...verlauf, { von: 'spieler', text }]
    setVerlauf(neu)
    setEingabe('')
    setHinweis(null)
    setDenkt(true)
    const analyse = await analysiereAsync(neu, THEMEN, URSACHEN)
    setDenkt(false)

    if (analyse.typ === 'forderung' && analyse.nachfrage) {
      setVerlauf([...neu, { von: 'ki', text: analyse.nachfrage }])
    } else if (analyse.typ === 'wert') {
      // Runde ohne Wertung – ein neues Problem kann genannt werden.
      setVerlauf([])
      setHinweis(WERT_ANTWORT)
    } else {
      onErgebnis(werteAus(analyse, nr, sprecher, spieler))
    }
  }

  return (
    <main className="seite runde">
      <div className="am-zug" style={parteiStil(aktiv.partei.farbe)}>
        <span className="am-zug-label">Am Zug</span>
        <strong>{aktiv.name}</strong>
        {rolle && <span className="rolle-chip">{rolle}</span>}
      </div>
      <h2>Welches Alltagsproblem nervt dich?</h2>
      <p className="hinweis">
        Beschreibe konkret, was in deinem Alltag schiefläuft. Beispiele: Arzttermine, Miete, Energiepreise.
      </p>

      <div className="verlauf" aria-live="polite">
        {hinweis && <p className="blase blase-ki">{hinweis}</p>}
        {verlauf.map((n, i) => (
          <p key={i} className={`blase blase-${n.von}`}>
            {n.text}
          </p>
        ))}
        {denkt && <p className="blase blase-ki denkt">Ich ordne das ein …</p>}
      </div>

      <form className="eingabe" onSubmit={absenden}>
        <label htmlFor="problem" className="sr-only">
          Dein Problem
        </label>
        <textarea
          id="problem"
          rows={3}
          maxLength={500}
          placeholder="z. B. „Ich warte seit drei Monaten auf einen Termin beim Facharzt.“"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) absenden(e)
          }}
          disabled={denkt}
        />
        <button className="knopf" type="submit" disabled={denkt || !eingabe.trim()}>
          Senden
        </button>
      </form>
    </main>
  )
}
