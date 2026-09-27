import { useEffect, useState } from 'react'
import { BEISPIEL_PROBLEME } from './mock'
import { supabase } from './quelle'

// Einträge der Wortwolke: freigegebene Stichwörter der zuletzt gespielten
// Runden, gezählt nach Häufigkeit. Updates kommen live über Supabase Realtime.
// Row Level Security sorgt dafür, dass die App nur Freigegebenes sieht.

export interface Wort {
  text: string
  anzahl: number
}

const MAX_RUNDEN = 150
const MAX_WOERTER = 40
/** Zurückgezogene Freigaben meldet Realtime der App nicht – deshalb zusätzlich regelmäßig neu laden. */
const NEU_LADEN_MS = 5 * 60_000

const gleich = (a: Wort[], b: Wort[]) =>
  a.length === b.length && a.every((w, i) => w.text === b[i].text && w.anzahl === b[i].anzahl)

const BEISPIEL: Wort[] = BEISPIEL_PROBLEME.map((text) => ({ text, anzahl: 1 }))

/** Fasst Stichwörter zusammen (Groß-/Kleinschreibung egal), häufigste zuerst. */
export function zaehleWoerter(stichwoerter: string[]): Wort[] {
  const zaehler = new Map<string, Wort>()
  for (const roh of stichwoerter) {
    const text = roh.trim()
    if (!text) continue
    const schluessel = text.toLocaleLowerCase('de')
    const w = zaehler.get(schluessel)
    if (w) w.anzahl++
    else zaehler.set(schluessel, { text, anzahl: 1 })
  }
  return [...zaehler.values()].sort((a, b) => b.anzahl - a.anzahl).slice(0, MAX_WOERTER)
}

async function ladeWoerter(): Promise<Wort[]> {
  if (!supabase) return BEISPIEL
  const { data, error } = await supabase
    .from('runden')
    .select('stichwort')
    .eq('freigegeben', true)
    .neq('status', 'wert')
    .not('stichwort', 'is', null)
    .order('created_at', { ascending: false })
    .limit(MAX_RUNDEN)
  if (error) throw error
  return zaehleWoerter(data.map((r) => r.stichwort as string))
}

/** Wörter für die Wortwolke. Ohne Supabase oder solange nichts freigegeben ist: Beispielwörter. */
export function useWortwolke(): Wort[] {
  const [woerter, setWoerter] = useState<Wort[]>(supabase ? [] : BEISPIEL)

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let aktiv = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const laden = () =>
      ladeWoerter()
        .then((w) => {
          const neu = w.length > 0 ? w : BEISPIEL
          // Gleiche Wörter → gleiches Array, damit die Wolke nicht neu berechnet wird.
          if (aktiv) setWoerter((alt) => (gleich(alt, neu) ? alt : neu))
        })
        .catch(() => aktiv && setWoerter((alt) => (alt.length > 0 ? alt : BEISPIEL)))
    // Mehrere Änderungen kurz hintereinander nur einmal laden.
    const baldLaden = () => {
      clearTimeout(timer)
      timer = setTimeout(laden, 800)
    }

    laden()
    const kanal = client
      .channel('wortwolke')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runden' }, baldLaden)
      .subscribe()
    const intervall = setInterval(laden, NEU_LADEN_MS)

    return () => {
      aktiv = false
      clearTimeout(timer)
      clearInterval(intervall)
      void client.removeChannel(kanal)
    }
  }, [])

  return woerter
}
