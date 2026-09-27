import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { analysiereAsync } from '../logic/analyse'
import { ABDECKUNG, MASSNAHMEN, PARTEIEN, THEMEN, URSACHEN } from './mock'
import type { AbdeckungEintrag, AnalyseAnfrage, AnalyseAntwort, Massnahme, Partei, Thema, Ursache } from './types'

// Datenquelle der App: Supabase (Standard, wenn konfiguriert) oder die
// eingebauten Beispieldaten (VITE_DATENQUELLE=mock, z. B. für Offline-Demos).

export interface Daten {
  quelle: 'supabase' | 'mock'
  parteien: Partei[]
  themen: Thema[]
  ursachen: Ursache[]
  massnahmen: Massnahme[]
  /** Welche Themen je Partei erfasst sind – fehlt ein Eintrag, wird nicht gewertet. */
  abdeckung: AbdeckungEintrag[]
}

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const NUR_MOCK = import.meta.env.VITE_DATENQUELLE === 'mock'

export const supabase: SupabaseClient | null =
  !NUR_MOCK && URL && KEY ? createClient(URL, KEY, { auth: { persistSession: false } }) : null

export const MOCK_DATEN: Daten = {
  quelle: 'mock',
  parteien: PARTEIEN,
  themen: THEMEN,
  ursachen: URSACHEN,
  massnahmen: MASSNAHMEN,
  abdeckung: ABDECKUNG,
}

export async function ladeDaten(): Promise<Daten> {
  if (!supabase) return MOCK_DATEN
  const [p, t, u, m, a] = await Promise.all([
    supabase.from('parteien').select('*').order('id'),
    supabase.from('themen').select('*').order('id'),
    supabase.from('ursachen').select('*').order('id'),
    supabase.from('massnahmen').select('*').order('id'),
    supabase.from('abdeckung').select('*'),
  ])
  const fehler = p.error ?? t.error ?? u.error ?? m.error
  if (fehler) throw new Error(fehler.message)
  // Ohne Abdeckung ließe sich „nichts im Programm“ nicht von „noch nicht erfasst“ unterscheiden.
  if (a.error) throw new Error(`Tabelle „abdeckung“ fehlt – Migration 20260928000000_abdeckung.sql ausführen (${a.error.message})`)
  if (!p.data?.length) throw new Error('Die Datenbank enthält noch keine Parteien.')
  return {
    quelle: 'supabase',
    parteien: p.data as Partei[],
    themen: t.data as Thema[],
    ursachen: u.data as Ursache[],
    massnahmen: m.data as Massnahme[],
    abdeckung: a.data as AbdeckungEintrag[],
  }
}

/** Zufällige Sitzungs-ID nur für das Rate-Limit – ohne Bezug zu einer Person. */
let sitzungImSpeicher: string | null = null
function sitzung(): string {
  try {
    const vorhanden = sessionStorage.getItem('wl-sitzung')
    if (vorhanden) return vorhanden
    const neu = crypto.randomUUID()
    sessionStorage.setItem('wl-sitzung', neu)
    return neu
  } catch {
    sitzungImSpeicher ??= crypto.randomUUID()
    return sitzungImSpeicher
  }
}

export class AnalyseFehler extends Error {}

export async function analysiere(
  daten: Daten,
  anfrage: Omit<AnalyseAnfrage, 'sitzung'>,
): Promise<AnalyseAntwort> {
  if (daten.quelle === 'mock' || !supabase) {
    return analysiereAsync(anfrage.verlauf, daten.themen, daten.ursachen)
  }
  const { data, error } = await supabase.functions.invoke<AnalyseAntwort>('analyse', {
    body: { ...anfrage, sitzung: sitzung() },
  })
  if (error) {
    // Fehlertext der Funktion anzeigen, wenn vorhanden.
    let text = 'Die Einordnung hat gerade nicht geklappt. Bitte versuch es noch einmal.'
    const antwort = (error as { context?: Response }).context
    try {
      const body = await antwort?.json()
      if (body?.fehler) text = body.fehler
    } catch {
      // Antwort ohne JSON – Standardtext behalten.
    }
    // Fehlercode anhängen, damit sich die Ursache ohne Browser-Konsole eingrenzen lässt.
    const code = antwort instanceof Response ? antwort.status : 'Netzwerk'
    throw new AnalyseFehler(`${text} (Fehlercode ${code})`)
  }
  if (!data) throw new AnalyseFehler('Leere Antwort von der Einordnung.')
  return data
}
