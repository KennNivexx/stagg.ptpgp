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

const missingEmployees = [
  {
    full_name: "Fadlan, S.Sos., CHRM",
    email: "fadlan@ptpgp.co.id",
    department: "HR & GA",
    position: "HR & GA Manager",
    phone: "081234567890",
    join_date: "2024-01-10",
    status: "Tetap"
  },
  {
    full_name: "M. Rizki Galuh Pratama, B.Bus",
    email: "rizki.galuh@ptpgp.co.id",
    department: "Finance",
    position: "Finance Manager",
    phone: "081234567891",
    join_date: "2024-01-10",
    status: "Tetap"
  },
  {
    full_name: "Tati Ernawati",
    email: "tati.ernawati@ptpgp.co.id",
    department: "Marketing",
    position: "Marketing Manager",
    phone: "081234567892",
    join_date: "2024-01-10",
    status: "Tetap"
  },
  {
    full_name: "I Gusti Ngurah Sukada",
    email: "gusti.ngurah@ptpgp.co.id",
    department: "Operational",
    position: "Operational Manager",
    phone: "081234567893",
    join_date: "2024-01-10",
    status: "Tetap"
  }
];

async function run() {
  console.log('Inserting missing employees...');
  for (const emp of missingEmployees) {
    // Check if employee already exists by email
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('email', emp.email)
      .maybeSingle();

    if (existing) {
      console.log(`Employee with email ${emp.email} already exists.`);
      continue;
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(emp)
      .select();

    if (error) {
      console.error(`Error inserting ${emp.full_name}:`, error);
    } else {
      console.log(`Successfully inserted ${emp.full_name} with ID: ${data[0].id}`);
    }
  }
  console.log('All insertions finished.');
}

run();
