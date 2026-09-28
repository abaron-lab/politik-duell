-- „Wer liefert?“ – Prüfung: neuen Link für eine bestehende Einladung erzeugen
--
-- Geht ein Einladungslink verloren, erzeugt die Admin-Ansicht einen neuen
-- Token und ersetzt den gespeicherten Hash. Der alte Link funktioniert dann
-- nicht mehr; Einwilligung und Bewertungen bleiben erhalten.

grant update (token_hash) on public.pruef_einladungen to authenticated;
