const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

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

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

const uid = () => Date.now() + "-" + Math.random().toString(36).slice(2, 8);

async function main() {
  console.log('🚀 PT PGP Setup\n');

  // 1. Ensure org_units table exists with correct schema
  console.log('1. Setting up org_units...');
  const { error: t1 } = await supabase.from('org_units').select('code').limit(1);
  if (t1 && t1.message.includes('does not exist')) {
    console.log('   Run migration: supabase/migrations/20260615004_create_org_units.sql');
    return;
  }

  // 2. Migrate JSON → org_units if empty
  const { data: existing, error: exErr } = await supabase.from('org_units').select('code').limit(1);
  if (!existing || existing.length === 0) {
    console.log('2. Migrating org structure from JSON...');
    const { data: settings } = await supabase.from('employees').select('address').eq('email', '__settings__@ptpgp.co.id').single();
    if (settings?.address) {
      try {
        const s = JSON.parse(typeof settings.address === 'string' ? settings.address : JSON.stringify(settings.address));
        const tree = s.org_structure || [];
        if (tree.length > 0) {
          function flatten(list, parentCode, sortBase) {
            const result = [];
            for (let i = 0; i < list.length; i++) {
              const u = list[i];
              result.push({
                id: u.id, code: u.code, name: u.name, parent_code: parentCode || null,
                level: u.level, leader_name: u.leader_name || '', leader_email: u.leader_email || '',
                sort_order: i,
              });
              if (u.children?.length) result.push(...flatten(u.children, u.code, i));
            }
            return result;
          }
          const flat = flatten(tree, null, 0);
          for (const row of flat) {
            const { error } = await supabase.from('org_units').upsert(row, { onConflict: 'code' });
            if (error) console.error('   Upsert error:', error.message);
          }
          console.log(`   ${flat.length} units migrated ✅`);
        }
      } catch (e) { console.error('   Parse error:', e.message); }
    }
  } else {
    console.log('2. org_units already has data, skipping migration');
  }

  // 3. Sync to departments
  console.log('3. Syncing departments...');
  const { data: units } = await supabase.from('org_units').select('*').order('level').order('sort_order');
  if (units?.length) {
    const nameCount = {};
    for (const u of units) nameCount[u.name] = (nameCount[u.name] || 0) + 1;
    const dups = new Map();
    const flat = units.map((u, i) => {
      let name = u.name;
      if (nameCount[name] > 1) {
        const idx = (dups.get(name) || 0) + 1;
        dups.set(name, idx);
        name = `${name} (${idx})`;
      }
      return { code: u.code, name, parent_code: u.parent_code, level: u.level, leader_name: u.leader_name, leader_email: u.leader_email, sort_order: u.sort_order || i };
    });
    const codes = flat.map(f => f.code);
    const { error: upErr } = await supabase.from('departments').upsert(flat, { onConflict: 'code' });
    if (upErr) console.error('   Dept upsert error:', upErr.message);
    else {
      const { data: existingDepts } = await supabase.from('departments').select('code');
      const toDel = (existingDepts || []).filter(d => !codes.includes(d.code)).map(d => d.code);
      if (toDel.length) await supabase.from('departments').delete().in('code', toDel);
      console.log(`   ${flat.length} departments synced ✅`);
    }
  }

  // 4. Seed positions from employees
  console.log('4. Syncing positions...');
  const { data: emps } = await supabase.from('employees').select('position, department').neq('status', 'Inactive');
  if (emps?.length) {
    const seen = new Set();
    const positions = [];
    for (const e of emps) {
      if (!e.position || seen.has(e.position)) continue;
      seen.add(e.position);
      positions.push({ id: uid(), code: e.position, name: e.position, department: e.department || '', level: '' });
    }
    if (positions.length) {
      await supabase.from('positions').upsert(positions, { onConflict: 'code' });
      console.log(`   ${positions.length} positions synced ✅`);
    }
  }

  // 5. Seed all user accounts with proper PBKDF2 hashes
  console.log('5. Seeding user accounts...');
  
  // First try to update the role CHECK constraint  
  try {
    await supabase.rpc('exec_raw', { query: "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check" });
    await supabase.rpc('exec_raw', { query: "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('superadmin','hrd','employee','director','department_manager'))" });
  } catch (e) {
    // If RPC not available, try direct query approach
    const { error: checkErr } = await supabase.from('users').select('id').eq('role', 'superadmin').limit(1);
    if (checkErr && checkErr.message.includes('users_role_check')) {
      console.log('   Note: CHECK constraint may need manual update');
      console.log('   Run: supabase/migrations/20260615006_role_jobpostings.sql');
    }
  }

  const passwordHashes = {};
  const allAccounts = [
    { email: 'superadmin@ptpgp.co.id', role: 'superadmin', name: 'Super Administrator' },
    { email: 'hrd@ptpgp.co.id', role: 'hrd', name: 'Administrator HRD' },
    { email: 'director@ptpgp.co.id', role: 'director', name: 'Ade Fajar Nurcahman' },
    { email: 'hrga@ptpgp.co.id', role: 'department_manager', name: 'Manager HR & GA' },
    { email: 'finance@ptpgp.co.id', role: 'department_manager', name: 'Manager Finance' },
    { email: 'operational@ptpgp.co.id', role: 'department_manager', name: 'Manager Operational' },
    { email: 'procurement@ptpgp.co.id', role: 'department_manager', name: 'Manager Procurement' },
    { email: 'projectappraisal@ptpgp.co.id', role: 'department_manager', name: 'Manager Project Appraisal' },
    { email: 'mr@ptpgp.co.id', role: 'department_manager', name: 'Manager MR' },
    { email: 'hse@ptpgp.co.id', role: 'department_manager', name: 'Manager HSE' },
  ];

  let seeded = 0;
  for (const acct of allAccounts) {
    const hash = hashPassword('password');
    const { error } = await supabase.from('users').upsert({
      email: acct.email, password_hash: hash, role: acct.role, full_name: acct.name,
    }, { onConflict: 'email' });
    if (error) {
      console.log(`   ${acct.email}: ${error.message}`);
    } else {
      seeded++;
    }
  }
  console.log(`   ${seeded}/${allAccounts.length} accounts seeded`);

  // 6. Seed employee data (realistic per department)
  console.log('6. Seeding employee data...');
  const employees = [
    // HR & GA
    { name: 'Radian, S.Sos., CHRM', email: 'radian@ptpgp.co.id', dept: 'HR & GA', position: 'HR Manager', join: '2023-03-15', status: 'Tetap' },
    { name: 'Siti Nurhaliza', email: 'siti.nurhaliza@ptpgp.co.id', dept: 'HR & GA', position: 'HR Officer', join: '2024-01-10', status: 'Tetap' },
    { name: 'Andi Pratama', email: 'andi.pratama@ptpgp.co.id', dept: 'HR & GA', position: 'Recruitment Staff', join: '2024-06-20', status: 'Tetap' },
    { name: 'Dewi Lestari', email: 'dewi.lestari@ptpgp.co.id', dept: 'HR & GA', position: 'Payroll Staff', join: '2025-02-01', status: 'Tetap' },
    { name: 'Budi Wibowo', email: 'budi.wibowo@ptpgp.co.id', dept: 'HR & GA', position: 'General Affair Staff', join: '2024-09-01', status: 'Kontrak' },
    { name: 'Rina Marlina', email: 'rina.marlina@ptpgp.co.id', dept: 'HR & GA', position: 'IT Support', join: '2025-04-15', status: 'Tetap' },
    { name: 'Hendra Gunawan', email: 'hendra.gunawan@ptpgp.co.id', dept: 'HR & GA', position: 'Security Officer', join: '2024-03-01', status: 'Tetap' },
    // Finance
    { name: 'Rini Astuti, S.E., M.Ak.', email: 'rini.astuti@ptpgp.co.id', dept: 'Finance', position: 'Finance Manager', join: '2023-06-01', status: 'Tetap' },
    { name: 'Ahmad Fauzi', email: 'ahmad.fauzi@ptpgp.co.id', dept: 'Finance', position: 'Senior Accountant', join: '2024-02-15', status: 'Tetap' },
    { name: 'Dian Permata', email: 'dian.permata@ptpgp.co.id', dept: 'Finance', position: 'Account Payable Staff', join: '2024-08-01', status: 'Tetap' },
    { name: 'Rudi Hartono', email: 'rudi.hartono@ptpgp.co.id', dept: 'Finance', position: 'Account Receivable Staff', join: '2025-01-10', status: 'Kontrak' },
    { name: 'Maya Sari', email: 'maya.sari@ptpgp.co.id', dept: 'Finance', position: 'Cashier', join: '2025-05-01', status: 'Tetap' },
    // Operational Division
    { name: 'Bambang Sutrisno', email: 'bambang.sutrisno@ptpgp.co.id', dept: 'Operational Division', position: 'Operations Manager', join: '2023-01-20', status: 'Tetap' },
    { name: 'Slamet Riyadi', email: 'slamet.riyadi@ptpgp.co.id', dept: 'Operational Division', position: 'Vehicle Operations Supervisor', join: '2023-08-15', status: 'Tetap' },
    { name: 'Agus Salim', email: 'agus.salim@ptpgp.co.id', dept: 'Operational Division', position: 'Driver', join: '2024-03-01', status: 'Tetap' },
    { name: 'Supriyanto', email: 'supriyanto@ptpgp.co.id', dept: 'Operational Division', position: 'Driver', join: '2024-06-10', status: 'Tetap' },
    { name: 'Joko Widodo', email: 'joko.widodo@ptpgp.co.id', dept: 'Operational Division', position: 'Heavy Equipment Operator', join: '2023-11-01', status: 'Tetap' },
    { name: 'Yanto Hermawan', email: 'yanto.hermawan@ptpgp.co.id', dept: 'Operational Division', position: 'Rigger', join: '2024-09-15', status: 'Kontrak' },
    { name: 'Tri Handoko', email: 'tri.handoko@ptpgp.co.id', dept: 'Operational Division', position: 'Quality Control Staff', join: '2025-03-01', status: 'Tetap' },
    { name: 'Eko Prasetyo', email: 'eko.prasetyo@ptpgp.co.id', dept: 'Operational Division', position: 'Traffic System Staff', join: '2024-12-01', status: 'Tetap' },
    // Procurement Division
    { name: 'Retno Wulandari', email: 'retno.wulandari@ptpgp.co.id', dept: 'Procurement Division', position: 'Procurement Officer', join: '2024-04-10', status: 'Tetap' },
    { name: 'Yudi Setiawan', email: 'yudi.setiawan@ptpgp.co.id', dept: 'Procurement Division', position: 'Procurement Staff', join: '2025-02-20', status: 'Kontrak' },
    // Project Appraisal
    { name: 'Galih Aditya', email: 'galih.aditya@ptpgp.co.id', dept: 'Project Appraisal', position: 'Project Appraisal Manager', join: '2023-07-01', status: 'Tetap' },
    { name: 'Fitriani Rahayu', email: 'fitriani.rahayu@ptpgp.co.id', dept: 'Project Appraisal', position: 'Sales Executive', join: '2024-05-15', status: 'Tetap' },
    { name: 'Doni Saputra', email: 'doni.saputra@ptpgp.co.id', dept: 'Project Appraisal', position: 'Media & Promotion Staff', join: '2025-01-05', status: 'Kontrak' },
    // Management Representative
    { name: 'Yuni Astuti', email: 'yuni.astuti@ptpgp.co.id', dept: 'Management Representative', position: 'MR Officer', join: '2024-07-01', status: 'Tetap' },
    // HSE
    { name: 'Rizky Pratama', email: 'rizky.pratama@ptpgp.co.id', dept: 'Health, Safety & Environment', position: 'HSE Officer', join: '2024-10-01', status: 'Tetap' },
    { name: 'Nina Kusuma', email: 'nina.kusuma@ptpgp.co.id', dept: 'Health, Safety & Environment', position: 'Document Control Staff', join: '2025-04-01', status: 'Tetap' },
  ];

  let empCount = 0;
  for (const e of employees) {
    const { error } = await supabase.from('employees').upsert({
      full_name: e.name, email: e.email, department: e.dept, position: e.position,
      join_date: e.join, status: e.status,
      phone: '', address: '',
    }, { onConflict: 'email' });
    if (!error) empCount++;

    // Also create user account
    const hash = hashPassword('password');
    await supabase.from('users').upsert({
      email: e.email, password_hash: hash, role: 'employee', full_name: e.name,
    }, { onConflict: 'email' });
  }
  console.log(`   ${empCount}/${employees.length} employees seeded`);

  // 7. Backfill kode for existing employees
  console.log('7. Generating employee kodes...');
  const { data: allEmps } = await supabase.from('employees').select('id, email, department, kode').eq('kode', null);
  if (allEmps && allEmps.length > 0) {
    let kodeCount = 0;
    for (const emp of allEmps) {
      if (!emp.department) continue;
      const { data: unit } = await supabase.from('org_units').select('code').eq('name', emp.department).maybeSingle();
      if (!unit) continue;
      const segments = unit.code.split('.');
      const { count } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('department', emp.department);
      const seq = (count || 0) + 1 - (allEmps.filter(e => e.department === emp.department).indexOf(emp)) + kodeCount;
      const firstZero = segments.findIndex(s => Number(s) === 0);
      if (firstZero >= 0) segments[firstZero] = String(seq);
      else segments.push(String(seq));
      const { error } = await supabase.from('employees').update({ kode: segments.join('.') }).eq('id', emp.id);
      if (!error) kodeCount++;
    }
    console.log(`   ${kodeCount}/${allEmps.length} kodes backfilled`);
  } else {
    console.log('   All employees already have kodes');
  }

  console.log('\n✅ Setup complete!');
}

main();
