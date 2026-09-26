// Typen spiegeln das Datenmodell aus CLAUDE.md, damit die Mock-Daten
// später 1:1 durch Supabase-Abfragen ersetzt werden können.

export type Rolle =
  | 'mieter'
  | 'eigentuemer'
  | 'angestellt'
  | 'selbststaendig'
  | 'rentner'
  | 'arbeitslos'
  | 'studierend'
  | 'vermoegend'

export interface Partei {
  id: number
  name: string
  kurzname: string
  farbe: string
  programm_url: string
  programm_stand: string // ISO-Datum
}

export interface Thema {
  id: number
  name: string
  beschreibung: string
  /** Nur Mock: Schlagwörter, mit denen die Mock-Analyse Themen erkennt. */
  schlagwoerter: string[]
}

export interface Ursache {
  id: number
  thema_id: number
  beschreibung: string
  quelle_url: string
  /** Nur Mock: Schlagwörter, mit denen die Mock-Analyse Ursachen erkennt. */
  schlagwoerter: string[]
}

export interface RollenModifikator {
  wert: number
  begruendung: string
}

export interface Massnahme {
  id: number
  thema_id: number
  partei_id: number
  beschreibung: string
  ursachen_ids: number[]
  wirksamkeit: 0 | 1 | 2 | 3
  umsetzbarkeit: 0 | 1 | 2 | 3
  rollen_modifikator?: Partial<Record<Rolle, RollenModifikator>>
  begruendung: string
  beleg_programm_url: string
  beleg_studie_url?: string
  stand: string
  geprueft: boolean
}

/** Antwortformat der Edge Function `analyse` (siehe CLAUDE.md). */
export interface AnalyseAntwort {
  typ: 'problem' | 'forderung' | 'wert'
  nachfrage: string | null
  thema_id: number | null
  ursachen_ids: number[]
  zusammenfassung: string
}

export interface Nachricht {
  von: 'spieler' | 'ki'
  text: string
}
