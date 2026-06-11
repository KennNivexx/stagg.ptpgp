const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkTables() {
  const admin = createClient(supabaseUrl, supabaseServiceKey);
  
  // We can query the information_schema using SQL if we had direct access.
  // But through PostgREST we can try fetching from common table names to see if they exist.
  const tables = ['employees', 'jobs', 'attendance', 'leave_requests', 'payroll', 'kpi', 'vacancies'];
  
  for (const table of tables) {
    const { data, error } = await admin.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}' error:`, error.message);
    } else {
      console.log(`Table '${table}' exists! Sample:`, data);
    }
  }
}

checkTables();
