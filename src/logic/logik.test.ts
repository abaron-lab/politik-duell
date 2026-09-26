import { describe, expect, it } from 'vitest'
import { MASSNAHMEN, PARTEIEN, THEMEN, URSACHEN } from '../data/mock'
import type { Nachricht } from '../data/types'
import { analysiere } from './analyse'
import { besteParteien, bewertePartei, rundenpunkte } from './bewertung'

const spieler = (...texte: string[]): Nachricht[] => texte.map((text) => ({ von: 'spieler', text }))
const partei = (id: number) => PARTEIEN.find((p) => p.id === id)!

describe('analysiere (Mock der Edge Function)', () => {
  it('erkennt ein Alltagsproblem und ordnet Thema und Ursache zu', () => {
    const a = analysiere(spieler('Ich warte seit Monaten auf einen Termin beim Facharzt'), THEMEN, URSACHEN)
    expect(a.typ).toBe('problem')
    expect(a.thema_id).toBe(1)
    expect(a.ursachen_ids).toEqual([102])
  })

  it('fragt bei einer Forderung nach dem Problem dahinter', () => {
    const a = analysiere(spieler('Weniger Steuern!'), THEMEN, URSACHEN)
    expect(a.typ).toBe('forderung')
    expect(a.nachfrage).toBeTruthy()
  })

  it('fragt höchstens zweimal nach', () => {
    const verlauf: Nachricht[] = [
      { von: 'spieler', text: 'Mehr Wohnungen!' },
      { von: 'ki', text: 'Nachfrage 1' },
      { von: 'spieler', text: 'Man sollte mehr bauen' },
      { von: 'ki', text: 'Nachfrage 2' },
      { von: 'spieler', text: 'Wir brauchen mehr Wohnungen' },
    ]
    const a = analysiere(verlauf, THEMEN, URSACHEN)
    expect(a.typ).toBe('problem')
    expect(a.thema_id).toBe(2)
  })

  it('erkennt eine persönliche Haltung', () => {
    const a = analysiere(spieler('Ich finde Gerechtigkeit wichtig'), THEMEN, URSACHEN)
    expect(a.typ).toBe('wert')
  })

  it('liefert thema_id null für unbekannte Themen', () => {
    const a = analysiere(spieler('Der Bus kommt bei uns nur zweimal am Tag'), THEMEN, URSACHEN)
    expect(a.typ).toBe('problem')
    expect(a.thema_id).toBeNull()
  })

  it('nimmt alle Ursachen des Themas, wenn keine konkret genannt ist', () => {
    const a = analysiere(spieler('Meine Stromrechnung ist ein Problem'), THEMEN, URSACHEN)
    expect(a.thema_id).toBe(3)
    expect(a.ursachen_ids).toEqual([301, 302, 303])
  })
})

describe('Bewertung', () => {
  it('summiert über Ursachen und nimmt je Ursache die beste Maßnahme', () => {
    // Partei Gamma, Energie: Netzentgelte (2+2) + Importe (2+2); Steuern: keine Maßnahme
    const e = bewertePartei(partei(3), 3, [301, 302, 303], null, MASSNAHMEN)
    expect(e.punkte).toBe(8)
    expect(e.treffer).toHaveLength(2)
  })

  it('gibt 0 Punkte ohne Maßnahme zum Thema', () => {
    expect(bewertePartei(partei(5), 1, [101, 102, 103], null, MASSNAHMEN).punkte).toBe(0)
  })

  it('berücksichtigt den Rollen-Modifikator', () => {
    const ohne = bewertePartei(partei(1), 2, [202], null, MASSNAHMEN).punkte
    expect(bewertePartei(partei(1), 2, [202], 'mieter', MASSNAHMEN).punkte).toBe(ohne + 1)
    expect(bewertePartei(partei(1), 2, [202], 'eigentuemer', MASSNAHMEN).punkte).toBe(ohne - 1)
  })

  it('vergibt Rundenpunkte nach Regel', () => {
    expect(rundenpunkte(5, 3)).toEqual([1, 0])
    expect(rundenpunkte(2, 4)).toEqual([0, 1])
    expect(rundenpunkte(4, 4)).toEqual([1, 1])
    expect(rundenpunkte(0, 0)).toEqual([0, 0])
  })

  it('findet die insgesamt beste Partei', () => {
    const beste = besteParteien(PARTEIEN, 1, [101], null, MASSNAHMEN)
    expect(beste.map((b) => b.partei.id)).toEqual([1])
  })
})
