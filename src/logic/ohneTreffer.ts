import type { ParteiErgebnis } from './bewertung'

const datum = (iso: string) =>
  new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Warum eine Partei in dieser Runde keine Maßnahme hat – drei Fälle, die sich
 * für Spieler:innen und für die Fairness deutlich unterscheiden. Immer als
 * überprüfbare Aussage über Programm und Stand, nie als „Partei hat nichts“.
 */
export function ohneTreffer(e: ParteiErgebnis): { kurz: string; lang: string; badge?: string } | null {
  if (e.treffer.length > 0) return null
  const stand = datum(e.partei.programm_stand)
  if (!e.abdeckung) {
    return {
      badge: 'noch nicht erfasst',
      kurz: 'noch nicht erfasst',
      lang: `Das Wahlprogramm (Stand ${stand}) ist zu diesem Thema noch nicht ausgewertet. Deshalb gibt es in dieser Runde keine Wertung.`,
    }
  }
  if (e.abdeckung.art === 'keine') {
    return {
      kurz: 'nichts zum Thema im Programm',
      lang: `Das Wahlprogramm (Stand ${stand}) enthält keine Maßnahme zu diesem Thema.`,
    }
  }
  return {
    kurz: 'nichts zu diesen Ursachen im Programm',
    lang: `Im Wahlprogramm (Stand ${stand}) keine Maßnahme zu diesen Ursachen gefunden.`,
  }
}
