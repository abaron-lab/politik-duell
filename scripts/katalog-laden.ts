// Lädt den Datenkatalog aus `daten/` für Node-Skripte (Seed, Prüfung, Tests).
// Die App lädt dieselben Dateien über Vite (src/data/mock.ts).
import { readdirSync, readFileSync } from 'node:fs'
import { pruefeKatalog, type Datei, type Pruefergebnis } from '../src/data/katalog.ts'

const WURZEL = new URL('../', import.meta.url)

export function pruefeDatenordner(): Pruefergebnis {
  const pfade = [
    'daten/parteien.json',
    ...readdirSync(new URL('daten/themen/', WURZEL))
      .filter((d) => d.endsWith('.json'))
      .sort()
      .map((d) => `daten/themen/${d}`),
  ]
  const dateien: Datei[] = []
  const syntaxfehler: string[] = []
  for (const pfad of pfade) {
    try {
      dateien.push({ pfad, inhalt: JSON.parse(readFileSync(new URL(pfad, WURZEL), 'utf8')) })
    } catch (e) {
      syntaxfehler.push(`${pfad}: kein gültiges JSON – ${e instanceof Error ? e.message : e}`)
    }
  }
  if (syntaxfehler.length) return { ...pruefeKatalog({ pfad: '', inhalt: null }, []), fehler: syntaxfehler, warnungen: [] }
  return pruefeKatalog(dateien[0], dateien.slice(1))
}
