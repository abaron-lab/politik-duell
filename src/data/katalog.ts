import { ROLLEN_IDS, type Massnahme, type Partei, type Thema, type Ursache } from './types.ts'

// ---------------------------------------------------------------------------
// Kuratierter Datenkatalog (Ordner `daten/`, Format siehe daten/README.md).
//
// Dieses Modul prüft die JSON-Dateien und baut daraus die flachen Listen,
// die App, Seed und Datenbank nutzen. Es ist reines TypeScript ohne Datei-
// oder Browser-Zugriff: Die App lädt die Dateien über Vite, die Skripte über
// node:fs – geprüft wird überall gleich.
// ---------------------------------------------------------------------------

/** Ausdrückliche Feststellung, dass ein Programm zu einem Thema nichts enthält. */
export interface KeineMassnahme {
  begruendung: string
  stand: string
  geprueft: boolean
}

export interface Abdeckung {
  thema_id: number
  partei_id: number
  /** `massnahmen`: mindestens eine Maßnahme erfasst; `keine`: nachweislich nichts im Programm. */
  art: 'massnahmen' | 'keine'
  geprueft: boolean
}

export interface Katalog {
  /** true = erfundene Platzhalterdaten (Mock). Dann gelten gelockerte Regeln. */
  fiktiv: boolean
  parteien: Partei[]
  themen: Thema[]
  ursachen: Ursache[]
  /** Alle erfassten Maßnahmen, auch ungeprüfte Entwürfe. */
  massnahmen: Massnahme[]
  abdeckung: Abdeckung[]
}

export interface Datei {
  /** Pfad relativ zum Repo, nur für Fehlermeldungen. */
  pfad: string
  inhalt: unknown
}

export interface Pruefergebnis {
  katalog: Katalog
  fehler: string[]
  warnungen: string[]
}

/**
 * Maßnahmen, die im Spiel zählen. Bei echten Daten nur geprüfte – ungeprüfte
 * bleiben als Entwurf im Repo, landen aber nicht in der Datenbank. Bei
 * fiktiven Daten zählt alles, weil es dort nichts zu prüfen gibt.
 */
export function spielbareMassnahmen(k: Katalog): Massnahme[] {
  return k.fiktiv ? k.massnahmen : k.massnahmen.filter((m) => m.geprueft)
}

const DATUM = /^\d{4}-\d{2}-\d{2}$/
const FARBE = /^#[0-9a-fA-F]{6}$/
const SEITENANKER = /#page=\d+$/
const PLATZHALTER_HOSTS = ['example.org', 'example.com', 'example.net']

const istObjekt = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const istDatum = (v: unknown): v is string =>
  typeof v === 'string' && DATUM.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v)

const ohneAnker = (url: string) => url.split('#')[0]

export function pruefeKatalog(parteienDatei: Datei, themenDateien: Datei[]): Pruefergebnis {
  const fehler: string[] = []
  const warnungen: string[] = []
  const katalog: Katalog = { fiktiv: false, parteien: [], themen: [], ursachen: [], massnahmen: [], abdeckung: [] }

  // Kleine Helfer, die jeweils eine Meldung mit Ort erzeugen.
  const f = (ort: string, text: string) => fehler.push(`${ort}: ${text}`)
  const text = (ort: string, o: Record<string, unknown>, feld: string, max = 400): string => {
    const v = o[feld]
    if (typeof v !== 'string' || !v.trim()) f(ort, `„${feld}“ fehlt oder ist leer`)
    else if (v.length > max) f(ort, `„${feld}“ ist länger als ${max} Zeichen`)
    return typeof v === 'string' ? v : ''
  }
  const ganzzahl = (ort: string, o: Record<string, unknown>, feld: string, min: number, max: number): number => {
    const v = o[feld]
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) f(ort, `„${feld}“ muss eine ganze Zahl von ${min} bis ${max} sein`)
    return typeof v === 'number' ? v : 0
  }
  const datum = (ort: string, o: Record<string, unknown>, feld: string): string => {
    if (!istDatum(o[feld])) f(ort, `„${feld}“ muss ein Datum im Format JJJJ-MM-TT sein`)
    return typeof o[feld] === 'string' ? (o[feld] as string) : ''
  }
  const wahrheitswert = (ort: string, o: Record<string, unknown>, feld: string): boolean => {
    if (typeof o[feld] !== 'boolean') f(ort, `„${feld}“ muss true oder false sein`)
    return o[feld] === true
  }
  const url = (ort: string, o: Record<string, unknown>, feld: string, pflicht = true): string | undefined => {
    const v = o[feld]
    if (v === undefined || v === null) {
      if (pflicht) f(ort, `„${feld}“ fehlt`)
      return undefined
    }
    let geparst: URL | null = null
    try {
      geparst = typeof v === 'string' ? new URL(v) : null
    } catch {
      // unten gemeldet
    }
    if (!geparst || geparst.protocol !== 'https:') {
      f(ort, `„${feld}“ muss eine vollständige https-Adresse sein`)
      return undefined
    }
    if (!katalog.fiktiv && PLATZHALTER_HOSTS.includes(geparst.hostname)) {
      f(ort, `„${feld}“ ist ein Platzhalter-Link (${geparst.hostname}) – bei echten Daten nicht erlaubt`)
    }
    return v as string
  }
  const unbekannteFelder = (ort: string, o: Record<string, unknown>, erlaubt: string[]) => {
    for (const k of Object.keys(o)) if (!erlaubt.includes(k)) f(ort, `unbekanntes Feld „${k}“ (Tippfehler?)`)
  }
  const schlagwoerter = (ort: string, o: Record<string, unknown>): string[] | undefined => {
    const v = o.schlagwoerter
    if (v === undefined) return undefined
    if (!Array.isArray(v) || v.some((s) => typeof s !== 'string' || !s.trim())) {
      f(ort, '„schlagwoerter“ muss eine Liste von Texten sein')
      return undefined
    }
    return v as string[]
  }

  // --- Parteien --------------------------------------------------------------
  const pd = parteienDatei.inhalt
  const pOrt = parteienDatei.pfad
  if (!istObjekt(pd) || !Array.isArray(pd.parteien)) {
    f(pOrt, 'erwartet ein Objekt mit „fiktiv“ und „parteien“ (Liste)')
    return { katalog, fehler, warnungen }
  }
  unbekannteFelder(pOrt, pd, ['fiktiv', 'hinweis', 'parteien'])
  katalog.fiktiv = wahrheitswert(pOrt, pd, 'fiktiv')

  const parteiIds = new Set<number>()
  const parteiNamen = new Set<string>()
  pd.parteien.forEach((roh, i) => {
    const ort = `${pOrt} › parteien[${i}]`
    if (!istObjekt(roh)) return f(ort, 'erwartet ein Objekt')
    unbekannteFelder(ort, roh, ['id', 'name', 'kurzname', 'farbe', 'programm_url', 'programm_stand'])
    const p: Partei = {
      id: ganzzahl(ort, roh, 'id', 1, 32767),
      name: text(ort, roh, 'name', 80),
      kurzname: text(ort, roh, 'kurzname', 20),
      farbe: text(ort, roh, 'farbe', 7),
      programm_url: url(ort, roh, 'programm_url') ?? '',
      programm_stand: datum(ort, roh, 'programm_stand'),
    }
    if (p.farbe && !FARBE.test(p.farbe)) f(ort, '„farbe“ muss ein Hex-Wert wie #1a2b3c sein')
    if (p.programm_url.includes('#')) f(ort, '„programm_url“ ist die Adresse des ganzen Programms – ohne #-Anker')
    if (parteiIds.has(p.id)) f(ort, `Partei-ID ${p.id} ist doppelt`)
    for (const n of [p.name, p.kurzname]) {
      if (n && parteiNamen.has(n.toLowerCase())) f(ort, `Name „${n}“ ist doppelt`)
      parteiNamen.add(n.toLowerCase())
    }
    parteiIds.add(p.id)
    katalog.parteien.push(p)
  })
  if (katalog.parteien.length < 2) f(pOrt, 'mindestens zwei Parteien nötig')
  const parteiNach = new Map(katalog.parteien.map((p) => [p.id, p]))

  // --- Themen ----------------------------------------------------------------
  const themaIds = new Set<number>()
  const themaNamen = new Set<string>()
  const ursacheIds = new Set<number>()
  const massnahmeIds = new Set<number>()

  for (const datei of themenDateien) {
    const ort = datei.pfad
    const t = datei.inhalt
    if (!istObjekt(t)) {
      f(ort, 'erwartet ein Objekt')
      continue
    }
    unbekannteFelder(ort, t, ['id', 'name', 'beschreibung', 'schlagwoerter', 'ursachen', 'abdeckung'])
    const thema: Thema = {
      id: ganzzahl(ort, t, 'id', 1, 32767),
      name: text(ort, t, 'name', 60),
      beschreibung: text(ort, t, 'beschreibung', 300),
    }
    const tw = schlagwoerter(ort, t)
    if (tw) thema.schlagwoerter = tw
    if (themaIds.has(thema.id)) f(ort, `Themen-ID ${thema.id} ist doppelt`)
    if (thema.name && themaNamen.has(thema.name.toLowerCase())) f(ort, `Thema „${thema.name}“ gibt es schon`)
    themaIds.add(thema.id)
    themaNamen.add(thema.name.toLowerCase())
    katalog.themen.push(thema)

    // Ursachen: parteiunabhängig, jede mit Quelle.
    const eigeneUrsachen = new Set<number>()
    if (!Array.isArray(t.ursachen) || t.ursachen.length === 0) f(ort, 'mindestens eine Ursache nötig („ursachen“)')
    for (const [i, roh] of (Array.isArray(t.ursachen) ? t.ursachen : []).entries()) {
      const uOrt = `${ort} › ursachen[${i}]`
      if (!istObjekt(roh)) {
        f(uOrt, 'erwartet ein Objekt')
        continue
      }
      unbekannteFelder(uOrt, roh, ['id', 'beschreibung', 'quelle_url', 'schlagwoerter'])
      const u: Ursache = {
        id: ganzzahl(uOrt, roh, 'id', 1, 32767),
        thema_id: thema.id,
        beschreibung: text(uOrt, roh, 'beschreibung', 200),
        quelle_url: url(uOrt, roh, 'quelle_url') ?? '',
      }
      const uw = schlagwoerter(uOrt, roh)
      if (uw) u.schlagwoerter = uw
      if (ursacheIds.has(u.id)) f(uOrt, `Ursachen-ID ${u.id} ist doppelt`)
      ursacheIds.add(u.id)
      eigeneUrsachen.add(u.id)
      katalog.ursachen.push(u)
    }

    // Abdeckung: Jede Partei genau einmal – mit Maßnahmen oder „keine_massnahme“.
    const gesehen = new Set<number>()
    const adressiert = new Set<number>()
    if (!Array.isArray(t.abdeckung)) f(ort, '„abdeckung“ fehlt (Liste mit einem Eintrag pro Partei)')
    for (const [i, roh] of (Array.isArray(t.abdeckung) ? t.abdeckung : []).entries()) {
      const aOrt = `${ort} › abdeckung[${i}]`
      if (!istObjekt(roh)) {
        f(aOrt, 'erwartet ein Objekt')
        continue
      }
      unbekannteFelder(aOrt, roh, ['partei_id', 'massnahmen', 'keine_massnahme'])
      const parteiId = ganzzahl(aOrt, roh, 'partei_id', 1, 32767)
      const partei = parteiNach.get(parteiId)
      if (!partei) f(aOrt, `unbekannte Partei-ID ${parteiId}`)
      if (gesehen.has(parteiId)) f(aOrt, `Partei ${parteiId} ist mehrfach eingetragen`)
      gesehen.add(parteiId)

      const hatListe = roh.massnahmen !== undefined
      const hatKeine = roh.keine_massnahme !== undefined
      if (hatListe === hatKeine) {
        f(aOrt, 'genau eines von „massnahmen“ oder „keine_massnahme“ angeben')
        continue
      }

      if (hatKeine) {
        const k = roh.keine_massnahme
        const kOrt = `${aOrt} › keine_massnahme`
        if (!istObjekt(k)) {
          f(kOrt, 'erwartet ein Objekt mit begruendung, stand, geprueft')
          continue
        }
        unbekannteFelder(kOrt, k, ['begruendung', 'stand', 'geprueft'])
        text(kOrt, k, 'begruendung')
        const stand = datum(kOrt, k, 'stand')
        const geprueft = wahrheitswert(kOrt, k, 'geprueft')
        if (partei && stand && partei.programm_stand && stand < partei.programm_stand) {
          f(kOrt, `„stand“ ${stand} liegt vor dem Programmstand ${partei.programm_stand} – bitte im aktuellen Programm neu prüfen`)
        }
        if (!katalog.fiktiv && !geprueft) warnungen.push(`${kOrt}: noch nicht geprüft`)
        katalog.abdeckung.push({ thema_id: thema.id, partei_id: parteiId, art: 'keine', geprueft })
        continue
      }

      if (!Array.isArray(roh.massnahmen) || roh.massnahmen.length === 0) {
        f(aOrt, '„massnahmen“ muss mindestens eine Maßnahme enthalten – sonst „keine_massnahme“ verwenden')
        continue
      }
      let alleGeprueft = true
      for (const [j, mRoh] of roh.massnahmen.entries()) {
        const mOrt = `${aOrt} › massnahmen[${j}]`
        if (!istObjekt(mRoh)) {
          f(mOrt, 'erwartet ein Objekt')
          continue
        }
        unbekannteFelder(mOrt, mRoh, [
          'id', 'beschreibung', 'ursachen_ids', 'wirksamkeit', 'umsetzbarkeit', 'rollen_modifikator',
          'begruendung', 'beleg_programm_url', 'beleg_studie_url', 'stand', 'geprueft',
        ])
        const m: Massnahme = {
          id: ganzzahl(mOrt, mRoh, 'id', 1, 2147483647),
          thema_id: thema.id,
          partei_id: parteiId,
          beschreibung: text(mOrt, mRoh, 'beschreibung', 200),
          ursachen_ids: [],
          wirksamkeit: ganzzahl(mOrt, mRoh, 'wirksamkeit', 0, 3) as Massnahme['wirksamkeit'],
          umsetzbarkeit: ganzzahl(mOrt, mRoh, 'umsetzbarkeit', 0, 3) as Massnahme['umsetzbarkeit'],
          begruendung: text(mOrt, mRoh, 'begruendung', 300),
          beleg_programm_url: url(mOrt, mRoh, 'beleg_programm_url') ?? '',
          stand: datum(mOrt, mRoh, 'stand'),
          geprueft: wahrheitswert(mOrt, mRoh, 'geprueft'),
        }
        const studie = url(mOrt, mRoh, 'beleg_studie_url', false)
        if (studie) m.beleg_studie_url = studie

        if (massnahmeIds.has(m.id)) f(mOrt, `Maßnahmen-ID ${m.id} ist doppelt`)
        massnahmeIds.add(m.id)

        // Ursachen müssen zum Thema gehören.
        const ids = mRoh.ursachen_ids
        if (!Array.isArray(ids) || ids.length === 0 || ids.some((x) => !Number.isInteger(x))) {
          f(mOrt, '„ursachen_ids“ muss eine nicht leere Liste von IDs sein')
        } else {
          for (const id of ids as number[]) {
            if (!eigeneUrsachen.has(id)) f(mOrt, `Ursache ${id} gehört nicht zum Thema „${thema.name}“`)
            else adressiert.add(id)
          }
          if (new Set(ids).size !== ids.length) f(mOrt, '„ursachen_ids“ enthält Doppelte')
          m.ursachen_ids = ids as number[]
        }

        // Beleg muss ins Programm der Partei zeigen, mit Seitenanker.
        if (m.beleg_programm_url && partei) {
          if (ohneAnker(m.beleg_programm_url) !== partei.programm_url) {
            f(mOrt, `„beleg_programm_url“ zeigt nicht auf das Programm der Partei (${partei.programm_url})`)
          }
          if (!SEITENANKER.test(m.beleg_programm_url)) f(mOrt, '„beleg_programm_url“ braucht einen Seitenanker wie #page=12')
        }
        if (partei && m.stand && partei.programm_stand && m.stand < partei.programm_stand) {
          f(mOrt, `„stand“ ${m.stand} liegt vor dem Programmstand ${partei.programm_stand} – bitte im aktuellen Programm neu prüfen`)
        }

        // Rollen-Modifikatoren: nur bekannte Rollen, kleiner Wert, immer begründet.
        const rm = mRoh.rollen_modifikator
        if (rm !== undefined && rm !== null) {
          if (!istObjekt(rm)) f(mOrt, '„rollen_modifikator“ muss ein Objekt sein')
          else {
            for (const [rolle, mod] of Object.entries(rm)) {
              const rOrt = `${mOrt} › rollen_modifikator.${rolle}`
              if (!(ROLLEN_IDS as readonly string[]).includes(rolle)) f(rOrt, `unbekannte Rolle (erlaubt: ${ROLLEN_IDS.join(', ')})`)
              if (!istObjekt(mod)) {
                f(rOrt, 'erwartet { wert, begruendung }')
                continue
              }
              unbekannteFelder(rOrt, mod, ['wert', 'begruendung'])
              ganzzahl(rOrt, mod, 'wert', -2, 2)
              if (mod.wert === 0) f(rOrt, '„wert“ 0 hat keine Wirkung – Eintrag weglassen')
              text(rOrt, mod, 'begruendung', 200)
            }
            m.rollen_modifikator = rm as Massnahme['rollen_modifikator']
          }
        }

        if (!m.geprueft) {
          alleGeprueft = false
          if (!katalog.fiktiv) warnungen.push(`${mOrt}: noch nicht geprüft – zählt im Spiel erst nach Prüfung`)
        }
        katalog.massnahmen.push(m)
      }
      katalog.abdeckung.push({ thema_id: thema.id, partei_id: parteiId, art: 'massnahmen', geprueft: alleGeprueft })
    }

    for (const p of katalog.parteien) {
      if (!gesehen.has(p.id)) f(ort, `Partei „${p.kurzname}“ (${p.id}) fehlt in „abdeckung“ – Maßnahmen oder „keine_massnahme“ eintragen`)
    }
    for (const id of eigeneUrsachen) {
      if (!adressiert.has(id)) warnungen.push(`${ort}: Ursache ${id} wird von keiner Partei adressiert`)
    }
  }

  const nachId = <T extends { id: number }>(a: T, b: T) => a.id - b.id
  katalog.themen.sort(nachId)
  katalog.ursachen.sort(nachId)
  katalog.massnahmen.sort(nachId)
  return { katalog, fehler, warnungen }
}

/** Prüft und wirft bei Fehlern – für Stellen, an denen die Daten schon geprüft sein müssen. */
export function ladeKatalog(parteienDatei: Datei, themenDateien: Datei[]): Katalog {
  const { katalog, fehler } = pruefeKatalog(parteienDatei, themenDateien)
  if (fehler.length) throw new Error(`Datenkatalog fehlerhaft (npm run daten:pruefen):\n${fehler.join('\n')}`)
  return katalog
}
