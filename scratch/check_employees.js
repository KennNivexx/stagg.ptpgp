const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
let env = {};
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    }
  }
} catch (e) {
  console.error('Error reading .env.local:', e.message);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching employees...');
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, email, position, department')
    .order('full_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} employees in DB:`);
  for (const emp of data) {
    console.log(`- ID: ${emp.id} | Name: ${emp.full_name} | Email: ${emp.email} | Position: ${emp.position} | Dept: ${emp.department}`);
  }
}

run();
