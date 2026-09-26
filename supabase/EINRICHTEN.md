# Supabase einrichten (Meilenstein 3)

Projekt: `xfprvshhexhzhfgkfxpi` (Region Frankfurt). Die Befehle laufen im Repo-Ordner auf deinem Rechner.
Die Supabase-CLI muss nicht installiert werden – `npx` lädt sie bei Bedarf.

## Voraussetzungen

- Node.js 20 oder neuer
- Das **Datenbank-Passwort** deines Supabase-Projekts (hast du beim Anlegen vergeben;
  zurücksetzen unter *Project Settings → Database*)
- Secret `MISTRAL_API_KEY` ist unter *Edge Functions → Secrets* gespeichert ✔

## 1. Anmelden und Projekt verknüpfen

```bash
npx supabase login
npx supabase link --project-ref xfprvshhexhzhfgkfxpi
```

`login` öffnet den Browser. `link` fragt nach dem Datenbank-Passwort.

## 2. Datenbank anlegen und Beispieldaten einspielen

```bash
npx supabase db push --include-seed
```

Das legt die Tabellen mit Zugriffsregeln an (`supabase/migrations/`) und spielt die fiktiven
Beispieldaten ein (`supabase/seed.sql`).

**Ohne CLI** geht es auch im Dashboard: *SQL Editor → New query*, zuerst den Inhalt von
`supabase/migrations/20260926000000_schema.sql` einfügen und ausführen, danach `supabase/seed.sql`.

## 3. Edge Function `analyse` veröffentlichen

```bash
npx supabase functions deploy analyse --no-verify-jwt
```

`--no-verify-jwt` ist nötig, weil die App ohne Login aufruft. Geschützt ist die Funktion durch
Eingabeprüfung und ein Rate-Limit (40 Anfragen pro 30 Minuten und Sitzung).

Optional: Mit dem Secret `MISTRAL_MODEL` lässt sich das Modell wechseln (Standard: `mistral-small-latest`).

## 4. App starten

```bash
npm install
npm run dev
```

Die App liest URL und Publishable Key aus `.env`. Auf der Startseite steht „Spiel starten“, sobald die
Daten aus Supabase geladen sind.

## Prüfen, ob alles läuft

- *Table Editor*: Tabellen `parteien`, `themen`, `ursachen`, `massnahmen` enthalten Daten.
- Nach einer gespielten Runde steht ein Eintrag in `runden`; Probleme ohne Thema zusätzlich in
  `review_warteschlange`.
- Fehler der Funktion: *Edge Functions → analyse → Logs*.

## Beispieldaten ändern

Die Seed-Daten werden aus `src/data/mock.ts` erzeugt:

```bash
npm run seed                         # schreibt supabase/seed.sql neu
npx supabase db push --include-seed  # oder seed.sql im SQL Editor ausführen
```

## Datenschutz

- Gespeichert wird nur die neutrale Kurzfassung eines Problems (`runden.problem_text`), keine
  Rohtexte, keine IPs, kein Audio. Die Sitzungs-ID für das Rate-Limit ist zufällig und wird nach
  einem Tag gelöscht.
- Mistral: Im kostenlosen Plan in der Mistral-Konsole unter *Privacy* die Nutzung für Training
  abschalten. Für den öffentlichen Start den bezahlten Plan nutzen (dort kein Training).
- Supabase und Mistral protokollieren technisch bedingt Zugriffe; das gehört in die
  Datenschutzerklärung (Meilenstein 5).
