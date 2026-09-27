import { useId, useState } from 'react'
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
  const [einverstanden, setEinverstanden] = useState(false)
  const id = useId()
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
          <>
            {/* Ausdrückliche Einwilligung (Art. 9 DSGVO): Eingaben können politische Meinungen erkennen lassen. */}
            <label className="einwilligung" htmlFor={id}>
              <input
                id={id}
                type="checkbox"
                checked={einverstanden}
                onChange={(e) => setEinverstanden(e.target.checked)}
              />
              <span>
                Ich bin einverstanden, dass eine KI meine Eingaben wie in der{' '}
                <a href="#/datenschutz">Datenschutzerklärung</a> beschrieben einordnet. Mir ist klar, dass sie
                politische Meinungen erkennen lassen können.
              </span>
            </label>
            <button className="knopf knopf-gross" onClick={onStart} disabled={!bereit || !einverstanden}>
              {bereit ? 'Spiel starten' : 'Lade Spieldaten …'}
            </button>
          </>
        )}
        <p className="datenschutz">
          <strong>Datenschutz:</strong> Keine Konten, keine Cookies, keine IP-Adressen, kein Audio. Deine Eingaben
          ordnet eine KI (Mistral, EU) ein. Gespeichert wird nur eine anonyme, neutrale Kurzfassung des Problems; ein
          Stichwort daraus kann nach Prüfung in der Wortwolke erscheinen.{' '}
          <a href="#/datenschutz">Mehr erfahren</a>
        </p>
      </div>
    </main>
  )
}
