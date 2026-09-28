// Zugriffsschutz der Edge Function: erlaubte Herkunft (CORS) und Rate-Limits.
// Reines TypeScript, damit es in der App getestet und in der Funktion genutzt werden kann.

/** Pro zufälliger Sitzungs-ID (Browser-Tab). */
export const RATE_LIMIT_SITZUNG = { max: 40, fenster: '30 minutes' }

/**
 * Obergrenze für alle Sitzungen zusammen – deckelt die KI-Kosten, auch wenn
 * jemand ständig neue Sitzungs-IDs erzeugt. Ohne IP-Adressen.
 * Anpassbar über das Secret RATE_LIMIT_GLOBAL (Anfragen pro Stunde).
 */
export const RATE_LIMIT_GLOBAL = { max: 600, fenster: '1 hour' }

/** Feste ID des globalen Zählers. Keine gültige Sitzung (nicht Version 4), siehe pruefeAnfrage. */
export const GLOBALE_SITZUNG = '00000000-0000-0000-0000-000000000000'

export function globalesLimit(wert: string | undefined): number {
  const n = Number(wert)
  return Number.isInteger(n) && n > 0 ? n : RATE_LIMIT_GLOBAL.max
}

/**
 * Liest die erlaubten Herkünfte aus dem Secret ERLAUBTE_URSPRUENGE, z. B.
 * „https://politik-duell.de, https://politik-duell-*.vercel.app“. `*` steht für
 * einen Teil eines Hostnamens (Buchstaben, Ziffern, Bindestriche).
 * Leer → keine Einschränkung (für Entwicklung und Einrichtung).
 */
export function erlaubteUrspruenge(wert: string | undefined): RegExp[] | null {
  const eintraege = (wert ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean)
  if (eintraege.length === 0) return null
  return eintraege.map(
    (e) => new RegExp('^' + e.split('*').map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[a-z0-9-]*') + '$', 'i'),
  )
}

export function ursprungErlaubt(ursprung: string | null, erlaubt: RegExp[] | null): boolean {
  if (!erlaubt) return true
  return ursprung !== null && erlaubt.some((r) => r.test(ursprung))
}

export function corsKoepfe(ursprung: string | null, erlaubt: RegExp[] | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': erlaubt ? (ursprungErlaubt(ursprung, erlaubt) ? ursprung! : 'null') : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...(erlaubt ? { Vary: 'Origin' } : {}),
  }
}
