import type { Partei, Rolle, Thema } from './data/types'
import type { ParteiErgebnis } from './logic/bewertung'

export const RUNDEN_GESAMT = 5

export interface Spieler {
  name: string
  partei: Partei
  rolle: Rolle | null
}

export interface RundenErgebnis {
  nr: number
  /** Index des Spielers, der das Problem genannt hat (0 = A, 1 = B). */
  sprecher: 0 | 1
  rolle: Rolle | null
  zusammenfassung: string
  /** Vorläufige Einschätzung bei ungeprüften Themen (ohne Punkte und Links). */
  einschaetzung: string | null
  thema: Thema | null
  status: 'gewertet' | 'ungeprueft'
  /** Ergebnisse der beiden gewählten Parteien (nur bei status „gewertet“). */
  ergebnisse: [ParteiErgebnis, ParteiErgebnis] | null
  /** Spielpunkte dieser Runde für A und B. */
  punkte: [number, number]
  /** Parteien mit der insgesamt besten Lösung (alle Parteien der DB). */
  beste: ParteiErgebnis[]
}

export function gesamtpunkte(runden: RundenErgebnis[]): [number, number] {
  return runden.reduce<[number, number]>((s, r) => [s[0] + r.punkte[0], s[1] + r.punkte[1]], [0, 0])
}

