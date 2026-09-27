// Erzeugt je Thema eine Prüfliste als eigenständige HTML-Seite für die
// Vier-Augen-Prüfung (Ablauf siehe daten/README.md → „Prüfung“).
// Aufruf: npm run pruefliste            – alle Themen mit Maßnahmen
//         npm run pruefliste -- 2       – nur Thema 2
// Ausgabe: pruefung/<nr>-<thema>.html (nicht im Repo)
import { mkdirSync, writeFileSync } from 'node:fs'
import { pruefeDatenordner } from './katalog-laden.ts'

const { katalog, fehler } = pruefeDatenordner()
if (fehler.length) {
  console.error('Datenkatalog fehlerhaft – erst `npm run daten:pruefen` beheben.')
  process.exit(1)
}

const nurThema = process.argv[2] ? Number(process.argv[2]) : null
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const dateiname = (s: string) =>
  s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// Feste, aber parteiunabhängige Reihenfolge für Durchgang A.
const mische = (n: number) => ((n * 2654435761) >>> 0) % 1000003

const ordner = new URL('../pruefung/', import.meta.url)
mkdirSync(ordner, { recursive: true })

for (const thema of katalog.themen) {
  if (nurThema !== null && thema.id !== nurThema) continue
  const massnahmen = katalog.massnahmen.filter((m) => m.thema_id === thema.id)
  const keine = katalog.abdeckung.filter((a) => a.thema_id === thema.id && a.art === 'keine')
  if (!massnahmen.length && !keine.length) continue

  const ursachen = katalog.ursachen.filter((u) => u.thema_id === thema.id)
  const ursacheText = (id: number) => ursachen.find((u) => u.id === id)?.beschreibung ?? String(id)
  const partei = (id: number) => katalog.parteien.find((p) => p.id === id)!
  const blind = [...massnahmen].sort((a, b) => mische(a.id) - mische(b.id))
  const kennung = new Map(blind.map((m, i) => [m.id, `M${i + 1}`]))
  const fehlend = katalog.parteien.filter((p) => !katalog.abdeckung.some((a) => a.thema_id === thema.id && a.partei_id === p.id))

  const daten = {
    thema: thema.id,
    massnahmen: massnahmen.map((m) => ({
      id: m.id,
      kennung: kennung.get(m.id),
      partei: partei(m.partei_id).kurzname,
      w: m.wirksamkeit,
      u: m.umsetzbarkeit,
      text: m.beschreibung,
    })),
  }

  const auswahl = (name: string) =>
    `<select data-feld="${name}"><option value="">–</option>${[0, 1, 2, 3].map((v) => `<option>${v}</option>`).join('')}</select>`

  const zeileA = (m: (typeof massnahmen)[number]) => `
      <tr data-id="${m.id}">
        <td class="kennung">${kennung.get(m.id)}</td>
        <td>${esc(m.beschreibung)}<div class="klein">Ursachen: ${m.ursachen_ids.map((u) => esc(ursacheText(u))).join(' · ')}</div></td>
        <td>${auswahl('w')}</td>
        <td>${auswahl('u')}</td>
        <td class="aufloesung"></td>
      </tr>`

  const PUNKTE_B = [
    'Link öffnet das richtige Programm auf der richtigen Seite',
    'Zitat steht dort wörtlich',
    'Kurzbeschreibung gibt das Zitat sinngemäß richtig wieder (nicht zugespitzt)',
    'Maßnahme passt zu den eingetragenen Ursachen',
    'Begründung ist neutral und bewertet nur die Maßnahme',
  ]
  const karteB = (m: (typeof massnahmen)[number]) => `
      <div class="karte" data-id="${m.id}">
        <div class="kopf"><b>${kennung.get(m.id)}</b> · ${esc(partei(m.partei_id).name)} · W ${m.wirksamkeit} / U ${m.umsetzbarkeit}</div>
        <p><b>${esc(m.beschreibung)}</b></p>
        <blockquote>„${esc(m.zitat ?? '(kein Zitat)')}“</blockquote>
        <p class="klein"><a href="${esc(m.beleg_programm_url)}" target="_blank" rel="noopener">${esc(m.beleg_programm_url)}</a>
          ${m.beleg_studie_url ? `<br>Studie: <a href="${esc(m.beleg_studie_url)}" target="_blank" rel="noopener">${esc(m.beleg_studie_url)}</a>` : ''}</p>
        <p class="klein">Ursachen: ${m.ursachen_ids.map((u) => esc(ursacheText(u))).join(' · ')}<br>Begründung: ${esc(m.begruendung)}${
          m.rollen_modifikator
            ? `<br>Rollen: ${Object.entries(m.rollen_modifikator)
                .map(([r, v]) => `${r} ${v!.wert > 0 ? '+' : ''}${v!.wert} (${esc(v!.begruendung)})`)
                .join('; ')}`
            : ''
        }</p>
        ${PUNKTE_B.map((p, i) => `<label><input type="checkbox" data-feld="b${i}"> ${p}</label>`).join('')}
        <textarea data-feld="notiz" placeholder="Einwand oder Notiz"></textarea>
      </div>`

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prüfliste ${esc(thema.name)}</title>
<style>
  :root { --bg: #fff; --text: #1b1d21; --leise: #5b6270; --linie: #d8dce3; --flaeche: #f4f6f9; --ok: #1f7a3a; --warn: #a15c00; --fehler: #b3261e; }
  @media (prefers-color-scheme: dark) { :root { --bg: #121417; --text: #e8eaee; --leise: #9aa2af; --linie: #2e333b; --flaeche: #1b1f24; --ok: #6fcf8a; --warn: #f0b35a; --fehler: #ff8a80; } }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; background: var(--bg); color: var(--text); font: 16px/1.5 system-ui, sans-serif; max-width: 960px; margin-inline: auto; }
  h1 { margin: 0 0 4px; font-size: 1.6rem; } h2 { margin-top: 2rem; border-bottom: 1px solid var(--linie); padding-bottom: 4px; }
  .klein { color: var(--leise); font-size: 0.85rem; }
  table { width: 100%; border-collapse: collapse; } td, th { border-bottom: 1px solid var(--linie); padding: 8px 6px; text-align: left; vertical-align: top; }
  .kennung { font-weight: 700; white-space: nowrap; }
  select, textarea { font: inherit; color: inherit; background: var(--flaeche); border: 1px solid var(--linie); border-radius: 6px; padding: 4px; }
  textarea { width: 100%; min-height: 3em; margin-top: 6px; }
  .karte { background: var(--flaeche); border: 1px solid var(--linie); border-radius: 10px; padding: 12px; margin: 12px 0; }
  .kopf { font-size: 0.9rem; color: var(--leise); }
  blockquote { margin: 8px 0; padding-left: 12px; border-left: 3px solid var(--linie); }
  label { display: block; margin: 2px 0; }
  button { font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--linie); background: var(--flaeche); color: inherit; cursor: pointer; margin: 8px 8px 0 0; }
  .gleich { color: var(--ok); } .eins { color: var(--warn); } .zwei { color: var(--fehler); font-weight: 700; }
  details { margin: 8px 0; } a { color: inherit; word-break: break-all; }
  .aufloesung:empty::after { content: ""; }
</style>
</head>
<body>
<h1>Prüfliste: ${esc(thema.name)}</h1>
<p class="klein">${esc(thema.beschreibung)} · ${massnahmen.length} Maßnahmen, ${keine.length} × „keine Maßnahme“ · erzeugt ${new Date().toISOString().slice(0, 10)} · Eingaben werden nur in diesem Browser gespeichert.</p>
${fehlend.length ? `<p class="klein">Noch nicht erfasst: ${fehlend.map((p) => esc(p.name)).join(', ')}</p>` : ''}

<details><summary>Ursachen und Bewertungsmaßstab</summary>
<ul>${ursachen.map((u) => `<li>${esc(u.beschreibung)} – <a href="${esc(u.quelle_url)}" target="_blank" rel="noopener">Quelle</a></li>`).join('')}</ul>
<p><b>Wirksamkeit</b>: 0 setzt an keiner erfassten Ursache an · 1 nur am Rand oder geringe Wirkung (lindert nur Folgen) · 2 setzt an einer Ursache an, spürbare Wirkung zu erwarten · 3 direkt an einer Hauptursache, Wirkung gut belegt</p>
<p><b>Umsetzbarkeit</b>: 0 derzeit rechtlich/finanziell nicht umsetzbar · 1 nur mit großen Hürden · 2 mit Aufwand oder in mehreren Jahren · 3 rechtlich möglich, finanziert, in einer Wahlperiode realistisch</p>
</details>

<h2>Durchgang A: Bewertung ohne Parteinamen</h2>
<p>Bewerte jede Maßnahme selbst, bevor du Durchgang B öffnest. Erst danach „Vergleichen“ drücken.</p>
<table><thead><tr><th></th><th>Maßnahme</th><th>W</th><th>U</th><th>Vergleich</th></tr></thead>
<tbody>${blind.map(zeileA).join('')}</tbody></table>
<button id="vergleichen">Vergleichen</button>
<p id="bilanz" class="klein"></p>

<details id="teil-b"><summary><h2 style="display:inline">Durchgang B: Belege prüfen</h2></summary>
${[...new Set(massnahmen.map((m) => m.partei_id))].map((pid) => `<h3>${esc(partei(pid).name)}</h3>${massnahmen.filter((m) => m.partei_id === pid).map(karteB).join('')}`).join('')}
${keine.length ? `<h3>„Keine Maßnahme im Programm“</h3>${keine.map((k) => `<div class="karte"><b>${esc(partei(k.partei_id).name)}</b><p>${esc(k.begruendung ?? '')}</p><label><input type="checkbox" data-feld="k${k.partei_id}"> Stichprobe mit der PDF-Suche bestätigt: nichts zum Thema</label></div>`).join('')}` : ''}
</details>

<h2>Ergebnis</h2>
<button id="kopieren">Zusammenfassung kopieren</button>
<p class="klein">Kopiert eine Markdown-Zusammenfassung – als Kommentar in den Pull Request einfügen.</p>
<textarea id="ausgabe" readonly style="min-height:8em"></textarea>

<script>
const DATEN = ${JSON.stringify(daten)};
const SCHLUESSEL = 'pruefliste-' + DATEN.thema;
let zustand = {};
try { zustand = JSON.parse(localStorage.getItem(SCHLUESSEL) || '{}'); } catch (e) {}
const speichern = () => { try { localStorage.setItem(SCHLUESSEL, JSON.stringify(zustand)); } catch (e) {} };
document.querySelectorAll('[data-feld]').forEach((el) => {
  const box = el.closest('[data-id]');
  const key = (box ? box.dataset.id : 'allg') + ':' + el.dataset.feld + (box && box.tagName === 'TR' ? ':a' : '');
  if (key in zustand) { if (el.type === 'checkbox') el.checked = zustand[key]; else el.value = zustand[key]; }
  el.addEventListener('input', () => { zustand[key] = el.type === 'checkbox' ? el.checked : el.value; speichern(); });
});
const wert = (id, feld) => { const v = zustand[id + ':' + feld + ':a']; return v === undefined || v === '' ? null : Number(v); };
function vergleichen() {
  let gleich = 0, eins = 0, zwei = 0, offen = 0;
  for (const m of DATEN.massnahmen) {
    const zelle = document.querySelector('tr[data-id="' + m.id + '"] .aufloesung');
    const w = wert(m.id, 'w'), u = wert(m.id, 'u');
    if (w === null || u === null) { offen++; zelle.textContent = 'noch nicht bewertet'; continue; }
    const d = Math.max(Math.abs(w - m.w), Math.abs(u - m.u));
    const klasse = d === 0 ? 'gleich' : d === 1 ? 'eins' : 'zwei';
    if (d === 0) gleich++; else if (d === 1) eins++; else zwei++;
    zelle.innerHTML = '<span class="' + klasse + '">Entwurf: W ' + m.w + ' / U ' + m.u + '</span><br><span class="klein">' + m.partei + '</span>';
  }
  document.getElementById('bilanz').textContent = gleich + ' gleich, ' + eins + ' mit 1 Punkt Abstand, ' + zwei + ' mit 2+ Punkten Abstand' + (offen ? ', ' + offen + ' offen' : '') + '.';
}
document.getElementById('vergleichen').addEventListener('click', vergleichen);
document.getElementById('kopieren').addEventListener('click', () => {
  const z = ['### Prüfung Thema ' + DATEN.thema, '', '| Maßnahme | Partei | Entwurf W/U | Prüfung W/U | Belege | Notiz |', '| --- | --- | --- | --- | --- | --- |'];
  for (const m of DATEN.massnahmen) {
    const w = wert(m.id, 'w'), u = wert(m.id, 'u');
    const haken = [0, 1, 2, 3, 4].filter((i) => zustand[m.id + ':b' + i]).length;
    const notiz = (zustand[m.id + ':notiz'] || '').replace(/\\n/g, ' ').replace(/\\|/g, '/');
    z.push('| ' + m.kennung + ' (' + m.id + ') ' + m.text.replace(/\\|/g, '/') + ' | ' + m.partei + ' | ' + m.w + '/' + m.u + ' | ' + (w === null ? '–' : w) + '/' + (u === null ? '–' : u) + ' | ' + haken + '/5 | ' + notiz + ' |');
  }
  const text = z.join('\\n');
  document.getElementById('ausgabe').value = text;
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
});
</script>
</body>
</html>
`
  const datei = new URL(`${String(thema.id).padStart(2, '0')}-${dateiname(thema.name)}.html`, ordner)
  writeFileSync(datei, html)
  console.log(`geschrieben: pruefung/${String(thema.id).padStart(2, '0')}-${dateiname(thema.name)}.html`)
}
