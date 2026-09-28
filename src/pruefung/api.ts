import { createClient } from '@supabase/supabase-js'
import type { BewertungEingabe, PruefAnfrage } from '../../supabase/functions/_shared/pruefung'

// Aufrufe der Edge Function `pruefung` von der Prüfseite. Ohne Konto: Zugang
// allein über den Token aus dem Link.

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const db = URL && KEY ? createClient(URL, KEY, { auth: { persistSession: false } }) : null

export const pruefungVerfuegbar = db !== null

export interface GeladeneBewertung extends BewertungEingabe {
  abgesendet: boolean
}

export interface PruefStand {
  name: string
  themen: number[]
  einwilligung: boolean
  name_oeffentlich: boolean
  bewertungen: GeladeneBewertung[]
}

export class PruefFehler extends Error {
  readonly status: number | null
  constructor(message: string, status: number | null) {
    super(message)
    this.status = status
  }
}

async function rufe<T>(anfrage: PruefAnfrage): Promise<T> {
  if (!db) throw new PruefFehler('Keine Verbindung zum Server konfiguriert.', null)
  const { data, error } = await db.functions.invoke<T>('pruefung', { body: anfrage })
  if (error) {
    const antwort = (error as { context?: Response }).context
    let text = 'Verbindung fehlgeschlagen. Bitte gleich noch einmal versuchen.'
    try {
      const body = await antwort?.json()
      if (body?.fehler) text = body.fehler
    } catch {
      // Antwort ohne JSON – Standardtext behalten.
    }
    throw new PruefFehler(text, antwort instanceof Response ? antwort.status : null)
  }
  return data as T
}

export const laden = (token: string) => rufe<PruefStand>({ token, aktion: 'laden' })
export const einwilligen = (token: string, name_oeffentlich: boolean) => rufe({ token, aktion: 'einwilligen', name_oeffentlich })
export const speichern = (token: string, bewertungen: BewertungEingabe[]) => rufe({ token, aktion: 'speichern', bewertungen })
export const absenden = (token: string, thema_id: number) => rufe({ token, aktion: 'absenden', thema_id })
export const widerrufen = (token: string) => rufe({ token, aktion: 'widerrufen' })
