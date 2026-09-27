import { BEISPIEL_PROBLEME } from '../data/mock'
import { Logo } from './Logo'

/** Schlichte Wortwolke als Platzhalter; d3-cloud + Realtime folgen in Meilenstein 4. */
function Wortwolke() {
  return (
    <div className="wortwolke" aria-hidden="true">
      {BEISPIEL_PROBLEME.map((wort, i) => (
        <span
          key={wort}
          style={{
            left: `${(i * 37) % 85}%`,
            top: `${(i * 53) % 90}%`,
            fontSize: `${0.9 + ((i * 7) % 5) * 0.2}rem`,
            animationDelay: `${-i * 2.3}s`,
            animationDuration: `${18 + (i % 4) * 4}s`,
          }}
        >
          {wort}
        </span>
      ))}
    </div>
  )
}

export function Start({
  bereit,
  ladeFehler,
  onBeispieldaten,
  onStart,
}: {
  bereit: boolean
  ladeFehler: string | null
  onBeispieldaten: () => void
  onStart: () => void
}) {
  return (
    <main className="start">
      <Wortwolke />
      <div className="start-inhalt">
        <Logo groesse={96} />
        <h1 className="titel">Wer liefert?</h1>
        <p className="slogan">Versprechen kann jeder.</p>
        <p className="erklaerung">
          Zwei Spieler:innen, zwei Parteien, fünf Runden. Nennt echte Alltagsprobleme – das Spiel zeigt, welche
          Partei dafür die wirksamste und umsetzbare Lösung bietet. Mit Beleg nach jeder Runde.
        </p>
        {ladeFehler ? (
          <div className="ladefehler" role="alert">
            <p>Die Spieldaten konnten nicht geladen werden ({ladeFehler}).</p>
            <button className="knopf knopf-gross" onClick={onBeispieldaten}>
              Mit Beispieldaten spielen
            </button>
          </div>
        ) : (
          <button className="knopf knopf-gross" onClick={onStart} disabled={!bereit}>
            {bereit ? 'Spiel starten' : 'Lade Spieldaten …'}
          </button>
        )}
        <p className="datenschutz">
          <strong>Datenschutz:</strong> Keine Konten, keine IP-Adressen, kein Audio. Deine Eingaben ordnet eine KI
          (Mistral, EU) ein. Gespeichert wird nur eine anonyme, neutrale Kurzfassung des Problems.
        </p>
      </div>
    </main>
  )
}
