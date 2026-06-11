const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log('Fetching employees...');
  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await admin
    .from("employees")
    .select("id, address");

  if (error) {
    console.error('Failed:', error.message);
  } else {
    console.log('Success! Count:', data.length, 'Data:', data);
  }
}

run();
