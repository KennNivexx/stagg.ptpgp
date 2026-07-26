/**
 * Run SQL seed file directly against PostgreSQL using DATABASE_URL.
 * Usage: node scripts/run_sql_seed.js [path/to/seed.sql]
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, 'utf8');
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

const env = loadEnv(path.join(__dirname, '../.env.local'));
const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const seedPath = process.argv[2] || path.join(__dirname, '../supabase/seed_struktur_organisasi_lengkap.sql');
if (!fs.existsSync(seedPath)) {
  console.error('Seed file not found:', seedPath);
  process.exit(1);
}

const sql = fs.readFileSync(seedPath, 'utf8');

const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

async function main() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Running seed:', seedPath);
  await client.query(sql);
  console.log('Seed executed successfully.');
  await client.end();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  client.end().catch(() => {});
  process.exit(1);
});
