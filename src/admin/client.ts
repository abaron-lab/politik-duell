import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Eigener Supabase-Client für die Admin-Ansicht: Nur hier gibt es eine Anmeldung
// (Supabase Auth), das Spiel selbst bleibt ohne Konten.

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const adminDb: SupabaseClient | null =
  URL && KEY ? createClient(URL, KEY, { auth: { persistSession: true, storageKey: 'wl-admin' } }) : null

export interface AdminRunde {
  id: number
  created_at: string
  problem_text: string
  stichwort: string | null
  filter_grund: string | null
  status: 'gewertet' | 'unvollstaendig' | 'ungeprueft' | 'wert'
  freigegeben: boolean
  abgelehnt: boolean
  moderiert_am: string | null
}

export interface ReviewEintrag {
  id: number
  created_at: string
  problem_text: string
  einschaetzung: string | null
  erledigt: boolean
}
