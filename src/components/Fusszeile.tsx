import { BETREIBER } from '../rechtliches/betreiber'

export function Fusszeile() {
  return (
    <footer className="fusszeile">
      <a href="#/impressum">Impressum</a>
      <a href="#/datenschutz">Datenschutz</a>
      <a href={BETREIBER.quellcode}>Quellcode &amp; Bewertungen</a>
    </footer>
  )
}
