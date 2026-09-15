import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const envText = await readFile(path.join(root, '.env.local'), 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).map((line) => {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match) return null;
  return [match[1], match[2].replace(/^['"]|['"]$/g, '')];
}).filter(Boolean));
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const apiKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!baseUrl || !apiKey || !baseUrl.startsWith('https://')) throw new Error('Configuration Supabase locale invalide.');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(root, 'backups', `production-${stamp}`);
await mkdir(path.join(backupDir, 'posters'), { recursive: true });
const headers = { apikey: apiKey, Authorization: `Bearer ${apiKey}` };

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers ?? {}) } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} — ${url}`);
  return response.json();
}

const tables = ['tournaments', 'sponsors', 'visits'];
const orderColumns = { tournaments: 'created_at', sponsors: 'created_at', visits: 'visited_at' };
const manifest = { created_at: new Date().toISOString(), project_url: baseUrl, tables: {}, posters: [] };
for (const table of tables) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await fetchJson(`${baseUrl}/rest/v1/${table}?select=*&order=${orderColumns[table]}.asc`, { headers: { Range: `${offset}-${offset + 999}` } });
    rows.push(...page);
    if (page.length < 1000) break;
  }
  await writeFile(path.join(backupDir, `${table}.json`), `${JSON.stringify(rows, null, 2)}\n`);
  manifest.tables[table] = rows.length;
}

const objects = await fetchJson(`${baseUrl}/storage/v1/object/list/posters`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prefix: '', limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } }),
});
for (const object of objects) {
  if (!object.name || object.id === null) continue;
  const response = await fetch(`${baseUrl}/storage/v1/object/public/posters/${object.name.split('/').map(encodeURIComponent).join('/')}`);
  if (!response.ok) throw new Error(`Téléchargement impossible : ${object.name}`);
  const safeName = object.name.replace(/[^A-Za-z0-9._-]/g, '_');
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(backupDir, 'posters', safeName), bytes);
  manifest.posters.push({ ...object, backup_name: safeName, byte_size: bytes.length });
}
await writeFile(path.join(backupDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ backupDir, tables: manifest.tables, posters: manifest.posters.length }));
