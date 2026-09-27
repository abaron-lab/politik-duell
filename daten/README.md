# Datenkatalog

Hier liegen alle Daten, aus denen „Wer liefert?“ Punkte vergibt: Parteien, Themen, Ursachen und Maßnahmen. Die KI liest diese Daten nur, um ein Problem einem Thema und seinen Ursachen zuzuordnen. **Punkte und Links kommen ausschließlich von hier.**

Änderungen laufen per Pull Request mit Quellenpflicht. Jeder Pull Request wird automatisch geprüft (`npm run daten:pruefen`).

> **Aktuell: fiktive Platzhalterdaten** (`"fiktiv": true` in `parteien.json`). Echte Parteien kommen erst hinzu, wenn Ursachen und Maßnahmen nach dem Ablauf unten erfasst und geprüft sind.

## Ablauf für ein neues Thema

Die Reihenfolge ist wichtig für die Neutralität.

1. **Thema und Ursachen festlegen – ohne Blick in die Wahlprogramme.**
   Ursachen beschreiben, *warum* das Alltagsproblem besteht. Jede Ursache braucht eine unabhängige Quelle (z. B. Statistisches Bundesamt, Sachverständigenrat, Bundesbank, wissenschaftliche Studie). Keine Parteiquellen, keine Quellen von Lobbyverbänden als einzige Quelle.
   Eigener Pull Request, damit die Ursachen feststehen, bevor Maßnahmen dazukommen.
2. **Maßnahmen aus den Programmen erfassen.**
   Für **jede** Partei entweder Maßnahmen mit Seitenangabe eintragen oder ausdrücklich `keine_massnahme` mit kurzer Begründung („Programm Stand … durchsucht, Kapitel … enthält nichts zu …“). Neue Einträge haben `"geprueft": false`.
3. **Bewerten** nach dem Maßstab unten, möglichst **ohne Parteinamen** (Maßnahmentext allein beurteilen).
4. **Prüfen:** Eine zweite Person kontrolliert Zitat, Seitenanker und Bewertung und setzt `"geprueft": true`. Bei abweichender Einschätzung Begründung im Pull Request festhalten.

Nur geprüfte Maßnahmen zählen im Spiel. Ungeprüfte bleiben als Entwurf im Repo und landen nicht in der Datenbank (bei fiktiven Daten zählt alles).

## Bewertungsmaßstab

### Wirksamkeit (0–3): Setzt die Maßnahme an der Ursache an?

| Wert | Bedeutung |
| --- | --- |
| 0 | Kein erkennbarer Bezug zur Ursache oder laut Studienlage wirkungslos/kontraproduktiv |
| 1 | Lindert Folgen, ändert an der Ursache wenig (z. B. einmalige Entlastung) |
| 2 | Setzt an der Ursache an, Wirkung begrenzt oder unsicher belegt |
| 3 | Setzt direkt an der Ursache an, Wirkung durch Studien oder Erfahrungen gut belegt |

### Umsetzbarkeit (0–3): Ist die Maßnahme realistisch?

| Wert | Bedeutung |
| --- | --- |
| 0 | Rechtlich kaum möglich (z. B. verfassungs- oder EU-rechtswidrig) oder nicht finanzierbar |
| 1 | Große Hürden: Grundgesetzänderung, hohe ungeklärte Kosten oder mehr als eine Wahlperiode |
| 2 | Machbar mit normalem Gesetzgebungsverfahren, Kosten benannt, aber mit Unsicherheiten |
| 3 | Schnell umsetzbar, rechtlich unproblematisch, Finanzierung geklärt oder gering |

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
- **Abdeckung:** jede Partei genau einmal pro Thema – mit Maßnahmen oder `keine_massnahme`
- Einträge sind nicht älter als das aktuelle Programm
- bei echten Daten: keine Platzhalter-Links (example.org); Warnung für ungeprüfte Einträge
- `supabase/seed.sql` passt zum Katalog

```bash
npm run daten:pruefen              # Dateien prüfen
npm run daten:pruefen -- --links   # zusätzlich alle Links abrufen
npm run seed                       # supabase/seed.sql neu erzeugen
npm run dashboard                  # zusätzlich Dateien fürs Supabase-Dashboard
```
