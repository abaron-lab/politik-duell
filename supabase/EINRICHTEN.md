# Supabase einrichten (Meilenstein 3)

Projekt: `xfprvshhexhzhfgkfxpi` (Region Frankfurt).

## Weg A: nur im Browser (empfohlen, kein eigener Rechner nötig)

Die Dateien in `supabase/dashboard/` sind zum Kopieren gedacht. Auf GitHub gibt es oben rechts
über jeder Datei den Knopf **„Copy raw file“** (zwei überlappende Rechtecke).

### 1. Datenbank anlegen

1. Datei öffnen: [`supabase/dashboard/1-datenbank.sql`](https://github.com/abaron-lab/wer-liefert/blob/claude/meilenstein-1-ausfuehren-qpwxov/supabase/dashboard/1-datenbank.sql) → **Copy raw file**
2. [SQL Editor öffnen](https://supabase.com/dashboard/project/xfprvshhexhzhfgkfxpi/sql/new), einfügen, **Run** klicken.
3. Erwartet: „Success. No rows returned“. Im *Table Editor* stehen jetzt Tabellen mit Beispieldaten.

### 2. Edge Function anlegen

1. Datei öffnen: [`supabase/dashboard/2-analyse.ts`](https://github.com/abaron-lab/wer-liefert/blob/claude/meilenstein-1-ausfuehren-qpwxov/supabase/dashboard/2-analyse.ts) → **Copy raw file**
2. [Edge Functions öffnen](https://supabase.com/dashboard/project/xfprvshhexhzhfgkfxpi/functions) → **Deploy a new function** → **Via Editor**.
3. Den vorhandenen Beispielcode komplett löschen, den kopierten Inhalt einfügen.
4. Als Namen der Funktion **`analyse`** eintragen (genau so, klein geschrieben) → **Deploy function**.
5. In der Funktion unter **Details** (bzw. *Settings*) die Option **„Enforce JWT Verification“ / „Verify JWT“ ausschalten** und speichern.
   Die App ruft ohne Login auf; geschützt ist die Funktion durch Eingabeprüfung und ein
   Rate-Limit (40 Anfragen pro 30 Minuten und Sitzung).

Das Secret `MISTRAL_API_KEY` ist schon gespeichert ✔. Optional wechselt das Secret
`MISTRAL_MODEL` das Modell (Standard: `mistral-small-latest`).

### 3. App im Netz starten (Vercel, kostenlos)

1. Auf [vercel.com](https://vercel.com) mit GitHub anmelden → **Add New… → Project** → Repository `wer-liefert` importieren.
2. Vercel erkennt Vite automatisch. **Deploy** klicken.
3. Vercel baut zunächst den Branch `main`. Für den aktuellen Stand: im Projekt unter
   **Deployments** das Deployment des Branches `claude/meilenstein-1-ausfuehren-qpwxov` öffnen
   (entsteht bei jedem Push automatisch) – oder den Branch nach `main` übernehmen.

URL und Publishable Key liest die App aus der Datei `.env` im Repo; dort ist nichts einzutragen.

## Weg B: mit der Supabase-Kommandozeile (auf einem eigenen Rechner)

```bash
npx supabase login
npx supabase link --project-ref xfprvshhexhzhfgkfxpi   # fragt nach dem Datenbank-Passwort
npx supabase db push --include-seed
npx supabase functions deploy analyse --no-verify-jwt
npm install && npm run dev
```

## Prüfen, ob alles läuft

- *Table Editor*: Tabellen `parteien`, `themen`, `ursachen`, `massnahmen` enthalten Daten.
- Nach einer gespielten Runde steht ein Eintrag in `runden`; Probleme ohne Thema zusätzlich in
  `review_warteschlange`.
- Fehler der Funktion: *Edge Functions → analyse → Logs*.

## Nach Änderungen am Code

`npm run dashboard` erzeugt `supabase/seed.sql` und beide Dateien in `supabase/dashboard/` neu.
Danach im Dashboard:

- **Beispieldaten geändert:** nur den Inhalt von `supabase/seed.sql` im SQL Editor ausführen
  (mehrfach ausführbar, gespielte Runden bleiben erhalten).
- **Edge Function geändert:** in der Funktion `analyse` den Code durch `2-analyse.ts` ersetzen → Deploy.
- **Neue Migration:** nur die neue Datei aus `supabase/migrations/` im SQL Editor ausführen.

## Datenschutz

- Gespeichert wird nur die neutrale Kurzfassung eines Problems (`runden.problem_text`), keine
  Rohtexte, keine IPs, kein Audio. Die Sitzungs-ID für das Rate-Limit ist zufällig und wird nach
  einem Tag gelöscht.
- Mistral: Im kostenlosen Plan in der Mistral-Konsole unter *Privacy* die Nutzung für Training
  abschalten. Für den öffentlichen Start den bezahlten Plan nutzen (dort kein Training).
- Supabase und Mistral protokollieren technisch bedingt Zugriffe; das gehört in die
  Datenschutzerklärung (Meilenstein 5).
