const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log('Testing anon client...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: anonData, error: anonError } = await supabase.from('jobs').select('*');
  if (anonError) {
    console.error('Anon client failed:', anonError.message);
  } else {
    console.log('Anon client success, fetched jobs:', anonData?.length);
  }

  console.log('Testing service_role client...');
  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const { data: adminData, error: adminError } = await admin.from('jobs').select('*');
  if (adminError) {
    console.error('Admin client failed:', adminError.message);
  } else {
    console.log('Admin client success, fetched jobs:', adminData?.length);
  }
}

run();
