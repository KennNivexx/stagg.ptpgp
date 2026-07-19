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

const employees = [
  // Procurement Division (empty -> 7)
  { full_name: 'Hasan Maulana', email: 'gm.procurement@ptpgp.co.id', department: 'Procurement Division', position: 'General Manager Procurement', kode: '1.4.1' },
  { full_name: 'Dewi Kartika', email: 'manager.procurement@ptpgp.co.id', department: 'Procurement Division', position: 'Manager Procurement', kode: '1.4.2' },
  { full_name: 'Bagus Santoso', email: 'spv.procurement@ptpgp.co.id', department: 'Procurement Division', position: 'Procurement Supervisor', kode: '1.4.3' },
  { full_name: 'Rina Wulandari', email: 'staff.procurement1@ptpgp.co.id', department: 'Procurement Division', position: 'Procurement Officer', kode: '1.4.4' },
  { full_name: 'Yusuf Hidayat', email: 'staff.procurement2@ptpgp.co.id', department: 'Procurement Division', position: 'Procurement Officer', kode: '1.4.5' },
  { full_name: 'Indah Permatasari', email: 'staff.vendor@ptpgp.co.id', department: 'Procurement Division', position: 'Vendor Management Staff', kode: '1.4.6' },
  { full_name: 'Arif Rahman', email: 'staff.sparepart@ptpgp.co.id', department: 'Procurement Division', position: 'Staff Pengadaan Armada & Sparepart', kode: '1.4.7' },

  // Project Appraisal (empty -> 6)
  { full_name: 'Wisnu Adiprasetyo', email: 'gm.appraisal@ptpgp.co.id', department: 'Project Appraisal', position: 'General Manager Project Appraisal', kode: '1.5.1' },
  { full_name: 'Melinda Sari', email: 'manager.appraisal@ptpgp.co.id', department: 'Project Appraisal', position: 'Manager Project Appraisal', kode: '1.5.2' },
  { full_name: 'Doni Kurniadi', email: 'spv.appraisal@ptpgp.co.id', department: 'Project Appraisal', position: 'Project Appraisal Supervisor', kode: '1.5.3' },
  { full_name: 'Sarah Amelia', email: 'analyst.appraisal1@ptpgp.co.id', department: 'Project Appraisal', position: 'Project Appraisal Analyst', kode: '1.5.4' },
  { full_name: 'Reza Firmansyah', email: 'analyst.appraisal2@ptpgp.co.id', department: 'Project Appraisal', position: 'Project Appraisal Analyst', kode: '1.5.5' },
  { full_name: 'Putri Anggita', email: 'staff.bizdev@ptpgp.co.id', department: 'Project Appraisal', position: 'Business Development Staff', kode: '1.5.6' },

  // Management Representative (empty -> 5)
  { full_name: 'Agung Prabowo', email: 'head.mr@ptpgp.co.id', department: 'Management Representative', position: 'Management Representative Head', kode: '1.6.1' },
  { full_name: 'Novita Rahmawati', email: 'doc.mr@ptpgp.co.id', department: 'Management Representative', position: 'ISO Documentation Staff', kode: '1.6.2' },
  { full_name: 'Teguh Iman Santoso', email: 'audit.mr@ptpgp.co.id', department: 'Management Representative', position: 'Internal Audit Staff', kode: '1.6.3' },
  { full_name: 'Citra Dewanti', email: 'qms.mr@ptpgp.co.id', department: 'Management Representative', position: 'QMS Officer', kode: '1.6.4' },
  { full_name: 'Fahmi Ardiansyah', email: 'doccontrol.mr@ptpgp.co.id', department: 'Management Representative', position: 'Document Control Staff', kode: '1.6.5' },

  // Health, Safety & Environment (1 -> 6)
  { full_name: 'Bambang Setiawan', email: 'manager.hse@ptpgp.co.id', department: 'Health, Safety & Environment', position: 'HSE Manager', kode: '1.7.2' },
  { full_name: 'Wahyu Nugraha', email: 'spv.hse@ptpgp.co.id', department: 'Health, Safety & Environment', position: 'HSE Supervisor', kode: '1.7.3' },
  { full_name: 'Lestari Handayani', email: 'hse.officer2@ptpgp.co.id', department: 'Health, Safety & Environment', position: 'HSE Officer', kode: '1.7.4' },
  { full_name: 'Dimas Prakoso', email: 'env.officer@ptpgp.co.id', department: 'Health, Safety & Environment', position: 'Environmental Officer', kode: '1.7.5' },
  { full_name: 'Ayu Ratnasari', email: 'safety.officer@ptpgp.co.id', department: 'Health, Safety & Environment', position: 'Safety Officer', kode: '1.7.6' },

  // Finance (4 -> 6)
  { full_name: 'Nur Hidayati', email: 'acc.staff2@ptpgp.co.id', department: 'Finance', position: 'Accounting Staff', kode: '1.2.5' },
  { full_name: 'Ilham Saputra', email: 'tax.officer@ptpgp.co.id', department: 'Finance', position: 'Tax Officer', kode: '1.2.6' },
];

(async () => {
  const now = new Date().toISOString();
  const rows = employees.map(e => ({
    id: crypto.randomUUID(),
    full_name: e.full_name,
    email: e.email,
    department: e.department,
    position: e.position,
    kode: e.kode,
    status: 'Active',
    join_date: '2024-01-15',
    created_at: now,
  }));

  const { data, error } = await supabase.from('karyawan').insert(rows).select('id, full_name, department');
  if (error) {
    console.error('Insert error:', error.message, error.details);
    process.exit(1);
  }
  console.log(`Inserted ${data.length} employees.`);

  const { data: byDept } = await supabase.from('karyawan').select('department');
  const counts = {};
  (byDept || []).forEach(r => { counts[r.department] = (counts[r.department] || 0) + 1; });
  console.log('Employee count per department now:', JSON.stringify(counts, null, 1));
})();
