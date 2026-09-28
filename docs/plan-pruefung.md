# Plan: Bewertung durch eingeladene Prüfende

Stand: 28. 9. 2026. Umsetzung in einem eigenen Pull Request.

## Ziel

Die Betreiberin schickt 2–3 (oder mehr) Bekannten mit Fachwissen je einen persönlichen Link. Sie bewerten in der App die Maßnahmen eines Themas nach dem Maßstab in `daten/README.md`. Die App sammelt die Bewertungen, bildet je Maßnahme den **Median** und zeigt, wo die Prüfenden weit auseinanderliegen. Die Ergebnisse werden per Skript in den Datenkatalog übernommen.

## Entscheidungen (von der Betreiberin getroffen)

| Frage | Entscheidung |
| --- | --- |
| Wo läuft die Prüfung? | In der App (nicht GitHub, nicht claude.ai) |
| Zugang | Persönlicher Einladungslink je Person, kein gemeinsames Passwort, kein Konto |
| Namen der Prüfenden | Nur intern (Admin-Ansicht, Supabase). Öffentlich nur mit ausdrücklicher Einwilligung der Person |
| Belegprüfung (Zitat, Seite, Link) | Übernimmt die Betreiberin selbst; Prüfende bewerten nur |
| Zusammenfassung | Median je Kriterium, nicht Mittelwert |
| Punkte | Erst am Ende: Median Wirksamkeit × Median Umsetzbarkeit |
| Empfehlung (Entwurfswerte) | Erst sichtbar, nachdem die Person die Maßnahme selbst bewertet hat |
| Zusammensetzung | Je Thema gegensätzlich besetzt: gleich viele Prüfende aus zwei vorab festgelegten, gegensätzlichen Perspektiven, möglichst ergänzt um eine Person ohne Bindung an eine Seite (ergänzt 28. 9. 2026, siehe „Auswahl der Prüfenden“) |

## Grundsätze

- **Art. 9 DSGVO:** Bewertungen von Parteimaßnahmen können politische Haltungen erkennen lassen. Deshalb: ausdrückliche Einwilligung vor der ersten Bewertung, keine IP-Adressen, keine Konten, Löschung auf Wunsch (Admin-Knopf), Datenschutzerklärung ergänzen.
- **Namen nie ins Repo.** Das Repo ist öffentlich. Im Datenkatalog stehen nur Anzahl, Median und Datum – die Zuordnung Person ↔ Bewertung bleibt in Supabase.
- **Blind bewerten:** keine Parteinamen, gemischte Reihenfolge (wie in der Prüfliste), Entwurfswerte erst nach eigener Bewertung.
- **Unabhängig:** Prüfende sehen die Bewertungen der anderen nicht.
- **Gegensätzlich besetzt:** Blindbewertung allein schützt nicht vor Schlagseite – viele Maßnahmen sind am Inhalt erkennbar, und Prüfende aus dem Bekanntenkreis der Betreiberin teilen oft ihre Sicht. Deshalb bewerten je Thema Menschen, die das Thema aus entgegengesetzten Interessen kennen (siehe „Auswahl der Prüfenden“).

## Auswahl der Prüfenden

Ergänzt am 28. 9. 2026. Gilt für alle Themen, auch für Miete.

### Regeln

1. **Perspektiven vorab festlegen.** Für jedes Thema werden zwei gegensätzliche Perspektiven benannt (Tabelle unten), **bevor** jemand eingeladen wird. Sie richten sich nach Interessen im Thema (z. B. Mieter- und Vermieterseite), nicht nach Parteien oder politischen Lagern. Änderungen an der Tabelle per Pull Request mit Begründung.
2. **Gleich viele aus beiden Perspektiven.** Mindestbesetzung: je eine Person aus Perspektive A und B. Empfohlen: zusätzlich eine Person aus Wissenschaft oder Praxis ohne Bindung an eine der beiden Seiten („ohne Bindung“), damit der Median nicht zwischen zwei Lagern hängt. Mehr Personen sind willkommen, solange A und B gleich stark vertreten sind.
3. **Übernahme erst bei vollständiger Besetzung.** Die Werte eines Themas werden erst übernommen, wenn aus A und B gleich viele abgesendete Bewertungen vorliegen. Fällt eine Person aus, wird aus derselben Perspektive nachbesetzt – nicht mit den vorhandenen Werten weitergemacht.
4. **Patt nicht selbst entscheiden.** Ergeben sich bei gerader Anzahl zwei verschiedene mittlere Werte, wird vorzugsweise eine weitere Person „ohne Bindung“ eingeladen. Nur wenn das nicht gelingt, entscheidet die Betreiberin zwischen den beiden Werten und begründet es im Pull Request.
5. **Nicht nur aus dem eigenen Umfeld.** Je Thema wird mindestens eine Person über eine Organisation, Hochschule oder Fachveröffentlichung gewonnen, nicht über den persönlichen Bekanntenkreis der Betreiberin.
6. **Auswahl über Tätigkeit, nie über Gesinnung.** Die Zuordnung zu einer Perspektive ergibt sich aus Beruf, Institution oder Veröffentlichungen. Nach Parteimitgliedschaft, Wahlabsicht oder politischer Haltung wird **nicht** gefragt (Art. 9 DSGVO).
7. **Keine Parteinähe im Amt.** Nicht eingeladen werden Abgeordnete, Mandats- und Amtsträger:innen von Parteien sowie Beschäftigte von Parteien, Fraktionen oder Abgeordneten (auch in den letzten drei Jahren). Die Person bestätigt das vor der Einladung; gespeichert wird nur die Einladung selbst, nicht die Erklärung.
8. **Offen berichten, ohne Namen.** Öffentlich steht je Thema, aus welchen Perspektiven wie viele Personen bewertet haben (z. B. „3 Prüfende: Mieterseite, Vermieter- und Bauseite, Wissenschaft“). Namen weiterhin nur mit Einwilligung.

### Perspektiven je Thema (Vorschlag)

Beispiele für Institutionen sind nur Orientierung für die Suche; eingeladen werden Einzelpersonen, die für sich selbst bewerten, nicht als Vertretung ihrer Organisation.

| Thema | Perspektive A | Perspektive B | Ohne Bindung (z. B.) |
| --- | --- | --- | --- |
| Arzttermine | Patienten und Versicherte (Patientenberatung, Verbraucherschutz, Krankenkassen) | Ärzteschaft und Praxen (Kassenärztliche Vereinigungen, Ärzteverbände) | Gesundheitsökonomie, Versorgungsforschung |
| Miete | Mieterseite (Mieterberatung, Sozialverbände) | Vermieter- und Bauseite (Eigentümer, Wohnungs- und Bauwirtschaft) | Immobilien- und Stadtökonomie |
| Energiepreise | Verbraucher- und Umweltseite | Energiewirtschaft und energieintensive Industrie | Energieökonomie |
| Schule | Schulpraxis mit Schwerpunkt Chancengleichheit (z. B. Gesamt- und Gemeinschaftsschulen, Bildungsgewerkschaft) | Schulpraxis mit Schwerpunkt Leistung und Gliederung (z. B. Gymnasien, Philologen- und Realschulverbände) | Bildungsforschung |
| Arbeitsplätze | Arbeitnehmerseite (Gewerkschaften, gewerkschaftsnahe Institute) | Arbeitgeberseite (Arbeitgeber- und Wirtschaftsverbände, arbeitgebernahe Institute) | Arbeitsmarktforschung |
| Zuwanderung und Integration | Integrations- und Flüchtlingsarbeit | Kommunen, Ausländer- und Sicherheitsbehörden | Migrationsforschung, Migrationsrecht |
| Rente | Sozialverbände, Gewerkschaften | Arbeitgeber, Generationengerechtigkeit, private Vorsorge | Rentenversicherung, Alterssicherungsforschung |
| Bus und Bahn | Fahrgast- und Umweltverbände | Straßenverkehr, Logistik, ländliche Kommunen | Verkehrswissenschaft |
| Sicherheit | Polizei und Strafverfolgung | Bürgerrechte und Strafverteidigung | Kriminologie |
| Pflege | Pflegebedürftige, Angehörige, Pflegekräfte | Träger und Kostenträger (Heimbetreiber, Pflegekassen) | Pflegewissenschaft, Gesundheitsökonomie |

### Umsetzung (offen, eigener Pull Request)

Bis dahin hält die Betreiberin die Perspektive je Einladung von Hand fest und prüft die Besetzung vor der Übernahme selbst.

- **Datenbank:** Spalte `perspektive text check (perspektive in ('a','b','ohne'))` in `pruef_einladungen`.
- **Admin:** Perspektive beim Anlegen der Einladung wählen (mit den Bezeichnungen aus der Tabelle); in der Auswertung je Thema anzeigen, wie viele abgesendete Bewertungen je Perspektive vorliegen, und warnen, wenn A und B nicht gleich stark vertreten sind.
- **Export und Übernahme:** Export enthält je Maßnahme die Anzahl je Perspektive (ohne Namen); `pruefung:uebernehmen` schreibt sie nach `bewertung.perspektiven`, z. B. `{ "a": 1, "b": 1, "ohne": 1 }`, und bricht ab, wenn `a ≠ b` oder eine der beiden 0 ist.
- **Katalogprüfung:** Bei echten Daten `geprueft: true` nur mit `bewertung.perspektiven.a = b ≥ 1`.
- **Perspektiven im Katalog:** Bezeichnungen je Thema als Feld `perspektiven` in `daten/themen/*.json`, damit Admin, Methodenseite und diese Tabelle dieselbe Quelle haben.
- **Methodenseite:** je Thema „bewertet von n Prüfenden aus …“ statt nur der Anzahl.

## Umsetzung

### 1. Datenbank (neue Migration `supabase/migrations/2026…_pruefung.sql`)

```sql
pruef_einladungen (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null,      -- SHA-256 des Tokens; der Token selbst wird nur einmal angezeigt
  name text not null,                   -- intern
  themen smallint[] not null,           -- welche Themen die Person bewerten soll
  erstellt timestamptz default now(),
  gesperrt boolean default false,
  einwilligung_am timestamptz,          -- Einwilligung zur Verarbeitung (Pflicht vor dem Bewerten)
  name_oeffentlich boolean default false -- Einwilligung zur öffentlichen Nennung (freiwillig)
)

pruef_bewertungen (
  einladung_id uuid references pruef_einladungen on delete cascade,
  massnahme_id int not null,            -- ID aus daten/themen/*.json
  wirksamkeit smallint check (0..3),
  umsetzbarkeit smallint check (0..3),
  notiz text,
  aktualisiert timestamptz default now(),
  abgesendet boolean default false,
  primary key (einladung_id, massnahme_id)
)
```

- RLS: `anon` hat **keinen** Zugriff. Admins (Tabelle `admins`) dürfen lesen, Einladungen anlegen/sperren/löschen.
- Zugriff der Prüfenden nur über die Edge Function (Service Role), geprüft über den Token-Hash.
- Tests mit PGlite wie in `supabase/datenbank.test.ts`: anon sieht nichts, Admin sieht alles, Löschen einer Einladung löscht ihre Bewertungen.

### 2. Edge Function `pruefung` (`supabase/functions/pruefung/`)

- `POST {token, aktion: 'laden'}` → Name, Themen, gespeicherte Bewertungen, Einwilligungsstatus.
- `POST {token, aktion: 'einwilligen', name_oeffentlich}` → setzt `einwilligung_am`.
- `POST {token, aktion: 'speichern', bewertungen: [...]}` → Upsert (nur mit Einwilligung, nur Maßnahmen der freigegebenen Themen, Werte 0–3).
- `POST {token, aktion: 'absenden', thema_id}` → setzt `abgesendet`.
- Gesperrte oder unbekannte Tokens → 403 ohne Details. Rate-Limit und Größenbegrenzung wie in `analyse`.
- Datei fürs Dashboard erzeugen wie bei `analyse` (`npm run dashboard`, `supabase/dashboard/`).

### 3. Maßnahmen für die Prüfseite

Die ungeprüften Maßnahmen stehen nicht in der Datenbank (dort nur `spielbareMassnahmen`). Die Prüfseite lädt sie deshalb **aus dem Datenkatalog im Bundle** (`daten/`, wie `src/data/mock.ts` es für `daten/beispiel/` tut). Das ist unbedenklich: `daten/` ist ohnehin öffentlich im Repo. In der Datenbank landen nur die Bewertungen mit Maßnahmen-ID.

### 4. Prüfseite in der App (`#/pruefen/<token>`)

1. **Begrüßung** mit Namen, Thema, Zeitaufwand (ca. 20–30 Minuten je Thema).
2. **Einwilligung** (Pflicht): was gespeichert wird, wozu, wer es sieht, Löschung auf Wunsch. Zweites, freiwilliges Häkchen: „Mein Name darf öffentlich als Prüfer:in genannt werden.“
3. **Ziel und Maßstab** des Themas (aus `ziel` und den Skalentexten).
4. **Bewerten:** Maßnahmen ohne Parteinamen, gemischt; je Maßnahme Wirksamkeit und Umsetzbarkeit wählen, optional Notiz. **Erst danach** wird „Empfehlung ansehen“ (Entwurfswerte + Begründung) freigeschaltet. Änderungen danach bleiben möglich, werden aber vermerkt (Feld `nach_empfehlung_geaendert`, optional).
5. Zwischenspeichern automatisch; „Absenden“ am Ende; danach Dank und Hinweis, dass Änderungen bis zur Übernahme möglich sind.

Design wie die bestehende Prüfliste (`scripts/erzeuge-pruefliste.ts`) bzw. wie die App; mobil nutzbar.

### 5. Admin-Ansicht (`#/admin`, Bereich „Prüfung“)

- **Einladung anlegen:** Name + Themen → Link wird **einmal** angezeigt (Kopieren-Knopf). Liste der Einladungen mit Status (eingewilligt, x/y bewertet, abgesendet), Sperren, Löschen.
- **Auswertung je Thema:** Tabelle je Maßnahme: Partei, Entwurf, alle Einzelwerte (mit Namen, nur hier), Anzahl, Median W, Median U, Punkte = Median W × Median U, Spannweite. Markierung, wenn die Spannweite ≥ 2 ist oder weniger als 2 Bewertungen vorliegen.
- **Export:** JSON-Datei mit `{massnahme_id, anzahl, median_w, median_u, spannweite}` – **ohne Namen**.

### 6. Übernahme ins Repo (`npm run pruefung:uebernehmen -- <export.json>`)

- Schreibt je Maßnahme die Mediane als `wirksamkeit`/`umsetzbarkeit` und ergänzt ein neues Feld, z. B.
  `"bewertung": { "anzahl": 3, "median_w": 2, "median_u": 2, "spannweite": 1, "datum": "2026-10-05", "entwurf": [2, 3] }`.
  (`entwurf` hält die ursprünglichen Werte fest, damit die Abweichung nachvollziehbar bleibt.)
- Prüfung in `src/data/katalog.ts` erweitern: Feld validieren; bei echten Daten `geprueft: true` nur, wenn `bewertung.anzahl ≥ 2` (Regel in `daten/README.md` festhalten).
- `geprueft: true` setzt weiterhin die Betreiberin, nachdem sie die Belege (Durchgang B der Prüfliste) kontrolliert hat.

### 7. Regeln (in `daten/README.md` → „Prüfung“ ersetzen)

- Mindestens 2, besser 3 unabhängige Bewertungen je Thema.
- Median je Kriterium. Bei gerader Anzahl und zwei verschiedenen mittleren Werten entscheidet die Betreiberin zwischen diesen beiden und begründet es im Pull Request.
- Spannweite ≥ 2: vor der Übernahme klären (Maßstab präzisieren oder Rückfrage bei den Prüfenden).
- Öffentliche Nennung nur mit Einwilligung: Methodenseite zeigt „Bewertet von …“ nur für Personen mit `name_oeffentlich`, sonst „von n unabhängigen Prüfenden“.

### 8. Texte

- Methodenseite: Ablauf mit mehreren Prüfenden und Median beschreiben; den Satz „Derzeit übernimmt der Betreiber die Prüfung“ anpassen.
- Datenschutzerklärung (`src/rechtliches/`): neuer Abschnitt für Prüfende (Zweck, Rechtsgrundlage Art. 6 Abs. 1 lit. a und Art. 9 Abs. 2 lit. a DSGVO, Speicherdauer, Löschung).
- `supabase/EINRICHTEN.md`: Migration und Edge Function `pruefung` einspielen.

### 9. Tests

- Median und Spannweite (inkl. gerader Anzahl), Punkte erst aus Medianen.
- Edge Function: Token-Prüfung, Einwilligung erforderlich, nur freigegebene Themen, Wertebereiche.
- Übernahme-Skript: schreibt keine Namen, validiert gegen den Katalog.
- Datenbank: RLS wie oben.

## Reihenfolge und Umfang

1. Migration + Tests → 2. Edge Function → 3. Prüfseite → 4. Admin: Einladungen → 5. Admin: Auswertung + Export → 6. Übernahme-Skript → 7. Texte und Anleitung.

Danach in Supabase: Migration ausführen, Edge Function `pruefung` einspielen. Dann Einladungen für das Thema Miete anlegen.

## Nicht Teil dieses Plans

- Belegprüfung durch Prüfende (macht die Betreiberin).
- Öffentliche Statistik über Prüfende.
- Weitere Themen erfassen (eigene Pull Requests, danach mit demselben Ablauf prüfen).
