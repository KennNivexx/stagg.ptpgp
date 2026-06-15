const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let env = {};
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      let key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
      env[key] = val;
    }
  }
} catch (e) {
  console.error('Error reading .env.local:', e.message);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // 1. Add missing columns to departments
  console.log('1. Fixing departments table...');
  const alters = [
    'ALTER TABLE departments ADD COLUMN IF NOT EXISTS code TEXT',
    'ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_code TEXT',
    'ALTER TABLE departments ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0',
    'ALTER TABLE departments ADD COLUMN IF NOT EXISTS leader_name TEXT DEFAULT \'\'',
    'ALTER TABLE departments ADD COLUMN IF NOT EXISTS leader_email TEXT DEFAULT \'\'',
    'ALTER TABLE departments ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0',
    'ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()',
    'ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()',
  ];
  for (const sql of alters) {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      // Try raw query
      const { error: e2 } = await supabase.from('departments').select('code').limit(1);
      if (e2) {
        console.log(`  Note: department table may need manual setup - ${error.message}`);
        break;
      }
    }
  }

  // 2. Try to add unique constraint on code
  try {
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE departments ADD CONSTRAINT IF NOT EXISTS departments_code_unique UNIQUE (code)' });
  } catch {}

  // 3. Seed org structure
  console.log('2. Seeding org structure...');
  let idCounter = 1;
  function o(name, code, level, leader_name, leader_email, children) {
    return { id: "org-" + (idCounter++), code, name, level, leader_name: leader_name || "", leader_email: leader_email || "", children: children || [] };
  }
  const tree = [
    o("COMMISSIONER", "1.0.0.0.0.0.0", 0, "", "", [
      o("Director", "1.1.0.0.0.0.0", 1, "Ade Fajar Nurcahman", "ade.fajar@ptpgp.co.id", [
        o("Internal Audit", "1.1.1.0.0.0.0", 2, "", "", []),
        o("Deputy Director", "1.1.2.0.0.0.0", 2, "Enjal Solihin", "enjal.solihin@ptpgp.co.id", [
          o("HR & GA", "1.1.2.1.0.0.0", 3, "", "", [
            o("Human Resources", "1.1.2.1.1.0.0", 4, "", "", []),
            o("Payroll", "1.1.2.1.2.0.0", 4, "", "", []),
            o("Recruitment & Development", "1.1.2.1.3.0.0", 4, "", "", []),
            o("General Affair", "1.1.2.1.4.0.0", 4, "", "", []),
            o("Other Boy House", "1.1.2.1.5.0.0", 4, "", "", []),
            o("Property Creation & Maintenance", "1.1.2.1.6.0.0", 4, "", "", []),
            o("Office Boy", "1.1.2.1.7.0.0", 4, "", "", []),
            o("IT Application & Development", "1.1.2.1.8.0.0", 4, "", "", []),
            o("Help Desk Staff", "1.1.2.1.9.0.0", 4, "", "", []),
            o("Security", "1.1.2.1.10.0.0", 4, "", "", []),
            o("Shift Leader", "1.1.2.1.11.0.0", 4, "", "", []),
            o("Personnel", "1.1.2.1.12.0.0", 4, "", "", []),
          ]),
          o("Finance", "1.1.2.2.0.0.0", 3, "", "", [
            o("Finance", "1.1.2.2.1.0.0", 4, "", "", []),
            o("Cashier", "1.1.2.2.2.0.0", 4, "", "", []),
            o("Account Payable", "1.1.2.2.3.0.0", 4, "", "", []),
            o("Account Receivable", "1.1.2.2.4.0.0", 4, "", "", []),
          ]),
        ]),
        o("Procurement Division", "1.1.3.0.0.0.0", 2, "Galih Aditya", "galih.aditya@ptpgp.co.id", []),
        o("Project Appraisal", "1.1.4.0.0.0.0", 2, "Titi Ernawati", "titi.ernawati@ptpgp.co.id", [
          o("Regional", "1.1.4.1.0.0.0", 3, "", "", []),
          o("Forwarder", "1.1.4.2.0.0.0", 3, "", "", []),
          o("PPK", "1.1.4.3.0.0.0", 3, "", "", []),
          o("Warehouse", "1.1.4.4.0.0.0", 3, "", "", []),
          o("Projected Heavy Equipment", "1.1.4.5.0.0.0", 3, "", "", []),
          o("Sales", "1.1.4.6.0.0.0", 3, "", "", []),
          o("Staff Admin", "1.1.4.7.0.0.0", 3, "", "", []),
          o("Media & Promotion", "1.1.4.8.0.0.0", 3, "", "", []),
        ]),
        o("Management Representative", "1.1.5.0.0.0.0", 2, "Dace Rizkia Sari", "dace.rizkia@ptpgp.co.id", []),
        o("Operational Division", "1.1.6.0.0.0.0", 2, "I Gusti Nursahada", "igusti.nursahada@ptpgp.co.id", [
          o("Vehicle Operation", "1.1.6.1.0.0.0", 3, "", "", []),
          o("Driver", "1.1.6.2.0.0.0", 3, "", "", []),
          o("Operational Alat Berat", "1.1.6.3.0.0.0", 3, "", "", []),
          o("Operator", "1.1.6.4.0.0.0", 3, "", "", []),
          o("Operational Plant", "1.1.6.5.0.0.0", 3, "", "", []),
          o("Rigger", "1.1.6.6.0.0.0", 3, "", "", []),
          o("Traffic System", "1.1.6.7.0.0.0", 3, "", "", []),
          o("Quality Control", "1.1.6.8.0.0.0", 3, "", "", []),
          o("Service Advisor", "1.1.6.9.0.0.0", 3, "", "", []),
          o("Vehicle Registration", "1.1.6.10.0.0.0", 3, "", "", []),
          o("Equipment Control", "1.1.6.11.0.0.0", 3, "", "", []),
          o("Staff Admin", "1.1.6.12.0.0.0", 3, "", "", []),
        ]),
        o("Health, Safety & Environment", "1.1.7.0.0.0.0", 2, "Asmaria Putri Utama", "asmaria.putri@ptpgp.co.id", [
          o("Delivery Route", "1.1.7.1.0.0.0", 3, "", "", []),
          o("Document Control", "1.1.7.2.0.0.0", 3, "", "", []),
          o("Staff", "1.1.7.3.0.0.0", 3, "", "", []),
        ]),
      ]),
    ]),
  ];

  const settings = { org_structure: tree };
  const { error: orgErr } = await supabase.from("employees").upsert({
    full_name: "System Settings",
    email: "__settings__@ptpgp.co.id",
    address: JSON.stringify(settings),
    department: "System",
    position: "Settings",
    join_date: "2024-01-01",
    status: "Tetap",
  }, { onConflict: "email" });
  if (orgErr) console.error("Org save error:", orgErr);
  else console.log("   Org structure saved!");

  // 4. Sync to departments
  console.log('3. Syncing departments...');
  
  function makeUUID() { return crypto.randomUUID(); }
  
  function flatten(list, parentCode) {
    const result = [];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      result.push({
        id: makeUUID(), code: u.code, name: u.name, parent_code: parentCode || null,
        level: u.level, leader_name: u.leader_name, leader_email: u.leader_email, sort_order: i,
      });
      if (u.children && u.children.length > 0) result.push(...flatten(u.children, u.code));
    }
    return result;
  }
  let flat = flatten(tree, null);

  // Fix duplicate names
  const nameCount = {};
  for (const d of flat) nameCount[d.name] = (nameCount[d.name] || 0) + 1;
  for (const d of flat) {
    if (nameCount[d.name] > 1) d.name = `${d.name} (${d.parent_code || 'root'})`;
  }

  // Delete all existing departments first (then re-insert)
  try {
    const { data: existing } = await supabase.from("departments").select("id").limit(1000);
    if (existing && existing.length > 0) {
      for (const row of existing) {
        await supabase.from("departments").delete().eq("id", row.id);
      }
    }
  } catch (e) { console.log("   (delete skipped:", e.message, ")"); }

  // Insert fresh departments
  let synced = 0;
  for (const dept of flat) {
    const { error: insErr } = await supabase.from("departments").insert(dept);
    if (!insErr) synced++;
  }
  console.log(`   ${synced}/${flat.length} departments synced!`);

  // 5. Seed positions from employee data
  console.log('4. Syncing positions...');
  const { data: employees } = await supabase.from("employees").select("position, department");
  if (employees) {
    const seen = new Set();
    const positions = [];
    for (const e of employees) {
      if (!e.position || seen.has(e.position)) continue;
      seen.add(e.position);
      positions.push({
        id: makeUUID(),
        code: e.position,
        name: e.position,
        department: e.department || "",
        level: "",
      });
    }
    if (positions.length > 0) {
      const { error: posErr } = await supabase.from("positions").upsert(positions, { onConflict: "code" });
      if (posErr) console.error("   Position sync error:", posErr.message);
      else console.log(`   ${positions.length} positions synced!`);
    }
  }

  // 6. Add headcount column
  console.log('5. Adding headcount column...');
  try {
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE departments ADD COLUMN IF NOT EXISTS headcount INTEGER DEFAULT 0' });
  } catch {
    const { error: hcErr } = await supabase.from("departments").select("headcount").limit(1);
    if (hcErr) console.log("   headcount column may need manual setup");
  }

  // 7. Set default headcount based on actual employees
  console.log('6. Setting headcount defaults...');
  for (const dept of flat) {
    const count = (employees || []).filter(e => e.department === dept.name && e.status !== "Inactive").length;
    if (count > 0) {
      await supabase.from("departments").update({ headcount: count }).eq("code", dept.code);
    }
  }

  console.log('\n✅ All done! Refresh browser. Run migration SQL in Supabase for new tables.\n');
  console.log('Migration files to run:');
  console.log('  supabase/migrations/20260615003_create_jobdesc_jobspec_requests.sql');
}
}

main();
