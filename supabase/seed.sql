-- AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
-- FIKTIVE Platzhalterdaten: Parteien, Maßnahmen, Punkte und Links sind erfunden.

-- Mehrfach ausführbar: Stammdaten per Upsert, Maßnahmen und Abdeckung werden neu geschrieben.
-- Gespielte Runden bleiben erhalten.
delete from public.massnahmen;
delete from public.abdeckung;

insert into public.parteien (id, name, kurzname, farbe, programm_url, programm_stand) values
  (1, 'Partei Alpha', 'Alpha', '#2bb3a3', 'https://example.org/mock/alpha/wahlprogramm.pdf', '2026-01-01'),
  (2, 'Partei Beta', 'Beta', '#8f6bff', 'https://example.org/mock/beta/wahlprogramm.pdf', '2026-01-01'),
  (3, 'Partei Gamma', 'Gamma', '#f2a33a', 'https://example.org/mock/gamma/wahlprogramm.pdf', '2026-01-01'),
  (4, 'Partei Delta', 'Delta', '#4f8fe8', 'https://example.org/mock/delta/wahlprogramm.pdf', '2026-01-01'),
  (5, 'Partei Epsilon', 'Epsilon', '#e86a8f', 'https://example.org/mock/epsilon/wahlprogramm.pdf', '2026-01-01')
on conflict (id) do update set name = excluded.name, kurzname = excluded.kurzname, farbe = excluded.farbe,
  programm_url = excluded.programm_url, programm_stand = excluded.programm_stand;

insert into public.themen (id, name, beschreibung) values
  (1, 'Arzttermine', 'Lange Wartezeiten und schwer erreichbare Praxen.'),
  (2, 'Miete', 'Hohe Mieten und schwierige Wohnungssuche.'),
  (3, 'Energiepreise', 'Hohe Kosten für Strom und Heizung.'),
  (4, 'Schule', 'Unterrichtsausfall, fehlende Lehrkräfte und marode Schulgebäude.'),
  (5, 'Arbeitsplätze', 'Unsichere Jobs, Stellenabbau und schwache Wirtschaft.'),
  (6, 'Zuwanderung und Integration', 'Probleme bei Aufnahme, Integration und Rückführung von Zugewanderten.'),
  (7, 'Rente', 'Niedrige Renten und Sorge um die Altersvorsorge.'),
  (8, 'Bus und Bahn', 'Seltene Verbindungen, Ausfälle und Verspätungen.'),
  (9, 'Sicherheit', 'Sich im Alltag unsicher fühlen oder Opfer von Kriminalität werden.'),
  (10, 'Pflege', 'Pflegeplatz oder Pflegedienst finden, hohe Kosten, überlastete Angehörige.')
on conflict (id) do update set name = excluded.name, beschreibung = excluded.beschreibung;

insert into public.ursachen (id, thema_id, beschreibung, quelle_url) values
  (101, 1, 'Zu wenige Hausarztpraxen, besonders auf dem Land; viele Ärztinnen und Ärzte gehen bald in den Ruhestand', 'https://idw-online.de/de/news769524'),
  (102, 1, 'Termine und Wege durch das Gesundheitssystem werden kaum gesteuert; knappes Personal wird nicht gezielt eingesetzt', 'https://www.svr-gesundheit.de/publikationen/gutachten-2024/'),
  (103, 1, 'Unterschiedliche Vergütung: Facharztpraxen vergeben Termine bevorzugt an Privatversicherte', 'https://idw-online.de/de/news750098'),
  (201, 2, 'Es werden weniger Wohnungen gebaut als gebraucht (Bedarf laut Prognose rund 320.000 pro Jahr)', 'https://www.bbsr.bund.de/BBSR/DE/presse/presseinformationen/2025/wohnungsbedarfsprognose.html'),
  (202, 2, 'Mieten bei Neuvermietung liegen rund 43 % über Bestandsmieten, in großen Städten besonders hoch', 'https://www.bbsr.bund.de/BBSR/DE/startseite/topmeldungen/entwicklung-wohnungsmieten-2025.html'),
  (203, 2, 'Stark gestiegene Baukosten: Wohngebäude wurden 2010 bis 2025 um 89 % teurer, mehr als doppelt so stark wie die Inflation', 'https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Baupreise-Immobilienpreisindex/_inhalt.html'),
  (301, 3, 'Hohe Netzentgelte für den Betrieb und Ausbau der Stromnetze', 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/PreiseAbschlaege/Tarife-table.html'),
  (302, 3, 'Steuern, Abgaben und Umlagen machen einen großen Teil des Strompreises aus', 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/PreiseAbschlaege/Tarife-table.html'),
  (303, 3, 'Rund 70 % der Energie wird importiert, vor allem Öl, Gas und Steinkohle', 'https://www.umweltbundesamt.de/daten/umweltzustand-trends/energie/primaerenergiegewinnung-importe'),
  (401, 4, 'Zu wenige Lehrkräfte: Kurzfristig liegt das Angebot deutlich unter dem Einstellungsbedarf', 'https://www.kmk.org/downloads-dokumente/statistik/schulstatistik/lehrkraefteeinstellungsbedarf-und-angebot.html'),
  (402, 4, 'Großer Sanierungsstau bei Schulgebäuden (rund 68 Mrd. Euro, größter Posten der Kommunen)', 'https://www.bundestag.de/resource/blob/1157306/KfW-Kommunalpanel-2025.pdf'),
  (403, 4, 'Wachsende Lernrückstände: Ein Drittel der Neuntklässler verfehlt den Mindeststandard in Mathematik', 'https://www.iqb.hu-berlin.de/de/schule/sekundarstufe-i/bildungstrend/2024/'),
  (501, 5, 'Die Industrie verliert an Wettbewerbsfähigkeit; Strukturwandel und geopolitische Veränderungen gefährden das Exportmodell', 'https://www.sachverstaendigenrat-wirtschaft.de/fileadmin/dateiablage/gutachten/jg202526/JG202526_Kurzfassung.pdf'),
  (502, 5, 'Strukturwandel: Die Industrie baut Stellen ab, neue Jobs entstehen vor allem in anderen Branchen', 'https://iab.de/presseinfo/iab-prognose-fuer-2026-2027-erwerbstaetigkeit-schrumpft-trotz-besserer-konjunktur/'),
  (503, 5, 'Löhne in Ostdeutschland liegen weiterhin deutlich unter denen im Westen', 'https://www.destatis.de/DE/Themen/Querschnitt/35-Jahre-Deutsche-Einheit/Vermoegen-Einkommen/Textbausteine/01_verdienstunterschiede.html'),
  (601, 6, 'Unterbringung bleibt für die meisten Kommunen herausfordernd; Ausländerbehörden sind besonders stark belastet', 'https://mediendienst-integration.de/fileadmin/Dateien/EXPERTISE_FLUECHTLINGSAUFNAHME_IN_DEN_KOMMUNEN_MEDIENDIENST_INTEGRATION_NOV_2025_FINAL.pdf'),
  (602, 6, 'Asyl- und Gerichtsverfahren dauern lange (im Schnitt rund anderthalb Jahre bis zur rechtskräftigen Entscheidung)', 'https://www.bundestag.de/presse/hib/kurzmeldungen-1145824'),
  (603, 6, 'Sprachkurse, Anerkennung von Abschlüssen und Zugang zum Arbeitsmarkt dauern lange', 'https://iab-forum.de/10-jahre-fluchtmigration-2015-was-integration-foerdert-und-was-sie-bremst/'),
  (604, 6, 'Viele Ausreisepflichtige werden nicht zurückgeführt, etwa wegen fehlender Papiere', 'https://mediendienst-integration.de/fluechtlinge/abschiebungen/warum-werden-ausreisepflichtige-personen-nicht-abgeschoben/'),
  (701, 7, 'Immer weniger Beitragszahlende kommen auf eine Rentnerin oder einen Rentner', 'https://www.demografie-portal.de/DE/Fakten/altersrentner-beitragszahler.html'),
  (702, 7, 'Niedrige Löhne und Lücken im Erwerbsleben (z. B. Arbeitslosigkeit) führen zu niedrigen Rentenansprüchen', 'https://www.diw.de/sixcms/detail.php?id=diw_01.c.402060.de'),
  (703, 7, 'Viele Beschäftigte haben keine betriebliche Altersvorsorge, vor allem in kleinen Betrieben', 'https://www.bpb.de/themen/soziale-lage/rentenpolitik/291012/empirische-befunde-zur-betrieblichen-altersversorgung/'),
  (801, 8, 'Rund 21 Millionen Menschen fehlt ein gutes Grundangebot an Bus und Bahn, besonders auf dem Land', 'https://www.agora-verkehrswende.de/aktuelles/oev-atlas-zeigt-grosse-unterschiede-beim-bus-und-bahnangebot'),
  (802, 8, 'Marodes, überaltertes Schienennetz mit wachsendem Nachholbedarf', 'https://www.bundesrechnungshof.de/fileadmin/import/SharedDocs/Downloads/DE/Berichte/2025/evaluation-luf-3_volltext-evaluation-luf-3_volltext.pdf'),
  (803, 8, 'Zu wenige Bus- und Straßenbahnfahrerinnen und -fahrer; viele Stellen bleiben unbesetzt', 'https://www.kofa.de/daten-und-fakten/studien/fachkraeftereport-juni-2025/'),
  (901, 9, 'Unsicherheit ballt sich an bestimmten Orten: nachts fühlen sich viele an Bahnhöfen und in Parks unsicher', 'https://www.bka.de/DE/Presse/Listenseite_Pressemitteilungen/2026/Presse2026/260420_PM_PKS_SKiD.html'),
  (902, 9, 'Überlastete Strafjustiz: Rund eine Million offene Ermittlungsverfahren, Verfahren dauern lange', 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2025/10/PD25_360_2421.html'),
  (903, 9, 'Junge Menschen werden häufiger Opfer von Gewalt; die Zahl tatverdächtiger Kinder steigt', 'https://www.bka.de/DE/Presse/Listenseite_Pressemitteilungen/2026/Presse2026/260420_PM_PKS_SKiD.html'),
  (1001, 10, 'Zu wenige Pflegekräfte; bis 2049 fehlen je nach Szenario 280.000 bis 690.000', 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2024/01/PD24_033_23_12.html'),
  (1002, 10, 'Steigende Eigenanteile im Pflegeheim (im ersten Jahr im Schnitt über 3.300 Euro im Monat)', 'https://www.vdek.com/presse/pressemitteilungen/2026/stationaere-pflege-eigenanteile-juli-2026.html'),
  (1003, 10, 'Durch die Alterung steigt die Zahl der Pflegebedürftigen deutlich', 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2023/03/PD23_124_12.html'),
  (1004, 10, 'Pflegende Angehörige tragen die Hauptlast; Entlastungsangebote werden wenig genutzt', 'https://www.zqp.de/thema/entlastung-pflegende/')
on conflict (id) do update set thema_id = excluded.thema_id, beschreibung = excluded.beschreibung,
  quelle_url = excluded.quelle_url;

insert into public.massnahmen (id, thema_id, partei_id, beschreibung, ursachen_ids, wirksamkeit, umsetzbarkeit,
  rollen_modifikator, begruendung, beleg_programm_url, beleg_studie_url, stand, geprueft) values
  (1, 1, 1, 'Stipendien und Startförderung für Praxen in unterversorgten Regionen', '{101}', 3, 2, null, 'Setzt direkt an fehlenden Praxen an; Wirkung erst nach einigen Jahren.', 'https://example.org/mock/alpha/wahlprogramm.pdf#page=34', 'https://example.org/mock/studie/landarzt-stipendien', '2026-01-01', false),
  (2, 1, 2, 'Digitale Terminplattform mit Pflicht zur Freigabe freier Termine', '{102}', 2, 2, null, 'Verteilt vorhandene Termine besser, schafft aber keine neuen.', 'https://example.org/mock/beta/wahlprogramm.pdf#page=18', null, '2026-01-01', false),
  (3, 1, 2, 'Budgetgrenzen für hausärztliche Leistungen aufheben', '{103}', 2, 1, null, 'Mehr Behandlungen möglich; Finanzierung durch Kassen ungeklärt.', 'https://example.org/mock/beta/wahlprogramm.pdf#page=19', null, '2026-01-01', false),
  (4, 1, 3, 'Mehr Medizinstudienplätze', '{101}', 2, 1, null, 'Richtige Richtung, wirkt aber erst nach über zehn Jahren Ausbildung.', 'https://example.org/mock/gamma/wahlprogramm.pdf#page=52', null, '2026-01-01', false),
  (5, 1, 4, 'Hausarztpraxis als erste Anlaufstelle mit gezielter Überweisung', '{102,103}', 2, 2, null, 'Entlastet Facharzttermine; erfordert Umstellung im System.', 'https://example.org/mock/delta/wahlprogramm.pdf#page=27', 'https://example.org/mock/studie/primaerarzt', '2026-01-01', false),
  (6, 2, 1, 'Mietpreisbremse verlängern und Ausnahmen streichen', '{202}', 2, 3, '{"mieter":{"wert":1,"begruendung":"Begrenzt Mietsteigerungen für Mieter:innen unmittelbar."},"eigentuemer":{"wert":-1,"begruendung":"Begrenzt mögliche Mieteinnahmen."}}'::jsonb, 'Dämpft Anstiege schnell, schafft aber keinen neuen Wohnraum.', 'https://example.org/mock/alpha/wahlprogramm.pdf#page=12', null, '2026-01-01', false),
  (7, 2, 2, 'Baugenehmigungen digitalisieren und feste Fristen einführen', '{201,203}', 2, 2, null, 'Beschleunigt Neubau; Personal in Bauämtern bleibt Engpass.', 'https://example.org/mock/beta/wahlprogramm.pdf#page=41', 'https://example.org/mock/studie/bauamt-digital', '2026-01-01', false),
  (8, 2, 4, 'Kommunalen und genossenschaftlichen Wohnungsbau fördern', '{201}', 3, 1, null, 'Schafft dauerhaft günstigen Wohnraum; hoher Finanzbedarf.', 'https://example.org/mock/delta/wahlprogramm.pdf#page=9', null, '2026-01-01', false),
  (9, 2, 5, 'Bauvorschriften vereinfachen und Standards bündeln', '{203}', 2, 3, '{"eigentuemer":{"wert":1,"begruendung":"Senkt Kosten bei Sanierung und Neubau im Eigentum."}}'::jsonb, 'Senkt Baukosten zügig; Wirkung auf Mieten indirekt.', 'https://example.org/mock/epsilon/wahlprogramm.pdf#page=22', null, '2026-01-01', false),
  (10, 3, 1, 'Stromsteuer auf das europäische Minimum senken', '{302}', 2, 3, null, 'Sofort spürbar; Einnahmeausfall muss gegenfinanziert werden.', 'https://example.org/mock/alpha/wahlprogramm.pdf#page=45', null, '2026-01-01', false),
  (11, 3, 3, 'Netzentgelte teilweise aus dem Bundeshaushalt tragen', '{301}', 2, 2, null, 'Senkt einen großen Preisbestandteil; dauerhafte Haushaltsbelastung.', 'https://example.org/mock/gamma/wahlprogramm.pdf#page=30', 'https://example.org/mock/studie/netzentgelte-zuschuss', '2026-01-01', false),
  (12, 3, 3, 'Ausbau heimischer erneuerbarer Energien beschleunigen', '{303}', 2, 2, null, 'Verringert Importabhängigkeit mittelfristig.', 'https://example.org/mock/gamma/wahlprogramm.pdf#page=31', null, '2026-01-01', false),
  (13, 3, 4, 'Einnahmen aus CO₂-Preis als Pro-Kopf-Auszahlung zurückgeben', '{302}', 1, 2, '{"studierend":{"wert":1,"begruendung":"Pauschale Auszahlung entlastet kleine Einkommen relativ stärker."},"rentner":{"wert":1,"begruendung":"Pauschale Auszahlung entlastet kleine Einkommen relativ stärker."},"arbeitslos":{"wert":1,"begruendung":"Pauschale Auszahlung entlastet kleine Einkommen relativ stärker."}}'::jsonb, 'Gleicht Belastung aus, senkt den Preis selbst aber nicht.', 'https://example.org/mock/delta/wahlprogramm.pdf#page=38', null, '2026-01-01', false),
  (14, 3, 5, 'Langfristige Lieferverträge für Gas absichern', '{303}', 1, 2, null, 'Mehr Planbarkeit, aber kaum Einfluss auf Strom- und Netzkosten.', 'https://example.org/mock/epsilon/wahlprogramm.pdf#page=15', null, '2026-01-01', false);

select setval(pg_get_serial_sequence('public.massnahmen', 'id'), (select max(id) from public.massnahmen));

insert into public.abdeckung (thema_id, partei_id, art, begruendung, stand) values
  (1, 1, 'massnahmen', null, '2026-01-01'),
  (1, 2, 'massnahmen', null, '2026-01-01'),
  (1, 3, 'massnahmen', null, '2026-01-01'),
  (1, 4, 'massnahmen', null, '2026-01-01'),
  (1, 5, 'keine', 'Kapitel „Gesundheit“ und Stichwortsuche durchsucht, nichts dazu gefunden (fiktives Beispiel).', '2026-01-01'),
  (2, 1, 'massnahmen', null, '2026-01-01'),
  (2, 2, 'massnahmen', null, '2026-01-01'),
  (2, 3, 'keine', 'Kapitel „Bauen und Wohnen“ und Stichwortsuche durchsucht, nichts dazu gefunden (fiktives Beispiel).', '2026-01-01'),
  (2, 4, 'massnahmen', null, '2026-01-01'),
  (2, 5, 'massnahmen', null, '2026-01-01'),
  (3, 1, 'massnahmen', null, '2026-01-01'),
  (3, 2, 'keine', 'Kapitel „Energie und Klima“ und Stichwortsuche durchsucht, nichts dazu gefunden (fiktives Beispiel).', '2026-01-01'),
  (3, 3, 'massnahmen', null, '2026-01-01'),
  (3, 4, 'massnahmen', null, '2026-01-01'),
  (3, 5, 'massnahmen', null, '2026-01-01');
