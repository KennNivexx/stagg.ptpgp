const {createClient} = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadEnv() {
  const env = {};
  try {
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
  } catch (e) { console.error('.env.local not found'); process.exit(1); }
  return env;
}
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('🧹 Cleanup & Re-seed\n');

  // 1. Delete all existing employees except settings
  console.log('1. Cleaning up old employees...');
  const { data: oldEmps } = await supabase.from('employees').select('id').neq('email', '__settings__@ptpgp.co.id');
  if (oldEmps) {
    for (const e of oldEmps) await supabase.from('employees').delete().eq('id', e.id);
  }

  // Also delete old users (will be re-seeded)
  const { data: oldUsers } = await supabase.from('users').select('email').neq('email', 'superadmin@ptpgp.co.id');
  if (oldUsers) {
    for (const u of oldUsers) {
      // Keep only superadmin
      if (u.email !== 'superadmin@ptpgp.co.id') {
        await supabase.from('users').delete().eq('email', u.email);
      }
    }
  }
  console.log('   Done');

  // 2. Seed all admin accounts
  console.log('2. Seeding admin accounts...');
  const admins = [
    { email: 'superadmin@ptpgp.co.id', role: 'superadmin', name: 'Super Administrator' },
    { email: 'director@ptpgp.co.id', role: 'director', name: 'Ade Fajar Nurcahman' },
    { email: 'hrd@ptpgp.co.id', role: 'hrd', name: 'Administrator HRD' },
    { email: 'hrga@ptpgp.co.id', role: 'department_manager', name: 'Manager HR & GA' },
    { email: 'finance@ptpgp.co.id', role: 'department_manager', name: 'Manager Finance' },
    { email: 'operational@ptpgp.co.id', role: 'department_manager', name: 'Manager Operational' },
    { email: 'procurement@ptpgp.co.id', role: 'department_manager', name: 'Manager Procurement' },
    { email: 'projectappraisal@ptpgp.co.id', role: 'department_manager', name: 'Manager Project Appraisal' },
    { email: 'mr@ptpgp.co.id', role: 'department_manager', name: 'Manager MR' },
    { email: 'hse@ptpgp.co.id', role: 'department_manager', name: 'Manager HSE' },
  ];
  for (const a of admins) {
    const hash = hashPassword('password');
    await supabase.from('users').upsert({ email: a.email, password_hash: hash, role: a.role, full_name: a.name }, { onConflict: 'email' });
  }
  console.log(`   ${admins.length} accounts seeded`);

  // 3. Seed all positions/jabatan
  console.log('3. Seeding all positions/jabatan...');

  // Get org units for department names
  const { data: units } = await supabase.from('org_units').select('name, code').order('level').order('sort_order');
  const deptNames = units ? [...new Set(units.map(u => u.name))] : [];

  // All positions (standard per department)
  const allPositions = [
    // Commissioner
    { code: 'COMM', name: 'Commissioner', department: 'COMMISSIONER', level: 'Komisaris' },
    // Director level
    { code: 'DIR', name: 'Director', department: 'Director', level: 'Direktur' },
    { code: 'INT-AUD', name: 'Internal Auditor', department: 'Internal Audit', level: 'Direktur' },
    // Deputy Director level
    { code: 'DEP-DIR', name: 'Deputy Director', department: 'Deputy Director', level: 'Wakil Direktur' },
    // HR & GA positions
    { code: 'HR-MGR', name: 'HR Manager', department: 'HR & GA', level: 'Manager' },
    { code: 'HR-OFF', name: 'HR Officer', department: 'HR & GA', level: 'Staff' },
    { code: 'REC-STF', name: 'Recruitment Staff', department: 'HR & GA', level: 'Staff' },
    { code: 'PAY-STF', name: 'Payroll Staff', department: 'HR & GA', level: 'Staff' },
    { code: 'GA-STF', name: 'General Affair Staff', department: 'HR & GA', level: 'Staff' },
    { code: 'IT-SUP', name: 'IT Support', department: 'HR & GA', level: 'Staff' },
    { code: 'SEC-OFF', name: 'Security Officer', department: 'HR & GA', level: 'Staff' },
    { code: 'OBH', name: 'Office Boy', department: 'HR & GA', level: 'Staff' },
    // Finance positions
    { code: 'FIN-MGR', name: 'Finance Manager', department: 'Finance', level: 'Manager' },
    { code: 'SR-ACC', name: 'Senior Accountant', department: 'Finance', level: 'Staff' },
    { code: 'AP-STF', name: 'Account Payable Staff', department: 'Finance', level: 'Staff' },
    { code: 'AR-STF', name: 'Account Receivable Staff', department: 'Finance', level: 'Staff' },
    { code: 'CSH', name: 'Cashier', department: 'Finance', level: 'Staff' },
    // Operational positions
    { code: 'OPS-MGR', name: 'Operations Manager', department: 'Operational Division', level: 'Manager' },
    { code: 'VOP-SPV', name: 'Vehicle Operations Supervisor', department: 'Operational Division', level: 'Supervisor' },
    { code: 'DRV', name: 'Driver', department: 'Operational Division', level: 'Staff' },
    { code: 'HE-OPR', name: 'Heavy Equipment Operator', department: 'Operational Division', level: 'Staff' },
    { code: 'RIG', name: 'Rigger', department: 'Operational Division', level: 'Staff' },
    { code: 'QC-STF', name: 'Quality Control Staff', department: 'Operational Division', level: 'Staff' },
    { code: 'TS-STF', name: 'Traffic System Staff', department: 'Operational Division', level: 'Staff' },
    { code: 'SVC-ADV', name: 'Service Advisor', department: 'Operational Division', level: 'Staff' },
    { code: 'VEH-REG', name: 'Vehicle Registration Staff', department: 'Operational Division', level: 'Staff' },
    { code: 'EQ-CTRL', name: 'Equipment Control Staff', department: 'Operational Division', level: 'Staff' },
    // Procurement positions
    { code: 'PRC-OFF', name: 'Procurement Officer', department: 'Procurement Division', level: 'Staff' },
    { code: 'PRC-STF', name: 'Procurement Staff', department: 'Procurement Division', level: 'Staff' },
    // Project Appraisal positions
    { code: 'PA-MGR', name: 'Project Appraisal Manager', department: 'Project Appraisal', level: 'Manager' },
    { code: 'SLS-EXEC', name: 'Sales Executive', department: 'Project Appraisal', level: 'Staff' },
    { code: 'MED-PROM', name: 'Media & Promotion Staff', department: 'Project Appraisal', level: 'Staff' },
    { code: 'REG-STF', name: 'Regional Staff', department: 'Project Appraisal', level: 'Staff' },
    { code: 'FWD-STF', name: 'Forwarder Staff', department: 'Project Appraisal', level: 'Staff' },
    { code: 'WH-STF', name: 'Warehouse Staff', department: 'Project Appraisal', level: 'Staff' },
    // MR positions
    { code: 'MR-OFF', name: 'MR Officer', department: 'Management Representative', level: 'Staff' },
    // HSE positions
    { code: 'HSE-OFF', name: 'HSE Officer', department: 'Health, Safety & Environment', level: 'Staff' },
    { code: 'DOC-CTRL', name: 'Document Control Staff', department: 'Health, Safety & Environment', level: 'Staff' },
  ];

  // Delete old positions, insert fresh
  await supabase.from('positions').delete().neq('code', '__dummy__');
  let posCount = 0;
  for (const p of allPositions) {
    const { error } = await supabase.from('positions').insert({ id: crypto.randomUUID(), ...p });
    if (!error) posCount++;
  }
  console.log(`   ${posCount}/${allPositions.length} positions seeded`);

  // 4. Seed employees
  console.log('4. Seeding employee data...');
  const employees = [
    { name: 'Radian, S.Sos., CHRM', email: 'radian@ptpgp.co.id', dept: 'HR & GA', position: 'HR Manager', join: '2023-03-15', status: 'Tetap' },
    { name: 'Siti Nurhaliza', email: 'siti.nurhaliza@ptpgp.co.id', dept: 'HR & GA', position: 'HR Officer', join: '2024-01-10', status: 'Tetap' },
    { name: 'Andi Pratama', email: 'andi.pratama@ptpgp.co.id', dept: 'HR & GA', position: 'Recruitment Staff', join: '2024-06-20', status: 'Tetap' },
    { name: 'Dewi Lestari', email: 'dewi.lestari@ptpgp.co.id', dept: 'HR & GA', position: 'Payroll Staff', join: '2025-02-01', status: 'Tetap' },
    { name: 'Budi Wibowo', email: 'budi.wibowo@ptpgp.co.id', dept: 'HR & GA', position: 'General Affair Staff', join: '2024-09-01', status: 'Kontrak' },
    { name: 'Rina Marlina', email: 'rina.marlina@ptpgp.co.id', dept: 'HR & GA', position: 'IT Support', join: '2025-04-15', status: 'Tetap' },
    { name: 'Hendra Gunawan', email: 'hendra.gunawan@ptpgp.co.id', dept: 'HR & GA', position: 'Security Officer', join: '2024-03-01', status: 'Tetap' },
    { name: 'Rini Astuti, S.E., M.Ak.', email: 'rini.astuti@ptpgp.co.id', dept: 'Finance', position: 'Finance Manager', join: '2023-06-01', status: 'Tetap' },
    { name: 'Ahmad Fauzi', email: 'ahmad.fauzi@ptpgp.co.id', dept: 'Finance', position: 'Senior Accountant', join: '2024-02-15', status: 'Tetap' },
    { name: 'Dian Permata', email: 'dian.permata@ptpgp.co.id', dept: 'Finance', position: 'Account Payable Staff', join: '2024-08-01', status: 'Tetap' },
    { name: 'Rudi Hartono', email: 'rudi.hartono@ptpgp.co.id', dept: 'Finance', position: 'Account Receivable Staff', join: '2025-01-10', status: 'Kontrak' },
    { name: 'Maya Sari', email: 'maya.sari@ptpgp.co.id', dept: 'Finance', position: 'Cashier', join: '2025-05-01', status: 'Tetap' },
    { name: 'Bambang Sutrisno', email: 'bambang.sutrisno@ptpgp.co.id', dept: 'Operational Division', position: 'Operations Manager', join: '2023-01-20', status: 'Tetap' },
    { name: 'Slamet Riyadi', email: 'slamet.riyadi@ptpgp.co.id', dept: 'Operational Division', position: 'Vehicle Operations Supervisor', join: '2023-08-15', status: 'Tetap' },
    { name: 'Agus Salim', email: 'agus.salim@ptpgp.co.id', dept: 'Operational Division', position: 'Driver', join: '2024-03-01', status: 'Tetap' },
    { name: 'Supriyanto', email: 'supriyanto@ptpgp.co.id', dept: 'Operational Division', position: 'Driver', join: '2024-06-10', status: 'Tetap' },
    { name: 'Joko Widodo', email: 'joko.widodo@ptpgp.co.id', dept: 'Operational Division', position: 'Heavy Equipment Operator', join: '2023-11-01', status: 'Tetap' },
    { name: 'Yanto Hermawan', email: 'yanto.hermawan@ptpgp.co.id', dept: 'Operational Division', position: 'Rigger', join: '2024-09-15', status: 'Kontrak' },
    { name: 'Tri Handoko', email: 'tri.handoko@ptpgp.co.id', dept: 'Operational Division', position: 'Quality Control Staff', join: '2025-03-01', status: 'Tetap' },
    { name: 'Eko Prasetyo', email: 'eko.prasetyo@ptpgp.co.id', dept: 'Operational Division', position: 'Traffic System Staff', join: '2024-12-01', status: 'Tetap' },
    { name: 'Retno Wulandari', email: 'retno.wulandari@ptpgp.co.id', dept: 'Procurement Division', position: 'Procurement Officer', join: '2024-04-10', status: 'Tetap' },
    { name: 'Yudi Setiawan', email: 'yudi.setiawan@ptpgp.co.id', dept: 'Procurement Division', position: 'Procurement Staff', join: '2025-02-20', status: 'Kontrak' },
    { name: 'Galih Aditya', email: 'galih.aditya@ptpgp.co.id', dept: 'Project Appraisal', position: 'Project Appraisal Manager', join: '2023-07-01', status: 'Tetap' },
    { name: 'Fitriani Rahayu', email: 'fitriani.rahayu@ptpgp.co.id', dept: 'Project Appraisal', position: 'Sales Executive', join: '2024-05-15', status: 'Tetap' },
    { name: 'Doni Saputra', email: 'doni.saputra@ptpgp.co.id', dept: 'Project Appraisal', position: 'Media & Promotion Staff', join: '2025-01-05', status: 'Kontrak' },
    { name: 'Yuni Astuti', email: 'yuni.astuti@ptpgp.co.id', dept: 'Management Representative', position: 'MR Officer', join: '2024-07-01', status: 'Tetap' },
    { name: 'Rizky Pratama', email: 'rizky.pratama@ptpgp.co.id', dept: 'Health, Safety & Environment', position: 'HSE Officer', join: '2024-10-01', status: 'Tetap' },
    { name: 'Nina Kusuma', email: 'nina.kusuma@ptpgp.co.id', dept: 'Health, Safety & Environment', position: 'Document Control Staff', join: '2025-04-01', status: 'Tetap' },
  ];

  let empCount = 0;
  let kodeColExists = false;
  try {
    const { error: kc } = await supabase.from('employees').select('kode').limit(1);
    kodeColExists = !kc;
  } catch { kodeColExists = false; }

  for (const e of employees) {
    // Generate kode
    let kode = '';
    if (kodeColExists) {
      const { data: unit } = await supabase.from('org_units').select('code').eq('name', e.dept).maybeSingle();
      if (unit) {
        const segments = unit.code.split('.');
        const firstZero = segments.findIndex(s => Number(s) === 0);
        if (firstZero >= 0) segments[firstZero] = String(empCount + 1);
        else segments.push(String(empCount + 1));
        kode = segments.join('.');
      }
    }

    const hash = hashPassword('password');
    const authData = JSON.stringify({ __auth__: { password_hash: hash, role: 'employee' } });

    const empRow = {
      full_name: e.name, email: e.email, department: e.dept, position: e.position,
      join_date: e.join, status: e.status, address: authData, phone: '',
    };
    if (kodeColExists) empRow.kode = kode;

    const { error: empErr } = await supabase.from('employees').insert(empRow);
    if (empErr) {
      console.log(`   FAIL ${e.email}: ${empErr.message}`);
      continue;
    }
    empCount++;

    await supabase.from('users').upsert({
      email: e.email, password_hash: hash, role: 'employee', full_name: e.name,
    }, { onConflict: 'email' });
  }
  console.log(`   ${empCount}/${employees.length} employees seeded\n`);

  // 5. Show summary
  const { count: emps } = await supabase.from('employees').select('*', { count: 'exact', head: true }).neq('email', '__settings__@ptpgp.co.id');
  const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: positions } = await supabase.from('positions').select('*', { count: 'exact', head: true });

  console.log('✅ Done! Summary:');
  console.log(`   Karyawan: ${emps}`);
  console.log(`   Users: ${users}`);
  console.log(`   Positions: ${positions}`);
}

main();
