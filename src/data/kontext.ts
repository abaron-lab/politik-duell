import { createContext, useContext } from 'react'
import { MOCK_DATEN, type Daten } from './quelle'

export const DatenKontext = createContext<Daten>(MOCK_DATEN)

/** Parteien, Themen, Ursachen und Maßnahmen – aus Supabase oder den Beispieldaten. */
export const useDaten = () => useContext(DatenKontext)
