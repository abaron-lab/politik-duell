import type { AbdeckungEintrag, Massnahme, Partei, Rolle } from './typen.ts'

// Deterministische Punktevergabe aus der kuratierten Datenbank.
// Die KI ist hier nicht beteiligt.

export interface Treffer {
  massnahme: Massnahme
  /** Ursachen, für die diese Maßnahme gezählt wurde. */
  ursachen_ids: number[]
  /** Punkte pro Ursache: Wirksamkeit (± Rolle, 0–3) × Umsetzbarkeit, also 0 bis 9. */
  punkteJeUrsache: number
  rollenBonus: number
  /** Wirksamkeit nach Rollen-Modifikator (0–3). */
  wirksamkeit: number
  rollenBegruendung?: string
}

export interface ParteiErgebnis {
  partei: Partei
  punkte: number
  treffer: Treffer[]
  /** Erfassung des Themas für diese Partei; null = noch nicht erfasst (keine Wertung möglich). */
  abdeckung: AbdeckungEintrag | null
}

export const findeAbdeckung = (abdeckung: AbdeckungEintrag[], parteiId: number, themaId: number) =>
  abdeckung.find((a) => a.partei_id === parteiId && a.thema_id === themaId) ?? null

export function massnahmenPunkte(m: Massnahme, rolle: Rolle | null) {
  const mod = rolle ? m.rollen_modifikator?.[rolle] : undefined
  const rollenBonus = mod?.wert ?? 0
  // Produkt statt Summe: Eine unwirksame Maßnahme bringt keine Punkte, egal wie leicht
  // sie umsetzbar ist, und eine nicht umsetzbare ebenso wenig. Die Rolle verschiebt nur
  // die Wirksamkeit (für diese Person wirkt die Maßnahme stärker oder schwächer).
  const wirksamkeit = Math.min(3, Math.max(0, m.wirksamkeit + rollenBonus))
  return {
    punkte: wirksamkeit * m.umsetzbarkeit,
    wirksamkeit,
    rollenBonus,
    rollenBegruendung: mod?.begruendung,
  }
}

/**
 * Rundenpunkte einer Partei = Summe über die zugeordneten Ursachen.
 * Pro Ursache zählt die beste Maßnahme der Partei, die diese Ursache adressiert.
 * Keine Maßnahme zum Thema → 0 Punkte. Ob das „nichts im Programm“ oder
 * „noch nicht erfasst“ heißt, steht in `abdeckung`.
 */
export function bewertePartei(
  partei: Partei,
  themaId: number,
  ursachenIds: number[],
  rolle: Rolle | null,
  massnahmen: Massnahme[],
  abdeckung: AbdeckungEintrag[],
): ParteiErgebnis {
  // Nicht erfasst → keine Maßnahmen verwenden, auch wenn (inkonsistent) welche vorliegen.
  const erfasst = findeAbdeckung(abdeckung, partei.id, themaId)
  if (!erfasst) return { partei, punkte: 0, treffer: [], abdeckung: null }
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
        wirksamkeit: beste.p.wirksamkeit,
        rollenBegruendung: beste.p.rollenBegruendung,
      })
    }
  }

  return { partei, punkte, treffer: [...trefferJeMassnahme.values()], abdeckung: erfasst }
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

/**
 * Wertung einer Runde zwischen zwei Parteien. Ist das Thema für eine der
 * beiden noch nicht erfasst, wird nicht gewertet: Fehlende Daten dürfen
 * keiner Partei einen Punkt kosten.
 */
export function werteRunde(a: ParteiErgebnis, b: ParteiErgebnis): { status: 'gewertet' | 'unvollstaendig'; punkte: [number, number] } {
  if (!a.abdeckung || !b.abdeckung) return { status: 'unvollstaendig', punkte: [0, 0] }
  return { status: 'gewertet', punkte: rundenpunkte(a.punkte, b.punkte) }
}

/**
 * Alle Parteien mit der höchsten Punktzahl zu diesem Problem (leer, wenn niemand liefert).
 * Berücksichtigt nur Parteien, für die das Thema erfasst ist.
 */
export function besteParteien(
  parteien: Partei[],
  themaId: number,
  ursachenIds: number[],
  rolle: Rolle | null,
  massnahmen: Massnahme[],
  abdeckung: AbdeckungEintrag[],
): ParteiErgebnis[] {
  const alle = parteien
    .map((p) => bewertePartei(p, themaId, ursachenIds, rolle, massnahmen, abdeckung))
    .filter((e) => e.abdeckung)
  if (!alle.length) return []
  const max = Math.max(...alle.map((e) => e.punkte))
  if (max <= 0) return []
  return alle.filter((e) => e.punkte === max)
}
