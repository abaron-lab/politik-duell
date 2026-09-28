import { gesamtpunkte, RUNDEN_GESAMT, type RundenErgebnis, type Spieler } from '../spiel'
import { parteiStil } from './stil'

export function Punktestand({
  spieler,
  runden,
  aktuelleRunde,
}: {
  spieler: [Spieler, Spieler]
  runden: RundenErgebnis[]
  aktuelleRunde: number
}) {
  const [pa, pb] = gesamtpunkte(runden)
  return (
    <header className="punktestand">
      <div className="team" style={parteiStil(spieler[0].partei.farbe)}>
        <span className="team-name">
          <span className="team-buchstabe" aria-label="Spieler:in A">A</span>
          {spieler[0].partei.kurzname}
        </span>
        <span className="team-punkte">{pa}</span>
      </div>
      <div className="runden-anzeige">
        <strong>Runde {aktuelleRunde}</strong>
        von {RUNDEN_GESAMT}
      </div>
      <div className="team team-rechts" style={parteiStil(spieler[1].partei.farbe)}>
        <span className="team-punkte">{pb}</span>
        <span className="team-name">
          {spieler[1].partei.kurzname}
          <span className="team-buchstabe" aria-label="Spieler:in B">B</span>
        </span>
      </div>
    </header>
  )
}
