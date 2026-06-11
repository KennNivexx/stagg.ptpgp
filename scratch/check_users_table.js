const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await admin.from('users').select('*');
  if (error) {
    console.log('Error fetching from users table:', error.message);
  } else {
    console.log('Users table exists! Data:', data);
  }
}

run();
