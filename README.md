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

## Stand: Meilenstein 4 – Wortwolke und Moderation

- Wortwolke auf dem Startbildschirm mit d3-cloud: freigegebene Stichwörter, Größe nach Häufigkeit, langsames Schweben; neue Freigaben kommen live über Supabase Realtime
- Die KI liefert pro Problem ein neutrales Stichwort (1–3 Wörter); öffentlich wird es erst nach Freigabe
- Automatischer Filter (`supabase/functions/_shared/moderation.ts`): Beleidigungen, Hetze/Gewalt, Namen mit Anrede, Kontaktdaten und Links → „Vom Filter gestoppt“
- Admin-Ansicht unter `#/admin` (Supabase Auth, nur Konten in `admins`): Stichwort anpassen, freigeben, ablehnen, zurückziehen, löschen; Review-Warteschlange für neue Themen abhaken
- Zugriffsregeln: Admins dürfen nur die Moderationsfelder ändern (nicht Punkte, Parteien oder Texte); anon sieht weiter nur Freigegebenes

**Einrichten:** siehe [supabase/EINRICHTEN.md](supabase/EINRICHTEN.md).

## Datenkatalog (Vorbereitung für echte Parteien)

- Alle Parteien, Themen, Ursachen und Maßnahmen liegen als JSON in [`daten/`](daten/README.md) – Änderungen per Pull Request mit Quellenpflicht
- Automatische Prüfung (`npm run daten:pruefen`, auch in GitHub Actions): Pflichtfelder, Wertebereiche, Beleg mit Seitenanker im Programm der richtigen Partei, Quelle für jede Ursache, keine Platzhalter-Links bei echten Daten
- **Vollständige Abdeckung:** Pro Thema steht bei jeder Partei entweder eine Maßnahme oder ausdrücklich „keine Maßnahme im Programm“ – so lässt sich „nichts im Programm“ von „noch nicht erfasst“ unterscheiden
- Bei echten Daten zählen nur geprüfte Maßnahmen (`geprueft: true`); ungeprüfte bleiben als Entwurf im Repo und kommen nicht in die Datenbank
- Einträge, die älter als das aktuelle Programm einer Partei sind, werden zur Neuprüfung gemeldet
- Bewertungsmaßstab für Wirksamkeit und Umsetzbarkeit (0–3) und Ablauf für neue Themen: [`daten/README.md`](daten/README.md)

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm test         # Tests: Analyse, Bewertung, KI-Prüfung, Datenbank (PGlite)
npm run lint
npm run build
npm run daten:pruefen  # Datenkatalog prüfen (mit -- --links auch alle Links abrufen)
npm run seed       # supabase/seed.sql aus daten/ erzeugen
npm run dashboard  # Dateien zum Einfügen im Supabase-Dashboard neu erzeugen
```

## Struktur

| Pfad | Inhalt |
| --- | --- |
| `supabase/migrations/` | Datenbankschema, Zugriffsregeln, Rate-Limit |
| `daten/` | Datenkatalog: Parteien, Themen, Ursachen, Maßnahmen (JSON, Anleitung in `daten/README.md`) |
| `scripts/` | Prüfung des Katalogs, Seed- und Dashboard-Erzeugung |
| `supabase/seed.sql` | Seed-Daten (erzeugt aus `daten/`) |
| `supabase/dashboard/` | Erzeugte Dateien zum Einfügen im Dashboard (SQL komplett, Edge Function als eine Datei) |
| `supabase/functions/analyse/` | Edge Function: KI-Einordnung und Speichern der Runde |
| `supabase/functions/_shared/` | Gemeinsamer Code von App und Funktion: Typen, Punktelogik, KI-Prompt und -Prüfung, Moderationsfilter |
| `src/data/quelle.ts` | Datenquelle der App: Supabase oder Beispieldaten |
| `src/data/katalog.ts` | Prüfregeln und Aufbau des Datenkatalogs |
| `src/data/mock.ts` | Eingebaute Daten der App (aus `daten/`, derzeit fiktiv) |
| `src/logic/analyse.ts` | Offline-Ersatz für die KI (Schlagwörter) |
| `src/logic/sprache.ts` | Hook für die Spracherkennung (Push-to-talk) |
| `src/components/` | Bildschirme: Start (mit Wortwolke), Setup, Runde, Auflösung, Ende |
| `src/data/wortwolke.ts` | Daten der Wortwolke (Realtime) |
| `src/admin/` | Admin-Ansicht zur Moderation (`#/admin`, eigenes Bundle) |

## Bewertungsregeln im Prototyp

- Pro zugeordneter Ursache zählt die beste Maßnahme der Partei: `wirksamkeit + umsetzbarkeit + Rollen-Modifikator` (min. 0). Rundenpunkte = Summe.
- Höhere Summe → 1 Spielpunkt, Gleichstand → je 1 Punkt.
- Annahme: Haben **beide** Parteien 0 Punkte (keine Maßnahme), gibt es keinen Punkt.
- Die Rolle der Person, die das Problem nennt, gilt für die Bewertung beider Parteien.
