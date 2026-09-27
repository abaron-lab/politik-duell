import type { Rolle } from './types.ts'

export const ROLLEN: { id: Rolle; label: string }[] = [
  { id: 'mieter', label: 'Mieter:in' },
  { id: 'eigentuemer', label: 'Eigentümer:in' },
  { id: 'angestellt', label: 'Angestellt' },
  { id: 'selbststaendig', label: 'Selbstständig' },
  { id: 'rentner', label: 'Rentner:in' },
  { id: 'arbeitslos', label: 'Arbeitslos' },
  { id: 'studierend', label: 'Studierend' },
  { id: 'vermoegend', label: 'Vermögend' },
]
