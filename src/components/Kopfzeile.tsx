import { Logo } from './Logo'

/** Kopfzeile im laufenden Spiel: Marke führt zur Startseite, „Neues Spiel“ zur Parteiwahl. */
export function Kopfzeile({
  spielLaeuft,
  onStartseite,
  onNeuesSpiel,
}: {
  spielLaeuft: boolean
  onStartseite: () => void
  onNeuesSpiel: () => void
}) {
  // Ein laufendes Spiel geht dabei verloren – deshalb vorher nachfragen.
  const bestaetigt = () => !spielLaeuft || confirm('Das laufende Spiel wird beendet. Wirklich neu beginnen?')
  return (
    <header className="kopfzeile">
      <button type="button" className="kopfzeile-marke" onClick={() => bestaetigt() && onStartseite()}>
        <Logo groesse={30} />
        <span>Wer liefert?</span>
        <span className="sr-only"> – zur Startseite</span>
      </button>
      <button type="button" className="knopf knopf-zweit knopf-klein" onClick={() => bestaetigt() && onNeuesSpiel()}>
        Neues Spiel
      </button>
    </header>
  )
}
