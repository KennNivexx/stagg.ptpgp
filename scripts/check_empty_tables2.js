const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const env = {};
  const content = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const tables = fs.readFileSync(process.argv[2], 'utf8').split('\n').map(s => s.trim()).filter(Boolean);

async function main() {
  const results = [];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      results.push({ table: t, count: null, error: error.message, code: error.code });
    } else {
      results.push({ table: t, count });
    }
  }
  results.sort((a, b) => (a.count ?? -2) - (b.count ?? -2));
  for (const r of results) {
    if (r.error) console.log(`ERR   ${r.table}: [${r.code}] ${r.error}`);
    else console.log(`${String(r.count).padStart(5)}  ${r.table}`);
  }
}
main();
