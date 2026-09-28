# Secret `ERLAUBTE_URSPRUENGE`

Liste der Website-Adressen, von denen aus die Edge Function `analyse` (KI-Einordnung) aufgerufen werden darf. Trotz des Namens „Secret“ ist der Wert nicht geheim – Supabase legt nur alle Einstellungen der Funktion am selben Ort ab.

## Aktueller Wert

```
https://wer-liefert.vercel.app, https://wer-liefert-*.vercel.app
```

| Eintrag | Wofür |
| --- | --- |
| `https://wer-liefert.vercel.app` | Hauptadresse der App (Branch `main`) |
| `https://wer-liefert-*.vercel.app` | Vorschau-Adressen, die Vercel für jeden Branch und Pull Request erzeugt |

Eingetragen unter [Edge Functions → Secrets](https://supabase.com/dashboard/project/xfprvshhexhzhfgkfxpi/functions/secrets).

## Wozu

Jeder Aufruf der Funktion kostet Geld bei Mistral. Die Funktion prüft deshalb, von welcher Website ein Aufruf kommt (die Adresse schickt der Browser automatisch mit). Steht sie nicht auf der Liste, antwortet die Funktion mit „Aufruf von dieser Seite nicht erlaubt“ (Fehlercode 403). So kann keine fremde Website die Funktion einbinden und das KI-Budget aufbrauchen.

**Grenze:** Das schützt vor fremden Websites. Wer die Funktion gezielt mit einem Programm statt einem Browser aufruft, kann die Herkunft fälschen. Dagegen deckeln die Rate-Limits die Kosten (40 Anfragen pro Sitzung in 30 Minuten, `RATE_LIMIT_GLOBAL` – Standard 600 pro Stunde – für alle zusammen).

## Schreibweise

- Adressen mit Komma trennen
- immer mit `https://`, ohne Schrägstrich und ohne Pfad am Ende
- `*` steht für einen Teil des Namens (Buchstaben, Ziffern, Bindestriche)
- leer lassen = Aufrufe von überall erlaubt (nur zum Einrichten oder im Notfall)

## Ändern

1. [Edge Functions → Secrets](https://supabase.com/dashboard/project/xfprvshhexhzhfgkfxpi/functions/secrets) öffnen, beim Eintrag `ERLAUBTE_URSPRUENGE` den Wert ändern → **Save**.
2. Greift die Änderung nach ein, zwei Minuten nicht: Funktion `analyse` einmal neu deployen.
3. Diese Datei (Abschnitt „Aktueller Wert“) anpassen.

**Mit eigener Domain** (nach Einrichtung in Vercel unter *Settings → Domains*) beide Schreibweisen ergänzen, z. B.:

```
https://politikduell.de, https://www.politikduell.de, https://wer-liefert.vercel.app, https://wer-liefert-*.vercel.app
```

**Lokale Entwicklung** (`npm run dev` gegen die echte Funktion) ist mit dem Wert gesperrt. Bei Bedarf vorübergehend `http://localhost:5173` ergänzen und danach wieder entfernen.

## Testen und Fehler finden

App unter der eingetragenen Adresse öffnen und eine Runde spielen. Klappt die Einordnung, stimmt alles.

Bei „Aufruf von dieser Seite nicht erlaubt. (Fehlercode 403)“ passt die Adresse nicht. Mit der Adresszeile im Browser vergleichen (nur bis vor den ersten `/` nach dem Namen). Häufige Ursachen:

- `www.` fehlt oder ist zu viel
- `http` statt `https`
- Schrägstrich am Ende
- Vorschau-Adresse beginnt nicht mit `wer-liefert-` (dann den Projektnamen in Vercel prüfen)
