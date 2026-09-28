import { KATALOG } from '../pruefung/katalog'

// Kleine Helfer für den Admin-Bereich „Prüfung“ (echter Datenkatalog aus daten/).

export const themaName = (id: number) => KATALOG.themen.find((t) => t.id === id)?.name ?? `Thema ${id}`

export const massnahmenIds = (themaId: number) => KATALOG.massnahmen.filter((m) => m.thema_id === themaId).map((m) => m.id)
