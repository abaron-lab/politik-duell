import { BETREIBER } from './betreiber'

// „So bewerten wir“ (#/methode): offene Methode und Fehlermeldung.
// Die Skalen hier müssen zu den Bewertungen in der Datenbank passen – wer
// Maßnahmen bewertet, richtet sich nach dieser Seite.

const WIRKSAMKEIT = [
  'setzt an keiner der erfassten Ursachen an',
  'berührt eine Ursache nur am Rand oder mit geringer Wirkung',
  'setzt an einer Ursache an und lässt eine spürbare Wirkung erwarten',
  'setzt direkt an einer Hauptursache an; die Wirkung ist gut belegt',
]

const UMSETZBARKEIT = [
  'rechtlich oder finanziell derzeit nicht umsetzbar',
  'nur mit großen Hürden umsetzbar (z. B. Verfassungsänderung, ungeklärte Finanzierung)',
  'umsetzbar mit Aufwand oder in mehreren Jahren',
  'rechtlich möglich, finanziert und innerhalb einer Wahlperiode realistisch',
]

function Skala({ stufen }: { stufen: string[] }) {
  return (
    <dl className="skala">
      {stufen.map((text, wert) => (
        <div key={wert}>
          <dt>{wert}</dt>
          <dd>{text}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Methode() {
  return (
    <article>
      <h1>So bewerten wir</h1>
      <p>
        „Wer liefert?“ fragt nicht, welche Partei sympathischer ist, sondern welche für ein konkretes Alltagsproblem die
        wirksamste und umsetzbare Lösung anbietet. Alle Parteien werden nach denselben Kriterien bewertet. Das Ergebnis
        steht vorher nicht fest: Liefert eine Partei nachweislich die beste Lösung, gewinnt sie – egal welche.
      </p>

      <h2>1. Vom Problem zu den Ursachen</h2>
      <p>
        Jedes Thema (z. B. Miete) hat Ursachen, die wir mit einer Quelle belegen (z. B. „zu wenig Neubau“). Nennst du ein
        Problem, ordnet eine KI es einem Thema und den passenden Ursachen zu. Die KI vergibt keine Punkte, nennt keine
        Quellen und bewertet keine Parteien.
      </p>

      <h2>2. Maßnahmen aus den Wahlprogrammen</h2>
      <p>
        Für jede Partei erfassen wir die Maßnahmen aus ihrem Wahlprogramm zur Bundestagswahl 2025, die an diesen
        Ursachen ansetzen – mit wörtlichem Zitat, Seitenangabe, Stand des Programms und, wo vorhanden, einer Studie zur
        Wirkung. Jede Bewertung hat eine kurze Begründung, die in der Auflösung angezeigt wird. Ins Spiel kommt ein
        Thema für eine Partei erst, wenn eine zweite Person alle Einträge dazu geprüft hat: Zitat und Seite im
        Programm, Zuordnung zu den Ursachen und die Bewertung – diese zuerst, ohne zu wissen, von welcher Partei die
        Maßnahme stammt.
      </p>
      <p>
        Derzeit übernimmt der Betreiber die Prüfung. Wer als unabhängige Prüferin oder unabhängiger Prüfer mitmachen
        möchte, ist herzlich eingeladen (Kontakt im Impressum).
      </p>

      <h2>3. Zwei Kriterien, je 0 bis 3 Punkte</h2>
      <h3>Wirksamkeit: Setzt die Maßnahme an den tatsächlichen Ursachen an?</h3>
      <Skala stufen={WIRKSAMKEIT} />
      <h3>Umsetzbarkeit: Ist sie rechtlich, finanziell und zeitlich realistisch?</h3>
      <Skala stufen={UMSETZBARKEIT} />
      <p>
        <strong>Rolle:</strong> Wählst du eine Rolle (z. B. Mieter:in), kann eine Maßnahme für dich mehr oder weniger
        bringen. Dann verschiebt sich ihre Wirksamkeit für dich um bis zu zwei Stufen (innerhalb von 0 bis 3). Solche
        Auf- oder Abwertungen sind je Maßnahme einzeln begründet und werden angezeigt.
      </p>

      <h2>4. Punkte in der Runde</h2>
      <ul>
        <li>
          Pro Ursache zählt die beste Maßnahme einer Partei: Wirksamkeit × Umsetzbarkeit, also 0 bis 9 Punkte. So
          bringt eine Maßnahme ohne Wirkung keine Punkte, auch wenn sie leicht umzusetzen wäre – und eine wirksame, die
          sich nicht umsetzen lässt, ebenso wenig.
        </li>
        <li>Die Rundenpunkte sind die Summe über alle zugeordneten Ursachen.</li>
        <li>Die höhere Summe bekommt den Spielpunkt, bei Gleichstand beide.</li>
        <li>
          Finden wir im Programm keine Maßnahme zu den Ursachen, gibt es 0 Punkte. Das heißt nur: Im Wahlprogramm mit
          dem angegebenen Stand steht dazu nichts – nicht, dass die Partei sich nie dazu geäußert hätte. Steht zum
          ganzen Thema nichts im Programm, halten wir fest, was wir durchsucht haben.
        </li>
        <li>
          Haben wir das Programm einer Partei zu einem Thema noch nicht vollständig ausgewertet und geprüft, zeigen wir
          „noch nicht erfasst“. Dann wird die Runde nicht gewertet: Fehlende Daten sollen keiner Partei einen Punkt
          kosten. Bei der besten Lösung aller Parteien vergleichen wir nur Parteien, für die das Thema erfasst ist.
        </li>
        <li>
          Themen, die wir noch nicht bewertet haben, zeigen wir als „ungeprüft – keine Wertung“, ohne Punkte und ohne
          Links.
        </li>
      </ul>

      <h2>5. Was die Punkte bedeuten – und was nicht</h2>
      <p>
        Die Punkte sind eine Einschätzung nach dieser Methode, bezogen auf einzelne Alltagsprobleme. Sie sind kein
        Gesamturteil über eine Partei und keine Wahlempfehlung. Ein Spiel deckt nur die fünf genannten Probleme ab.
      </p>

      <h2>6. Offen und korrigierbar</h2>
      <p>
        Alle Bewertungen, Begründungen und Belege stehen im <a href={BETREIBER.quellcode}>öffentlichen Quellcode</a>.
        Änderungen sind dort nachvollziehbar und brauchen immer eine Quelle.
      </p>

      <h2 id="fehler">7. Fehler melden</h2>
      <p>
        Ist eine Maßnahme falsch wiedergegeben, fehlt etwas oder ist ein Beleg veraltet? Bitte melde es mit Link auf die
        Stelle im Programm:
      </p>
      <ul>
        <li>
          per E-Mail: <a href={`mailto:${BETREIBER.email}?subject=Wer%20liefert%3F%20%E2%80%93%20Fehler`}>{BETREIBER.email}</a>
        </li>
        <li>
          oder öffentlich auf <a href={`${BETREIBER.quellcode}/issues/new`}>GitHub</a>
        </li>
      </ul>
      <p>
        Wir prüfen jede Meldung und korrigieren belegte Fehler so schnell wie möglich. Parteien können ihre Einträge
        jederzeit prüfen und eine Stellungnahme schicken.
      </p>
    </article>
  )
}
