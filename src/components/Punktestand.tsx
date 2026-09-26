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
        <span className="team-name">A · {spieler[0].partei.kurzname}</span>
        <span className="team-punkte">{pa}</span>
      </div>
      <div className="runden-anzeige">
        Runde
        <strong>
          {aktuelleRunde}/{RUNDEN_GESAMT}
        </strong>
      </div>
      <div className="team team-rechts" style={parteiStil(spieler[1].partei.farbe)}>
        <span className="team-punkte">{pb}</span>
        <span className="team-name">B · {spieler[1].partei.kurzname}</span>
      </div>
    </header>
  )
}
