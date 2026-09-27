import { Logo } from './Logo'
import { Wortwolke } from './Wortwolke'

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
          (Mistral, EU) ein. Gespeichert wird nur eine anonyme, neutrale Kurzfassung des Problems; ein Stichwort
          daraus kann nach Prüfung in der Wortwolke erscheinen.
        </p>
      </div>
    </main>
  )
}
