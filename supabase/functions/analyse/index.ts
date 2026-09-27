// Edge Function `analyse`: ordnet eine Äußerung per KI (Mistral) ein und
// speichert abgeschlossene Runden anonym. Die KI vergibt keine Punkte und
// nennt keine Links – Punkte kommen deterministisch aus der Datenbank.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   MISTRAL_API_KEY            – Pflicht
//   MISTRAL_MODEL              – optional, Standard: mistral-small-latest
// Automatisch vorhanden: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'npm:@supabase/supabase-js@2'
import { bewertePartei } from '../_shared/bewertung.ts'
import { bereinigeAntwort, EingabeFehler, nutzerNachrichten, pruefeAnfrage, systemPrompt } from '../_shared/ki.ts'
import { pruefeText } from '../_shared/moderation.ts'
import type { AnalyseAntwort, Massnahme, Partei, Rolle, Thema, Ursache } from '../_shared/typen.ts'

const RATE_LIMIT_MAX = 40
const RATE_LIMIT_FENSTER = '30 minutes'
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

async function frageMistral(system: string, nachrichten: ReturnType<typeof nutzerNachrichten>): Promise<unknown> {
  const key = Deno.env.get('MISTRAL_API_KEY')
  if (!key) throw new Error('MISTRAL_API_KEY fehlt')
  const res = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('MISTRAL_MODEL') ?? 'mistral-small-latest',
      temperature: 0.1,
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, ...nachrichten],
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const daten = await res.json()
  return JSON.parse(daten.choices?.[0]?.message?.content ?? '{}')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ fehler: 'Nur POST erlaubt.' }, 405)

  try {
    const anfrage = pruefeAnfrage(await req.json().catch(() => null))

    const { data: erlaubt, error: rlFehler } = await db.rpc('rate_limit_pruefen', {
      p_sitzung: anfrage.sitzung,
      p_max: RATE_LIMIT_MAX,
      p_fenster: RATE_LIMIT_FENSTER,
    })
    if (rlFehler) throw rlFehler
    if (!erlaubt) return json({ fehler: 'Zu viele Anfragen. Bitte warte ein paar Minuten.' }, 429)

    const [themenRes, ursachenRes] = await Promise.all([
      db.from('themen').select('id, name, beschreibung'),
      db.from('ursachen').select('id, thema_id, beschreibung, quelle_url'),
    ])
    if (themenRes.error) throw themenRes.error
    if (ursachenRes.error) throw ursachenRes.error
    const themen = themenRes.data as Thema[]
    const ursachen = ursachenRes.data as Ursache[]

    const roh = await frageMistral(systemPrompt(themen, ursachen), nutzerNachrichten(anfrage.verlauf, anfrage.rolle))
    const antwort = bereinigeAntwort(roh, anfrage.verlauf, themen, ursachen)

    // Abgeschlossene Runde anonym speichern (nur die neutrale Zusammenfassung).
    if (antwort.typ !== 'forderung') {
      // Der Originaltext wird nur geprüft, nicht gespeichert.
      const original = anfrage.verlauf.filter((n) => n.von === 'spieler').map((n) => n.text)
      await speichereRunde(antwort, anfrage.parteien, anfrage.rolle, original)
    }

    return json(antwort)
  } catch (e) {
    if (e instanceof EingabeFehler) return json({ fehler: e.message }, 400)
    console.error('analyse:', e instanceof Error ? e.message : e)
    return json({ fehler: 'Die Einordnung hat gerade nicht geklappt. Bitte versuch es noch einmal.' }, 502)
  }
})

async function speichereRunde(
  antwort: AnalyseAntwort,
  [parteiA, parteiB]: [number, number],
  rolle: Rolle | null,
  original: string[],
) {
  const stichwort = antwort.stichwort ?? null
  const basis = {
    problem_text: antwort.zusammenfassung,
    stichwort,
    // Automatischer Filter: Treffer landen in der Admin-Ansicht unter „Vom Filter gestoppt“.
    filter_grund: pruefeText(stichwort, antwort.zusammenfassung, ...original),
    partei_a: parteiA,
    partei_b: parteiB,
  }

  if (antwort.typ === 'wert') {
    await db.from('runden').insert({ ...basis, status: 'wert' })
    return
  }

  if (antwort.thema_id === null) {
    await Promise.all([
      db.from('runden').insert({ ...basis, status: 'ungeprueft' }),
      db.from('review_warteschlange').insert({
        problem_text: antwort.zusammenfassung,
        einschaetzung: antwort.einschaetzung ?? null,
      }),
    ])
    return
  }

  const [pRes, mRes] = await Promise.all([
    db.from('parteien').select('*').in('id', [parteiA, parteiB]),
    db.from('massnahmen').select('*').eq('thema_id', antwort.thema_id).in('partei_id', [parteiA, parteiB]),
  ])
  const parteien = (pRes.data ?? []) as Partei[]
  const massnahmen = (mRes.data ?? []) as Massnahme[]
  const a = parteien.find((p) => p.id === parteiA)
  const b = parteien.find((p) => p.id === parteiB)
  if (!a || !b) return

  const pa = bewertePartei(a, antwort.thema_id, antwort.ursachen_ids, rolle, massnahmen).punkte
  const pb = bewertePartei(b, antwort.thema_id, antwort.ursachen_ids, rolle, massnahmen).punkte
  // Gespeichert werden die Rundenpunkte (Summe über die Ursachen), nicht der Spielpunkt.
  await db.from('runden').insert({ ...basis, thema_id: antwort.thema_id, status: 'gewertet', punkte_a: pa, punkte_b: pb })
}
