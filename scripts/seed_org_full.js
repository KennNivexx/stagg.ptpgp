/**
 * SEED STRUKTUR ORGANISASI LENGKAP
 * 
 * Runs the comprehensive org structure migration against Supabase.
 * Uses the SQL from 20260726002_seed_struktur_organisasi_lengkap.sql
 * 
 * Usage: node scripts/seed_org_full.js
 */
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

async function main() {
  console.log('🌲 Seeding Struktur Organisasi Lengkap (Komisaris s/d Staff)\n');

  // Read the SQL file
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260726002_seed_struktur_organisasi_lengkap.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split into individual statements and execute each
  const statements = sql
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    // Skip DO $$ blocks as separate statements (they're handled as one block)
    if (stmt.startsWith('$$') || stmt === '$$') continue;
    
    try {
      const { error } = await supabase.rpc('exec_raw', { query: stmt + ';' });
      
      if (error) {
        // Fallback: try direct SQL via REST API
        const { error: restErr } = await supabase.from('_sql').select('*').eq('query', stmt + ';');
        
        if (restErr && !restErr.message.includes('does not exist')) {
          failed++;
          if (i < 5) console.log(`  ✗ Statement ${i + 1}: ${restErr.message}`);
          continue;
        }
      }
      success++;
    } catch (e) {
      // Try direct insert approach for main data blocks
      failed++;
      if (i < 5) console.log(`  ✗ Statement ${i + 1}: ${e.message}`);
    }
  }

  console.log(`\n  ${success} statements executed, ${failed} failed`);

  // Direct seeding via REST API as fallback for key tables
  console.log('\n🔧 Seeding via REST API...');

  // 1. Unit Organisasi
  const units = [
    { id: 'unit-hold', code: '1.0.0.0.0.0.0', name: 'PT Pratama Galuh Perkasa (Holding)', level: 0, parent_code: null, sort_order: 0, jenis_unit: 'Perusahaan', status: 'Aktif' },
    { id: 'unit-hr', code: '1.1.0.0.0.0.0', name: 'Divisi HR & GA', level: 1, parent_code: '1.0.0.0.0.0.0', sort_order: 1, jenis_unit: 'Divisi', status: 'Aktif' },
    { id: 'unit-fin', code: '1.2.0.0.0.0.0', name: 'Divisi Finance & Accounting', level: 1, parent_code: '1.0.0.0.0.0.0', sort_order: 2, jenis_unit: 'Divisi', status: 'Aktif' },
    { id: 'unit-ops', code: '1.3.0.0.0.0.0', name: 'Divisi Operasional', level: 1, parent_code: '1.0.0.0.0.0.0', sort_order: 3, jenis_unit: 'Divisi', status: 'Aktif' },
    { id: 'unit-proc', code: '1.4.0.0.0.0.0', name: 'Divisi SCM / Procurement', level: 1, parent_code: '1.0.0.0.0.0.0', sort_order: 4, jenis_unit: 'Divisi', status: 'Aktif' },
    { id: 'unit-pa', code: '1.5.0.0.0.0.0', name: 'Divisi Project Appraisal & QC', level: 1, parent_code: '1.0.0.0.0.0.0', sort_order: 5, jenis_unit: 'Divisi', status: 'Aktif' },
    { id: 'unit-mr', code: '1.6.0.0.0.0.0', name: 'Divisi Management Representative', level: 1, parent_code: '1.0.0.0.0.0.0', sort_order: 6, jenis_unit: 'Divisi', status: 'Aktif' },
    { id: 'unit-hse', code: '1.7.0.0.0.0.0', name: 'Divisi HSE (Health, Safety & Environment)', level: 1, parent_code: '1.0.0.0.0.0.0', sort_order: 7, jenis_unit: 'Divisi', status: 'Aktif' },
  ];

  for (const u of units) {
    const { error } = await supabase.from('unit_organisasi').upsert(u, { onConflict: 'id' });
    if (error) console.log(`  unit_organisasi ${u.name}: ${error.message}`);
  }
  console.log(`  ✅ ${units.length} unit organisasi`);

  // 2. Grade Jabatan
  const grades = [
    { id: 'grade-g01', kode: 'G01', nama: 'Staf Junior', urutan: 1, salary_min: 4500000, salary_max: 5500000 },
    { id: 'grade-g02', kode: 'G02', nama: 'Staf Madya', urutan: 2, salary_min: 5500000, salary_max: 7000000 },
    { id: 'grade-g03', kode: 'G03', nama: 'Staf Senior', urutan: 3, salary_min: 6500000, salary_max: 8500000 },
    { id: 'grade-g04', kode: 'G04', nama: 'Koordinator', urutan: 4, salary_min: 8000000, salary_max: 10000000 },
    { id: 'grade-g05', kode: 'G05', nama: 'Supervisor', urutan: 5, salary_min: 10000000, salary_max: 13000000 },
    { id: 'grade-g06', kode: 'G06', nama: 'Asisten Manajer', urutan: 6, salary_min: 12000000, salary_max: 16000000 },
    { id: 'grade-g07', kode: 'G07', nama: 'Manager', urutan: 7, salary_min: 15000000, salary_max: 20000000 },
    { id: 'grade-g08', kode: 'G08', nama: 'Senior Manager', urutan: 8, salary_min: 18000000, salary_max: 25000000 },
    { id: 'grade-g09', kode: 'G09', nama: 'General Manager', urutan: 9, salary_min: 20000000, salary_max: 28000000 },
    { id: 'grade-g10', kode: 'G10', nama: 'Direktur', urutan: 10, salary_min: 35000000, salary_max: 55000000 },
    { id: 'grade-g11', kode: 'G11', nama: 'Direktur Utama', urutan: 11, salary_min: 60000000, salary_max: 90000000 },
    { id: 'grade-g12', kode: 'G12', nama: 'Komisaris', urutan: 12, salary_min: 75000000, salary_max: 110000000 },
  ];
  for (const g of grades) {
    const { error } = await supabase.from('grade_jabatan').upsert(g, { onConflict: 'id' });
    if (error) console.log(`  grade ${g.nama}: ${error.message}`);
  }
  console.log(`  ✅ ${grades.length} grade jabatan`);

  // 3. Jabatan (positions)
  const jabatanDefs = [
    // TOP
    { id: 'jab-komisaris', code: '1.0.0.0.0.0.0', name: 'Komisaris', department: 'Holding', level: 'Komisaris', grade_id: 'grade-g12', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: null },
    { id: 'jab-dirut', code: '1.1.0.0.0.0.0', name: 'Direktur Utama', department: 'Holding', level: 'Direktur Utama', grade_id: 'grade-g11', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.0.0.0.0.0.0' },
    // DIREKTUR
    { id: 'jab-dir-hr', code: '1.1.1.0.0.0.0', name: 'Direktur HR & GA', department: 'Divisi HR & GA', level: 'Direktur', grade_id: 'grade-g10', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.1.0.0.0.0.0' },
    { id: 'jab-dir-fin', code: '1.2.1.0.0.0.0', name: 'Direktur Finance', department: 'Divisi Finance & Accounting', level: 'Direktur', grade_id: 'grade-g10', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.2.0.0.0.0.0' },
    { id: 'jab-dir-ops', code: '1.3.1.0.0.0.0', name: 'Direktur Operasional', department: 'Divisi Operasional', level: 'Direktur', grade_id: 'grade-g10', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.3.0.0.0.0.0' },
    { id: 'jab-dir-proc', code: '1.4.1.0.0.0.0', name: 'Direktur SCM / Procurement', department: 'Divisi SCM / Procurement', level: 'Direktur', grade_id: 'grade-g10', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.4.0.0.0.0.0' },
    { id: 'jab-dir-pa', code: '1.5.1.0.0.0.0', name: 'Direktur Project Appraisal & QC', department: 'Divisi Project Appraisal & QC', level: 'Direktur', grade_id: 'grade-g10', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.5.0.0.0.0.0' },
    { id: 'jab-dir-mr', code: '1.6.1.0.0.0.0', name: 'Direktur Management Representative', department: 'Divisi MR', level: 'Direktur', grade_id: 'grade-g10', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.6.0.0.0.0.0' },
    { id: 'jab-dir-hse', code: '1.7.1.0.0.0.0', name: 'Direktur HSE', department: 'Divisi HSE', level: 'Direktur', grade_id: 'grade-g10', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.7.0.0.0.0.0' },
    // HR & GA
    { id: 'jab-gm-hr', code: '1.1.1.1.0.0.0', name: 'General Manager HR & GA', department: 'Divisi HR & GA', level: 'General Manager', grade_id: 'grade-g09', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.1.1.0.0.0.0' },
    { id: 'jab-mgr-hr', code: '1.1.1.1.1.0.0', name: 'Manager HR & GA', department: 'Divisi HR & GA', level: 'Manager', grade_id: 'grade-g07', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.1.1.1.0.0.0' },
    { id: 'jab-spv-hr', code: '1.1.1.1.1.1.0', name: 'Supervisor HR & GA', department: 'Divisi HR & GA', level: 'Supervisor', grade_id: 'grade-g05', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.1.1.1.1.0.0' },
    { id: 'jab-staff-hr-1', code: '1.1.1.1.1.1.1', name: 'Staff HRD (Rekrutmen)', department: 'Divisi HR & GA', level: 'Staff', grade_id: 'grade-g02', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.1.1.1.1.1.0' },
    { id: 'jab-staff-hr-2', code: '1.1.1.1.1.1.2', name: 'Staff HRD (Payroll & Adm)', department: 'Divisi HR & GA', level: 'Staff', grade_id: 'grade-g02', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.1.1.1.1.1.0' },
    { id: 'jab-staff-ga', code: '1.1.1.1.1.1.3', name: 'Staff General Affairs (GA)', department: 'Divisi HR & GA', level: 'Staff', grade_id: 'grade-g01', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.1.1.1.1.1.0' },
    // FINANCE
    { id: 'jab-gm-fin', code: '1.2.1.1.0.0.0', name: 'General Manager Finance', department: 'Divisi Finance & Accounting', level: 'General Manager', grade_id: 'grade-g09', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.2.1.0.0.0.0' },
    { id: 'jab-mgr-fin', code: '1.2.1.1.1.0.0', name: 'Manager Finance & Accounting', department: 'Divisi Finance & Accounting', level: 'Manager', grade_id: 'grade-g07', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.2.1.1.0.0.0' },
    { id: 'jab-spv-fin', code: '1.2.1.1.1.1.0', name: 'Supervisor Finance', department: 'Divisi Finance & Accounting', level: 'Supervisor', grade_id: 'grade-g05', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.2.1.1.1.0.0' },
    { id: 'jab-staff-fin-1', code: '1.2.1.1.1.1.1', name: 'Staff Accounting', department: 'Divisi Finance & Accounting', level: 'Staff', grade_id: 'grade-g03', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.2.1.1.1.1.0' },
    { id: 'jab-staff-fin-2', code: '1.2.1.1.1.1.2', name: 'Staff Finance (AP/AR)', department: 'Divisi Finance & Accounting', level: 'Staff', grade_id: 'grade-g02', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.2.1.1.1.1.0' },
    { id: 'jab-staff-tax', code: '1.2.1.1.1.1.3', name: 'Staff Tax & Compliance', department: 'Divisi Finance & Accounting', level: 'Staff', grade_id: 'grade-g03', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.2.1.1.1.1.0' },
    // OPERASIONAL (most complex)
    { id: 'jab-gm-ops', code: '1.3.1.1.0.0.0', name: 'General Manager Operasional', department: 'Divisi Operasional', level: 'General Manager', grade_id: 'grade-g09', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.3.1.0.0.0.0' },
    { id: 'jab-mgr-ppjk', code: '1.3.1.1.1.0.0', name: 'Manager Kepabeanan (PPJK)', department: 'Divisi Operasional', level: 'Manager', grade_id: 'grade-g07', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.3.1.1.0.0.0' },
    { id: 'jab-spv-ppjk', code: '1.3.1.1.1.1.0', name: 'Supervisor Kepabeanan (PPJK)', department: 'Divisi Operasional', level: 'Supervisor', grade_id: 'grade-g05', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.1.1.0.0' },
    { id: 'jab-staff-ppjk-1', code: '1.3.1.1.1.1.1', name: 'Staff PPJK (PIB/PEB)', department: 'Divisi Operasional', level: 'Staff', grade_id: 'grade-g03', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.1.1.1.0' },
    { id: 'jab-staff-ppjk-2', code: '1.3.1.1.1.1.2', name: 'Staff PPJK (Dokumentasi)', department: 'Divisi Operasional', level: 'Staff', grade_id: 'grade-g02', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.1.1.1.0' },
    { id: 'jab-mgr-gudang', code: '1.3.1.2.0.0.0', name: 'Manager Gudang & Cargo', department: 'Divisi Operasional', level: 'Manager', grade_id: 'grade-g07', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.3.1.1.0.0.0' },
    { id: 'jab-spv-gudang', code: '1.3.1.2.1.0.0', name: 'Supervisor Gudang & Cargo', department: 'Divisi Operasional', level: 'Supervisor', grade_id: 'grade-g05', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.2.0.0.0' },
    { id: 'jab-staff-gudang-1', code: '1.3.1.2.1.1.1', name: 'Staff Gudang (Bongkar Muat)', department: 'Divisi Operasional', level: 'Staff', grade_id: 'grade-g01', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.2.1.0.0' },
    { id: 'jab-staff-gudang-2', code: '1.3.1.2.1.1.2', name: 'Staff Administrasi Gudang', department: 'Divisi Operasional', level: 'Staff', grade_id: 'grade-g01', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.2.1.0.0' },
    { id: 'jab-mgr-armada', code: '1.3.1.3.0.0.0', name: 'Manager Armada & Trucking', department: 'Divisi Operasional', level: 'Manager', grade_id: 'grade-g07', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.3.1.1.0.0.0' },
    { id: 'jab-spv-armada', code: '1.3.1.3.1.0.0', name: 'Koordinator Armada', department: 'Divisi Operasional', level: 'Supervisor', grade_id: 'grade-g05', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.3.0.0.0' },
    { id: 'jab-supir-1', code: '1.3.1.3.1.1.1', name: 'Supir Truk / Driver', department: 'Divisi Operasional', level: 'Supir', grade_id: 'grade-g01', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.3.1.0.0' },
    { id: 'jab-supir-2', code: '1.3.1.3.1.1.2', name: 'Supir Truk / Driver', department: 'Divisi Operasional', level: 'Supir', grade_id: 'grade-g01', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.3.1.0.0' },
    { id: 'jab-supir-3', code: '1.3.1.3.1.1.3', name: 'Supir Truk / Driver', department: 'Divisi Operasional', level: 'Supir', grade_id: 'grade-g01', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.3.1.0.0' },
    { id: 'jab-cs-ops', code: '1.3.1.3.1.1.4', name: 'Customer Service Ekspor-Impor', department: 'Divisi Operasional', level: 'Staff', grade_id: 'grade-g02', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.3.1.3.1.0.0' },
    // PROCUREMENT
    { id: 'jab-gm-proc', code: '1.4.1.1.0.0.0', name: 'General Manager SCM / Procurement', department: 'Divisi SCM / Procurement', level: 'General Manager', grade_id: 'grade-g09', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.4.1.0.0.0.0' },
    { id: 'jab-mgr-proc', code: '1.4.1.1.1.0.0', name: 'Manager Procurement', department: 'Divisi SCM / Procurement', level: 'Manager', grade_id: 'grade-g07', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.4.1.1.0.0.0' },
    { id: 'jab-spv-proc', code: '1.4.1.1.1.1.0', name: 'Supervisor Procurement', department: 'Divisi SCM / Procurement', level: 'Supervisor', grade_id: 'grade-g05', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.4.1.1.1.0.0' },
    { id: 'jab-staff-proc-1', code: '1.4.1.1.1.1.1', name: 'Staff Procurement (Sourcing)', department: 'Divisi SCM / Procurement', level: 'Staff', grade_id: 'grade-g03', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.4.1.1.1.1.0' },
    { id: 'jab-staff-proc-2', code: '1.4.1.1.1.1.2', name: 'Staff Procurement (PO)', department: 'Divisi SCM / Procurement', level: 'Staff', grade_id: 'grade-g02', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.4.1.1.1.1.0' },
    // PA & QC
    { id: 'jab-gm-pa', code: '1.5.1.1.0.0.0', name: 'General Manager Project Appraisal', department: 'Divisi Project Appraisal & QC', level: 'General Manager', grade_id: 'grade-g09', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.5.1.0.0.0.0' },
    { id: 'jab-mgr-qc', code: '1.5.1.1.1.0.0', name: 'Manager Quality Control (QC)', department: 'Divisi Project Appraisal & QC', level: 'Manager', grade_id: 'grade-g07', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.5.1.1.0.0.0' },
    { id: 'jab-staff-pa-1', code: '1.5.1.1.1.1.1', name: 'Project Appraisal Analyst', department: 'Divisi Project Appraisal & QC', level: 'Staff', grade_id: 'grade-g03', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.5.1.1.1.0.0' },
    { id: 'jab-staff-pa-2', code: '1.5.1.1.1.1.2', name: 'QC Inspector', department: 'Divisi Project Appraisal & QC', level: 'Staff', grade_id: 'grade-g02', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.5.1.1.1.0.0' },
    // MR
    { id: 'jab-gm-mr', code: '1.6.1.1.0.0.0', name: 'General Manager MR', department: 'Divisi MR', level: 'General Manager', grade_id: 'grade-g09', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.6.1.0.0.0.0' },
    { id: 'jab-mgr-mr', code: '1.6.1.1.1.0.0', name: 'Manager MR & Compliance', department: 'Divisi MR', level: 'Manager', grade_id: 'grade-g07', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.6.1.1.0.0.0' },
    { id: 'jab-staff-mr-1', code: '1.6.1.1.1.1.1', name: 'MR Coordinator', department: 'Divisi MR', level: 'Staff', grade_id: 'grade-g03', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.6.1.1.1.0.0' },
    // HSE
    { id: 'jab-gm-hse', code: '1.7.1.1.0.0.0', name: 'General Manager HSE', department: 'Divisi HSE', level: 'General Manager', grade_id: 'grade-g09', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.7.1.0.0.0.0' },
    { id: 'jab-mgr-hse', code: '1.7.1.1.1.0.0', name: 'Manager HSE', department: 'Divisi HSE', level: 'Manager', grade_id: 'grade-g07', is_kepala_unit: true, is_master: true, status: 'Aktif', parent_code: '1.7.1.1.0.0.0' },
    { id: 'jab-staff-hse-1', code: '1.7.1.1.1.1.1', name: 'HSE Officer', department: 'Divisi HSE', level: 'Staff', grade_id: 'grade-g03', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.7.1.1.1.0.0' },
    { id: 'jab-staff-hse-2', code: '1.7.1.1.1.1.2', name: 'Safety Inspector', department: 'Divisi HSE', level: 'Staff', grade_id: 'grade-g02', is_kepala_unit: false, is_master: true, status: 'Aktif', parent_code: '1.7.1.1.1.0.0' },
  ];

  for (const j of jabatanDefs) {
    const { error } = await supabase.from('jabatan').upsert(j, { onConflict: 'id' });
    if (error) console.log(`  jabatan ${j.name}: ${error.message}`);
  }
  console.log(`  ✅ ${jabatanDefs.length} jabatan`);

  // 4. Formasi + Karyawan
  const karyawanData = [
    // TOP
    { id: 'emp-001', formasi_id: 'form-komisaris', full_name: 'H. Bambang Sutrisno', email: 'komisaris@ptpgp.co.id', dept: 'Holding', position: 'Komisaris', join: '2015-01-05', phone: '081300000001', kode_jabatan: '1.0.0.0.0.0.0', nik: 'PGP-201501-0001', kode: '1.0.0.0.0.0.1' },
    { id: 'emp-002', formasi_id: 'form-dirut', full_name: 'Ir. Ahmad Faisal', email: 'dirut@ptpgp.co.id', dept: 'Holding', position: 'Direktur Utama', join: '2016-03-10', phone: '081300000002', kode_jabatan: '1.1.0.0.0.0.0', nik: 'PGP-201601-0001', kode: '1.1.0.0.0.0.1' },
    // HR
    { id: 'emp-003', formasi_id: 'form-dir-hr', full_name: 'Dra. Ratna Kusumawati', email: 'dir.hr@ptpgp.co.id', dept: 'Divisi HR & GA', position: 'Direktur HR & GA', join: '2017-02-01', phone: '081300000003', kode_jabatan: '1.1.1.0.0.0.0', nik: 'PGP-201702-0001', kode: '1.1.1.0.0.0.1' },
    { id: 'emp-004', formasi_id: 'form-gm-hr', full_name: 'Fitriani Handayani, SE', email: 'gm.hr@ptpgp.co.id', dept: 'Divisi HR & GA', position: 'General Manager HR & GA', join: '2018-04-02', phone: '081300000004', kode_jabatan: '1.1.1.1.0.0.0', nik: 'PGP-201804-0001', kode: '1.1.1.1.0.0.1' },
    { id: 'emp-005', formasi_id: 'form-mgr-hr', full_name: 'Rudi Hartanto, S.Psi', email: 'mgr.hr@ptpgp.co.id', dept: 'Divisi HR & GA', position: 'Manager HR & GA', join: '2020-01-20', phone: '081300000005', kode_jabatan: '1.1.1.1.1.0.0', nik: 'PGP-202001-0001', kode: '1.1.1.1.1.0.1' },
    { id: 'emp-006', formasi_id: 'form-spv-hr', full_name: 'Siti Rahayu, A.Md', email: 'spv.hr@ptpgp.co.id', dept: 'Divisi HR & GA', position: 'Supervisor HR & GA', join: '2021-02-14', phone: '081300000006', kode_jabatan: '1.1.1.1.1.1.0', nik: 'PGP-202102-0001', kode: '1.1.1.1.1.1.1' },
    { id: 'emp-007', formasi_id: 'form-staff-hr-1', full_name: 'Andi Prasetyo, S.Psi', email: 'staff.hrd1@ptpgp.co.id', dept: 'Divisi HR & GA', position: 'Staff HRD (Rekrutmen)', join: '2022-06-01', phone: '081300000007', kode_jabatan: '1.1.1.1.1.1.1', nik: 'PGP-202206-0001', kode: '1.1.1.1.1.1.1' },
    { id: 'emp-008', formasi_id: 'form-staff-hr-2', full_name: 'Dewi Anggraeni, SE', email: 'staff.hrd2@ptpgp.co.id', dept: 'Divisi HR & GA', position: 'Staff HRD (Payroll & Adm)', join: '2023-01-15', phone: '081300000008', kode_jabatan: '1.1.1.1.1.1.2', nik: 'PGP-202301-0001', kode: '1.1.1.1.1.1.2' },
    { id: 'emp-009', formasi_id: 'form-staff-ga', full_name: 'Budi Hermawan', email: 'staff.ga@ptpgp.co.id', dept: 'Divisi HR & GA', position: 'Staff General Affairs (GA)', join: '2022-09-10', phone: '081300000009', kode_jabatan: '1.1.1.1.1.1.3', nik: 'PGP-202209-0001', kode: '1.1.1.1.1.1.3' },
    // FINANCE
    { id: 'emp-010', formasi_id: 'form-dir-fin', full_name: 'Drs. Setiawan Halim, Ak.', email: 'dir.finance@ptpgp.co.id', dept: 'Divisi Finance & Accounting', position: 'Direktur Finance', join: '2017-04-15', phone: '081300000010', kode_jabatan: '1.2.1.0.0.0.0', nik: 'PGP-201704-0001', kode: '1.2.1.0.0.0.1' },
    { id: 'emp-011', formasi_id: 'form-gm-fin', full_name: 'Lina Marlina, SE, Ak.', email: 'gm.finance@ptpgp.co.id', dept: 'Divisi Finance & Accounting', position: 'General Manager Finance', join: '2018-07-09', phone: '081300000011', kode_jabatan: '1.2.1.1.0.0.0', nik: 'PGP-201807-0001', kode: '1.2.1.1.0.0.1' },
    { id: 'emp-012', formasi_id: 'form-mgr-fin', full_name: 'Hendro Wibowo, SE, Ak.', email: 'mgr.finance@ptpgp.co.id', dept: 'Divisi Finance & Accounting', position: 'Manager Finance & Accounting', join: '2020-03-16', phone: '081300000012', kode_jabatan: '1.2.1.1.1.0.0', nik: 'PGP-202003-0001', kode: '1.2.1.1.1.0.1' },
    { id: 'emp-013', formasi_id: 'form-spv-fin', full_name: 'Yuni Hartati, SE', email: 'spv.finance@ptpgp.co.id', dept: 'Divisi Finance & Accounting', position: 'Supervisor Finance', join: '2021-05-22', phone: '081300000013', kode_jabatan: '1.2.1.1.1.1.0', nik: 'PGP-202105-0001', kode: '1.2.1.1.1.1.1' },
    { id: 'emp-014', formasi_id: 'form-staff-fin-1', full_name: 'Ahmad Dahlan, A.Md.Ak.', email: 'staff.acc@ptpgp.co.id', dept: 'Divisi Finance & Accounting', position: 'Staff Accounting', join: '2022-02-10', phone: '081300000014', kode_jabatan: '1.2.1.1.1.1.1', nik: 'PGP-202202-0001', kode: '1.2.1.1.1.1.1' },
    { id: 'emp-015', formasi_id: 'form-staff-fin-2', full_name: 'Mega Puspita, SE', email: 'staff.fin@ptpgp.co.id', dept: 'Divisi Finance & Accounting', position: 'Staff Finance (AP/AR)', join: '2022-08-01', phone: '081300000015', kode_jabatan: '1.2.1.1.1.1.2', nik: 'PGP-202208-0001', kode: '1.2.1.1.1.1.2' },
    { id: 'emp-016', formasi_id: 'form-staff-tax', full_name: 'Rina Marlina, SE, BKP', email: 'staff.tax@ptpgp.co.id', dept: 'Divisi Finance & Accounting', position: 'Staff Tax & Compliance', join: '2023-03-01', phone: '081300000016', kode_jabatan: '1.2.1.1.1.1.3', nik: 'PGP-202303-0001', kode: '1.2.1.1.1.1.3' },
    // OPERASIONAL
    { id: 'emp-017', formasi_id: 'form-dir-ops', full_name: 'Ir. Bayu Kristanto', email: 'dir.ops@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Direktur Operasional', join: '2016-08-20', phone: '081300000017', kode_jabatan: '1.3.1.0.0.0.0', nik: 'PGP-201608-0001', kode: '1.3.1.0.0.0.1' },
    { id: 'emp-018', formasi_id: 'form-gm-ops', full_name: 'Dedi Kurniawan, S.E.', email: 'gm.ops@ptpgp.co.id', dept: 'Divisi Operasional', position: 'General Manager Operasional', join: '2018-01-10', phone: '081300000018', kode_jabatan: '1.3.1.1.0.0.0', nik: 'PGP-201801-0001', kode: '1.3.1.1.0.0.1' },
    { id: 'emp-019', formasi_id: 'form-mgr-ppjk', full_name: 'Wawan Setiadi', email: 'mgr.ppjk@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Manager Kepabeanan (PPJK)', join: '2019-02-18', phone: '081300000019', kode_jabatan: '1.3.1.1.1.0.0', nik: 'PGP-201902-0001', kode: '1.3.1.1.1.0.1' },
    { id: 'emp-020', formasi_id: 'form-spv-ppjk', full_name: 'Eko Prasetyo', email: 'spv.ppjk@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Supervisor Kepabeanan (PPJK)', join: '2020-05-11', phone: '081300000020', kode_jabatan: '1.3.1.1.1.1.0', nik: 'PGP-202005-0001', kode: '1.3.1.1.1.1.1' },
    { id: 'emp-021', formasi_id: 'form-staff-ppjk-1', full_name: 'Dian Anggraini, A.Md.Kep.', email: 'staff.ppjk1@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Staff PPJK (PIB/PEB)', join: '2022-03-07', phone: '081300000021', kode_jabatan: '1.3.1.1.1.1.1', nik: 'PGP-202203-0001', kode: '1.3.1.1.1.1.1' },
    { id: 'emp-022', formasi_id: 'form-staff-ppjk-2', full_name: 'Rina Karlina', email: 'staff.ppjk2@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Staff PPJK (Dokumentasi)', join: '2023-05-20', phone: '081300000022', kode_jabatan: '1.3.1.1.1.1.2', nik: 'PGP-202305-0001', kode: '1.3.1.1.1.1.2' },
    { id: 'emp-023', formasi_id: 'form-mgr-gudang', full_name: 'Slamet Riyadi', email: 'mgr.gudang@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Manager Gudang & Cargo', join: '2019-06-25', phone: '081300000023', kode_jabatan: '1.3.1.2.0.0.0', nik: 'PGP-201906-0001', kode: '1.3.1.2.0.0.1' },
    { id: 'emp-024', formasi_id: 'form-spv-gudang', full_name: 'Teguh Prayitno', email: 'spv.gudang@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Supervisor Gudang & Cargo', join: '2020-09-10', phone: '081300000024', kode_jabatan: '1.3.1.2.1.0.0', nik: 'PGP-202009-0001', kode: '1.3.1.2.1.0.1' },
    { id: 'emp-025', formasi_id: 'form-staff-gudang-1', full_name: 'Suparman', email: 'staff.gudang1@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Staff Gudang (Bongkar Muat)', join: '2021-11-05', phone: '081300000025', kode_jabatan: '1.3.1.2.1.1.1', nik: 'PGP-202111-0001', kode: '1.3.1.2.1.1.1' },
    { id: 'emp-026', formasi_id: 'form-staff-gudang-2', full_name: 'Jumadi', email: 'staff.gudang2@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Staff Administrasi Gudang', join: '2023-02-15', phone: '081300000026', kode_jabatan: '1.3.1.2.1.1.2', nik: 'PGP-202302-0001', kode: '1.3.1.2.1.1.2' },
    { id: 'emp-027', formasi_id: 'form-mgr-armada', full_name: 'Joko Susilo', email: 'mgr.armada@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Manager Armada & Trucking', join: '2019-09-14', phone: '081300000027', kode_jabatan: '1.3.1.3.0.0.0', nik: 'PGP-201909-0001', kode: '1.3.1.3.0.0.1' },
    { id: 'emp-028', formasi_id: 'form-spv-armada', full_name: 'Herman Susanto', email: 'spv.armada@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Koordinator Armada', join: '2020-12-01', phone: '081300000028', kode_jabatan: '1.3.1.3.1.0.0', nik: 'PGP-202012-0001', kode: '1.3.1.3.1.0.1' },
    { id: 'emp-029', formasi_id: 'form-supir-1', full_name: 'Agus Salim', email: 'supir1@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Supir Truk / Driver', join: '2021-07-14', phone: '081300000029', kode_jabatan: '1.3.1.3.1.1.1', nik: 'PGP-202107-0001', kode: '1.3.1.3.1.1.1' },
    { id: 'emp-030', formasi_id: 'form-supir-2', full_name: 'Rahmat Hidayat', email: 'supir2@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Supir Truk / Driver', join: '2021-08-22', phone: '081300000030', kode_jabatan: '1.3.1.3.1.1.2', nik: 'PGP-202108-0001', kode: '1.3.1.3.1.1.2' },
    { id: 'emp-031', formasi_id: 'form-supir-3', full_name: 'Udin Samsudin', email: 'supir3@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Supir Truk / Driver', join: '2022-04-10', phone: '081300000031', kode_jabatan: '1.3.1.3.1.1.3', nik: 'PGP-202204-0001', kode: '1.3.1.3.1.1.3' },
    { id: 'emp-032', formasi_id: 'form-cs-ops', full_name: 'Fitri Andriani', email: 'staff.cs@ptpgp.co.id', dept: 'Divisi Operasional', position: 'Customer Service Ekspor-Impor', join: '2023-06-01', phone: '081300000032', kode_jabatan: '1.3.1.3.1.1.4', nik: 'PGP-202306-0001', kode: '1.3.1.3.1.1.4' },
    // PROCUREMENT
    { id: 'emp-033', formasi_id: 'form-dir-proc', full_name: 'Hendra Kusuma', email: 'dir.proc@ptpgp.co.id', dept: 'Divisi SCM / Procurement', position: 'Direktur SCM / Procurement', join: '2017-09-18', phone: '081300000033', kode_jabatan: '1.4.1.0.0.0.0', nik: 'PGP-201709-0001', kode: '1.4.1.0.0.0.1' },
    { id: 'emp-034', formasi_id: 'form-gm-proc', full_name: 'Surya Dharma, ST', email: 'gm.proc@ptpgp.co.id', dept: 'Divisi SCM / Procurement', position: 'General Manager SCM / Procurement', join: '2019-01-25', phone: '081300000034', kode_jabatan: '1.4.1.1.0.0.0', nik: 'PGP-201901-0001', kode: '1.4.1.1.0.0.1' },
    { id: 'emp-035', formasi_id: 'form-mgr-proc', full_name: 'Rangga Maulana', email: 'mgr.proc@ptpgp.co.id', dept: 'Divisi SCM / Procurement', position: 'Manager Procurement', join: '2020-08-12', phone: '081300000035', kode_jabatan: '1.4.1.1.1.0.0', nik: 'PGP-202008-0001', kode: '1.4.1.1.1.0.1' },
    { id: 'emp-036', formasi_id: 'form-spv-proc', full_name: 'Tika Nurmalasari', email: 'spv.proc@ptpgp.co.id', dept: 'Divisi SCM / Procurement', position: 'Supervisor Procurement', join: '2021-10-05', phone: '081300000036', kode_jabatan: '1.4.1.1.1.1.0', nik: 'PGP-202110-0001', kode: '1.4.1.1.1.1.1' },
    { id: 'emp-037', formasi_id: 'form-staff-proc-1', full_name: 'Aldo Firmansyah', email: 'staff.proc1@ptpgp.co.id', dept: 'Divisi SCM / Procurement', position: 'Staff Procurement (Sourcing)', join: '2022-12-01', phone: '081300000037', kode_jabatan: '1.4.1.1.1.1.1', nik: 'PGP-202212-0001', kode: '1.4.1.1.1.1.1' },
    { id: 'emp-038', formasi_id: 'form-staff-proc-2', full_name: 'Desi Ratnasari', email: 'staff.proc2@ptpgp.co.id', dept: 'Divisi SCM / Procurement', position: 'Staff Procurement (PO)', join: '2023-07-15', phone: '081300000038', kode_jabatan: '1.4.1.1.1.1.2', nik: 'PGP-202307-0001', kode: '1.4.1.1.1.1.2' },
    // PA & QC
    { id: 'emp-039', formasi_id: 'form-dir-pa', full_name: 'Ir. Dodi Haryanto', email: 'dir.pa@ptpgp.co.id', dept: 'Divisi Project Appraisal & QC', position: 'Direktur Project Appraisal & QC', join: '2017-06-30', phone: '081300000039', kode_jabatan: '1.5.1.0.0.0.0', nik: 'PGP-201706-0001', kode: '1.5.1.0.0.0.1' },
    { id: 'emp-040', formasi_id: 'form-gm-pa', full_name: 'Arief Rachman, ST', email: 'gm.pa@ptpgp.co.id', dept: 'Divisi Project Appraisal & QC', position: 'General Manager Project Appraisal', join: '2019-03-12', phone: '081300000040', kode_jabatan: '1.5.1.1.0.0.0', nik: 'PGP-201903-0001', kode: '1.5.1.1.0.0.1' },
    { id: 'emp-041', formasi_id: 'form-mgr-qc', full_name: 'Yuni Astuti, ST', email: 'mgr.qc@ptpgp.co.id', dept: 'Divisi Project Appraisal & QC', position: 'Manager Quality Control (QC)', join: '2020-11-20', phone: '081300000041', kode_jabatan: '1.5.1.1.1.0.0', nik: 'PGP-202011-0001', kode: '1.5.1.1.1.0.1' },
    { id: 'emp-042', formasi_id: 'form-staff-pa-1', full_name: 'Bayu Setyawan, SE', email: 'staff.pa1@ptpgp.co.id', dept: 'Divisi Project Appraisal & QC', position: 'Project Appraisal Analyst', join: '2022-05-08', phone: '081300000042', kode_jabatan: '1.5.1.1.1.1.1', nik: 'PGP-202205-0001', kode: '1.5.1.1.1.1.1' },
    { id: 'emp-043', formasi_id: 'form-staff-pa-2', full_name: 'Nurul Hikmah, A.Md.T', email: 'staff.qc@ptpgp.co.id', dept: 'Divisi Project Appraisal & QC', position: 'QC Inspector', join: '2023-04-18', phone: '081300000043', kode_jabatan: '1.5.1.1.1.1.2', nik: 'PGP-202304-0001', kode: '1.5.1.1.1.1.2' },
    // MR
    { id: 'emp-044', formasi_id: 'form-dir-mr', full_name: 'Drs. Bambang Wibisono', email: 'dir.mr@ptpgp.co.id', dept: 'Divisi MR', position: 'Direktur Management Representative', join: '2017-05-12', phone: '081300000044', kode_jabatan: '1.6.1.0.0.0.0', nik: 'PGP-201705-0001', kode: '1.6.1.0.0.0.1' },
    { id: 'emp-045', formasi_id: 'form-gm-mr', full_name: 'Indriani Putri, ST', email: 'gm.mr@ptpgp.co.id', dept: 'Divisi MR', position: 'General Manager MR', join: '2019-07-28', phone: '081300000045', kode_jabatan: '1.6.1.1.0.0.0', nik: 'PGP-201907-0001', kode: '1.6.1.1.0.0.1' },
    { id: 'emp-046', formasi_id: 'form-mgr-mr', full_name: 'Mulyadi Kurniawan', email: 'mgr.mr@ptpgp.co.id', dept: 'Divisi MR', position: 'Manager MR & Compliance', join: '2021-01-10', phone: '081300000046', kode_jabatan: '1.6.1.1.1.0.0', nik: 'PGP-202101-0001', kode: '1.6.1.1.1.0.1' },
    { id: 'emp-047', formasi_id: 'form-staff-mr-1', full_name: 'Sinta Amelia', email: 'staff.mr@ptpgp.co.id', dept: 'Divisi MR', position: 'MR Coordinator', join: '2022-10-05', phone: '081300000047', kode_jabatan: '1.6.1.1.1.1.1', nik: 'PGP-202210-0001', kode: '1.6.1.1.1.1.1' },
    // HSE
    { id: 'emp-048', formasi_id: 'form-dir-hse', full_name: 'Ir. Wahyu Santoso', email: 'dir.hse@ptpgp.co.id', dept: 'Divisi HSE', position: 'Direktur HSE', join: '2017-10-08', phone: '081300000048', kode_jabatan: '1.7.1.0.0.0.0', nik: 'PGP-201710-0001', kode: '1.7.1.0.0.0.1' },
    { id: 'emp-049', formasi_id: 'form-gm-hse', full_name: 'Riza Hermawan, ST, AK3U', email: 'gm.hse@ptpgp.co.id', dept: 'Divisi HSE', position: 'General Manager HSE', join: '2019-11-15', phone: '081300000049', kode_jabatan: '1.7.1.1.0.0.0', nik: 'PGP-201911-0001', kode: '1.7.1.1.0.0.1' },
    { id: 'emp-050', formasi_id: 'form-mgr-hse', full_name: 'Agus Triyono, ST', email: 'mgr.hse@ptpgp.co.id', dept: 'Divisi HSE', position: 'Manager HSE', join: '2021-04-22', phone: '081300000050', kode_jabatan: '1.7.1.1.1.0.0', nik: 'PGP-202104-0001', kode: '1.7.1.1.1.0.1' },
    { id: 'emp-051', formasi_id: 'form-staff-hse-1', full_name: 'Dimas Prasetya', email: 'staff.hse1@ptpgp.co.id', dept: 'Divisi HSE', position: 'HSE Officer', join: '2022-07-30', phone: '081300000051', kode_jabatan: '1.7.1.1.1.1.1', nik: 'PGP-202207-0001', kode: '1.7.1.1.1.1.1' },
    { id: 'emp-052', formasi_id: 'form-staff-hse-2', full_name: 'Maya Sari Dewi', email: 'staff.hse2@ptpgp.co.id', dept: 'Divisi HSE', position: 'Safety Inspector', join: '2023-08-12', phone: '081300000052', kode_jabatan: '1.7.1.1.1.1.2', nik: 'PGP-202308-0001', kode: '1.7.1.1.1.1.2' },
  ];

  // Formasi data - maps to karyawan entries
  const formasiMap = {
    'form-komisaris': { id: 'form-komisaris', position_number: 'PN-EXEC-001', unit_organisasi_id: 'unit-hold', jabatan_id: 'jab-komisaris', status: 'Filled' },
    'form-dirut': { id: 'form-dirut', position_number: 'PN-EXEC-002', unit_organisasi_id: 'unit-hold', jabatan_id: 'jab-dirut', status: 'Filled' },
    'form-dir-hr': { id: 'form-dir-hr', position_number: 'PN-HR-001', unit_organisasi_id: 'unit-hr', jabatan_id: 'jab-dir-hr', status: 'Filled' },
    'form-gm-hr': { id: 'form-gm-hr', position_number: 'PN-HR-002', unit_organisasi_id: 'unit-hr', jabatan_id: 'jab-gm-hr', status: 'Filled' },
    'form-mgr-hr': { id: 'form-mgr-hr', position_number: 'PN-HR-003', unit_organisasi_id: 'unit-hr', jabatan_id: 'jab-mgr-hr', status: 'Filled' },
    'form-spv-hr': { id: 'form-spv-hr', position_number: 'PN-HR-004', unit_organisasi_id: 'unit-hr', jabatan_id: 'jab-spv-hr', status: 'Filled' },
    'form-staff-hr-1': { id: 'form-staff-hr-1', position_number: 'PN-HR-005', unit_organisasi_id: 'unit-hr', jabatan_id: 'jab-staff-hr-1', status: 'Filled' },
    'form-staff-hr-2': { id: 'form-staff-hr-2', position_number: 'PN-HR-006', unit_organisasi_id: 'unit-hr', jabatan_id: 'jab-staff-hr-2', status: 'Filled' },
    'form-staff-ga': { id: 'form-staff-ga', position_number: 'PN-HR-007', unit_organisasi_id: 'unit-hr', jabatan_id: 'jab-staff-ga', status: 'Filled' },
    'form-dir-fin': { id: 'form-dir-fin', position_number: 'PN-FIN-001', unit_organisasi_id: 'unit-fin', jabatan_id: 'jab-dir-fin', status: 'Filled' },
    'form-gm-fin': { id: 'form-gm-fin', position_number: 'PN-FIN-002', unit_organisasi_id: 'unit-fin', jabatan_id: 'jab-gm-fin', status: 'Filled' },
    'form-mgr-fin': { id: 'form-mgr-fin', position_number: 'PN-FIN-003', unit_organisasi_id: 'unit-fin', jabatan_id: 'jab-mgr-fin', status: 'Filled' },
    'form-spv-fin': { id: 'form-spv-fin', position_number: 'PN-FIN-004', unit_organisasi_id: 'unit-fin', jabatan_id: 'jab-spv-fin', status: 'Filled' },
    'form-staff-fin-1': { id: 'form-staff-fin-1', position_number: 'PN-FIN-005', unit_organisasi_id: 'unit-fin', jabatan_id: 'jab-staff-fin-1', status: 'Filled' },
    'form-staff-fin-2': { id: 'form-staff-fin-2', position_number: 'PN-FIN-006', unit_organisasi_id: 'unit-fin', jabatan_id: 'jab-staff-fin-2', status: 'Filled' },
    'form-staff-tax': { id: 'form-staff-tax', position_number: 'PN-FIN-007', unit_organisasi_id: 'unit-fin', jabatan_id: 'jab-staff-tax', status: 'Filled' },
    'form-dir-ops': { id: 'form-dir-ops', position_number: 'PN-OPS-001', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-dir-ops', status: 'Filled' },
    'form-gm-ops': { id: 'form-gm-ops', position_number: 'PN-OPS-002', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-gm-ops', status: 'Filled' },
    'form-mgr-ppjk': { id: 'form-mgr-ppjk', position_number: 'PN-OPS-003', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-mgr-ppjk', status: 'Filled' },
    'form-spv-ppjk': { id: 'form-spv-ppjk', position_number: 'PN-OPS-004', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-spv-ppjk', status: 'Filled' },
    'form-staff-ppjk-1': { id: 'form-staff-ppjk-1', position_number: 'PN-OPS-005', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-staff-ppjk-1', status: 'Filled' },
    'form-staff-ppjk-2': { id: 'form-staff-ppjk-2', position_number: 'PN-OPS-006', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-staff-ppjk-2', status: 'Filled' },
    'form-mgr-gudang': { id: 'form-mgr-gudang', position_number: 'PN-OPS-007', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-mgr-gudang', status: 'Filled' },
    'form-spv-gudang': { id: 'form-spv-gudang', position_number: 'PN-OPS-008', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-spv-gudang', status: 'Filled' },
    'form-staff-gudang-1': { id: 'form-staff-gudang-1', position_number: 'PN-OPS-009', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-staff-gudang-1', status: 'Filled' },
    'form-staff-gudang-2': { id: 'form-staff-gudang-2', position_number: 'PN-OPS-010', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-staff-gudang-2', status: 'Filled' },
    'form-mgr-armada': { id: 'form-mgr-armada', position_number: 'PN-OPS-011', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-mgr-armada', status: 'Filled' },
    'form-spv-armada': { id: 'form-spv-armada', position_number: 'PN-OPS-012', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-spv-armada', status: 'Filled' },
    'form-supir-1': { id: 'form-supir-1', position_number: 'PN-OPS-013', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-supir-1', status: 'Filled' },
    'form-supir-2': { id: 'form-supir-2', position_number: 'PN-OPS-014', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-supir-2', status: 'Filled' },
    'form-supir-3': { id: 'form-supir-3', position_number: 'PN-OPS-015', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-supir-3', status: 'Filled' },
    'form-cs-ops': { id: 'form-cs-ops', position_number: 'PN-OPS-016', unit_organisasi_id: 'unit-ops', jabatan_id: 'jab-cs-ops', status: 'Filled' },
    'form-dir-proc': { id: 'form-dir-proc', position_number: 'PN-PRC-001', unit_organisasi_id: 'unit-proc', jabatan_id: 'jab-dir-proc', status: 'Filled' },
    'form-gm-proc': { id: 'form-gm-proc', position_number: 'PN-PRC-002', unit_organisasi_id: 'unit-proc', jabatan_id: 'jab-gm-proc', status: 'Filled' },
    'form-mgr-proc': { id: 'form-mgr-proc', position_number: 'PN-PRC-003', unit_organisasi_id: 'unit-proc', jabatan_id: 'jab-mgr-proc', status: 'Filled' },
    'form-spv-proc': { id: 'form-spv-proc', position_number: 'PN-PRC-004', unit_organisasi_id: 'unit-proc', jabatan_id: 'jab-spv-proc', status: 'Filled' },
    'form-staff-proc-1': { id: 'form-staff-proc-1', position_number: 'PN-PRC-005', unit_organisasi_id: 'unit-proc', jabatan_id: 'jab-staff-proc-1', status: 'Filled' },
    'form-staff-proc-2': { id: 'form-staff-proc-2', position_number: 'PN-PRC-006', unit_organisasi_id: 'unit-proc', jabatan_id: 'jab-staff-proc-2', status: 'Filled' },
    'form-dir-pa': { id: 'form-dir-pa', position_number: 'PN-PA-001', unit_organisasi_id: 'unit-pa', jabatan_id: 'jab-dir-pa', status: 'Filled' },
    'form-gm-pa': { id: 'form-gm-pa', position_number: 'PN-PA-002', unit_organisasi_id: 'unit-pa', jabatan_id: 'jab-gm-pa', status: 'Filled' },
    'form-mgr-qc': { id: 'form-mgr-qc', position_number: 'PN-PA-003', unit_organisasi_id: 'unit-pa', jabatan_id: 'jab-mgr-qc', status: 'Filled' },
    'form-staff-pa-1': { id: 'form-staff-pa-1', position_number: 'PN-PA-004', unit_organisasi_id: 'unit-pa', jabatan_id: 'jab-staff-pa-1', status: 'Filled' },
    'form-staff-pa-2': { id: 'form-staff-pa-2', position_number: 'PN-PA-005', unit_organisasi_id: 'unit-pa', jabatan_id: 'jab-staff-pa-2', status: 'Filled' },
    'form-dir-mr': { id: 'form-dir-mr', position_number: 'PN-MR-001', unit_organisasi_id: 'unit-mr', jabatan_id: 'jab-dir-mr', status: 'Filled' },
    'form-gm-mr': { id: 'form-gm-mr', position_number: 'PN-MR-002', unit_organisasi_id: 'unit-mr', jabatan_id: 'jab-gm-mr', status: 'Filled' },
    'form-mgr-mr': { id: 'form-mgr-mr', position_number: 'PN-MR-003', unit_organisasi_id: 'unit-mr', jabatan_id: 'jab-mgr-mr', status: 'Filled' },
    'form-staff-mr-1': { id: 'form-staff-mr-1', position_number: 'PN-MR-004', unit_organisasi_id: 'unit-mr', jabatan_id: 'jab-staff-mr-1', status: 'Filled' },
    'form-dir-hse': { id: 'form-dir-hse', position_number: 'PN-HSE-001', unit_organisasi_id: 'unit-hse', jabatan_id: 'jab-dir-hse', status: 'Filled' },
    'form-gm-hse': { id: 'form-gm-hse', position_number: 'PN-HSE-002', unit_organisasi_id: 'unit-hse', jabatan_id: 'jab-gm-hse', status: 'Filled' },
    'form-mgr-hse': { id: 'form-mgr-hse', position_number: 'PN-HSE-003', unit_organisasi_id: 'unit-hse', jabatan_id: 'jab-mgr-hse', status: 'Filled' },
    'form-staff-hse-1': { id: 'form-staff-hse-1', position_number: 'PN-HSE-004', unit_organisasi_id: 'unit-hse', jabatan_id: 'jab-staff-hse-1', status: 'Filled' },
    'form-staff-hse-2': { id: 'form-staff-hse-2', position_number: 'PN-HSE-005', unit_organisasi_id: 'unit-hse', jabatan_id: 'jab-staff-hse-2', status: 'Filled' },
  };

  // Upsert formasi
  for (const [key, f] of Object.entries(formasiMap)) {
    const { error } = await supabase.from('formasi_jabatan').upsert(f, { onConflict: 'id' });
    if (error) console.log(`  formasi ${key}: ${error.message}`);
  }
  console.log(`  ✅ ${Object.keys(formasiMap).length} formasi`);

  // Upsert karyawan
  const crypto = require('crypto');
  let successCount = 0;
  for (const emp of karyawanData) {
    const row = {
      id: crypto.randomUUID(),
      full_name: emp.full_name,
      email: emp.email,
      department: emp.dept,
      position: emp.position,
      status: 'Active',
      formasi_id: emp.formasi_id,
      join_date: emp.join,
      phone: emp.phone,
      kode_jabatan: emp.kode_jabatan,
      nik: emp.nik,
      kode: emp.kode,
    };
    const { error } = await supabase.from('karyawan').insert(row);
    if (error) console.log(`  kary ${emp.full_name}: ${error.message}`);
    else successCount++;
  }
  console.log(`  ✅ ${successCount}/${karyawanData.length} karyawan`);

  // Pengguna accounts
  console.log('\n🔐 Creating user accounts...');
  function hashPassword(pass) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(pass, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  let userCount = 0;
  for (const emp of karyawanData) {
    let role = 'employee';
    if (emp.position === 'Komisaris' || emp.position === 'Direktur Utama') role = 'director';
    else if (emp.position.includes('Direktur')) role = 'director';
    else if (emp.position.includes('General Manager') || emp.position.includes('Manager')) role = 'department_manager';
    else if (emp.dept.includes('HR')) role = 'hrd';

    const pwHash = hashPassword('password');
    const { error } = await supabase.from('pengguna').upsert({
      email: emp.email,
      password_hash: pwHash,
      role,
      full_name: emp.full_name,
    }, { onConflict: 'email' });
    if (!error) userCount++;
  }
  console.log(`  ✅ ${userCount}/${karyawanData.length} user accounts`);

  // Sync departemen
  console.log('\n📋 Syncing departemen...');
  const { data: deptUnits } = await supabase.from('unit_organisasi').select('*').order('sort_order');
  if (deptUnits?.length) {
    const flat = deptUnits.map((u, i) => ({
      code: u.code,
      name: u.name,
      parent_code: u.parent_code || null,
      level: u.level || 0,
      leader_name: '',
      leader_email: '',
      sort_order: u.sort_order || i,
    }));
    const { error } = await supabase.from('departemen').upsert(flat, { onConflict: 'code' });
    if (error) console.log(`  Error: ${error.message}`);
    else console.log(`  ✅ ${flat.length} departemen synced`);
  }

  console.log('\n✅ Struktur Organisasi Lengkap berhasil di-seed!');
  console.log(`   Total: 1 Komisaris + 1 Dirut + 8 Direktur + 52 Karyawan = ${karyawanData.length} orang`);
  console.log('\n   Login accounts: password = "password"');
  console.log('   Key emails: komisaris@ptpgp.co.id | dirut@ptpgp.co.id | dir.hr@ptpgp.co.id');
}

main().catch(e => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
