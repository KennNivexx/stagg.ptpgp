/**
 * Fix kode_jabatan — proper 7-segment hierarchy:
 *   [KOMISARIS][DIRUT][DIVISI][GM][MANAGER][SUPERVISOR][STAFF]
 *        1         2      3     4      5          6        7
 * 
 * Every child increments sequentially within its parent.
 * All divisions (HR/Fin/Ops/Proc/PA/MR/HSE) are under Dirut → segment 3 = 1..7
 */
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

// Segment meaning: [KOM][DIRUT][DIV][GM][MGR][SPV][STAFF]
const unitCodes = {
  'unit-hold': { code: '1.0.0.0.0.0.0', parent_code: null },
  'unit-hr':   { code: '1.1.1.0.0.0.0', parent_code: '1.0.0.0.0.0.0' },
  'unit-fin':  { code: '1.1.2.0.0.0.0', parent_code: '1.0.0.0.0.0.0' },
  'unit-ops':  { code: '1.1.3.0.0.0.0', parent_code: '1.0.0.0.0.0.0' },
  'unit-proc': { code: '1.1.4.0.0.0.0', parent_code: '1.0.0.0.0.0.0' },
  'unit-pa':   { code: '1.1.5.0.0.0.0', parent_code: '1.0.0.0.0.0.0' },
  'unit-mr':   { code: '1.1.6.0.0.0.0', parent_code: '1.0.0.0.0.0.0' },
  'unit-hse':  { code: '1.1.7.0.0.0.0', parent_code: '1.0.0.0.0.0.0' },
};

const jabCodes = {
  'jab-komisaris':     { code: '1.0.0.0.0.0.0', parent: null },
  'jab-dirut':         { code: '1.1.0.0.0.0.0', parent: '1.0.0.0.0.0.0' },
  // HR
  'jab-dir-hr':        { code: '1.1.1.0.0.0.0', parent: '1.1.0.0.0.0.0' },
  'jab-gm-hr':         { code: '1.1.1.1.0.0.0', parent: '1.1.1.0.0.0.0' },
  'jab-mgr-hr':        { code: '1.1.1.1.1.0.0', parent: '1.1.1.1.0.0.0' },
  'jab-spv-hr':        { code: '1.1.1.1.1.1.0', parent: '1.1.1.1.1.0.0' },
  'jab-staff-hr-1':    { code: '1.1.1.1.1.1.1', parent: '1.1.1.1.1.1.0' },
  'jab-staff-hr-2':    { code: '1.1.1.1.1.1.2', parent: '1.1.1.1.1.1.0' },
  'jab-staff-ga':      { code: '1.1.1.1.1.1.3', parent: '1.1.1.1.1.1.0' },
  // Finance
  'jab-dir-fin':       { code: '1.1.2.0.0.0.0', parent: '1.1.0.0.0.0.0' },
  'jab-gm-fin':        { code: '1.1.2.1.0.0.0', parent: '1.1.2.0.0.0.0' },
  'jab-mgr-fin':       { code: '1.1.2.1.1.0.0', parent: '1.1.2.1.0.0.0' },
  'jab-spv-fin':       { code: '1.1.2.1.1.1.0', parent: '1.1.2.1.1.0.0' },
  'jab-staff-fin-1':   { code: '1.1.2.1.1.1.1', parent: '1.1.2.1.1.1.0' },
  'jab-staff-fin-2':   { code: '1.1.2.1.1.1.2', parent: '1.1.2.1.1.1.0' },
  'jab-staff-tax':     { code: '1.1.2.1.1.1.3', parent: '1.1.2.1.1.1.0' },
  // Operations
  'jab-dir-ops':       { code: '1.1.3.0.0.0.0', parent: '1.1.0.0.0.0.0' },
  'jab-gm-ops':        { code: '1.1.3.1.0.0.0', parent: '1.1.3.0.0.0.0' },
  'jab-mgr-ppjk':      { code: '1.1.3.1.1.0.0', parent: '1.1.3.1.0.0.0' },
  'jab-spv-ppjk':      { code: '1.1.3.1.1.1.0', parent: '1.1.3.1.1.0.0' },
  'jab-staff-ppjk-1':  { code: '1.1.3.1.1.1.1', parent: '1.1.3.1.1.1.0' },
  'jab-staff-ppjk-2':  { code: '1.1.3.1.1.1.2', parent: '1.1.3.1.1.1.0' },
  'jab-mgr-gudang':    { code: '1.1.3.1.2.0.0', parent: '1.1.3.1.0.0.0' },
  'jab-spv-gudang':    { code: '1.1.3.1.2.1.0', parent: '1.1.3.1.2.0.0' },
  'jab-staff-gudang-1':{ code: '1.1.3.1.2.1.1', parent: '1.1.3.1.2.1.0' },
  'jab-staff-gudang-2':{ code: '1.1.3.1.2.1.2', parent: '1.1.3.1.2.1.0' },
  'jab-mgr-armada':    { code: '1.1.3.1.3.0.0', parent: '1.1.3.1.0.0.0' },
  'jab-spv-armada':    { code: '1.1.3.1.3.1.0', parent: '1.1.3.1.3.0.0' },
  'jab-supir-1':       { code: '1.1.3.1.3.1.1', parent: '1.1.3.1.3.1.0' },
  'jab-supir-2':       { code: '1.1.3.1.3.1.2', parent: '1.1.3.1.3.1.0' },
  'jab-supir-3':       { code: '1.1.3.1.3.1.3', parent: '1.1.3.1.3.1.0' },
  'jab-cs-ops':        { code: '1.1.3.1.3.1.4', parent: '1.1.3.1.3.1.0' },
  // SCM / Procurement
  'jab-dir-proc':      { code: '1.1.4.0.0.0.0', parent: '1.1.0.0.0.0.0' },
  'jab-gm-proc':       { code: '1.1.4.1.0.0.0', parent: '1.1.4.0.0.0.0' },
  'jab-mgr-proc':      { code: '1.1.4.1.1.0.0', parent: '1.1.4.1.0.0.0' },
  'jab-spv-proc':      { code: '1.1.4.1.1.1.0', parent: '1.1.4.1.1.0.0' },
  'jab-staff-proc-1':  { code: '1.1.4.1.1.1.1', parent: '1.1.4.1.1.1.0' },
  'jab-staff-proc-2':  { code: '1.1.4.1.1.1.2', parent: '1.1.4.1.1.1.0' },
  // PA & QC
  'jab-dir-pa':        { code: '1.1.5.0.0.0.0', parent: '1.1.0.0.0.0.0' },
  'jab-gm-pa':         { code: '1.1.5.1.0.0.0', parent: '1.1.5.0.0.0.0' },
  'jab-mgr-qc':        { code: '1.1.5.1.1.0.0', parent: '1.1.5.1.0.0.0' },
  'jab-staff-pa-1':    { code: '1.1.5.1.1.1.1', parent: '1.1.5.1.1.0.0' },
  'jab-staff-pa-2':    { code: '1.1.5.1.1.1.2', parent: '1.1.5.1.1.0.0' },
  // MR
  'jab-dir-mr':        { code: '1.1.6.0.0.0.0', parent: '1.1.0.0.0.0.0' },
  'jab-gm-mr':         { code: '1.1.6.1.0.0.0', parent: '1.1.6.0.0.0.0' },
  'jab-mgr-mr':        { code: '1.1.6.1.1.0.0', parent: '1.1.6.1.0.0.0' },
  'jab-staff-mr-1':    { code: '1.1.6.1.1.1.1', parent: '1.1.6.1.1.0.0' },
  // HSE
  'jab-dir-hse':       { code: '1.1.7.0.0.0.0', parent: '1.1.0.0.0.0.0' },
  'jab-gm-hse':        { code: '1.1.7.1.0.0.0', parent: '1.1.7.0.0.0.0' },
  'jab-mgr-hse':       { code: '1.1.7.1.1.0.0', parent: '1.1.7.1.0.0.0' },
  'jab-staff-hse-1':   { code: '1.1.7.1.1.1.1', parent: '1.1.7.1.1.0.0' },
  'jab-staff-hse-2':   { code: '1.1.7.1.1.1.2', parent: '1.1.7.1.1.0.0' },
};

async function main() {
  console.log('🔧 Fixing 7-segment hierarchical codes...\n');

  // 1. Update unit_organisasi codes
  console.log('Updating unit_organisasi...');
  for (const [id, u] of Object.entries(unitCodes)) {
    const { error } = await sb.from('unit_organisasi').update({ code: u.code, parent_code: u.parent_code }).eq('id', id);
    if (error) console.log(`  ❌ ${id}: ${error.message}`);
    else console.log(`  ✅ ${id} → ${u.code}`);
  }

  // 2. Update jabatan codes + parent_code
  console.log('\nUpdating jabatan...');
  for (const [id, j] of Object.entries(jabCodes)) {
    const { error } = await sb.from('jabatan').update({ code: j.code, parent_code: j.parent }).eq('id', id);
    if (error) console.log(`  ❌ ${id}: ${error.message}`);
    else console.log(`  ✅ ${id} → ${j.code}`);
  }

  // 3. Update karyawan.kode_jabatan based on their jabatan (via formasi)
  console.log('\nUpdating karyawan.kode_jabatan...');
  const { data: employees, error: empErr } = await sb.from('karyawan').select('id, formasi_id');
  if (empErr) {
    console.error(`  ❌ fetch karyawan: ${empErr.message}`);
  } else {
    let updated = 0;
    for (const emp of employees) {
      if (!emp.formasi_id) continue;
      // Find the jabatan for this formasi
      const { data: fj } = await sb.from('formasi_jabatan').select('jabatan_id').eq('id', emp.formasi_id).single();
      if (!fj?.jabatan_id) continue;
      const jc = jabCodes[fj.jabatan_id];
      if (!jc) continue;
      const { error } = await sb.from('karyawan').update({ kode_jabatan: jc.code }).eq('id', emp.id);
      if (!error) updated++;
    }
    console.log(`  ✅ ${updated}/${employees.length} karyawan updated`);
  }

  // 4. Update departemen codes to match unit_organisasi
  console.log('\nUpdating departemen...');
  const nameToCode = {
    'PT Pratama Galuh Perkasa': '1.0.0.0.0.0.0',
    'Divisi HR & GA': '1.1.1.0.0.0.0',
    'Divisi Finance & Accounting': '1.1.2.0.0.0.0',
    'Divisi Operasional': '1.1.3.0.0.0.0',
    'Divisi SCM / Procurement': '1.1.4.0.0.0.0',
    'Divisi Project Appraisal & QC': '1.1.5.0.0.0.0',
    'Divisi MR': '1.1.6.0.0.0.0',
    'Divisi HSE': '1.1.7.0.0.0.0',
  };
  for (const [name, code] of Object.entries(nameToCode)) {
    const { error, count } = await sb.from('departemen').update({ code }).eq('name', name);
    if (error) console.log(`  ❌ ${name}: ${error.message}`);
    else console.log(`  ✅ ${name} → ${code}`);
  }

  console.log('\n✅ All codes fixed.');
}

main().catch(e => {
  console.error('Fix failed:', e);
  process.exit(1);
});
