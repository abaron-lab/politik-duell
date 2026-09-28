import { useCallback, useEffect, useState } from 'react'
import { adminDb, type PruefBewertung, type PruefEinladung } from './client'
import { PruefAuswertung } from './PruefAuswertung'
import { PruefEinladungen } from './PruefEinladungen'

// Admin → Prüfung: Einladungen für Prüfende verwalten und ihre Bewertungen
// je Thema auswerten (docs/plan-pruefung.md).
// Namen und Einzelwerte sind nur hier sichtbar, nie im Repo.

export function Pruefung() {
  const db = adminDb!
  const [einladungen, setEinladungen] = useState<PruefEinladung[]>([])
  const [bewertungen, setBewertungen] = useState<PruefBewertung[]>([])
  const [fehler, setFehler] = useState<string | null>(null)

  const laden = useCallback(async () => {
    const [e, b] = await Promise.all([
      db
        .from('pruef_einladungen')
        .select('id, name, themen, erstellt, gesperrt, einwilligung_am, name_oeffentlich')
        .order('erstellt', { ascending: false }),
      db.from('pruef_bewertungen').select('*'),
    ])
    const f = e.error ?? b.error
    // Fehlt die Tabelle, ist die Migration noch nicht eingespielt.
    setFehler(f ? `${f.message} – ist die Migration 20260929000000_pruefung.sql ausgeführt?` : null)
    if (e.data) setEinladungen(e.data as PruefEinladung[])
    if (b.data) setBewertungen(b.data as PruefBewertung[])
  }, [db])

  useEffect(() => {
    let aktiv = true
    void Promise.resolve().then(() => {
      if (aktiv) void laden()
    })
    return () => {
      aktiv = false
    }
  }, [laden])

  return (
    <>
      <p className="admin-hinweis">
        Persönliche Links für Prüfende. Sie bewerten die Maßnahmen ihrer Themen ohne Parteinamen; ihre Namen sind nur
        hier sichtbar.
      </p>
      {fehler && (
        <p className="admin-fehler" role="alert">
          {fehler}
        </p>
      )}
      <PruefEinladungen einladungen={einladungen} bewertungen={bewertungen} onGeaendert={laden} onFehler={setFehler} />
      <PruefAuswertung einladungen={einladungen} bewertungen={bewertungen} />
    </>
  )
}
