const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

  console.log('\n✅ Setup complete!');
}

main();
