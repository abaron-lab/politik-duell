import { bereinigeStichwort } from './moderation.ts'
import { ROLLEN_IDS, type AnalyseAnfrage, type AnalyseAntwort, type Nachricht, type Rolle, type Thema, type Ursache } from './typen.ts'

// Prompt-Aufbau und strenge Prüfung der KI-Antwort. Reines TypeScript,
// damit es in der App getestet und in der Edge Function genutzt werden kann.

export const MAX_NACHFRAGEN = 2
export const MAX_NACHRICHTEN = 2 * MAX_NACHFRAGEN + 1
export const MAX_TEXTLAENGE = 500

const ROLLEN_TEXT: Record<Rolle, string> = {
  mieter: 'Mieter:in',
  eigentuemer: 'Eigentümer:in',
  angestellt: 'Angestellt',
  selbststaendig: 'Selbstständig',
  rentner: 'Rentner:in',
  arbeitslos: 'Arbeitslos',
  studierend: 'Studierend',
  vermoegend: 'Vermögend',
}

export function systemPrompt(themen: Thema[], ursachen: Ursache[]): string {
  const katalog = themen
    .map((t) => {
      const u = ursachen
        .filter((x) => x.thema_id === t.id)
        .map((x) => `    - Ursache ${x.id}: ${x.beschreibung}`)
        .join('\n')
      return `- Thema ${t.id}: ${t.name} – ${t.beschreibung}\n${u}`
    })
    .join('\n')

  return `Du moderierst das Spiel „Wer liefert?“. Spieler:innen nennen Alltagsprobleme.
Deine einzige Aufgabe: die Äußerung einordnen und einem Thema und Ursachen aus dem Katalog zuordnen.

Regeln:
- Neutral, respektvoll, freundlich. Keine Belehrung. Deutsch, kurze Sätze.
- Bewerte NIEMALS Parteien, Politiker:innen oder Maßnahmen. Nenne keine Parteien.
- Nenne NIEMALS Links, Quellen oder Zahlen aus Studien.
- Vergib keine Punkte.

Einordnung ("typ"):
- "problem": ein konkretes Alltagsproblem (z. B. „Ich finde keine bezahlbare Wohnung“).
- "forderung": eine politische Forderung ohne konkretes Alltagsproblem (z. B. „Weniger Steuern!“).
  Dann stelle in "nachfrage" genau eine kurze, freundliche Frage nach dem konkreten Alltagsproblem dahinter,
  z. B. „Was läuft in deinem Alltag konkret schief?“.
- "wert": eine persönliche Haltung oder ein Wert (z. B. „Mir ist Gerechtigkeit wichtig“), kein Problem.

Zuordnung (nur bei "problem"):
- "thema_id": die ID aus dem Katalog, die am besten passt, sonst null.
- "ursachen_ids": IDs der Ursachen dieses Themas, die zum geschilderten Problem passen. Wenn unklar: alle Ursachen des Themas.
- Passt kein Thema: "thema_id": null, "ursachen_ids": [] und in "einschaetzung" 1–2 neutrale Sätze zu möglichen
  Ursachen des Problems – ohne Parteien, ohne Lösungsbewertung, ohne Links.

"zusammenfassung": ein kurzer, neutraler Satz zum Problem, ohne Namen oder persönliche Details.
"stichwort": 1–3 Wörter, die das Problem neutral benennen (z. B. „Facharzttermin“, „Nebenkosten-Nachzahlung“),
  ohne Namen, Orte, Beleidigungen oder Wertungen.

Katalog:
${katalog}

Antworte ausschließlich mit einem JSON-Objekt:
{"typ": "problem" | "forderung" | "wert", "nachfrage": string | null, "thema_id": number | null,
 "ursachen_ids": number[], "zusammenfassung": string, "stichwort": string, "einschaetzung": string | null}`
}

export function nutzerNachrichten(verlauf: Nachricht[], rolle: Rolle | null) {
  const nachfragen = verlauf.filter((n) => n.von === 'ki').length
  const hinweis =
    `Rolle der Person: ${rolle ? ROLLEN_TEXT[rolle] : 'keine Angabe'}.` +
    (nachfragen >= MAX_NACHFRAGEN
      ? ' Es wurde bereits zweimal nachgefragt: Ordne jetzt als "problem" oder "wert" ein, nicht als "forderung".'
      : '')
  return [
    { role: 'system' as const, content: hinweis },
    ...verlauf.map((n) => ({
      role: n.von === 'spieler' ? ('user' as const) : ('assistant' as const),
      content: n.text,
    })),
  ]
}

export class EingabeFehler extends Error {}

/** Prüft die Anfrage der App. Wirft EingabeFehler bei ungültigen Daten. */
export function pruefeAnfrage(roh: unknown): AnalyseAnfrage {
  const a = roh as Partial<AnalyseAnfrage> | null
  if (!a || typeof a !== 'object') throw new EingabeFehler('Anfrage fehlt.')
  if (typeof a.sitzung !== 'string' || !/^[0-9a-f-]{36}$/i.test(a.sitzung)) throw new EingabeFehler('Ungültige Sitzung.')
  if (!Array.isArray(a.verlauf) || a.verlauf.length === 0 || a.verlauf.length > MAX_NACHRICHTEN)
    throw new EingabeFehler('Ungültiger Verlauf.')
  for (const n of a.verlauf) {
    if (!n || (n.von !== 'spieler' && n.von !== 'ki') || typeof n.text !== 'string')
      throw new EingabeFehler('Ungültige Nachricht.')
    if (n.text.trim().length === 0 || n.text.length > MAX_TEXTLAENGE) throw new EingabeFehler('Text zu lang oder leer.')
  }
  if (a.verlauf[a.verlauf.length - 1].von !== 'spieler') throw new EingabeFehler('Letzte Nachricht muss vom Spieler sein.')
  if (a.rolle !== null && a.rolle !== undefined && !ROLLEN_IDS.includes(a.rolle)) throw new EingabeFehler('Ungültige Rolle.')
  if (
    !Array.isArray(a.parteien) ||
    a.parteien.length !== 2 ||
    !a.parteien.every((p) => Number.isInteger(p)) ||
    a.parteien[0] === a.parteien[1]
  )
    throw new EingabeFehler('Ungültige Parteien.')
  return { sitzung: a.sitzung, verlauf: a.verlauf, rolle: a.rolle ?? null, parteien: a.parteien }
}

const kurz = (s: unknown, max: number) => (typeof s === 'string' ? s.trim().replace(/\s+/g, ' ').slice(0, max) : '')

/**
 * Macht aus der (nicht vertrauenswürdigen) KI-Antwort eine gültige AnalyseAntwort:
 * nur IDs aus dem Katalog, höchstens zwei Nachfragen, keine Links.
 */
export function bereinigeAntwort(
  roh: unknown,
  verlauf: Nachricht[],
  themen: Thema[],
  ursachen: Ursache[],
): AnalyseAntwort {
  const r = (roh && typeof roh === 'object' ? roh : {}) as Record<string, unknown>
  const nachfragen = verlauf.filter((n) => n.von === 'ki').length
  const letzterText = verlauf.filter((n) => n.von === 'spieler').at(-1)?.text ?? ''
  const ohneLinks = (s: string) => s.replace(/(https?:\/\/|www\.)\S+/gi, '').trim()

  let typ: AnalyseAntwort['typ'] = r.typ === 'forderung' || r.typ === 'wert' ? r.typ : 'problem'
  let nachfrage = ohneLinks(kurz(r.nachfrage, 200))
  if (typ === 'forderung' && (nachfragen >= MAX_NACHFRAGEN || !nachfrage)) {
    if (nachfragen >= MAX_NACHFRAGEN) typ = 'problem'
    else nachfrage = 'Was läuft in deinem Alltag konkret schief?'
  }

  const zusammenfassung = ohneLinks(kurz(r.zusammenfassung, 200)) || kurz(letzterText, 120)
  const stichwort = bereinigeStichwort(r.stichwort, zusammenfassung)

  if (typ !== 'problem') {
    return {
      typ,
      nachfrage: typ === 'forderung' ? nachfrage : null,
      thema_id: null,
      ursachen_ids: [],
      zusammenfassung,
      stichwort,
      einschaetzung: null,
    }
  }

  const thema = themen.find((t) => t.id === Number(r.thema_id)) ?? null
  if (!thema) {
    return {
      typ,
      nachfrage: null,
      thema_id: null,
      ursachen_ids: [],
      zusammenfassung,
      stichwort,
      einschaetzung: ohneLinks(kurz(r.einschaetzung, 400)) || null,
    }
  }

  const erlaubt = ursachen.filter((u) => u.thema_id === thema.id).map((u) => u.id)
  const genannt = Array.isArray(r.ursachen_ids) ? r.ursachen_ids.map(Number).filter((id) => erlaubt.includes(id)) : []
  return {
    typ,
    nachfrage: null,
    thema_id: thema.id,
    ursachen_ids: genannt.length > 0 ? [...new Set(genannt)] : erlaubt,
    zusammenfassung,
    stichwort,
    einschaetzung: null,
  }
}
