import { alsDateien, ladeKatalog } from '../data/katalog.ts'

// Der echte Datenkatalog aus `daten/` – mit ungeprüften Entwürfen, die nicht in
// der Datenbank stehen. Nur Prüfseite und Admin-Ansicht laden ihn (eigenes
// Bundle). Unbedenklich: `daten/` ist ohnehin öffentlich im Repo.

const [parteienDatei] = alsDateien(import.meta.glob('../../daten/parteien.json', { eager: true, import: 'default' }))
const themenDateien = alsDateien(import.meta.glob('../../daten/themen/*.json', { eager: true, import: 'default' }))

export const KATALOG = ladeKatalog(parteienDatei, themenDateien)
