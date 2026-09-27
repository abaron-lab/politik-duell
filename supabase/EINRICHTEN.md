# Supabase einrichten (Meilenstein 3 und 4)

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
5. In der Funktion unter *Details → Function configuration* die Option
   **„Verify JWT with legacy secret“ ausschalten** → **Save changes**.
   Pflicht: Der Publishable Key der App ist kein JWT, sonst werden alle Aufrufe abgelehnt.
   Die App ruft ohne Login auf; geschützt ist die Funktion durch Eingabeprüfung und ein
   Rate-Limit (40 Anfragen pro 30 Minuten und Sitzung).

Die Funktion braucht das Secret **`ANTHROPIC_API_KEY`** (Claude-API-Key aus der
[Claude Console](https://platform.claude.com) → *API Keys*), einzutragen unter
[Edge Functions → Secrets](https://supabase.com/dashboard/project/xfprvshhexhzhfgkfxpi/functions/secrets).
Optional wechselt das Secret `ANTHROPIC_MODEL` das Modell (Standard: `claude-haiku-4-5`).

### 3. App im Netz starten (Vercel, kostenlos)

1. Auf [vercel.com](https://vercel.com) mit GitHub anmelden → **Add New… → Project** → Repository `wer-liefert` importieren.
2. Vercel erkennt Vite automatisch. **Deploy** klicken.
3. Vercel baut zunächst den Branch `main`. Für den aktuellen Stand: im Projekt unter
   **Deployments** das Deployment des Branches `claude/meilenstein-1-ausfuehren-qpwxov` öffnen
   (entsteht bei jedem Push automatisch) – oder den Branch nach `main` übernehmen.

URL und Publishable Key liest die App aus der Datei `.env` im Repo; dort ist nichts einzutragen.

### 4. Meilenstein 4: Wortwolke und Moderation

Einmalig, wenn Schritt 1–3 schon erledigt sind:

1. **Datenbank ergänzen:** [`supabase/migrations/20260927000000_moderation.sql`](https://github.com/abaron-lab/wer-liefert/blob/claude/gallant-meitner-7zqaw2/supabase/migrations/20260927000000_moderation.sql)
   → **Copy raw file** → im [SQL Editor](https://supabase.com/dashboard/project/xfprvshhexhzhfgkfxpi/sql/new)
   einfügen → **Run**. Legt Stichwort- und Moderationsfelder, die Tabelle `admins` und die
   Zugriffsregeln für Admins an und schaltet Realtime für `runden` ein.
2. **Edge Function aktualisieren:** in der Funktion `analyse` den Code durch
   [`supabase/dashboard/2-analyse.ts`](https://github.com/abaron-lab/wer-liefert/blob/claude/gallant-meitner-7zqaw2/supabase/dashboard/2-analyse.ts) ersetzen → **Deploy**
   (sie speichert jetzt ein Stichwort und prüft es mit dem automatischen Filter).
3. **Admin-Konto anlegen:** [Authentication → Users](https://supabase.com/dashboard/project/xfprvshhexhzhfgkfxpi/auth/users)
   → **Add user → Create new user**, E-Mail und ein starkes Passwort eintragen,
   **„Auto Confirm User“** anhaken → **Create user**.
4. **Konto zum Admin machen:** im SQL Editor (E-Mail anpassen) → **Run**:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'admin@example.org';
   ```
   Erwartet: „Success. 1 row affected“ (bei 0: E-Mail-Adresse prüfen).
5. **Empfohlen:** [Authentication → Sign In / Providers](https://supabase.com/dashboard/project/xfprvshhexhzhfgkfxpi/auth/providers)
   → **„Allow new users to sign up“ ausschalten** → Save. Fremde Konten hätten ohnehin keine Rechte,
   so entstehen aber gar keine.
6. **Moderieren:** In der App die Adresse um `#/admin` ergänzen (z. B. `https://…vercel.app/#/admin`)
   und anmelden.

So läuft die Moderation:

- Nach jeder Runde speichert die Funktion ein kurzes Stichwort (z. B. „Facharzttermin“). Öffentlich
  ist es erst nach **Freigabe** in der Admin-Ansicht; das Stichwort kann vorher geändert werden.
- Der automatische Filter (Beleidigungen, Hetze, Namen mit Anrede wie „Herr Müller“, Kontaktdaten,
  Links) prüft Stichwort, Zusammenfassung und Originaltext. Treffer landen unter **„Vom Filter gestoppt“**.
  Der Originaltext wird dafür nur geprüft, nicht gespeichert.
- „Wert“-Runden erscheinen nicht, weil sie keine Probleme sind.
- **Neue Themen:** Probleme ohne passendes Thema (Review-Warteschlange) zum Abhaken.
- Die Wortwolke auf dem Startbildschirm aktualisiert sich live (Supabase Realtime). Solange noch
  nichts freigegeben ist, zeigt sie Beispielwörter.

## Weg B: mit der Supabase-Kommandozeile (auf einem eigenen Rechner)

```bash
npx supabase login
npx supabase link --project-ref xfprvshhexhzhfgkfxpi   # fragt nach dem Datenbank-Passwort
npx supabase db push --include-seed
npx supabase functions deploy analyse --no-verify-jwt
npm install && npm run dev
```

Admin-Konto danach wie in Weg A, Schritt 4.3–4.5.

## Prüfen, ob alles läuft

- *Table Editor*: Tabellen `parteien`, `themen`, `ursachen`, `massnahmen` enthalten Daten.
- Nach einer gespielten Runde steht ein Eintrag in `runden`; Probleme ohne Thema zusätzlich in
  `review_warteschlange`.
- Fehler der Funktion: *Edge Functions → analyse → Logs*.
- Moderation: neue Runden erscheinen in `#/admin` unter „Offen“ ohne Neuladen; nach „Freigeben“
  taucht das Stichwort auf dem Startbildschirm auf (ggf. ein paar Sekunden warten).

## Nach Änderungen am Code

`npm run dashboard` erzeugt `supabase/seed.sql` und beide Dateien in `supabase/dashboard/` neu.
Danach im Dashboard:

- **Beispieldaten geändert:** nur den Inhalt von `supabase/seed.sql` im SQL Editor ausführen
  (mehrfach ausführbar, gespielte Runden bleiben erhalten).
- **Edge Function geändert:** in der Funktion `analyse` den Code durch `2-analyse.ts` ersetzen → Deploy.
- **Neue Migration:** nur die neue Datei aus `supabase/migrations/` im SQL Editor ausführen.

## Datenschutz

- Gespeichert wird nur die neutrale Kurzfassung eines Problems (`runden.problem_text`) und ein Stichwort, keine
  Rohtexte, keine IPs, kein Audio. Die Sitzungs-ID für das Rate-Limit ist zufällig und wird nach
  einem Tag gelöscht.
- Claude (Anthropic): Eingaben über die API werden laut Anthropics kommerziellen Bedingungen
  nicht zum Training verwendet. Die Verarbeitung findet in den USA statt – das gehört mit in die
  Datenschutzerklärung (Meilenstein 5).
- Supabase und Anthropic protokollieren technisch bedingt Zugriffe; das gehört in die
  Datenschutzerklärung (Meilenstein 5).
