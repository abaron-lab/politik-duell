import { type FormEvent, useState } from 'react'
import { neuerToken, tokenHash } from '../../supabase/functions/_shared/pruefung'
import { KATALOG } from '../pruefung/katalog'
import { massnahmenIds, themaName } from './pruefKatalog'
import { adminDb, type PruefBewertung, type PruefEinladung } from './client'

// Admin → Prüfung → Einladungen: persönliche Links für Prüfende anlegen,
// Status sehen, sperren, löschen. Der Token steht nur im Link; in der
// Datenbank liegt sein SHA-256-Hash. Deshalb lässt sich ein Link nur einmal anzeigen.

const datum = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** Themen, zu denen es Maßnahmen gibt (nur diese lassen sich bewerten). */
const BEWERTBAR = KATALOG.themen.filter((t) => massnahmenIds(t.id).length > 0)

export function PruefEinladungen({
  einladungen,
  bewertungen,
  onGeaendert,
  onFehler,
}: {
  einladungen: PruefEinladung[]
  bewertungen: PruefBewertung[]
  onGeaendert: () => Promise<void>
  onFehler: (text: string | null) => void
}) {
  const db = adminDb!
  const [name, setName] = useState('')
  const [themen, setThemen] = useState<number[]>([])
  const [link, setLink] = useState<{ name: string; url: string } | null>(null)
  const [kopiert, setKopiert] = useState(false)
  const [laeuft, setLaeuft] = useState(false)

  async function anlegen(e: FormEvent) {
    e.preventDefault()
    setLaeuft(true)
    onFehler(null)
    const token = neuerToken()
    const { error } = await db
      .from('pruef_einladungen')
      .insert({ token_hash: await tokenHash(token), name: name.trim(), themen })
    setLaeuft(false)
    if (error) return onFehler(error.message)
    setLink({ name: name.trim(), url: `${location.origin}${location.pathname}#/pruefen/${token}` })
    setKopiert(false)
    setName('')
    setThemen([])
    await onGeaendert()
  }

  async function kopieren() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link.url)
      setKopiert(true)
    } catch {
      onFehler('Kopieren nicht möglich – bitte den Link markieren und selbst kopieren.')
    }
  }

  async function sperren(e: PruefEinladung) {
    const { error } = await db.from('pruef_einladungen').update({ gesperrt: !e.gesperrt }).eq('id', e.id)
    onFehler(error?.message ?? null)
    await onGeaendert()
  }

  async function loeschen(e: PruefEinladung) {
    if (!confirm(`Einladung von „${e.name}“ löschen? Alle Bewertungen dieser Person werden mit gelöscht.`)) return
    const { error } = await db.from('pruef_einladungen').delete().eq('id', e.id)
    onFehler(error?.message ?? null)
    await onGeaendert()
  }

  return (
    <>
      <form className="admin-eintrag pruef-anlegen" onSubmit={anlegen}>
        <p className="admin-text">Neue Einladung</p>
        <label className="admin-stichwort">
          Name (nur intern sichtbar)
          <input value={name} maxLength={80} required onChange={(e) => setName(e.target.value)} />
        </label>
        <fieldset className="pruef-themenwahl">
          <legend className="admin-klein">Themen</legend>
          {BEWERTBAR.length === 0 && <p className="admin-leer">Noch kein Thema mit Maßnahmen im Datenkatalog.</p>}
          {BEWERTBAR.map((t) => (
            <label key={t.id}>
              <input
                type="checkbox"
                checked={themen.includes(t.id)}
                onChange={(e) => setThemen((v) => (e.target.checked ? [...v, t.id] : v.filter((x) => x !== t.id)))}
              />
              {t.name} ({massnahmenIds(t.id).length} Maßnahmen)
            </label>
          ))}
        </fieldset>
        <div className="admin-aktionen">
          <button className="knopf knopf-klein" disabled={laeuft || !name.trim() || themen.length === 0}>
            {laeuft ? 'Lege an …' : 'Einladung anlegen'}
          </button>
        </div>
      </form>

      {link && (
        <div className="admin-eintrag pruef-link" role="status">
          <p className="admin-text">Link für {link.name}</p>
          <p className="admin-warnung">
            Nur jetzt sichtbar – der Link wird nicht gespeichert. Jetzt kopieren und der Person persönlich schicken.
          </p>
          <input readOnly value={link.url} onFocus={(e) => e.target.select()} aria-label="Einladungslink" />
          <div className="admin-aktionen">
            <button className="knopf knopf-klein" onClick={() => void kopieren()}>
              {kopiert ? 'Kopiert ✓' : 'Link kopieren'}
            </button>
            <button className="knopf knopf-klein knopf-leise" onClick={() => setLink(null)}>
              Fertig
            </button>
          </div>
        </div>
      )}

      {einladungen.length === 0 && <p className="admin-leer">Noch keine Einladungen.</p>}
      <ul className="admin-liste">
        {einladungen.map((e) => {
          const eigene = bewertungen.filter((b) => b.einladung_id === e.id)
          return (
            <li key={e.id} className="admin-eintrag">
              <p className="admin-text">
                {e.name}
                {e.gesperrt && <span className="admin-warnung"> · gesperrt</span>}
              </p>
              <p className="admin-klein">
                Eingeladen am {datum(e.erstellt)} ·{' '}
                {e.einwilligung_am ? `eingewilligt am ${datum(e.einwilligung_am)}` : 'noch keine Einwilligung'}
                {e.einwilligung_am && (e.name_oeffentlich ? ' · Name darf genannt werden' : ' · Name nicht öffentlich')}
              </p>
              <ul className="pruef-status">
                {e.themen.map((t) => {
                  const ids = new Set(massnahmenIds(t))
                  const hier = eigene.filter((b) => ids.has(b.massnahme_id))
                  const fertig = hier.filter((b) => b.wirksamkeit !== null && b.umsetzbarkeit !== null).length
                  const abgesendet = hier.length > 0 && hier.length >= ids.size && hier.every((b) => b.abgesendet)
                  return (
                    <li key={t} className="admin-klein">
                      {themaName(t)}: {fertig}/{ids.size} bewertet{abgesendet ? ' · abgesendet' : ''}
                    </li>
                  )
                })}
              </ul>
              <div className="admin-aktionen">
                <span className="admin-klein" />
                <button className="knopf knopf-klein knopf-leise" onClick={() => void sperren(e)}>
                  {e.gesperrt ? 'Entsperren' : 'Sperren'}
                </button>
                <button className="knopf knopf-klein knopf-gefahr" onClick={() => void loeschen(e)}>
                  Löschen
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
