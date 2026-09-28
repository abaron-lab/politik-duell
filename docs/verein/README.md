# Trägerverein für das Politik-Duell

Stand: 28. 9. 2026 · Keine Rechtsberatung: Die Vorlagen folgen der Mustersatzung der Abgabenordnung und dem BGB. Vor der Gründung die Satzung **kostenlos vom Finanzamt vorprüfen lassen** (siehe Schritt 4).

## Warum ein Verein?

Heute betreibt eine Einzelperson das Politik-Duell. Das hat vier Schwachstellen:

| Risiko heute | Mit gemeinnützigem e. V. |
| --- | --- |
| **Persönliche Haftung:** Eine Partei mahnt eine Bewertung ab oder klagt – es haftet das Privatvermögen. | Es haftet das Vereinsvermögen. Ehrenamtliche Vorstände haften nur bei Vorsatz und grober Fahrlässigkeit (§ 31a BGB). |
| **Abhängigkeit von einer Person:** Krankheit, Umzug, keine Zeit mehr → App, Domain und Konten sind verwaist. | Konten, Domain und Rechte gehören dem Verein; der Vorstand kann wechseln. |
| **Neutralität nur als Versprechen:** Die Grundprinzipien stehen in `CLAUDE.md`, jede:r Betreiber:in könnte sie ändern. | Die Grundprinzipien stehen in der Satzung und sind nur mit großer Mehrheit änderbar. Das Finanzamt prüft, dass der Verein keine Partei unterstützt. |
| **Kosten privat:** KI, Hosting, Domain zahlt eine Person. | Spenden mit Zuwendungsbestätigung, Fördermittel für politische Bildung, Mitgliedsbeiträge. |

## Welche Rechtsform?

| | **Eingetragener Verein (e. V.)** | **Gemeinnützige UG (gUG)** | **Weiter als Einzelperson** |
| --- | --- | --- | --- |
| Personen zur Gründung | **7** (danach mindestens 3) | 1 | 1 |
| Kosten Gründung | ca. 50–150 € (Notar-Beglaubigung, Registergericht) | ca. 500–1 000 € (Notar, Handelsregister) | 0 € |
| Laufender Aufwand | Einnahmen-Überschuss-Rechnung, alle 3 Jahre Steuererklärung | Doppelte Buchführung, Bilanz, Offenlegung – meist mit Steuerberatung (ab ca. 1 000 €/Jahr) | keiner |
| Haftung | Vereinsvermögen | Gesellschaftsvermögen | privat, unbegrenzt |
| Passt zum Projekt | **sehr gut:** viele Menschen tragen es gemeinsam, das stützt die Neutralität | gut, aber eine Person bleibt allein verantwortlich | nur übergangsweise |

**Empfehlung:** e. V. mit Gemeinnützigkeit. Solange es noch keine sieben Personen gibt, bleibt die Betreiberin Einzelperson – bereitet aber alles so vor, dass die Übertragung später ein Nachmittag ist (Phase 1 unten). Wenn sich über längere Zeit keine Mitstreiter:innen finden und die Haftung drückt, ist die gUG der Ausweg; die Satzung hier lässt sich dafür mit wenig Aufwand umschreiben.

Gemeinnütziger Zweck: **Förderung der Volksbildung** (politische Bildung, § 52 Abs. 2 Nr. 7 AO) und **allgemeine Förderung des demokratischen Staatswesens** (§ 52 Abs. 2 Nr. 24 AO). Politische Bildung ist gemeinnützig, wenn sie sachlich, ausgewogen und parteipolitisch neutral ist – genau das ist die Methode des Politik-Duells.

## Die Unterlagen

| Datei | Wofür |
| --- | --- |
| [satzung.md](satzung.md) | Satzungsentwurf mit den Grundprinzipien des Projekts |
| [mitstreiter.md](mitstreiter.md) | Wen du brauchst, wo du sie findest, Text zum Ansprechen |
| [gruendungsversammlung.md](gruendungsversammlung.md) | Einladung, Ablauf, Protokoll, Anwesenheitsliste |
| [anmeldung.md](anmeldung.md) | Registergericht, Finanzamt, Bank, Transparenz |
| [uebertragung.md](uebertragung.md) | Vertrag über die Übergabe der App an den Verein, Checkliste aller Konten |
| [beitritt.md](beitritt.md) | Beitrittserklärung mit Datenschutzhinweis, Beitragsordnung |

## Fahrplan

### Phase 1 – jetzt, allein (ohne Mitstreiter:innen möglich)

- [ ] **Lizenz festlegen.** Das Repo ist öffentlich, hat aber keine Lizenz – rechtlich darf es niemand weiterverwenden. Eine freie Lizenz sichert das Projekt auch dann, wenn der Verein scheitert. Vorschlag: Code unter **AGPL-3.0** (wer eine veränderte Fassung online betreibt, muss sie offenlegen), Daten in `daten/` unter **CC BY 4.0**. Entscheidung liegt bei dir; bisher bist du die einzige Urheberin, danach wird das schwieriger.
- [ ] **Namen prüfen:** Im [Gemeinsamen Registerportal](https://www.handelsregister.de) (Registerart „VR“) nach „Politik-Duell“ und „Politikduell“ suchen. Vereinsnamen müssen sich im selben Ort deutlich unterscheiden.
- [ ] **GitHub-Organisation** `politik-duell` anlegen (kostenlos) und das Repo dorthin übertragen. Links leitet GitHub automatisch um. Später wird die Organisation einfach dem Verein übergeben.
- [ ] **Konten auf die Projektadresse umstellen:** Vercel, Supabase, Mistral, INWX, GitHub-Organisation mit `politik-duell@posteo.de` statt privater Adresse. Zugangsdaten in einem Passwortmanager mit Notfallzugang.
- [ ] **Belege sammeln** für alle bisherigen Kosten (Domain, Posteo, Mistral). Der Verein kann Gründungskosten laut Satzung übernehmen, laufende Vorab-Kosten nicht.
- [ ] **Mitstreiter:innen suchen** → [mitstreiter.md](mitstreiter.md).
- [ ] **Vercel-Tarif prüfen:** Der kostenlose Hobby-Tarif ist nach den Vercel-Bedingungen auf persönliche, nicht-kommerzielle Nutzung beschränkt. Für einen Verein vorher klären, ob das reicht, sonst Pro-Tarif oder Wechsel (z. B. Netlify, Cloudflare Pages).

### Phase 2 – Gründung (sobald 7 Personen zugesagt haben)

- [ ] Satzung gemeinsam lesen, Platzhalter `[…]` ausfüllen.
- [ ] **Satzung dem Finanzamt zur Vorprüfung schicken** (Finanzamt am künftigen Vereinssitz, formlose E-Mail: „Bitte um Vorprüfung eines Satzungsentwurfs auf Gemeinnützigkeit“). Dauert meist 2–6 Wochen und erspart eine spätere Satzungsänderung.
- [ ] Gründungsversammlung abhalten → [gruendungsversammlung.md](gruendungsversammlung.md).

### Phase 3 – Eintragung (ca. 4–12 Wochen)

- [ ] Anmeldung beim Notar beglaubigen lassen, Notar reicht beim Registergericht ein → [anmeldung.md](anmeldung.md).
- [ ] Parallel: Feststellung der Gemeinnützigkeit beim Finanzamt beantragen (§ 60a AO).
- [ ] Nach Eintragung: Vereinskonto eröffnen.

### Phase 4 – Übergabe der App

- [ ] Übertragungsvertrag unterschreiben → [uebertragung.md](uebertragung.md).
- [ ] Konten, Domain, Repo auf den Verein umstellen (Checkliste dort).
- [ ] Impressum und Datenschutzerklärung umstellen (`src/rechtliches/betreiber.ts`: Name „Politik-Duell e. V.“, vertreten durch den Vorstand, Registergericht und Registernummer).
- [ ] Verträge zur Auftragsverarbeitung (Vercel, Supabase, Mistral) im Namen des Vereins neu abschließen.

## Kosten im Überblick

| Posten | einmalig | laufend |
| --- | --- | --- |
| Notar (Beglaubigung der Anmeldung) | ca. 20–70 € | – |
| Registergericht (Eintragung) | ca. 50–75 € | Änderungen je ca. 50 € |
| Vereinskonto | – | 0–10 €/Monat (viele Banken kostenlos für gemeinnützige Vereine) |
| Domain, Posteo, Mistral, ggf. Vercel Pro | – | wie bisher, künftig aus Vereinsmitteln |
| Vereinshaftpflicht + Vermögensschaden-Haftpflicht für den Vorstand | – | ca. 100–300 €/Jahr, empfohlen |
| Transparenzregister, Zuwendungsempfängerregister | – | 0 € (für eingetragene, gemeinnützige Vereine automatisch bzw. gebührenfrei) |

## Worauf der Verein achten muss

- **Parteipolitische Neutralität** ist Voraussetzung für die Gemeinnützigkeit (§ 55 Abs. 1 Nr. 1 Satz 3 AO: keine Unterstützung politischer Parteien). Keine Spenden von Parteien oder ihren Mandatsträger:innen annehmen – das regelt die Satzung.
- **Ehrenamtspauschale:** Vorstände dürfen bis 840 € im Jahr für ihre Tätigkeit bekommen, aber nur, wenn die Satzung das erlaubt (§ 8 Abs. 5 des Entwurfs). Darüber entfällt die Haftungserleichterung nach § 31a BGB.
- **Äußerungsrecht:** Bewertungen von Parteien bleiben das größte rechtliche Risiko. Die Methode (Belege, Zitate, gleiche Maßstäbe, Hinweis „Stand des Programms“) schützt; eine Vermögensschaden-Haftpflicht oder Rechtsschutz mit Medienrecht ist sinnvoll, sobald der Verein Geld hat.
- **Transparenz:** Empfohlen ist, der [Initiative Transparente Zivilgesellschaft](https://www.transparency.de/mitmachen/initiative-transparente-zivilgesellschaft) beizutreten und Satzung, Vorstand und Geldgeber öffentlich zu machen – das stärkt das Vertrauen in die Neutralität.
