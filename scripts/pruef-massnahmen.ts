// Baut supabase/functions/_shared/pruef-massnahmen.ts: welche Maßnahmen zu
// welchem Thema gehören (auch ungeprüfte). Die Edge Function `pruefung` prüft
// damit, dass Prüfende nur Maßnahmen ihrer Themen bewerten – die ungeprüften
// Maßnahmen stehen nicht in der Datenbank.
import type { Katalog } from '../src/data/katalog.ts'

export function pruefMassnahmenTs(k: Katalog): string {
  const jeThema = k.themen
    .map((t) => [t.id, k.massnahmen.filter((m) => m.thema_id === t.id).map((m) => m.id)] as const)
    .filter(([, ids]) => ids.length > 0)
  return `// AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
// Maßnahmen-IDs je Thema für die Edge Function \`pruefung\`.
import type { MassnahmenJeThema } from './pruefung.ts'

export const MASSNAHMEN_JE_THEMA: MassnahmenJeThema = {
${jeThema.map(([id, ids]) => `  ${id}: [${ids.join(', ')}],`).join('\n')}
}
`
}
