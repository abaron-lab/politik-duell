import type { Massnahme, Partei, Rolle } from '../data/types'

// Deterministische Punktevergabe aus der kuratierten Datenbank.
// Die KI ist hier nicht beteiligt.

export interface Treffer {
  massnahme: Massnahme
  /** Ursachen, für die diese Maßnahme gezählt wurde. */
  ursachen_ids: number[]
  /** Punkte pro Ursache: Wirksamkeit + Umsetzbarkeit + Rollen-Modifikator (min. 0). */
  punkteJeUrsache: number
  rollenBonus: number
  rollenBegruendung?: string
}

export interface ParteiErgebnis {
  partei: Partei
  punkte: number
  treffer: Treffer[]
}

export function massnahmenPunkte(m: Massnahme, rolle: Rolle | null) {
  const mod = rolle ? m.rollen_modifikator?.[rolle] : undefined
  const rollenBonus = mod?.wert ?? 0
  return {
    punkte: Math.max(0, m.wirksamkeit + m.umsetzbarkeit + rollenBonus),
    rollenBonus,
    rollenBegruendung: mod?.begruendung,
  }
}

/**
 * Rundenpunkte einer Partei = Summe über die zugeordneten Ursachen.
 * Pro Ursache zählt die beste Maßnahme der Partei, die diese Ursache adressiert.
 * Keine Maßnahme zum Thema → 0 Punkte.
 */
export function bewertePartei(
  partei: Partei,
  themaId: number,
  ursachenIds: number[],
  rolle: Rolle | null,
  massnahmen: Massnahme[],
): ParteiErgebnis {
  const eigene = massnahmen.filter((m) => m.partei_id === partei.id && m.thema_id === themaId)
  const trefferJeMassnahme = new Map<number, Treffer>()
  let punkte = 0

  for (const ursacheId of ursachenIds) {
    let beste: { m: Massnahme; p: ReturnType<typeof massnahmenPunkte> } | null = null
    for (const m of eigene) {
      if (!m.ursachen_ids.includes(ursacheId)) continue
      const p = massnahmenPunkte(m, rolle)
      if (!beste || p.punkte > beste.p.punkte) beste = { m, p }
    }
    if (!beste) continue
    punkte += beste.p.punkte
    const vorhanden = trefferJeMassnahme.get(beste.m.id)
    if (vorhanden) {
      vorhanden.ursachen_ids.push(ursacheId)
    } else {
      trefferJeMassnahme.set(beste.m.id, {
        massnahme: beste.m,
        ursachen_ids: [ursacheId],
        punkteJeUrsache: beste.p.punkte,
        rollenBonus: beste.p.rollenBonus,
        rollenBegruendung: beste.p.rollenBegruendung,
      })
    }
  }

  return { partei, punkte, treffer: [...trefferJeMassnahme.values()] }
}

/**
 * Rundensieger: Höhere Summe bekommt 1 Punkt, Gleichstand je 1 Punkt.
 * Haben beide Parteien 0 Punkte (keine Maßnahme), gibt es keinen Punkt.
 */
export function rundenpunkte(a: number, b: number): [number, number] {
  if (a === 0 && b === 0) return [0, 0]
  if (a === b) return [1, 1]
  return a > b ? [1, 0] : [0, 1]
}

/** Alle Parteien mit der höchsten Punktzahl zu diesem Problem (leer, wenn niemand liefert). */
export function besteParteien(
  parteien: Partei[],
  themaId: number,
  ursachenIds: number[],
  rolle: Rolle | null,
  massnahmen: Massnahme[],
): ParteiErgebnis[] {
  const alle = parteien.map((p) => bewertePartei(p, themaId, ursachenIds, rolle, massnahmen))
  const max = Math.max(...alle.map((e) => e.punkte))
  if (max <= 0) return []
  return alle.filter((e) => e.punkte === max)
}
