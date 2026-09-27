// Automatischer Vorfilter für die Wortwolke. Reines TypeScript (App + Edge Function).
//
// Der Filter entscheidet nie allein über eine Freigabe: Alles, was in die
// Wortwolke soll, gibt ein Admin frei. Schlägt der Filter an, landet der
// Eintrag in der Admin-Ansicht unter „Vom Filter gestoppt“ statt in der Liste
// der offenen Einträge.

/** Beleidigungen: zählen am Wortanfang („Idioten“, „Arschloch“). */
const BELEIDIGUNGEN = [
  'arschloch', 'arschgeige', 'idiot', 'vollidiot', 'depp', 'trottel', 'vollpfosten', 'wichser', 'wixer',
  'fotze', 'hurensohn', 'hure', 'schlampe', 'spast', 'spacko', 'missgeburt', 'pisser', 'drecksau',
  'bastard', 'schwuchtel', 'ficken', 'fick dich', 'verpiss', 'honk', 'halt die fresse',
]

/** Wortteile, die auch mitten in Zusammensetzungen zählen („Drecksvermieter“). */
const BELEIDIGENDE_WORTTEILE = ['drecks', 'scheiß', 'scheiss', 'arschloch', 'hurensohn', 'wichser', 'fotze', 'idiot']

/** Menschenverachtende Bezeichnungen, Gewaltaufrufe, NS-Parolen. Zählen am Wortanfang. */
const HETZE = [
  'kanake', 'kanacke', 'neger', 'nigger', 'zigeuner', 'kameltreiber', 'untermensch', 'judenpack', 'judensau',
  'vergasen', 'erschießen', 'erschiessen', 'abknallen', 'totschlagen', 'abstechen',
  'sieg heil', 'heil hitler',
]

// Personen: Anrede oder Titel mit Namen („Herr Müller“, „Dr. Schmidt“), Social-Media-Handles.
const PERSON_MUSTER = [
  /(^|[^\p{L}])(Herr|Herrn|Frau|Hr\.|Fr\.|Dr\.|Prof\.)\s+[A-ZÄÖÜ][a-zäöüß]+/u,
  /(^|\s)@[a-z0-9_]{3,}/i,
]

// Kontaktdaten und Links haben in der Wortwolke nichts verloren.
const KONTAKT_MUSTER = [
  /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, // E-Mail
  /(\+49|\b0049|\b0)[\s/-]?\d{2,5}[\s/-]?\d{4,}/, // Telefonnummer
  /(https?:\/\/|www\.)\S+/i,
  /\b[a-zäöüß]+(straße|str\.|weg|gasse|allee)\s+\d+[a-z]?\b/i, // Adresse
]

function normalisiere(text: string): string {
  return (
    ' ' +
    text
      .toLowerCase()
      .replace(/[0@4$1!3]/g, (z) => ({ '0': 'o', '@': 'a', '4': 'a', $: 's', '1': 'i', '!': 'i', '3': 'e' })[z] ?? z)
      .replace(/[^a-zäöüß ]+/g, ' ')
      .replace(/(.)\1{2,}/g, '$1$1') // „diiiiies“ → „diies“
      .replace(/\s+/g, ' ') +
    ' '
  )
}

const amWortanfang = (normal: string, liste: string[]) => liste.some((w) => normal.includes(' ' + w))
const irgendwo = (normal: string, liste: string[]) => liste.some((w) => normal.includes(w))

export type FilterGrund = 'beleidigung' | 'hetze' | 'person' | 'kontaktdaten'

export const FILTER_TEXTE: Record<FilterGrund, string> = {
  beleidigung: 'Beleidigung',
  hetze: 'Hetze oder Gewalt',
  person: 'möglicher Name einer Privatperson',
  kontaktdaten: 'Kontaktdaten oder Link',
}

/**
 * Prüft Texte (Stichwort, Zusammenfassung, Originaltext) und gibt den ersten
 * Grund zurück, aus dem sie nicht ungeprüft in die Wortwolke dürfen – sonst null.
 */
export function pruefeText(...texte: (string | null | undefined)[]): FilterGrund | null {
  const roh = texte.filter(Boolean).join(' \n ')
  if (!roh.trim()) return null
  if (KONTAKT_MUSTER.some((m) => m.test(roh))) return 'kontaktdaten'
  const normal = normalisiere(roh)
  if (amWortanfang(normal, HETZE)) return 'hetze'
  if (amWortanfang(normal, BELEIDIGUNGEN) || irgendwo(normal, BELEIDIGENDE_WORTTEILE)) return 'beleidigung'
  if (PERSON_MUSTER.some((m) => m.test(roh))) return 'person'
  return null
}

/** Macht aus einem Vorschlag ein sauberes Stichwort für die Wortwolke (1–3 Wörter, max. 40 Zeichen). */
export function bereinigeStichwort(roh: unknown, ersatz: string): string {
  const text = (typeof roh === 'string' && roh.trim() ? roh : ersatz)
    .replace(/(https?:\/\/|www\.)\S+/gi, '')
    .replace(/[„“"'»«.!?;:]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const woerter = text.split(' ').filter(Boolean).slice(0, 3)
  let s = ''
  for (const w of woerter) {
    const neu = s ? `${s} ${w}` : w
    if (neu.length > 40) break
    s = neu
  }
  return s || text.slice(0, 40) || 'Problem'
}
