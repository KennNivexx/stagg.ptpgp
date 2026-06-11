const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const admin = createClient(supabaseUrl, supabaseServiceKey);
  
  const queries = {
    employees: admin.from("employees").select("*", { count: "exact", head: true }),
    attendance: admin.from("attendance").select("*", { count: "exact", head: true }),
    leaves: admin.from("leaves").select("*", { count: "exact", head: true }),
    jobs: admin.from("jobs").select("*", { count: "exact", head: true }),
    applications: admin.from("applications").select("*", { count: "exact", head: true }),
  };

  for (const [name, query] of Object.entries(queries)) {
    const { count, error } = await query;
    if (error) {
      console.log(`Query '${name}' failed:`, error.message);
    } else {
      console.log(`Query '${name}' succeeded. Count:`, count);
    }
  }
}

run();
