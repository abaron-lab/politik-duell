# Wer liefert?

*„Versprechen kann jeder."* – Zwei-Spieler-Webspiel: Alltagsprobleme nennen, das Spiel zeigt, welche Partei dafür die wirksamste und umsetzbare Lösung bietet – mit Beleg-Link nach jeder Runde.

Konzept, Grundprinzipien und Meilensteine: siehe [CLAUDE.md](CLAUDE.md).

## Stand: Meilenstein 1 – klickbarer Prototyp

- Startbildschirm mit Erklärung, Datenschutzhinweis und schwebender Wortwolke (Platzhalter)
- Parteiwahl für Spieler:in A und B (nicht dieselbe) plus optionale Rolle
- 5 Runden abwechselnd, Texteingabe
- Mock-Analyse im Format der späteren Edge Function `analyse` (`problem` | `forderung` | `wert`)
  - Forderung → höchstens 2 Nachfragen nach dem Alltagsproblem
  - Wert → respektvoller Hinweis, Runde wird nicht gewertet, neues Problem möglich
  - Unbekanntes Thema → „ungeprüft – keine Wertung", keine Punkte, keine Links, Review-Warteschlange
- Deterministische Punktevergabe aus Mock-Daten (3 Themen: Arzttermine, Miete, Energiepreise)
- Auflösung mit Maßnahme, Punktzahl, Begründung, Beleg-Links und bester Partei insgesamt
- Endbildschirm mit Gesamtsieger, Rundenübersicht mit Links und Teilen-Button

> **Mock-Daten:** Parteien („Partei Alpha" … „Partei Epsilon"), Maßnahmen, Punkte und Links (`example.org`) sind **fiktiv**. Echte Parteien kommen erst mit geprüften, belegten Daten hinzu – so entsteht keine ungeprüfte Bewertung realer Parteien.

## Stand: Meilenstein 2 – Push-to-talk

- Großer Mikrofon-Knopf: gedrückt halten, sprechen, loslassen (Maus, Touch oder Leertaste/Enter)
- Web Speech API (`de-DE`), Live-Anzeige des erkannten Texts; nach dem Loslassen landet der Text im Eingabefeld und kann vor dem Senden korrigiert werden
- Hinweis unter dem Knopf, dass der Browser-Dienst (bei Chrome Google-Server) die Erkennung übernimmt. Audio wird nie gespeichert. (Die lokale Erkennung per `SpeechRecognition.available()` ist bewusst nicht eingebaut: Der Aufruf hing bzw. stürzte in Tests mit Chromium ab.)
- Verständliche Fehlermeldungen (kein Mikrofon, keine Freigabe, nichts gehört …); ohne Unterstützung bleibt die Texteingabe

## Stand: Meilenstein 3 – Supabase und KI

- Datenbankschema mit Row Level Security (`supabase/migrations/`): App liest nur Stammdaten und freigegebene Probleme, geschrieben wird ausschließlich über die Edge Function
- Seed-Daten aus den fiktiven Beispieldaten (`npm run seed` → `supabase/seed.sql`)
- Edge Function `analyse` (`supabase/functions/analyse/`): Mistral ordnet die Äußerung ein (striktes JSON), die Antwort wird streng geprüft (nur IDs aus dem Katalog, keine Links, höchstens zwei Nachfragen)
- Punkte berechnet dieselbe Logik in App und Funktion (`supabase/functions/_shared/bewertung.ts`) – die KI vergibt keine Punkte
- Abgeschlossene Runden werden anonym gespeichert (nur neutrale Kurzfassung); unbekannte Themen landen in `review_warteschlange` mit vorläufiger Einschätzung
- Rate-Limit pro zufälliger Sitzungs-ID
- Ohne Supabase-Verbindung: „Mit Beispieldaten spielen“ bzw. `VITE_DATENQUELLE=mock`

**Einrichten:** siehe [supabase/EINRICHTEN.md](supabase/EINRICHTEN.md).

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm test         # Tests: Analyse, Bewertung, KI-Prüfung, Datenbank (PGlite)
npm run lint
npm run build
npm run dashboard  # Dateien zum Einfügen im Supabase-Dashboard neu erzeugen
```

## Struktur

| Pfad | Inhalt |
| --- | --- |
| `supabase/migrations/` | Datenbankschema, Zugriffsregeln, Rate-Limit |
| `supabase/seed.sql` | Beispieldaten (erzeugt aus `src/data/mock.ts`) |
| `supabase/dashboard/` | Erzeugte Dateien zum Einfügen im Dashboard (SQL komplett, Edge Function als eine Datei) |
| `supabase/functions/analyse/` | Edge Function: KI-Einordnung und Speichern der Runde |
| `supabase/functions/_shared/` | Gemeinsamer Code von App und Funktion: Typen, Punktelogik, KI-Prompt und -Prüfung |
| `src/data/quelle.ts` | Datenquelle der App: Supabase oder Beispieldaten |
| `src/data/mock.ts` | Fiktive Beispieldaten |
| `src/logic/analyse.ts` | Offline-Ersatz für die KI (Schlagwörter) |
| `src/logic/sprache.ts` | Hook für die Spracherkennung (Push-to-talk) |
| `src/components/` | Bildschirme: Start, Setup, Runde, Auflösung, Ende |

## Bewertungsregeln im Prototyp

- Pro zugeordneter Ursache zählt die beste Maßnahme der Partei: `wirksamkeit + umsetzbarkeit + Rollen-Modifikator` (min. 0). Rundenpunkte = Summe.
- Höhere Summe → 1 Spielpunkt, Gleichstand → je 1 Punkt.
- Annahme: Haben **beide** Parteien 0 Punkte (keine Maßnahme), gibt es keinen Punkt.
- Die Rolle der Person, die das Problem nennt, gilt für die Bewertung beider Parteien.
