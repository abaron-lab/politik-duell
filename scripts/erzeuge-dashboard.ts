// Erzeugt Dateien zum Einfügen im Supabase-Dashboard (ohne Kommandozeile):
//   supabase/dashboard/1-datenbank.sql   – Schema + Beispieldaten für den SQL Editor
//   supabase/dashboard/2-analyse.ts      – Edge Function als eine Datei für den Function-Editor
// Aufruf: npm run dashboard
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const wurzel = new URL('../supabase/', import.meta.url)
const ziel = new URL('dashboard/', wurzel)
mkdirSync(ziel, { recursive: true })

const migrationen = readdirSync(new URL('migrations/', wurzel))
  .filter((d) => d.endsWith('.sql'))
  .sort()
  .map((d) => `-- ===== migrations/${d} =====\n` + readFileSync(new URL(`migrations/${d}`, wurzel), 'utf8'))
const seed = readFileSync(new URL('seed.sql', wurzel), 'utf8')

writeFileSync(
  new URL('1-datenbank.sql', ziel),
  `-- AUTOMATISCH ERZEUGT (npm run dashboard) – nicht von Hand bearbeiten.
-- Im Supabase-Dashboard: SQL Editor → New query → alles einfügen → Run.
-- Nur beim ersten Mal komplett ausführen. Später reicht der Teil ab „seed.sql“.

begin;

${migrationen.join('\n')}
-- ===== seed.sql =====
${seed}
commit;
`,
)

const funktionen = new URL('functions/', wurzel)
const bundle = new URL('2-analyse.ts', ziel)
execFileSync('npx', ['-y', 'deno', 'bundle', '--quiet', '--external', 'npm:*', '-o', bundle.pathname, 'analyse/index.ts'], {
  cwd: funktionen,
  stdio: 'inherit',
})
rmSync(new URL('deno.lock', funktionen), { force: true })
writeFileSync(
  bundle,
  `// @ts-nocheck
// AUTOMATISCH ERZEUGT aus supabase/functions/analyse (npm run dashboard) – nicht von Hand bearbeiten.
// Im Supabase-Dashboard: Edge Functions → Deploy a new function → Via Editor,
// Name „analyse“, diesen Inhalt komplett einfügen → Deploy.
` + readFileSync(bundle, 'utf8'),
)
console.log('supabase/dashboard/ geschrieben.')
