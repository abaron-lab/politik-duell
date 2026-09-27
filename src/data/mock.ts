import { ladeKatalog, spielbareAbdeckung, spielbareMassnahmen, type Datei } from './katalog.ts'

// ---------------------------------------------------------------------------
// Eingebaute Daten der App (Offline-Modus, Tests) – geladen aus `daten/`.
//
// Solange `daten/parteien.json` „fiktiv: true“ enthält, sind Parteien,
// Maßnahmen, Punktzahlen und Links ERFUNDEN. Sie zeigen nur Spielablauf und
// Punktelogik. Echte Parteien kommen erst mit geprüften Daten hinzu
// (Quellenpflicht, siehe daten/README.md).
// ---------------------------------------------------------------------------

const alsDateien = (module: Record<string, unknown>): Datei[] =>
  Object.entries(module)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([pfad, inhalt]) => ({ pfad: pfad.replace(/^(\.\.\/)+/, ''), inhalt }))

const [parteienDatei] = alsDateien(import.meta.glob('../../daten/parteien.json', { eager: true, import: 'default' }))
const themenDateien = alsDateien(import.meta.glob('../../daten/themen/*.json', { eager: true, import: 'default' }))

export const KATALOG = ladeKatalog(parteienDatei, themenDateien)

export const PARTEIEN = KATALOG.parteien
export const THEMEN = KATALOG.themen
export const URSACHEN = KATALOG.ursachen
/** Nur Maßnahmen, die im Spiel zählen (bei echten Daten: geprüft). */
export const MASSNAHMEN = spielbareMassnahmen(KATALOG)
/** Welche Themen je Partei erfasst sind (fehlt ein Eintrag: noch nicht erfasst). */
export const ABDECKUNG = spielbareAbdeckung(KATALOG)

/** Beispielprobleme für die Hintergrund-Wortwolke (später: freigegebene Runden aus Supabase). */
export const BEISPIEL_PROBLEME = [
  'Kein Facharzttermin', 'Miete frisst Gehalt', 'Stromrechnung verdoppelt', 'Keine Wohnung in Uni-Nähe',
  'Hausarzt nimmt niemanden', 'Nebenkosten-Nachzahlung', 'Monate auf Termin warten', 'Mieterhöhung',
  'Heizkosten', 'WG-Zimmer unbezahlbar', 'Praxis auf dem Land zu', 'Netzentgelte',
]
