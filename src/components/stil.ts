import type { CSSProperties } from 'react'

/** Setzt die Parteifarbe als CSS-Variable `--partei`. */
export const parteiStil = (farbe: string) => ({ '--partei': farbe }) as CSSProperties
