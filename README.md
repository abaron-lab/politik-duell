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
- Wo Chrome lokale Erkennung anbietet (`processLocally`), läuft sie auf dem Gerät; sonst Hinweis, dass der Browser-Dienst (bei Chrome Google-Server) genutzt wird. Audio wird nie gespeichert.
- Verständliche Fehlermeldungen (kein Mikrofon, keine Freigabe, nichts gehört …); ohne Unterstützung bleibt die Texteingabe

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm test         # Tests für Analyse und Bewertung
npm run lint
npm run build
```

## Struktur

| Pfad | Inhalt |
| --- | --- |
| `src/data/types.ts` | Typen entsprechend dem Datenmodell |
| `src/data/mock.ts` | Mock-Daten (später Supabase) |
| `src/logic/analyse.ts` | Mock der Edge Function `analyse` (Schlagwörter statt KI) |
| `src/logic/bewertung.ts` | Punktelogik |
| `src/logic/sprache.ts` | Hook für die Spracherkennung (Push-to-talk) |
| `src/components/` | Bildschirme: Start, Setup, Runde, Auflösung, Ende |

## Bewertungsregeln im Prototyp

- Pro zugeordneter Ursache zählt die beste Maßnahme der Partei: `wirksamkeit + umsetzbarkeit + Rollen-Modifikator` (min. 0). Rundenpunkte = Summe.
- Höhere Summe → 1 Spielpunkt, Gleichstand → je 1 Punkt.
- Annahme: Haben **beide** Parteien 0 Punkte (keine Maßnahme), gibt es keinen Punkt.
- Die Rolle der Person, die das Problem nennt, gilt für die Bewertung beider Parteien.
