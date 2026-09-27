# Datenkatalog

Hier liegen alle Daten, aus denen „Wer liefert?“ Punkte vergibt: Parteien, Themen, Ursachen und Maßnahmen. Die KI liest diese Daten nur, um ein Problem einem Thema und seinen Ursachen zuzuordnen. **Punkte und Links kommen ausschließlich von hier.**

Änderungen laufen per Pull Request mit Quellenpflicht. Jeder Pull Request wird automatisch geprüft (`npm run daten:pruefen`).

> **Aktuell: fiktive Platzhalterdaten** (`"fiktiv": true` in `parteien.json`). Echte Parteien kommen erst hinzu, wenn Ursachen und Maßnahmen nach dem Ablauf unten erfasst und geprüft sind.

## Ablauf für ein neues Thema

Die Reihenfolge ist wichtig für die Neutralität.

1. **Thema und Ursachen festlegen – ohne Blick in die Wahlprogramme.**
   Ursachen beschreiben, *warum* das Alltagsproblem besteht. Jede Ursache braucht eine unabhängige Quelle (z. B. Statistisches Bundesamt, Sachverständigenrat, Bundesbank, wissenschaftliche Studie). Keine Parteiquellen, keine Quellen von Lobbyverbänden als einzige Quelle.
   Eigener Pull Request, damit die Ursachen feststehen, bevor Maßnahmen dazukommen. Die Themendatei enthält dann noch keine `abdeckung` – das Thema gilt für alle Parteien als „noch nicht erfasst“.
2. **Maßnahmen aus den Programmen erfassen.**
   Für **jede** Partei entweder Maßnahmen mit Seitenangabe eintragen oder ausdrücklich `keine_massnahme` mit kurzer Begründung („Programm Stand … durchsucht, Kapitel … enthält nichts zu …“). Neue Einträge haben `"geprueft": false`.
3. **Bewerten** nach dem Maßstab unten, möglichst **ohne Parteinamen** (Maßnahmentext allein beurteilen).
4. **Prüfen:** Eine zweite Person kontrolliert Zitat, Seitenanker und Bewertung und setzt `"geprueft": true`. Bei abweichender Einschätzung Begründung im Pull Request festhalten.

Ins Spiel kommt ein Thema für eine Partei erst, wenn der **ganze Eintrag** geprüft ist: alle Maßnahmen der Partei zum Thema bzw. `keine_massnahme`. Bis dahin gilt es als **„noch nicht erfasst“** – die App zeigt das so an und wertet Runden mit dieser Partei zu diesem Thema nicht (fehlende Daten sollen keiner Partei einen Punkt kosten). Ungeprüfte Einträge bleiben als Entwurf im Repo und landen nicht in der Datenbank. Bei fiktiven Daten zählt alles.

| In `daten/` | Anzeige im Spiel | Punkte |
| --- | --- | --- |
| Maßnahmen zum Thema, alle geprüft; eine passt zu den Ursachen | Maßnahme mit Bewertung und Belegen | nach Bewertung |
| Maßnahmen zum Thema, alle geprüft; keine passt zu den Ursachen | „keine Maßnahme zu diesen Ursachen“ | 0 |
| `keine_massnahme`, geprüft | „enthält keine Maßnahme zu diesem Thema“ + Begründung | 0 |
| Eintrag (teilweise) ungeprüft oder Partei fehlt in `abdeckung` | „noch nicht erfasst“ | Runde wird nicht gewertet |

## Themenauswahl

Welche Themen in den Katalog kommen, richtet sich danach, was Menschen selbst als wichtigste Probleme nennen – nicht nach den Schwerpunkten einzelner Parteien. Grundlage für die zehn Themen (Stand September 2026) sind die Umfragen vor den Wahlen 2026:

| Wahl | Meistgenannte Probleme | Umfrage |
| --- | --- | --- |
| Sachsen-Anhalt (6. 9. 2026) | Wirtschaftslage 22 %, Arbeitslosigkeit 17 %, Bildung/Schule 17 %; außerdem Zuwanderung, Bus- und Bahnnetz | [Politbarometer Extra I, Aug. 2026](https://presseportal.zdf.de/pressemitteilung/zdf-politbarometer-extra-i-sachsen-anhalt-august-2026), [LänderTREND Mai 2026](https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/sachsen-anhalt/laendertrend/2026/mai/) |
| Mecklenburg-Vorpommern (20. 9. 2026) | Bildung/Schule 25 %, Wirtschaft 16 %, Migration/Integration 16 %, Arbeitslosigkeit 14 %, Gesundheit/Pflege 10 %, Rente 10 %, Verkehr 8 %, Wohnen 7 %, Lebenshaltungskosten 6 % | [LänderTREND Sept. 2026](https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/mecklenburg-vorpommern/laendertrend/2026/september/) |
| Berlin (20. 9. 2026) | Wohnen/Mieten 32 %, Zuwanderung 10 %, innere Sicherheit 9 %, Verkehr 8 % | BerlinTrend Sept. 2026 (rbb/Infratest dimap), z. B. [t-online](https://www.t-online.de/nachrichten/deutschland/innenpolitik/id_101442118/themen-der-berlin-wahl-2026-wohnen-verkehr-sicherheit-und-muell.html) |

Daraus: Arzttermine und Pflege (Gesundheit/Pflege), Miete, Energiepreise (Lebenshaltungskosten), Schule, Arbeitsplätze (Wirtschaft und Arbeitslosigkeit), Zuwanderung und Integration, Rente, Bus und Bahn, Sicherheit.

Noch nicht aufgenommen, Kandidaten für später: soziale Ungerechtigkeit/Armut (MV 8 %), Verwaltung und Bürgeramt-Termine sowie Müll (Berlin, im Wahlkampf genannt), Abwanderung junger Menschen und Kita-Betreuung (Sachsen-Anhalt). Häufige Einträge in der Review-Warteschlange sind ein weiterer Hinweis.

## Bewertungsmaßstab

Maßgeblich ist die Methodenseite der App (`src/rechtliches/Methode.tsx`, in der App unter „So bewerten wir“). Die Tabellen hier geben sie wieder und ergänzen Beispiele – bei Änderungen beide anpassen.

### Wirksamkeit (0–3): Setzt die Maßnahme an der Ursache an?

| Wert | Bedeutung |
| --- | --- |
| 0 | setzt an keiner der erfassten Ursachen an |
| 1 | berührt eine Ursache nur am Rand oder mit geringer Wirkung (z. B. einmalige Entlastung, lindert nur Folgen) |
| 2 | setzt an einer Ursache an und lässt eine spürbare Wirkung erwarten |
| 3 | setzt direkt an einer Hauptursache an; die Wirkung ist gut belegt (Studie oder Erfahrungen anderswo) |

### Umsetzbarkeit (0–3): Ist die Maßnahme realistisch?

| Wert | Bedeutung |
| --- | --- |
| 0 | rechtlich oder finanziell derzeit nicht umsetzbar (z. B. verfassungs- oder EU-rechtswidrig) |
| 1 | nur mit großen Hürden umsetzbar (z. B. Verfassungsänderung, ungeklärte Finanzierung) |
| 2 | umsetzbar mit Aufwand oder in mehreren Jahren |
| 3 | rechtlich möglich, finanziert und innerhalb einer Wahlperiode realistisch |

### Rollen-Modifikator (−2 bis +2, optional)

Nur wenn eine Maßnahme für eine Rolle nachweislich deutlich besser oder schlechter wirkt (z. B. Mietrecht für Mieter:innen vs. Eigentümer:innen). Immer mit Begründung. Rollen: `mieter`, `eigentuemer`, `angestellt`, `selbststaendig`, `rentner`, `arbeitslos`, `studierend`, `vermoegend`.

### Begründung

Ein bis zwei neutrale Sätze: was dafür, was dagegen spricht. Keine Wertung der Partei, nur der Maßnahme.

## Dateiformat

### `parteien.json`

```json
{
  "fiktiv": false,
  "parteien": [
    {
      "id": 1,
      "name": "Voller Name",
      "kurzname": "Kurz",
      "farbe": "#1a2b3c",
      "programm_url": "https://…/wahlprogramm.pdf",
      "programm_stand": "2026-01-01"
    }
  ]
}
```

`programm_url` ist die Adresse des ganzen Programms ohne `#`-Anker. Erscheint ein neues Programm, `programm_url` und `programm_stand` ändern: Die Prüfung meldet dann alle Einträge dieser Partei mit älterem `stand` zur Neuprüfung.

### `themen/NN-name.json` – eine Datei pro Thema

```json
{
  "id": 4,
  "name": "Kita-Plätze",
  "beschreibung": "Kurzer neutraler Satz.",
  "schlagwoerter": ["kita", "betreuung"],
  "ursachen": [
    { "id": 401, "beschreibung": "Zu wenige Fachkräfte", "quelle_url": "https://…" }
  ],
  "abdeckung": [
    {
      "partei_id": 1,
      "massnahmen": [
        {
          "id": 101,
          "beschreibung": "Was die Partei vorschlägt (sinngemäß, kurz)",
          "ursachen_ids": [401],
          "wirksamkeit": 2,
          "umsetzbarkeit": 2,
          "rollen_modifikator": { "angestellt": { "wert": 1, "begruendung": "…" } },
          "begruendung": "Ein bis zwei neutrale Sätze.",
          "beleg_programm_url": "https://…/wahlprogramm.pdf#page=17",
          "beleg_studie_url": "https://…",
          "stand": "2026-03-01",
          "geprueft": false
        }
      ]
    },
    {
      "partei_id": 2,
      "keine_massnahme": {
        "begruendung": "Programm Stand 2026-01 durchsucht, Kapitel Familie enthält nichts dazu.",
        "stand": "2026-03-01",
        "geprueft": false
      }
    }
  ]
}
```

- **IDs** sind im ganzen Katalog eindeutig und ändern sich nie (gespielte Runden verweisen darauf). Konvention für Ursachen: Themen-ID × 100 + laufende Nummer.
- `schlagwoerter` braucht nur die Offline-Analyse ohne KI; kleingeschrieben, Umlaute als ae/oe/ue.
- `beleg_programm_url` muss auf `programm_url` der Partei zeigen, mit Seitenanker `#page=N`.
- `beleg_studie_url` ist optional.
- `stand` darf nicht vor dem `programm_stand` der Partei liegen.

## Was die automatische Prüfung kontrolliert

- Pflichtfelder, Wertebereiche, Datumsformat, keine unbekannten Felder (Tippfehler)
- eindeutige IDs und Namen
- jede Ursache mit https-Quelle; Maßnahmen verweisen nur auf Ursachen ihres Themas
- Beleg zeigt ins Programm der richtigen Partei, mit Seitenanker
- **Abdeckung:** jede Partei höchstens einmal pro Thema – mit Maßnahmen oder `keine_massnahme`; fehlende Parteien werden als „noch nicht erfasst“ gemeldet (Warnung)
- Einträge sind nicht älter als das aktuelle Programm
- bei echten Daten: keine Platzhalter-Links (example.org); Warnung für ungeprüfte Einträge (die im Spiel „noch nicht erfasst“ sind)
- `supabase/seed.sql` passt zum Katalog

```bash
npm run daten:pruefen              # Dateien prüfen
npm run daten:pruefen -- --links   # zusätzlich alle Links abrufen
npm run seed                       # supabase/seed.sql neu erzeugen
npm run dashboard                  # zusätzlich Dateien fürs Supabase-Dashboard
```
