import { useState } from 'react'
import { PARTEIEN, ROLLEN } from '../data/mock'
import type { Partei, Rolle } from '../data/types'
import { parteiStil } from './stil'
import type { Spieler } from '../spiel'

interface Auswahl {
  partei: Partei | null
  rolle: Rolle | null
}

function SpielerWahl({
  titel,
  auswahl,
  gesperrt,
  onChange,
}: {
  titel: string
  auswahl: Auswahl
  gesperrt: Partei | null
  onChange: (a: Auswahl) => void
}) {
  return (
    <fieldset className="spieler-wahl">
      <legend>{titel}</legend>
      <p className="label">Partei</p>
      <div className="partei-raster">
        {PARTEIEN.map((p) => {
          const belegt = gesperrt?.id === p.id
          const gewaehlt = auswahl.partei?.id === p.id
          return (
            <button
              key={p.id}
              type="button"
              className={`partei-knopf${gewaehlt ? ' gewaehlt' : ''}`}
              style={parteiStil(p.farbe)}
              disabled={belegt}
              aria-pressed={gewaehlt}
              onClick={() => onChange({ ...auswahl, partei: p })}
            >
              {p.kurzname}
              {belegt && <small> (vergeben)</small>}
            </button>
          )
        })}
      </div>
      <label className="label" htmlFor={`${titel}-rolle`}>
        Rolle (optional)
      </label>
      <select
        id={`${titel}-rolle`}
        value={auswahl.rolle ?? ''}
        onChange={(e) => onChange({ ...auswahl, rolle: (e.target.value || null) as Rolle | null })}
      >
        <option value="">Keine Angabe</option>
        {ROLLEN.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
    </fieldset>
  )
}

export function Setup({ onFertig }: { onFertig: (s: [Spieler, Spieler]) => void }) {
  const [a, setA] = useState<Auswahl>({ partei: null, rolle: null })
  const [b, setB] = useState<Auswahl>({ partei: null, rolle: null })
  const bereit = a.partei && b.partei && a.partei.id !== b.partei.id

  return (
    <main className="seite">
      <h2>Wer tritt an?</h2>
      <p className="hinweis">Jede Seite wählt eine andere Partei. Die Rolle beeinflusst manche Bewertungen.</p>
      <SpielerWahl titel="Spieler:in A" auswahl={a} gesperrt={b.partei} onChange={setA} />
      <SpielerWahl titel="Spieler:in B" auswahl={b} gesperrt={a.partei} onChange={setB} />
      <button
        className="knopf knopf-gross"
        disabled={!bereit}
        onClick={() =>
          onFertig([
            { name: 'Spieler:in A', partei: a.partei!, rolle: a.rolle },
            { name: 'Spieler:in B', partei: b.partei!, rolle: b.rolle },
          ])
        }
      >
        Los geht’s
      </button>
    </main>
  )
}
