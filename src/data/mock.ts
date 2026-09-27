import type { Massnahme, Partei, Thema, Ursache } from './types.ts'

// ---------------------------------------------------------------------------
// MOCK-DATEN für Meilenstein 1.
//
// Parteien, Maßnahmen, Punktzahlen und Links sind FIKTIV. Sie dienen nur dazu,
// Spielablauf und Punktelogik zu zeigen. Echte Parteien werden erst mit
// geprüften Daten (Quellenpflicht, siehe CLAUDE.md) eingetragen – so entsteht
// kein Eindruck einer Bewertung realer Parteien.
// ---------------------------------------------------------------------------

const MOCK_STAND = '2026-01-01'
const beleg = (partei: string, seite: number) =>
  `https://example.org/mock/${partei}/wahlprogramm.pdf#page=${seite}`

export const PARTEIEN: Partei[] = [
  { id: 1, name: 'Partei Alpha', kurzname: 'Alpha', farbe: '#2bb3a3', programm_url: 'https://example.org/mock/alpha/wahlprogramm.pdf', programm_stand: MOCK_STAND },
  { id: 2, name: 'Partei Beta', kurzname: 'Beta', farbe: '#8f6bff', programm_url: 'https://example.org/mock/beta/wahlprogramm.pdf', programm_stand: MOCK_STAND },
  { id: 3, name: 'Partei Gamma', kurzname: 'Gamma', farbe: '#f2a33a', programm_url: 'https://example.org/mock/gamma/wahlprogramm.pdf', programm_stand: MOCK_STAND },
  { id: 4, name: 'Partei Delta', kurzname: 'Delta', farbe: '#4f8fe8', programm_url: 'https://example.org/mock/delta/wahlprogramm.pdf', programm_stand: MOCK_STAND },
  { id: 5, name: 'Partei Epsilon', kurzname: 'Epsilon', farbe: '#e86a8f', programm_url: 'https://example.org/mock/epsilon/wahlprogramm.pdf', programm_stand: MOCK_STAND },
]

export const THEMEN: Thema[] = [
  {
    id: 1,
    name: 'Arzttermine',
    beschreibung: 'Lange Wartezeiten und schwer erreichbare Praxen.',
    schlagwoerter: ['arzt', 'aerzt', 'praxis', 'praxen', 'hausarzt', 'facharzt', 'kinderarzt', 'wartezimmer', 'behandlung', 'krank', 'orthopaed', 'termin beim'],
  },
  {
    id: 2,
    name: 'Miete',
    beschreibung: 'Hohe Mieten und schwierige Wohnungssuche.',
    schlagwoerter: ['miete', 'mieten', 'wohnung', 'vermieter', 'mieterhoehung', 'wohnen', 'wg-zimmer', 'kaltmiete', 'warmmiete', 'umzug'],
  },
  {
    id: 3,
    name: 'Energiepreise',
    beschreibung: 'Hohe Kosten für Strom und Heizung.',
    schlagwoerter: ['strom', 'energie', 'heiz', 'gasrechnung', 'gaspreis', 'abschlag', 'fernwaerme', 'stromrechnung', 'heizkosten'],
  },
]

export const URSACHEN: Ursache[] = [
  { id: 101, thema_id: 1, beschreibung: 'Zu wenige Praxen, besonders auf dem Land', quelle_url: 'https://example.org/mock/studie/aerzteversorgung', schlagwoerter: ['land', 'dorf', 'keine praxis', 'kein hausarzt', 'kein arzt', 'aerztemangel', 'zu wenig aerzte', 'nimmt keine', 'keine neuen patienten', 'weit fahren'] },
  { id: 102, thema_id: 1, beschreibung: 'Ineffiziente Terminvergabe', quelle_url: 'https://example.org/mock/studie/terminvergabe', schlagwoerter: ['termin', 'warte', 'monate', 'wochen', 'telefon', 'hotline', 'erreich', 'besetzt'] },
  { id: 103, thema_id: 1, beschreibung: 'Budgetierung begrenzt Behandlungen', quelle_url: 'https://example.org/mock/studie/budgetierung', schlagwoerter: ['budget', 'quartal', 'abrechnung', 'kasse', 'kassenpatient'] },

  { id: 201, thema_id: 2, beschreibung: 'Zu wenig neue Wohnungen', quelle_url: 'https://example.org/mock/studie/wohnungsbau', schlagwoerter: ['keine wohnung', 'finde keine', 'wohnungssuche', 'besichtigung', 'bewerber', 'zu wenig wohnungen', 'neubau', 'nichts frei'] },
  { id: 202, thema_id: 2, beschreibung: 'Starke Mietsteigerungen', quelle_url: 'https://example.org/mock/studie/mietentwicklung', schlagwoerter: ['mieterhoehung', 'erhoeh', 'teurer', 'zu hoch', 'teuer', 'leisten', 'indexmiete', 'neuvermietung'] },
  { id: 203, thema_id: 2, beschreibung: 'Hohe Baukosten und lange Genehmigungen', quelle_url: 'https://example.org/mock/studie/baukosten', schlagwoerter: ['baukosten', 'genehmigung', 'bauen', 'bauantrag', 'vorschrift'] },

  { id: 301, thema_id: 3, beschreibung: 'Hohe Netzentgelte', quelle_url: 'https://example.org/mock/studie/netzentgelte', schlagwoerter: ['netz', 'grundgebuehr', 'grundpreis'] },
  { id: 302, thema_id: 3, beschreibung: 'Steuern und Abgaben auf Energie', quelle_url: 'https://example.org/mock/studie/energiesteuern', schlagwoerter: ['steuer', 'abgabe', 'umlage', 'co2'] },
  { id: 303, thema_id: 3, beschreibung: 'Abhängigkeit von fossilen Importen', quelle_url: 'https://example.org/mock/studie/importe', schlagwoerter: ['gas', 'oel', 'import', 'abhaengig', 'heizoel'] },
]

export const MASSNAHMEN: Massnahme[] = [
  // --- Arzttermine -------------------------------------------------------
  { id: 1, thema_id: 1, partei_id: 1, beschreibung: 'Stipendien und Startförderung für Praxen in unterversorgten Regionen', ursachen_ids: [101], wirksamkeit: 3, umsetzbarkeit: 2, begruendung: 'Setzt direkt an fehlenden Praxen an; Wirkung erst nach einigen Jahren.', beleg_programm_url: beleg('alpha', 34), beleg_studie_url: 'https://example.org/mock/studie/landarzt-stipendien', stand: MOCK_STAND, geprueft: false },
  { id: 2, thema_id: 1, partei_id: 2, beschreibung: 'Digitale Terminplattform mit Pflicht zur Freigabe freier Termine', ursachen_ids: [102], wirksamkeit: 2, umsetzbarkeit: 2, begruendung: 'Verteilt vorhandene Termine besser, schafft aber keine neuen.', beleg_programm_url: beleg('beta', 18), stand: MOCK_STAND, geprueft: false },
  { id: 3, thema_id: 1, partei_id: 2, beschreibung: 'Budgetgrenzen für hausärztliche Leistungen aufheben', ursachen_ids: [103], wirksamkeit: 2, umsetzbarkeit: 1, begruendung: 'Mehr Behandlungen möglich; Finanzierung durch Kassen ungeklärt.', beleg_programm_url: beleg('beta', 19), stand: MOCK_STAND, geprueft: false },
  { id: 4, thema_id: 1, partei_id: 3, beschreibung: 'Mehr Medizinstudienplätze', ursachen_ids: [101], wirksamkeit: 2, umsetzbarkeit: 1, begruendung: 'Richtige Richtung, wirkt aber erst nach über zehn Jahren Ausbildung.', beleg_programm_url: beleg('gamma', 52), stand: MOCK_STAND, geprueft: false },
  { id: 5, thema_id: 1, partei_id: 4, beschreibung: 'Hausarztpraxis als erste Anlaufstelle mit gezielter Überweisung', ursachen_ids: [102, 103], wirksamkeit: 2, umsetzbarkeit: 2, begruendung: 'Entlastet Facharzttermine; erfordert Umstellung im System.', beleg_programm_url: beleg('delta', 27), beleg_studie_url: 'https://example.org/mock/studie/primaerarzt', stand: MOCK_STAND, geprueft: false },
  // Partei Epsilon: keine Maßnahme zu Arztterminen → 0 Punkte

  // --- Miete -------------------------------------------------------------
  {
    id: 6, thema_id: 2, partei_id: 1, beschreibung: 'Mietpreisbremse verlängern und Ausnahmen streichen', ursachen_ids: [202], wirksamkeit: 2, umsetzbarkeit: 3,
    rollen_modifikator: {
      mieter: { wert: 1, begruendung: 'Begrenzt Mietsteigerungen für Mieter:innen unmittelbar.' },
      eigentuemer: { wert: -1, begruendung: 'Begrenzt mögliche Mieteinnahmen.' },
    },
    begruendung: 'Dämpft Anstiege schnell, schafft aber keinen neuen Wohnraum.', beleg_programm_url: beleg('alpha', 12), stand: MOCK_STAND, geprueft: false,
  },
  { id: 7, thema_id: 2, partei_id: 2, beschreibung: 'Baugenehmigungen digitalisieren und feste Fristen einführen', ursachen_ids: [201, 203], wirksamkeit: 2, umsetzbarkeit: 2, begruendung: 'Beschleunigt Neubau; Personal in Bauämtern bleibt Engpass.', beleg_programm_url: beleg('beta', 41), beleg_studie_url: 'https://example.org/mock/studie/bauamt-digital', stand: MOCK_STAND, geprueft: false },
  // Partei Gamma: keine Maßnahme zur Miete → 0 Punkte
  { id: 8, thema_id: 2, partei_id: 4, beschreibung: 'Kommunalen und genossenschaftlichen Wohnungsbau fördern', ursachen_ids: [201], wirksamkeit: 3, umsetzbarkeit: 1, begruendung: 'Schafft dauerhaft günstigen Wohnraum; hoher Finanzbedarf.', beleg_programm_url: beleg('delta', 9), stand: MOCK_STAND, geprueft: false },
  {
    id: 9, thema_id: 2, partei_id: 5, beschreibung: 'Bauvorschriften vereinfachen und Standards bündeln', ursachen_ids: [203], wirksamkeit: 2, umsetzbarkeit: 3,
    rollen_modifikator: { eigentuemer: { wert: 1, begruendung: 'Senkt Kosten bei Sanierung und Neubau im Eigentum.' } },
    begruendung: 'Senkt Baukosten zügig; Wirkung auf Mieten indirekt.', beleg_programm_url: beleg('epsilon', 22), stand: MOCK_STAND, geprueft: false,
  },

  // --- Energiepreise -----------------------------------------------------
  { id: 10, thema_id: 3, partei_id: 1, beschreibung: 'Stromsteuer auf das europäische Minimum senken', ursachen_ids: [302], wirksamkeit: 2, umsetzbarkeit: 3, begruendung: 'Sofort spürbar; Einnahmeausfall muss gegenfinanziert werden.', beleg_programm_url: beleg('alpha', 45), stand: MOCK_STAND, geprueft: false },
  // Partei Beta: keine Maßnahme zu Energiepreisen → 0 Punkte
  { id: 11, thema_id: 3, partei_id: 3, beschreibung: 'Netzentgelte teilweise aus dem Bundeshaushalt tragen', ursachen_ids: [301], wirksamkeit: 2, umsetzbarkeit: 2, begruendung: 'Senkt einen großen Preisbestandteil; dauerhafte Haushaltsbelastung.', beleg_programm_url: beleg('gamma', 30), beleg_studie_url: 'https://example.org/mock/studie/netzentgelte-zuschuss', stand: MOCK_STAND, geprueft: false },
  { id: 12, thema_id: 3, partei_id: 3, beschreibung: 'Ausbau heimischer erneuerbarer Energien beschleunigen', ursachen_ids: [303], wirksamkeit: 2, umsetzbarkeit: 2, begruendung: 'Verringert Importabhängigkeit mittelfristig.', beleg_programm_url: beleg('gamma', 31), stand: MOCK_STAND, geprueft: false },
  {
    id: 13, thema_id: 3, partei_id: 4, beschreibung: 'Einnahmen aus CO₂-Preis als Pro-Kopf-Auszahlung zurückgeben', ursachen_ids: [302], wirksamkeit: 1, umsetzbarkeit: 2,
    rollen_modifikator: {
      studierend: { wert: 1, begruendung: 'Pauschale Auszahlung entlastet kleine Einkommen relativ stärker.' },
      rentner: { wert: 1, begruendung: 'Pauschale Auszahlung entlastet kleine Einkommen relativ stärker.' },
      arbeitslos: { wert: 1, begruendung: 'Pauschale Auszahlung entlastet kleine Einkommen relativ stärker.' },
    },
    begruendung: 'Gleicht Belastung aus, senkt den Preis selbst aber nicht.', beleg_programm_url: beleg('delta', 38), stand: MOCK_STAND, geprueft: false,
  },
  { id: 14, thema_id: 3, partei_id: 5, beschreibung: 'Langfristige Lieferverträge für Gas absichern', ursachen_ids: [303], wirksamkeit: 1, umsetzbarkeit: 2, begruendung: 'Mehr Planbarkeit, aber kaum Einfluss auf Strom- und Netzkosten.', beleg_programm_url: beleg('epsilon', 15), stand: MOCK_STAND, geprueft: false },
]

/** Beispielprobleme für die Hintergrund-Wortwolke (später: freigegebene Runden aus Supabase). */
export const BEISPIEL_PROBLEME = [
  'Kein Facharzttermin', 'Miete frisst Gehalt', 'Stromrechnung verdoppelt', 'Keine Wohnung in Uni-Nähe',
  'Hausarzt nimmt niemanden', 'Nebenkosten-Nachzahlung', 'Monate auf Termin warten', 'Mieterhöhung',
  'Heizkosten', 'WG-Zimmer unbezahlbar', 'Praxis auf dem Land zu', 'Netzentgelte',
]
