const { createClient } = require('@supabase/supabase-js');
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
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const DUMMY_ID = '00000000-0000-0000-0000-000000000000';

async function tryDeleteAll(table) {
  const { data, error } = await sb.from(table).delete().neq('id', DUMMY_ID);
  return { data, error };
}

function parseFkTable(error) {
  const matches = error?.message?.match(/table "([^"]+)"/g) || [];
  if (matches.length >= 2) {
    // last quoted table is the referencing table
    return matches[matches.length - 1].replace(/table "|"/g, '');
  }
  return null;
}

async function main() {
  const tablesDeleted = [];
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    attempts++;
    const { data, error } = await tryDeleteAll('karyawan');
    if (!error) {
      console.log(`✅ karyawan cleared after deleting from: ${tablesDeleted.join(', ') || '(none)'}`);
      break;
    }
    const fkTable = parseFkTable(error);
    if (!fkTable) {
      console.error('❌ Unparseable error:', error);
      process.exit(1);
    }
    console.log(`  FK block from ${fkTable}, clearing it...`);
    const { error: delErr } = await sb.from(fkTable).delete().neq('id', DUMMY_ID);
    if (delErr) {
      console.error(`  Failed to clear ${fkTable}:`, delErr);
      process.exit(1);
    }
    tablesDeleted.push(fkTable);
  }

  if (attempts >= maxAttempts) {
    console.error('❌ Too many attempts');
    process.exit(1);
  }

  // Clear other core tables that have no FK constraints
  for (const table of ['pengguna', 'formasi_jabatan', 'unit_organisasi', 'departemen']) {
    const { error } = await sb.from(table).delete().neq('id', DUMMY_ID);
    if (error) {
      console.error(`❌ Failed to clear ${table}:`, error);
    } else {
      console.log(`✅ ${table} cleared`);
    }
  }

  // Clear dependent tables blocking jabatan and grade_jabatan
  const dependents = [
    { table: 'kpi_jabatan', col: 'id' },
    { table: 'promotion_policies', col: 'id' },
    { table: 'deskripsi_kerja', col: 'id' },
    { table: 'kompetensi_jabatan', col: 'position_code' },
    { table: 'jalur_jabatan', col: 'id' },
    { table: 'critical_positions', col: 'id' },
  ];
  for (const { table, col } of dependents) {
    const { error } = await sb.from(table).delete().neq(col, '');
    if (error) {
      console.error(`❌ Failed to clear ${table}:`, error);
    } else {
      console.log(`✅ ${table} cleared`);
    }
  }

  // Clear jabatan and grade_jabatan completely
  for (const table of ['jabatan', 'grade_jabatan']) {
    const { error } = await sb.from(table).delete().neq('id', DUMMY_ID);
    if (error) {
      console.error(`❌ Failed to clear ${table}:`, error);
    } else {
      console.log(`✅ ${table} cleared`);
    }
  }

  console.log('\n✅ Database core tables cleared. Now run: node scripts/seed_org_full.js');
}

main().catch(e => {
  console.error('Cleanup failed:', e);
  process.exit(1);
});
