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

const leaders = {
  'SDM & Aset': { leader_name: 'Kepala Divisi SDM & Aset', leader_email: 'hrga@ptpgp.co.id' },
  'Finance / Accounting': { leader_name: 'Kepala Divisi Finance / Accounting', leader_email: 'finance@ptpgp.co.id' },
  'Operasional': { leader_name: 'Kepala Divisi Operasional', leader_email: 'operational@ptpgp.co.id' },
  'SCM (Supply Chain Management)': { leader_name: 'Kepala Divisi SCM', leader_email: 'procurement@ptpgp.co.id' },
  'Quality Control (QC)': { leader_name: 'Kepala Divisi QC', leader_email: 'projectappraisal@ptpgp.co.id' },
  'Management Representative': { leader_name: 'Management Representative', leader_email: 'mr@ptpgp.co.id' },
  'Health, Safety & Environment': { leader_name: 'Kepala HSE', leader_email: 'hse@ptpgp.co.id' },
  'Direksi': { leader_name: 'Direktur/Wakil Direktur', leader_email: 'director@ptpgp.co.id' },
};

(async () => {
  for (const [name, { leader_name, leader_email }] of Object.entries(leaders)) {
    const { error } = await supabase.from('unit_organisasi').update({ leader_name, leader_email }).eq('name', name);
    if (error) console.error(`Failed for ${name}:`, error.message);
    else console.log(`Updated ${name} -> ${leader_name} (${leader_email})`);
  }
})();
