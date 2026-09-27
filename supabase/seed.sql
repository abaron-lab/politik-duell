-- AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
-- FIKTIVE Platzhalterdaten: Parteien, Maßnahmen, Punkte und Links sind erfunden.

-- Mehrfach ausführbar: Stammdaten per Upsert, Maßnahmen werden neu geschrieben.
-- Gespielte Runden bleiben erhalten.
delete from public.massnahmen;

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
  (3, 'Energiepreise', 'Hohe Kosten für Strom und Heizung.')
on conflict (id) do update set name = excluded.name, beschreibung = excluded.beschreibung;

insert into public.ursachen (id, thema_id, beschreibung, quelle_url) values
  (101, 1, 'Zu wenige Praxen, besonders auf dem Land', 'https://example.org/mock/studie/aerzteversorgung'),
  (102, 1, 'Ineffiziente Terminvergabe', 'https://example.org/mock/studie/terminvergabe'),
  (103, 1, 'Budgetierung begrenzt Behandlungen', 'https://example.org/mock/studie/budgetierung'),
  (201, 2, 'Zu wenig neue Wohnungen', 'https://example.org/mock/studie/wohnungsbau'),
  (202, 2, 'Starke Mietsteigerungen', 'https://example.org/mock/studie/mietentwicklung'),
  (203, 2, 'Hohe Baukosten und lange Genehmigungen', 'https://example.org/mock/studie/baukosten'),
  (301, 3, 'Hohe Netzentgelte', 'https://example.org/mock/studie/netzentgelte'),
  (302, 3, 'Steuern und Abgaben auf Energie', 'https://example.org/mock/studie/energiesteuern'),
  (303, 3, 'Abhängigkeit von fossilen Importen', 'https://example.org/mock/studie/importe')
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
